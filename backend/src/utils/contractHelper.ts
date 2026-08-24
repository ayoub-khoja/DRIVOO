import { round3 } from './invoiceHelper'

export interface ContractTotalsInput {
  /** Rental price excluding tax, before supplements */
  rentalHT: number
  supplements?: { priceHT: number }[]
  vatRate?: number
  payments?: { amount: number }[]
}

export interface ContractTotals {
  /** TOTAL H.TVA */
  totalHT: number
  /** TVA */
  totalVAT: number
  /** TOTAL LOCATION TTC */
  totalTTC: number
  totalPaid: number
  /** Reste à payer */
  balanceDue: number
}

/**
 * Compute the totals of a rental contract. Mirrored on the frontend in
 * `frontend/src/agency/utils/contractMath.ts` — keep both in sync. The server
 * always recomputes on save, the client copy only drives the live preview.
 *
 * @param {ContractTotalsInput} input
 * @returns {ContractTotals}
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
