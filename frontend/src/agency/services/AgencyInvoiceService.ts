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

/**
 * Fetch the PDF rendered by the backend. The document is authenticated through the
 * agency cookie, so it cannot be linked to directly — it is downloaded as a blob and
 * turned into an object URL by the caller.
 *
 * @param {string} id
 * @returns {Promise<Blob>}
 */
export const getInvoicePdf = (id: string): Promise<Blob> =>
  agencyAxiosInstance
    .get(`/api/agency/invoice/${encodeURIComponent(id)}/pdf`, { responseType: 'blob' })
    .then((res) => new Blob([res.data], { type: 'application/pdf' }))

/**
 * Save the invoice PDF to the visitor's disk.
 */
export const downloadInvoicePdf = async (id: string, number: string): Promise<void> => {
  const blob = await getInvoicePdf(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Facture-${number}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke on the next tick so Safari has time to start the download
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
