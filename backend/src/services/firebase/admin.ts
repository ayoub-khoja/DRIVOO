import {
  App,
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import * as env from '../../config/env.config'
import * as logger from '../../utils/logger'

let app: App | null = null

const hasExplicitCredentials = (): boolean => Boolean(
  env.FIREBASE_PROJECT_ID
  && env.FIREBASE_CLIENT_EMAIL
  && env.FIREBASE_PRIVATE_KEY,
)

export const isFirebaseAdminConfigured = (): boolean => Boolean(
  hasExplicitCredentials() || env.GOOGLE_APPLICATION_CREDENTIALS,
)

export const getFirebaseAdminApp = (): App | null => {
  if (app) {
    return app
  }

  const existing = getApps()
  if (existing.length > 0) {
    app = getApp()
    return app
  }

  if (!isFirebaseAdminConfigured()) {
    return null
  }

  try {
    if (hasExplicitCredentials()) {
      app = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      })
      return app
    }

    app = initializeApp({
      credential: applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID || undefined,
    })
    return app
  } catch (error) {
    logger.error('[firebase.admin] Failed to initialize Firebase Admin SDK', error)
    return null
  }
}

export const resetFirebaseAdminForTests = (): void => {
  app = null
}
