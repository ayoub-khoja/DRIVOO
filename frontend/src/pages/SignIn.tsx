import React, { useState } from 'react'
import {
  Paper,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  Button,
  FormHelperText,
} from '@mui/material'
import { EmailOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings as suStrings } from '@/lang/sign-up'
import { strings } from '@/lang/sign-in'
import * as UserService from '@/services/UserService'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import { needsAgencyPlan } from '@/agency/utils/subscriptionPlan'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Error from '@/components/Error'
import Layout from '@/components/Layout'
import SocialLogin from '@/components/SocialLogin'
import { schema, FormFields } from '@/models/SignInForm'
import PasswordInput from '@/components/PasswordInput'

import '@/assets/css/signin.css'

const SignIn = () => {
  const navigate = useNavigate()
  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [visible, setVisible] = useState(false)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const signinError = (message?: string) => {
    setError('root', { message: message || strings.ERROR_IN_SIGN_IN })
  }

  const completeClientLogin = async (userId: string) => {
    const user = await UserService.getUser(userId)
    setUser(user)
    setUserLoaded(true)

    const params = new URLSearchParams(window.location.search)
    if (params.get('from') === 'checkout') {
      navigate('/checkout', {
        state: {
          carId: params.get('c'),
          pickupLocationId: params.get('p'),
          dropOffLocationId: params.get('d'),
          from: new Date(Number(params.get('f'))),
          to: new Date(Number(params.get('t'))),
        },
      })
      return
    }
    navigate('/')
  }

  const completeAgencyLogin = async (user: bookcarsTypes.User) => {
    AgencyAuthService.setCurrentUser({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      language: user.language,
      type: user.type,
      agencyApproved: user.agencyApproved,
      parentAgency: typeof user.parentAgency === 'object' && user.parentAgency
        ? user.parentAgency._id
        : user.parentAgency,
      subscriptionPlan: user.subscriptionPlan || null,
    })

    if (needsAgencyPlan(user)) {
      navigate('/agency/choose-plan', { replace: true })
    } else {
      navigate('/agency/dashboard', { replace: true })
    }
  }

  const tryAgencyLogin = async (email: string, password: string) => {
    const result = await AgencyAuthService.signin({ email, password })
    if (result.status !== 200 || !result.data?._id) {
      return false
    }

    const user = await AgencyAuthService.getUser(result.data._id)
    if (!user || user.type !== bookcarsTypes.UserType.Supplier) {
      await AgencyAuthService.signout(false)
      return false
    }
    if (user.blacklisted) {
      await AgencyAuthService.signout(false)
      signinError(strings.IS_BLACKLISTED)
      return true
    }

    await completeAgencyLogin(user)
    return true
  }

  const onSubmit = async ({ email, password }: FormFields) => {
    try {
      clearErrors('root')

      // 1) Client space (User type)
      const clientRes = await UserService.signin({
        email,
        password,
        stayConnected: UserService.getStayConnected(),
      })

      if (clientRes.status === 200 && clientRes.data?._id) {
        if (clientRes.data.blacklisted) {
          await UserService.signout(false)
          signinError(strings.IS_BLACKLISTED)
          return
        }
        await completeClientLogin(clientRes.data._id)
        return
      }

      // Clear accidental empty session from a 204 frontend response
      localStorage.removeItem('bc-fe-user')

      // 2) Agency space (Supplier type) — same email/password, auto-routed
      const handled = await tryAgencyLogin(email, password)
      if (!handled) {
        signinError()
      }
    } catch {
      // Frontend axios may throw on network errors; still try agency once
      try {
        localStorage.removeItem('bc-fe-user')
        const handled = await tryAgencyLogin(email, password)
        if (!handled) {
          signinError()
        }
      } catch {
        signinError()
      }
    }
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    UserService.setStayConnected(false)

    // Already signed in as agency?
    const agencySession = AgencyAuthService.getCurrentUser()
    if (agencySession?._id) {
      try {
        const status = await AgencyAuthService.validateAccessToken()
        if (status === 200) {
          const agencyUser = await AgencyAuthService.getUser(agencySession._id)
          if (agencyUser && agencyUser.type === bookcarsTypes.UserType.Supplier && !agencyUser.blacklisted) {
            await completeAgencyLogin(agencyUser)
            return
          }
        }
      } catch {
        // Fall through
      }
    }

    // Already signed in as client?
    if (user) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('from') === 'checkout') {
        navigate('/checkout', {
          state: {
            carId: params.get('c'),
            pickupLocationId: params.get('p'),
            dropOffLocationId: params.get('d'),
            from: new Date(Number(params.get('f'))),
            to: new Date(Number(params.get('t'))),
          },
        })
      } else {
        navigate('/')
      }
      return
    }

    setVisible(true)
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div className="signin">
        <Paper className={`signin-form ${visible ? '' : 'hidden'}`} elevation={0}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <h1 className="signin-form-title">{strings.SIGN_IN_HEADING}</h1>
            <p className="signin-form-subtitle">{strings.SIGN_IN_SUBTITLE}</p>

            <FormControl fullWidth margin="dense" error={!!errors.email}>
              <InputLabel htmlFor="signin-email">{commonStrings.EMAIL}</InputLabel>
              <Input
                id="signin-email"
                {...register('email')}
                onChange={(e) => {
                  if (errors.email) {
                    clearErrors('email')
                  }
                  setValue('email', e.target.value)
                }}
                autoComplete="email"
                required
                endAdornment={(
                  <InputAdornment position="end">
                    <EmailOutlined fontSize="small" />
                  </InputAdornment>
                )}
              />
              <FormHelperText error={!!errors.email}>{errors.email?.message || ''}</FormHelperText>
            </FormControl>

            <PasswordInput
              label={commonStrings.PASSWORD}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              onChange={(e) => {
                if (errors.password) {
                  clearErrors('password')
                }
                setValue('password', e.target.value)
              }}
              required
              autoComplete="current-password"
            />

            <div className="stay-connected">
              <input
                id="stay-connected"
                type="checkbox"
                onChange={(e) => UserService.setStayConnected(e.currentTarget.checked)}
              />
              <label htmlFor="stay-connected">
                {strings.STAY_CONNECTED}
              </label>
            </div>

            <div className="forgot-password-wrapper">
              <Button variant="text" onClick={() => navigate('/forgot-password')} className="btn-lnk">
                {strings.RESET_PASSWORD}
              </Button>
            </div>

            <SocialLogin />

            <div className="signin-buttons">
              <Button variant="outlined" onClick={() => navigate('/sign-up')} className="btn-signin-secondary">
                {suStrings.SIGN_UP}
              </Button>
              <Button type="submit" variant="contained" className="btn-primary" disabled={isSubmitting}>
                {strings.SIGN_IN}
              </Button>
            </div>
            <div className="form-error">
              {errors.root && <Error message={errors.root.message!} />}
            </div>
          </form>
        </Paper>
      </div>
    </Layout>
  )
}

export default SignIn
