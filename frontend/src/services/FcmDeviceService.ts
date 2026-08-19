import { AxiosInstance } from 'axios'
import * as bookcarsTypes from ':bookcars-types'

export const registerFcmDevice = (
  client: AxiosInstance,
  payload: bookcarsTypes.RegisterFcmDevicePayload,
): Promise<bookcarsTypes.FcmDevice> =>
  client
    .post('/api/fcm-devices', payload, { withCredentials: true })
    .then((res) => res.data)

export const unregisterFcmDevice = (
  client: AxiosInstance,
  payload: bookcarsTypes.UnregisterFcmDevicePayload,
): Promise<number> =>
  client
    .delete('/api/fcm-devices', { data: payload, withCredentials: true })
    .then((res) => res.status)

export const listFcmDevices = (client: AxiosInstance): Promise<bookcarsTypes.FcmDevice[]> =>
  client
    .get('/api/fcm-devices', { withCredentials: true })
    .then((res) => res.data)
