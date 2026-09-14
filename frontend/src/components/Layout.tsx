import React, { useEffect, useRef, ReactNode } from 'react'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/master'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import { useAnalytics } from '@/utils/useAnalytics'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Unauthorized from '@/components/Unauthorized'

interface LayoutProps {
  strict?: boolean
  children: ReactNode
  onLoad?: (user?: bookcarsTypes.User) => void
}

const Layout = ({
  strict,
  children,
  onLoad
}: LayoutProps) => {
  useAnalytics()

  const { user, userLoaded, unauthorized } = useUserContext() as UserContextType
  const onLoadRef = useRef(onLoad)
  const didCallOnLoad = useRef(false)

  onLoadRef.current = onLoad

  useEffect(() => {
    const currentUser = UserService.getCurrentUser()

    if (!currentUser && strict) {
      UserService.signout(true, false)
      return
    }

    if (!userLoaded) {
      return
    }

    if (onLoadRef.current && !didCallOnLoad.current) {
      didCallOnLoad.current = true
      onLoadRef.current(user || undefined)
    }
  }, [user, userLoaded, strict])

  const handleResend = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    try {
      if (user) {
        const data = { email: user.email }

        const status = await UserService.resendLink(data)
        if (status === 200) {
          helper.info(strings.VALIDATION_EMAIL_SENT)
        } else {
          helper.error(null, strings.VALIDATION_EMAIL_ERROR)
        }
      }
    } catch (err) {
      helper.error(err, strings.VALIDATION_EMAIL_ERROR)
    }
  }

  // Never blank the whole page while auth is resolving (that looked like a frozen SPA).
  // Guests / non-strict pages see content as soon as the session check finishes.
  const showContent = !userLoaded
    ? !strict
    : ((!user) || !!user.verified || !strict)
  const showVerifyEmail = userLoaded && !!user && !user.verified && !!strict

  return (
    <>
      {!(unauthorized && strict) && showContent && (
        <div className="content">{children}</div>
      )}
      {!(unauthorized && strict) && showVerifyEmail && (
        <div className="validate-email">
          <span>{strings.VALIDATE_EMAIL}</span>
          <Button type="button" variant="contained" className="btn-primary btn-resend" onClick={handleResend}>
            {strings.RESEND}
          </Button>
        </div>
      )}
      {unauthorized && strict && <Unauthorized />}
    </>
  )
}

export default Layout
