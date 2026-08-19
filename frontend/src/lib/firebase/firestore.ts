import type { Firestore } from 'firebase/firestore'
import { getFirebaseApp } from './client'

let db: Firestore | null = null

export const getFirestoreClient = async (): Promise<Firestore | null> => {
  if (db) {
    return db
  }

  const app = getFirebaseApp()
  if (!app) {
    return null
  }

  const { getFirestore } = await import('firebase/firestore')
  db = getFirestore(app)
  return db
}

export { getConversationPath, getConversationMessagesPath } from './constants'

export const resetFirestoreClientForTests = (): void => {
  db = null
}
