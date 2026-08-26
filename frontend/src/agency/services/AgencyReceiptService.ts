import type {
  AgencyReceipt,
  AgencyReceiptInput,
  AgencyReceiptListResult,
} from '@/agency/types/receipt'
import agencyAxiosInstance from './agencyAxios'

/**
 * Receipts are scoped server side by the session token — no agency id is sent.
 */
export const listReceipts = (
  keyword = '',
  page = 1,
  pageSize = 10,
): Promise<AgencyReceiptListResult> =>
  agencyAxiosInstance
    .get(`/api/agency/receipts/${page}/${pageSize}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const getReceipt = (id: string): Promise<AgencyReceipt> =>
  agencyAxiosInstance
    .get(`/api/agency/receipt/${encodeURIComponent(id)}`)
    .then((res) => res.data)

export const createReceipt = (data: AgencyReceiptInput): Promise<AgencyReceipt> =>
  agencyAxiosInstance
    .post('/api/agency/receipts', data)
    .then((res) => res.data)

export const deleteReceipt = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/agency/receipt/${encodeURIComponent(id)}`)
    .then((res) => res.status)
