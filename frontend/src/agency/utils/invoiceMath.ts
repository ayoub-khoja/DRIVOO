import type { AgencyInvoicePayments } from '@/agency/types/invoice'

/**
 * Round to the millime (3 decimals), the smallest legal unit of the Tunisian dinar.
 */
export const round3 = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

/**
 * Invoice amounts always print with 3 decimals (378.150), unlike
 * `bookcarsHelper.formatNumber` which is hard-coded to 2.
 */
export const formatMoney = (value: number): string => (Number.isFinite(value) ? value : 0).toFixed(3)

export interface InvoiceTotalsInput {
  lines: { quantity: number, unitPrice: number }[]
  discount?: number
  vatRate?: number
  stampDuty?: number
  payments?: Partial<AgencyInvoicePayments>
}

export interface InvoiceTotals {
  lineTotals: number[]
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
 * Compute the fiscal totals of an invoice. Mirrored on the backend in
 * `backend/src/utils/invoiceHelper.ts` — keep both in sync. The server always
 * recomputes on save, this is only for the live preview.
 */
export const computeInvoiceTotals = (input: InvoiceTotalsInput): InvoiceTotals => {
  const lineTotals = (input.lines || []).map((line) => round3(Number(line?.quantity) * Number(line?.unitPrice)))
  const totalGross = round3(lineTotals.reduce((sum, total) => sum + total, 0))
  const totalHT = round3(Math.max(0, totalGross - (Number(input.discount) || 0)))
  const totalVAT = round3(totalHT * ((Number(input.vatRate) || 0) / 100))
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
    totalGross,
    totalHT,
    totalVAT,
    totalTTC,
    totalPaid,
    balanceDue: round3(totalTTC - totalPaid),
  }
}
