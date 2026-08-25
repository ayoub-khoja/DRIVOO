import axios from 'axios'
import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

const STORAGE_KEY = 'bc-agency-user'
const ONBOARDING_KEY = 'bc-agency-onboarding'

export type AgencyOnboardingCredentials = { email: string, password: string }

export const setOnboardingCredentials = (email: string, password: string) => {
  sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify({ email, password }))
}

export const getOnboardingCredentials = (): AgencyOnboardingCredentials | null => {
  const raw = sessionStorage.getItem(ONBOARDING_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as AgencyOnboardingCredentials
    if (!parsed?.email || !parsed?.password) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const clearOnboardingCredentials = () => {
  sessionStorage.removeItem(ONBOARDING_KEY)
}

export const signin = (data: bookcarsTypes.SignInPayload): Promise<{ status: number, data: bookcarsTypes.User }> =>
  agencyAxiosInstance
    .post('/api/sign-in/agency', data)
    .then((res) => {
      if (res.status === 200 && res.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data))
      }
      return { status: res.status, data: res.data }
    })

export const signout = async (redirect = true) => {
  localStorage.removeItem(STORAGE_KEY)
  clearOnboardingCredentials()
  try {
    await agencyAxiosInstance.post('/api/sign-out', null)
  } catch {
    // ignore
  }
  if (redirect) {
    window.location.href = '/sign-in'
  }
}

export const validateAccessToken = (): Promise<number> =>
  agencyAxiosInstance
    .post('/api/validate-access-token', null)
    .then((res) => res.status)
    .catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status) {
        return err.response.status
      }
      return 500
    })

export const getUser = (id?: string): Promise<bookcarsTypes.User | null> =>
  agencyAxiosInstance
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

export const updateLanguage = (data: bookcarsTypes.UpdateLanguagePayload): Promise<number> =>
  agencyAxiosInstance
    .post('/api/update-language', data)
    .then((res) => {
      if (res.status === 200) {
        const user = getCurrentUser()
        if (user) {
          setCurrentUser({ ...user, language: data.language })
        }
      }
      return res.status
    })
