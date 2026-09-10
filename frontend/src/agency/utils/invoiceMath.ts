import type { AgencyInvoicePayments } from '@/agency/types/invoice'
import * as bookcarsHelper from ':bookcars-helper'

/** Fixed Tunisian daily levy rate applied per rental day. */
export const DAILY_LEVY_RATE = 2

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

/**
 * Rental length in days: prefer the period dates, otherwise fall back to Unité.
 */
export const rentalDays = (periodFrom?: string, periodTo?: string, quantity?: number): number => {
  if (periodFrom && periodTo) {
    const from = new Date(periodFrom)
    const to = new Date(periodTo)
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
      return Math.max(0, bookcarsHelper.days(from, to))
    }
  }
  return Math.max(0, Number(quantity) || 0)
}

/**
 * Total daily levy = rental days × rate (default 2 Dt/j).
 */
export const computeDailyLevyTotal = (
  periodFrom?: string,
  periodTo?: string,
  quantity?: number,
  rate: number = DAILY_LEVY_RATE,
): number => round3(rentalDays(periodFrom, periodTo, quantity) * Math.max(0, Number(rate) || 0))

/** @deprecated Use computeDailyLevyTotal */
export const computeDailyLevy = (periodFrom?: string, periodTo?: string): number => (
  computeDailyLevyTotal(periodFrom, periodTo, undefined, DAILY_LEVY_RATE)
)

export interface InvoiceTotalsInput {
  lines: { quantity: number, unitPrice: number, dailyLevy?: number }[]
  discount?: number
  vatRate?: number
  stampDuty?: number
  payments?: Partial<AgencyInvoicePayments>
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
 * Compute the fiscal totals of an invoice. Mirrored on the backend in
 * `backend/src/utils/invoiceHelper.ts` — keep both in sync. The server always
 * recomputes on save, this is only for the live preview.
 */
export const computeInvoiceTotals = (input: InvoiceTotalsInput): InvoiceTotals => {
  const lineTotals = (input.lines || []).map((line) => round3(Number(line?.quantity) * Number(line?.unitPrice)))
  const dailyLevyTotal = round3(
    (input.lines || []).reduce((sum, line) => sum + (Number(line?.dailyLevy) || 0), 0),
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
