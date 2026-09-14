import NProgress from 'nprogress'

/**
 * Hard navigation for public vitrine links (header, footer, marketing pages).
 *
 * React Router 7 + React 19 wrap client navigations in startTransition. When the
 * next route is lazy-loaded, React keeps the previous page on screen with no
 * Suspense fallback — so clicks look broken until a full refresh.
 *
 * Use this for simple path changes. Keep react-router `navigate()` when the
 * destination needs `location.state` (search → offer → checkout).
 */
export const appNavigate = (path: string) => {
  if (typeof window === 'undefined') {
    return
  }

  const current = `${window.location.pathname}${window.location.search}`
  if (path === current) {
    return
  }

  try {
    NProgress.configure({ showSpinner: false })
    NProgress.start()
  } catch {
    // ignore
  }

  window.location.assign(path)
}
