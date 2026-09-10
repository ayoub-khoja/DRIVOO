import { round3, DAILY_LEVY_RATE } from '@/agency/utils/invoiceMath'

/** Re-export the shared Tunisian daily levy default (2 Dt/j). */
export const CONTRACT_DAILY_LEVY_RATE = DAILY_LEVY_RATE

export interface ContractTotalsInput {
  rentalHT: number
  supplements?: { priceHT: number }[]
  vatRate?: number
  payments?: { amount: number }[]
  /** Dt charged per rental day (default 2) */
  dailyLevyRate?: number
  rentalDays?: number
  departureDate?: string
  returnDate?: string
}

export interface ContractTotals {
  /** TOTAL H.TVA (rental + supplements, without levy) */
  totalHT: number
  rentalDays: number
  dailyLevyRate: number
  /** Prélèvement journalier = days × rate */
  dailyLevyTotal: number
  /** TVA on (TOTAL H.TVA + prélèvement) */
  totalVAT: number
  totalTTC: number
  totalPaid: number
  balanceDue: number
}

/** Rental length in calendar days between departure and return (min 1 when dates are set). */
export const contractRentalDays = (
  departureDate?: string,
  returnDate?: string,
  fallbackDays?: number,
): number => {
  if (departureDate && returnDate) {
    const from = new Date(departureDate)
    const to = new Date(returnDate)
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to >= from) {
      const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
      const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
      const calendarDays = Math.round((toDay - fromDay) / (1000 * 60 * 60 * 24))
      return Math.max(1, calendarDays || 1)
    }
  }
  return Math.max(0, Number(fallbackDays) || 0)
}

/**
 * Compute the totals of a rental contract. Mirrored on the backend in
 * `backend/src/utils/contractHelper.ts` — keep both in sync.
 *
 * TVA is assessed on (TOTAL H.TVA + prélèvement journalier).
 */
export const computeContractTotals = (input: ContractTotalsInput): ContractTotals => {
  const supplementsHT = (input.supplements || [])
    .reduce((sum, supplement) => sum + (Number(supplement?.priceHT) || 0), 0)

  const totalHT = round3(Math.max(0, (Number(input.rentalHT) || 0) + supplementsHT))
  const dailyLevyRate = Math.max(0, Number(input.dailyLevyRate ?? CONTRACT_DAILY_LEVY_RATE) || 0)
  const rentalDays = contractRentalDays(input.departureDate, input.returnDate, input.rentalDays)
  const dailyLevyTotal = round3(rentalDays * dailyLevyRate)
  const taxableBase = round3(totalHT + dailyLevyTotal)
  const totalVAT = round3(taxableBase * ((Number(input.vatRate) || 0) / 100))
  const totalTTC = round3(taxableBase + totalVAT)
  const totalPaid = round3(
    (input.payments || []).reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0),
  )

  return {
    totalHT,
    rentalDays,
    dailyLevyRate,
    dailyLevyTotal,
    totalVAT,
    totalTTC,
    totalPaid,
    balanceDue: round3(totalTTC - totalPaid),
  }
}
