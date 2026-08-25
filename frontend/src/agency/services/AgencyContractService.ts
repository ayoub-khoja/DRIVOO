import type {
  AgencyContract,
  AgencyContractInput,
  AgencyContractListResult,
} from '@/agency/types/contract'
import agencyAxiosInstance from './agencyAxios'

/**
 * Contracts are scoped server side by the session token - no agency id is sent.
 */
export const listContracts = (
  keyword = '',
  page = 1,
  pageSize = 10,
): Promise<AgencyContractListResult> =>
  agencyAxiosInstance
    .get(`/api/agency/contracts/${page}/${pageSize}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const getContract = (id: string): Promise<AgencyContract> =>
  agencyAxiosInstance
    .get(`/api/agency/contract/${encodeURIComponent(id)}`)
    .then((res) => res.data)

export const createContract = (data: AgencyContractInput): Promise<AgencyContract> =>
  agencyAxiosInstance
    .post('/api/agency/contracts', data)
    .then((res) => res.data)

export const deleteContract = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/agency/contract/${encodeURIComponent(id)}`)
    .then((res) => res.status)

/**
 * Fetch the PDF rendered by the backend. The document is authenticated through the
 * agency cookie, so it cannot be linked to directly - it is downloaded as a blob and
 * turned into an object URL by the caller.
 */
export const getContractPdf = (id: string): Promise<Blob> =>
  agencyAxiosInstance
    .get(`/api/agency/contract/${encodeURIComponent(id)}/pdf`, { responseType: 'blob' })
    .then((res) => new Blob([res.data], { type: 'application/pdf' }))

/**
 * Save the contract PDF to the visitor's disk.
 */
export const downloadContractPdf = async (id: string, number: string): Promise<void> => {
  const blob = await getContractPdf(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Contrat-${number}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
