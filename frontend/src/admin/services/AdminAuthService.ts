import axios from 'axios'
import * as bookcarsTypes from ':bookcars-types'
import adminAxiosInstance from './adminAxios'

const STORAGE_KEY = 'bc-admin-user'

/**
 * Admin panel sign-in (Admin role only on the UI; API accepts Admin/Supplier).
 */
export const signin = (data: bookcarsTypes.SignInPayload): Promise<{ status: number, data: bookcarsTypes.User }> =>
  adminAxiosInstance
    .post('/api/sign-in/admin', data)
    .then((res) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data))
      return { status: res.status, data: res.data }
    })

export const signout = async (redirect = true) => {
  localStorage.removeItem(STORAGE_KEY)

  try {
    await adminAxiosInstance.post('/api/sign-out', null)
  } catch {
    // ignore network errors on logout
  }

  if (redirect) {
    window.location.href = '/admin/sign-in'
  }
}

export const validateAccessToken = (): Promise<number> =>
  adminAxiosInstance
    .post('/api/validate-access-token', null)
    .then((res) => res.status)
    .catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status) {
        return err.response.status
      }
      return 500
    })

export const getUser = (id?: string): Promise<bookcarsTypes.User | null> =>
  adminAxiosInstance
    .get(`/api/user/${encodeURIComponent(id || '')}`)
    .then((res) => res.data)
    .catch(() => null)

export const getCurrentUser = (): bookcarsTypes.User | null => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as bookcarsTypes.User
  } catch {
    return null
  }
}

export const setCurrentUser = (user: bookcarsTypes.User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
