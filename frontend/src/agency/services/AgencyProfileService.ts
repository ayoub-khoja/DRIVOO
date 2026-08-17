import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import agencyAxiosInstance from './agencyAxios'

export const resolveLogoUrl = (avatar?: string | null) => {
  if (!avatar) {
    return ''
  }
  if (/^https?:\/\//i.test(avatar)) {
    return avatar
  }
  return bookcarsHelper.joinURL(env.CDN_USERS, avatar)
}

export const updateProfile = (
  data: bookcarsTypes.UpdateAgencyProfilePayload,
): Promise<bookcarsTypes.User> =>
  agencyAxiosInstance
    .put('/api/agency/profile', data)
    .then((res) => res.data)

export const updateLogo = (file: Blob): Promise<bookcarsTypes.AgencyLogoPayload> => {
  const formData = new FormData()
  formData.append('image', file)
  return agencyAxiosInstance
    .post('/api/agency/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export const deleteLogo = (): Promise<number> =>
  agencyAxiosInstance
    .delete('/api/agency/logo')
    .then((res) => res.status)

export const getShareLink = (): Promise<bookcarsTypes.AgencyShareLink> =>
  agencyAxiosInstance
    .get('/api/agency/share-link')
    .then((res) => res.data)
