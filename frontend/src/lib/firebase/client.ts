import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { getFirebaseClientConfig, isBrowser, isFirebaseClientConfigured } from './config'
import { FirebaseInitializationError } from './errors'
import { logWarn } from './log'

let app: FirebaseApp | null = null

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isBrowser()) {
    return null
  }

  if (app) {
    return app
  }

  if (!isFirebaseClientConfigured()) {
    logWarn('Client configuration is incomplete; Firebase will stay disabled')
    return null
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseClientConfig())
    return app
  } catch (error) {
    throw new FirebaseInitializationError(
      error instanceof Error ? error.message : 'Failed to initialize Firebase',
    )
  }
}

export const resetFirebaseAppForTests = (): void => {
  app = null
}
