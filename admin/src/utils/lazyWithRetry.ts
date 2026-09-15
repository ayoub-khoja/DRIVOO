import { ComponentType, lazy, LazyExoticComponent } from 'react'

const RELOAD_KEY = 'bc:chunk-reload'

const CHUNK_ERROR_RE =
  /text\/html.*MIME|Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i

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

export const reloadForFreshAssets = (): boolean => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') {
      sessionStorage.removeItem(RELOAD_KEY)
      return false
    }
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    // ignore
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
        return new Promise(() => undefined)
      }
      throw error
    }
  }) as LazyExoticComponent<T>
