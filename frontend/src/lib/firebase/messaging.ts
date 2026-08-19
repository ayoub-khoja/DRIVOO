import { deleteToken, getMessaging, getToken, isSupported, Messaging, onMessage } from 'firebase/messaging'
import * as bookcarsTypes from ':bookcars-types'
import { getFirebaseApp } from './client'
import { getFirebaseVapidKey, isBrowser } from './config'
import { FIREBASE_MESSAGING_SW_URL, FCM_TOKEN_STORAGE_KEY } from './constants'
import { FCMTokenError, MessagingUnsupportedError, NotificationPermissionDeniedError } from './errors'
import { logError, logWarn } from './log'
import type { ForegroundMessageHandler } from './types'

let messagingInstance: Messaging | null = null
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

const persistToken = (token: string | null): void => {
  if (!isBrowser()) {
    return
  }
  if (!token) {
    window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
}

export const getStoredFcmToken = (): string | null => {
  if (!isBrowser()) {
    return null
  }
  return window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
}

export const isMessagingSupported = async (): Promise<boolean> => {
  if (!isBrowser() || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    return await isSupported()
  } catch {
    return false
  }
}

const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (messagingInstance) {
    return messagingInstance
  }

  const supported = await isMessagingSupported()
  if (!supported) {
    return null
  }

  const app = getFirebaseApp()
  if (!app) {
    return null
  }

  messagingInstance = getMessaging(app)
  return messagingInstance
}

const registerMessagingServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isBrowser() || !('serviceWorker' in navigator)) {
    return null
  }

  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register(FIREBASE_MESSAGING_SW_URL, {
      scope: '/',
    })
    await navigator.serviceWorker.ready
    return serviceWorkerRegistration
  } catch (error) {
    logError('Failed to register Firebase messaging service worker', error)
    return null
  }
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isBrowser() || !('Notification' in window)) {
    throw new MessagingUnsupportedError()
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }

  const permission = await Notification.requestPermission()
  if (permission === 'denied') {
    throw new NotificationPermissionDeniedError()
  }
  return permission
}

export const getFCMToken = async (): Promise<string | null> => {
  const messaging = await getMessagingInstance()
  if (!messaging) {
    throw new MessagingUnsupportedError()
  }

  const vapidKey = getFirebaseVapidKey()
  if (!vapidKey) {
    throw new FCMTokenError('Missing VITE_FIREBASE_VAPID_KEY')
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    throw new NotificationPermissionDeniedError()
  }

  const registration = await registerMessagingServiceWorker()
  if (!registration) {
    throw new FCMTokenError('Firebase messaging service worker is not available')
  }

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })
    persistToken(token || null)
    return token || null
  } catch (error) {
    throw new FCMTokenError(error instanceof Error ? error.message : 'Failed to retrieve an FCM token')
  }
}

export const deleteFCMToken = async (): Promise<void> => {
  const messaging = await getMessagingInstance()
  if (!messaging) {
    persistToken(null)
    return
  }

  try {
    await deleteToken(messaging)
  } catch (error) {
    logWarn('Failed to delete FCM token from Firebase', error)
  } finally {
    persistToken(null)
  }
}

export const subscribeToForegroundMessages = async (
  handler: ForegroundMessageHandler,
): Promise<() => void> => {
  const messaging = await getMessagingInstance()
  if (!messaging) {
    return () => undefined
  }

  return onMessage(messaging, (payload) => {
    const data = payload.data || {}
    handler({
      title: payload.notification?.title || data.title,
      body: payload.notification?.body || data.body,
      url: data.url,
      type: data.type,
      data,
    })
  })
}

export const detectWebDeviceMeta = (): Pick<bookcarsTypes.RegisterFcmDevicePayload, 'platform' | 'browser' | 'deviceName'> => {
  const userAgent = isBrowser() ? window.navigator.userAgent : ''
  let browser = 'other'
  if (/edg/i.test(userAgent)) {
    browser = 'edge'
  } else if (/chrome|crios/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = 'chrome'
  } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    browser = 'safari'
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = 'firefox'
  }

  return {
    platform: bookcarsTypes.FcmDevicePlatform.Web,
    browser,
    deviceName: `${browser} ${isBrowser() ? window.navigator.platform : ''}`.trim(),
  }
}

export const resetMessagingForTests = (): void => {
  messagingInstance = null
  serviceWorkerRegistration = null
}
