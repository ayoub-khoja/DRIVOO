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

/**
 * Fetch the PDF rendered by the backend. The document is authenticated through the
 * agency cookie, so it cannot be linked to directly — it is downloaded as a blob and
 * turned into an object URL by the caller.
 */
export const getReceiptPdf = (id: string): Promise<Blob> =>
  agencyAxiosInstance
    .get(`/api/agency/receipt/${encodeURIComponent(id)}/pdf`, { responseType: 'blob' })
    .then((res) => new Blob([res.data], { type: 'application/pdf' }))

/**
 * Save the receipt PDF to the visitor's disk.
 */
export const downloadReceiptPdf = async (id: string, number: string): Promise<void> => {
  const blob = await getReceiptPdf(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Recu-${number}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
