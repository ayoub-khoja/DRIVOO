import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}))

describe('Firebase client initialization', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('returns null outside the browser', async () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    const { getFirebaseApp } = await import('./client')
    expect(getFirebaseApp()).toBeNull()
  })

  it('returns null when the public config is incomplete', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } })
    vi.stubGlobal('document', {})
    const { getFirebaseApp } = await import('./client')
    expect(getFirebaseApp()).toBeNull()
  })
})
