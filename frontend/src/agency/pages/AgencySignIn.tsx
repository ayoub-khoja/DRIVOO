import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Legacy agency sign-in (dark UI) — disabled.
 * Unified login is /sign-in: redirect is based on user type after credentials check.
 */
const AgencySignIn = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/sign-in', { replace: true })
  }, [navigate])

  return null
}

export default AgencySignIn
