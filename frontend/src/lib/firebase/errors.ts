export class FirebaseInitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FirebaseInitializationError'
  }
}

export class MessagingUnsupportedError extends Error {
  constructor(message = 'Firebase Cloud Messaging is not supported in this browser') {
    super(message)
    this.name = 'MessagingUnsupportedError'
  }
}

export class NotificationPermissionDeniedError extends Error {
  constructor(message = 'Notification permission was denied') {
    super(message)
    this.name = 'NotificationPermissionDeniedError'
  }
}

export class FCMTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FCMTokenError'
  }
}
