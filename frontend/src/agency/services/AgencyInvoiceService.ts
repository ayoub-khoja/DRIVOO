import type {
  AgencyInvoice,
  AgencyInvoiceInput,
  AgencyInvoiceListResult,
} from '@/agency/types/invoice'
import agencyAxiosInstance from './agencyAxios'

/**
 * Invoices are scoped server side by the session token — no agency id is sent.
 */
export const listInvoices = (
  keyword = '',
  page = 1,
  pageSize = 10,
): Promise<AgencyInvoiceListResult> =>
  agencyAxiosInstance
    .get(`/api/agency/invoices/${page}/${pageSize}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const getInvoice = (id: string): Promise<AgencyInvoice> =>
  agencyAxiosInstance
    .get(`/api/agency/invoice/${encodeURIComponent(id)}`)
    .then((res) => res.data)

export const createInvoice = (data: AgencyInvoiceInput): Promise<AgencyInvoice> =>
  agencyAxiosInstance
    .post('/api/agency/invoices', data)
    .then((res) => res.data)

export const deleteInvoice = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/agency/invoice/${encodeURIComponent(id)}`)
    .then((res) => res.status)
