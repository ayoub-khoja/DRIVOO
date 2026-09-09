import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const getClients = (
  page: number,
  size: number,
  keyword = '',
): Promise<bookcarsTypes.Result<bookcarsTypes.User>> =>
  agencyAxiosInstance
    .post(`/api/users/${page}/${size}/?s=${encodeURIComponent(keyword)}`, {
      types: [bookcarsTypes.UserType.User],
    })
    .then((res) => res.data)

export const createClient = (data: bookcarsTypes.CreateUserPayload): Promise<number> =>
  agencyAxiosInstance
    .post('/api/create-user', data, { withCredentials: true })
    .then((res) => res.status)

/** 200 = email available, 204 = already registered */
export const validateEmail = (email: string): Promise<number> =>
  agencyAxiosInstance
    .post('/api/validate-email', { email })
    .then((res) => res.status)
    .catch((err) => {
      if (err?.response?.status === 204) {
        return 204
      }
      throw err
    })
