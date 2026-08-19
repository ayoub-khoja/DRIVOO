import type { FirebaseClientConfig } from './types'

const readEnv = (value: unknown): string => String(value || '').trim()

export const getFirebaseClientConfig = (): FirebaseClientConfig => ({
  apiKey: readEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: readEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: readEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: readEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: readEnv(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: readEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || undefined,
})

export const getFirebaseVapidKey = (): string => readEnv(import.meta.env.VITE_FIREBASE_VAPID_KEY)

export const isFirebaseClientConfigured = (): boolean => {
  const config = getFirebaseClientConfig()
  return Boolean(
    config.apiKey
    && config.authDomain
    && config.projectId
    && config.storageBucket
    && config.messagingSenderId
    && config.appId,
  )
}

export const isFirebaseMessagingConfigured = (): boolean =>
  isFirebaseClientConfigured() && Boolean(getFirebaseVapidKey())

export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined'
