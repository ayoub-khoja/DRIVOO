export type AgencyReceiptPaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque'

export interface AgencyReceipt {
  _id: string
  number: string
  agencyId: string
  createdAt: string
  paidAt: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  vehicleLabel?: string
  description: string
  amount: number
  currency: string
  paymentMethod: AgencyReceiptPaymentMethod
  notes?: string
}

export interface AgencyReceiptInput {
  clientName: string
  clientEmail?: string
  clientPhone?: string
  vehicleLabel?: string
  description: string
  amount: number
  currency?: string
  paymentMethod: AgencyReceiptPaymentMethod
  paidAt: string
  notes?: string
}

export interface AgencyReceiptListResult {
  rows: AgencyReceipt[]
  totalRecords: number
  page: number
  pageSize: number
}
