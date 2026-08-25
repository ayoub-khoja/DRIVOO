import { round3 } from '@/agency/utils/invoiceMath'

export interface ContractTotalsInput {
  rentalHT: number
  supplements?: { priceHT: number }[]
  vatRate?: number
  payments?: { amount: number }[]
}

export interface ContractTotals {
  totalHT: number
  totalVAT: number
  totalTTC: number
  totalPaid: number
  balanceDue: number
}

/**
 * Compute the totals of a rental contract. Mirrored on the backend in
 * `backend/src/utils/contractHelper.ts` - keep both in sync. The server always
 * recomputes on save, this copy only drives the live preview.
 */
export const computeContractTotals = (input: ContractTotalsInput): ContractTotals => {
  const supplementsHT = (input.supplements || [])
    .reduce((sum, supplement) => sum + (Number(supplement?.priceHT) || 0), 0)

  const totalHT = round3(Math.max(0, (Number(input.rentalHT) || 0) + supplementsHT))
  const totalVAT = round3(totalHT * ((Number(input.vatRate) || 0) / 100))
  const totalTTC = round3(totalHT + totalVAT)
  const totalPaid = round3(
    (input.payments || []).reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0),
  )

  return {
    totalHT,
    totalVAT,
    totalTTC,
    totalPaid,
    balanceDue: round3(totalTTC - totalPaid),
  }
}
