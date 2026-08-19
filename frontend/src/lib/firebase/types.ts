export type { Conversation, ChatMessage as Message, MessageParticipant, NotificationPayload, FcmDevice, FirebaseMessagePayload } from ':bookcars-types'

export type FirebaseClientConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export type ForegroundMessageHandler = (payload: {
  title?: string
  body?: string
  url?: string
  type?: string
  data: Record<string, string>
}) => void
