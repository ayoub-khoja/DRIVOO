export const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js'

export const FIRESTORE_COLLECTIONS = {
  conversations: 'conversations',
  messages: 'messages',
} as const

export const FCM_TOKEN_STORAGE_KEY = 'bc_fcm_token'

export const getConversationPath = (conversationId: string): string =>
  `${FIRESTORE_COLLECTIONS.conversations}/${conversationId}`

export const getConversationMessagesPath = (conversationId: string): string =>
  `${FIRESTORE_COLLECTIONS.conversations}/${conversationId}/${FIRESTORE_COLLECTIONS.messages}`
