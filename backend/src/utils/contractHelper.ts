import { round3 } from './invoiceHelper'

/** Default Tunisian daily levy rate (Dt per rental day). */
export const CONTRACT_DAILY_LEVY_RATE = 2

export interface ContractTotalsInput {
  /** Rental price excluding tax, before supplements */
  rentalHT: number
  supplements?: { priceHT: number }[]
  vatRate?: number
  payments?: { amount: number }[]
  /** Dt charged per rental day (default 2) */
  dailyLevyRate?: number
  /** Explicit rental length in days; preferred when dates are unavailable */
  rentalDays?: number
  departureDate?: Date | string
  returnDate?: Date | string
}

export interface ContractTotals {
  /** TOTAL H.TVA (rental + supplements, without levy) */
  totalHT: number
  /** Days used for the levy */
  rentalDays: number
  /** Rate applied (Dt/j) */
  dailyLevyRate: number
  /** Prélèvement journalier = days × rate */
  dailyLevyTotal: number
  /** TVA on (TOTAL H.TVA + prélèvement) */
  totalVAT: number
  /** TOTAL LOCATION TTC */
  totalTTC: number
  totalPaid: number
  /** Reste à payer */
  balanceDue: number
}

/**
 * Rental length in calendar days between departure and return.
 * Same-day (or equal timestamps) counts as 1 day.
 */
export const contractRentalDays = (
  departureDate?: Date | string,
  returnDate?: Date | string,
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
 * Compute the totals of a rental contract. Mirrored on the frontend in
 * `frontend/src/agency/utils/contractMath.ts` — keep both in sync. The server
 * always recomputes on save, the client copy only drives the live preview.
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
