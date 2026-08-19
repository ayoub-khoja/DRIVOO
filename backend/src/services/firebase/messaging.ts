import { getMessaging } from 'firebase-admin/messaging'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../../config/env.config'
import * as logger from '../../utils/logger'
import FirebaseDevice from '../../models/FirebaseDevice'
import { getFirebaseAdminApp, isFirebaseAdminConfigured } from './admin'

type SendResult = {
  success: boolean
  successCount: number
  failureCount: number
  reason?: string
}

type MessagingSendResponse = {
  success: boolean
  error?: { code: string }
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
])

const toDataPayload = (payload: bookcarsTypes.NotificationPayload): Record<string, string> => {
  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    environment: env.FIREBASE_ENVIRONMENT,
    ...(payload.data || {}),
  }
  if (payload.url) {
    data.url = payload.url
  }
  if (payload.type) {
    data.type = payload.type
  }
  return data
}

const deactivateInvalidTokens = async (tokens: string[], responses: MessagingSendResponse[]): Promise<void> => {
  const invalidTokens = tokens.filter((token, index) => {
    const response = responses[index]
    return !response.success && response.error && INVALID_TOKEN_CODES.has(response.error.code)
  })

  if (invalidTokens.length === 0) {
    return
  }

  await FirebaseDevice.updateMany(
    { token: { $in: invalidTokens } },
    { $set: { isActive: false } },
  )
}

export const sendNotificationToDevice = async (
  token: string,
  payload: bookcarsTypes.NotificationPayload,
): Promise<SendResult> => {
  const app = getFirebaseAdminApp()
  if (!app) {
    logger.warn('[firebase.messaging] Admin SDK is not configured')
    return { success: false, successCount: 0, failureCount: 0, reason: 'not_configured' }
  }

  try {
    await getMessaging(app).send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: toDataPayload(payload),
      webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
    })
    return { success: true, successCount: 1, failureCount: 0 }
  } catch (error) {
    logger.error('[firebase.messaging] Failed to send notification to device', error)
    return { success: false, successCount: 0, failureCount: 1, reason: 'send_failed' }
  }
}

export const sendMulticastNotification = async (
  tokens: string[],
  payload: bookcarsTypes.NotificationPayload,
): Promise<SendResult> => {
  const uniqueTokens = [...new Set(tokens.filter(Boolean))]
  if (uniqueTokens.length === 0) {
    return { success: true, successCount: 0, failureCount: 0, reason: 'no_tokens' }
  }

  const app = getFirebaseAdminApp()
  if (!app) {
    logger.warn('[firebase.messaging] Admin SDK is not configured')
    return { success: false, successCount: 0, failureCount: uniqueTokens.length, reason: 'not_configured' }
  }

  try {
    const response = await getMessaging(app).sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: toDataPayload(payload),
      webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
    })

    await deactivateInvalidTokens(uniqueTokens, response.responses)

    return {
      success: response.failureCount === 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    logger.error('[firebase.messaging] Failed to send multicast notification', error)
    return { success: false, successCount: 0, failureCount: uniqueTokens.length, reason: 'send_failed' }
  }
}

export const sendNotificationToUser = async (
  userId: string,
  payload: bookcarsTypes.NotificationPayload,
  environment = env.FIREBASE_ENVIRONMENT,
): Promise<SendResult> => {
  const devices = await FirebaseDevice.find({
    user: userId,
    isActive: true,
    environment,
  }).select('token')

  const tokens = devices.map((device) => device.token)
  return sendMulticastNotification(tokens, payload)
}

export const canSendPushNotifications = (): boolean => isFirebaseAdminConfigured()
