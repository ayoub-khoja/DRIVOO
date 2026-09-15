import { ComponentType, lazy, LazyExoticComponent } from 'react'

const RELOAD_KEY = 'bc:chunk-reload'

const CHUNK_ERROR_RE =
  /text\/html.*MIME|Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i

/** True when a failed dynamic import got HTML (stale deploy / SPA fallback) instead of JS. */
export const isChunkLoadError = (error: unknown): boolean => {
  if (!error) {
    return false
  }
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : String((error as { message?: unknown })?.message ?? error)
  return CHUNK_ERROR_RE.test(message)
}

/**
 * One automatic full reload after a deploy so the browser picks up new hashed chunks.
 * sessionStorage prevents an infinite reload loop if the new build is also broken.
 */
export const reloadForFreshAssets = (): boolean => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') {
      sessionStorage.removeItem(RELOAD_KEY)
      return false
    }
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    // private mode / blocked storage — still try a single reload
  }
  window.location.reload()
  return true
}

export const clearChunkReloadFlag = (): void => {
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    // ignore
  }
}

/**
 * React.lazy wrapper that recovers from stale chunk URLs after a new deploy.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyWithRetry = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> =>
  lazy(async () => {
    try {
      const mod = await factory()
      clearChunkReloadFlag()
      return mod
    } catch (error) {
      if (isChunkLoadError(error) && reloadForFreshAssets()) {
        // Keep Suspense pending until the reload navigates away.
        return new Promise(() => undefined)
      }
      throw error
    }
  }) as LazyExoticComponent<T>
