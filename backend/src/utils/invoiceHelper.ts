import * as bookcarsTypes from ':bookcars-types'

/**
 * Round to the millime (3 decimals), the smallest legal unit of the Tunisian dinar.
 *
 * @param {number} value
 * @returns {number}
 */
export const round3 = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

export interface InvoiceTotalsInput {
  lines: { quantity: number, unitPrice: number, dailyLevy?: number }[]
  discount?: number
  vatRate?: number
  stampDuty?: number
  payments?: Partial<bookcarsTypes.AgencyInvoicePayments>
}

export interface InvoiceTotals {
  lineTotals: number[]
  /** Sum of per-line daily levies (2 Dt/j) */
  dailyLevyTotal: number
  /** TOTAL BRUT */
  totalGross: number
  /** TOTAL HT */
  totalHT: number
  /** TOTAL TVA */
  totalVAT: number
  /** TOTAL TTC */
  totalTTC: number
  /** Réglement */
  totalPaid: number
  /** Reste à payer */
  balanceDue: number
}

/**
 * Compute the fiscal totals of an invoice. Mirrored on the frontend in
 * `frontend/src/agency/utils/invoiceMath.ts` — keep both in sync.
 *
 * @param {InvoiceTotalsInput} input
 * @returns {InvoiceTotals}
 */
export const computeInvoiceTotals = (input: InvoiceTotalsInput): InvoiceTotals => {
  const lineTotals = input.lines.map((line) => round3(Number(line.quantity) * Number(line.unitPrice)))
  const dailyLevyTotal = round3(
    input.lines.reduce((sum, line) => sum + (Number(line.dailyLevy) || 0), 0),
  )
  const totalGross = round3(lineTotals.reduce((sum, total) => sum + total, 0))
  // TOTAL HT = lignes + prélèvement journalier (same figure as table TOTAUX)
  const totalHT = round3(Math.max(0, totalGross - (Number(input.discount) || 0) + dailyLevyTotal))
  const totalVAT = round3(totalHT * ((Number(input.vatRate) || 0) / 100))
  // Levy is already inside TOTAL HT — do not add it again
  const totalTTC = round3(totalHT + totalVAT + (Number(input.stampDuty) || 0))

  const payments = input.payments || {}
  const totalPaid = round3(
    (Number(payments.cash) || 0)
    + (Number(payments.cheque) || 0)
    + (Number(payments.draft) || 0)
    + (Number(payments.card) || 0)
    + (Number(payments.transfer) || 0),
  )

  return {
    lineTotals,
    dailyLevyTotal,
    totalGross,
    totalHT,
    totalVAT,
    totalTTC,
    totalPaid,
    balanceDue: round3(totalTTC - totalPaid),
  }
}
