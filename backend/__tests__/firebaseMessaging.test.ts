import { isFirebaseAdminConfigured, getFirebaseAdminApp } from '../src/services/firebase/admin'
import { sendMulticastNotification, sendNotificationToDevice } from '../src/services/firebase/messaging'

describe('Firebase Admin messaging foundation', () => {
  it('should report when Admin SDK is not configured', () => {
    expect(isFirebaseAdminConfigured()).toBe(false)
  })

  it('should not send notifications when Admin SDK is missing', async () => {
    const result = await sendNotificationToDevice('token', {
      title: 'Hello',
      body: 'World',
    })
    expect(result.success).toBe(false)
    expect(result.reason).toBe('not_configured')
  })

  it('should skip multicast when no tokens are provided', async () => {
    const result = await sendMulticastNotification([], {
      title: 'Hello',
      body: 'World',
    })
    expect(result.success).toBe(true)
    expect(result.reason).toBe('no_tokens')
  })

  it('should not throw when initializing without credentials', () => {
    expect(getFirebaseAdminApp()).toBeNull()
  })
})
