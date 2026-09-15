import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

/**
 * Shows the top progress bar during React Router 7 transitions.
 * RR7 wraps navigations in startTransition: when the next route suspends (lazy),
 * React keeps the previous page visible and Suspense fallbacks do not show.
 * During that window, window.location and useLocation() can briefly diverge —
 * we use that to drive NProgress so the user always gets feedback.
 */
const RouteProgress = () => {
  const location = useLocation()
  const renderedPath = useRef(location.pathname + location.search)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120 })
  }, [])

  useEffect(() => {
    const rendered = location.pathname + location.search
    renderedPath.current = rendered
    NProgress.done()
    if (timer.current) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    const tick = () => {
      const browserPath = window.location.pathname + window.location.search
      if (browserPath !== renderedPath.current) {
        if (!NProgress.isStarted()) {
          NProgress.start()
        }
      }
    }

    timer.current = window.setInterval(tick, 40)
    window.addEventListener('popstate', tick)
    return () => {
      if (timer.current) {
        window.clearInterval(timer.current)
      }
      window.removeEventListener('popstate', tick)
      NProgress.done()
    }
  }, [])

  return null
}

export default RouteProgress
