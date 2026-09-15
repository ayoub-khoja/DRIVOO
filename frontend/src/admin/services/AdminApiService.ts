import * as bookcarsTypes from ':bookcars-types'
import adminAxiosInstance from './adminAxios'

export type AccountRequest = {
  _id: string
  email: string
  phone?: string
  fullName: string
  verified?: boolean
  language?: string
  type?: string
  createdAt?: string
  taxId?: string
  rneNumber?: string
  rneDocument?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  iban?: string
  legalRepFirstName?: string
  legalRepLastName?: string
  legalRepTitle?: string
  legalRepCin?: string
  whatsapp?: string
}

type AccountRequestsResult = {
  resultData: AccountRequest[]
  pageInfo: { totalRecords: number }[]
}[]

export const getAccountRequests = (page: number, size: number, keyword = ''): Promise<AccountRequestsResult> =>
  adminAxiosInstance
    .post(`/api/account-requests/${page}/${size}/?s=${encodeURIComponent(keyword)}`, {})
    .then((res) => res.data)

export const approveAccountRequest = (id: string): Promise<number> =>
  adminAxiosInstance
    .post(`/api/account-request/${encodeURIComponent(id)}/approve`, {})
    .then((res) => res.status)

export const rejectAccountRequest = (id: string): Promise<number> =>
  adminAxiosInstance
    .post(`/api/account-request/${encodeURIComponent(id)}/reject`, {})
    .then((res) => res.status)

export const getUsers = (
  page: number,
  size: number,
  types: bookcarsTypes.UserType[],
  keyword = '',
  active?: boolean,
  agencyApproved?: boolean,
): Promise<{ resultData: bookcarsTypes.User[], pageInfo: { totalRecords: number }[] }[]> =>
  adminAxiosInstance
    .post(
      `/api/users/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      {
        types,
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(typeof agencyApproved === 'boolean' ? { agencyApproved } : {}),
      },
    )
    .then((res) => res.data)

export const updateAgency = (
  id: string,
  data: bookcarsTypes.UpdateAgencyProfilePayload,
): Promise<{ status: number, data: bookcarsTypes.User }> =>
  adminAxiosInstance
    .put(`/api/admin/agency/${encodeURIComponent(id)}`, data)
    .then((res) => ({ status: res.status, data: res.data }))

export const deleteAgency = (id: string): Promise<number> =>
  adminAxiosInstance
    .delete(`/api/delete-supplier/${encodeURIComponent(id)}`)
    .then((res) => res.status)

export const deleteUser = (id: string): Promise<number> =>
  adminAxiosInstance
    .post('/api/delete-users', [id])
    .then((res) => res.status)

export const getAgencyLogins = (
  page: number,
  size: number,
  keyword = '',
): Promise<{ resultData: bookcarsTypes.AgencyLoginRow[], pageInfo: { totalRecords: number }[] }[]> =>
  adminAxiosInstance
    .post(`/api/admin/agency-logins/${page}/${size}/?s=${encodeURIComponent(keyword)}`, {})
    .then((res) => res.data)

export const updateAgencyLogin = (
  id: string,
  data: bookcarsTypes.UpdateAgencyLoginPayload,
): Promise<{ status: number, data: bookcarsTypes.AgencyLoginRow }> =>
  adminAxiosInstance
    .put(`/api/admin/agency/${encodeURIComponent(id)}/login`, data)
    .then((res) => ({ status: res.status, data: res.data }))

export const getAgencyPayments = (
  page: number,
  size: number,
  keyword = '',
): Promise<{ resultData: bookcarsTypes.AgencyPaymentRow[], pageInfo: { totalRecords: number }[] }[]> =>
  adminAxiosInstance
    .post(`/api/admin/agency-payments/${page}/${size}/?s=${encodeURIComponent(keyword)}`, {})
    .then((res) => res.data)

export const updateAgencyPayment = (
  id: string,
  data: bookcarsTypes.UpdateAgencyPaymentPayload,
): Promise<{ status: number, data: bookcarsTypes.AgencyPaymentRow }> =>
  adminAxiosInstance
    .put(`/api/admin/agency/${encodeURIComponent(id)}/payment`, data)
    .then((res) => ({ status: res.status, data: res.data }))
