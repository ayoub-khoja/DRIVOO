import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  deleteToken: vi.fn(),
  isSupported: vi.fn(async () => false),
  onMessage: vi.fn(),
}))

describe('Firebase messaging helpers', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('reports messaging as unsupported without a browser', async () => {
    const { isMessagingSupported, getStoredFcmToken } = await import('./messaging')
    expect(await isMessagingSupported()).toBe(false)
    expect(getStoredFcmToken()).toBeNull()
  })

  it('detects a Chrome web device', async () => {
    vi.stubGlobal('window', {
      navigator: {
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
        platform: 'Win32',
      },
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    })
    vi.stubGlobal('document', {})
    const { detectWebDeviceMeta } = await import('./messaging')
    const meta = detectWebDeviceMeta()
    expect(meta.platform).toBe('web')
    expect(meta.browser).toBe('chrome')
  })
})
