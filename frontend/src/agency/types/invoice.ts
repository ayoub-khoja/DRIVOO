import type * as bookcarsTypes from ':bookcars-types'

export type AgencyInvoiceLine = bookcarsTypes.AgencyInvoiceLine
export type AgencyInvoicePayments = bookcarsTypes.AgencyInvoicePayments
export type AgencyInvoice = bookcarsTypes.AgencyInvoice
export type AgencyInvoiceInput = bookcarsTypes.CreateAgencyInvoicePayload
export type AgencyInvoiceStats = bookcarsTypes.AgencyInvoiceStats
export type AgencyInvoiceListResult = bookcarsTypes.AgencyInvoiceResult

export const EMPTY_PAYMENTS: AgencyInvoicePayments = {
  cash: 0,
  cheque: 0,
  draft: 0,
  card: 0,
  transfer: 0,
}

/** Payment channels, in the order they appear on the printed invoice. */
export const PAYMENT_CHANNELS = ['cash', 'cheque', 'draft', 'card', 'transfer'] as const

export type AgencyInvoicePaymentChannel = (typeof PAYMENT_CHANNELS)[number]
