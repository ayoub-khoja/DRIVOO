import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Paper,
  CircularProgress,
} from '@mui/material'
import { LockResetOutlined, ArrowBack } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import { needsAgencyPlan } from '@/agency/utils/subscriptionPlan'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings as rpStrings } from '@/lang/reset-password'
import { useUserContext, UserContextType } from '@/context/UserContext'
import * as helper from '@/utils/helper'
import Error from './Error'
import NoMatch from './NoMatch'
import { schema, FormFields } from '@/models/ResetPasswordForm'
import PasswordInput from '@/components/PasswordInput'

import '@/assets/css/reset-password.css'

const ResetPassword = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, setError, clearErrors } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

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

  const onSubmit = async ({ password }: FormFields) => {
    try {
      const data: bookcarsTypes.ActivatePayload = { userId, token, password }

      const status = await UserService.activate(data)

      if (status !== 200) {
        helper.error()
        return
      }

      await UserService.deleteTokens(userId)

      const clientRes = await UserService.signin({ email, password })
      if (clientRes.status === 200 && clientRes.data?._id) {
        const user = await UserService.getUser(clientRes.data._id)
        if (user && user.type === bookcarsTypes.UserType.User) {
          setUser(user)
          setUserLoaded(true)
          navigate('/')
          return
        }
        await UserService.signout(false, false)
      }

      const agencyRes = await AgencyAuthService.signin({ email, password })
      if (agencyRes.status === 200 && agencyRes.data?._id) {
        const agencyUser = await AgencyAuthService.getUser(agencyRes.data._id)
        if (agencyUser && agencyUser.type === bookcarsTypes.UserType.Supplier && !agencyUser.blacklisted) {
          await completeAgencyLogin(agencyUser)
          return
        }
        await AgencyAuthService.signout(false)
      }

      helper.error()
    } catch (err) {
      helper.error(err)
    }
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    if (user) {
      setNoMatch(true)
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.has('u') && params.has('e') && params.has('t')) {
      const _userId = params.get('u')
      const _email = params.get('e')
      const _token = params.get('t')
      if (_userId && _email && _token) {
        try {
          const status = await UserService.checkToken(_userId, _email, _token)

          if (status === 200) {
            setUserId(_userId)
            setEmail(_email)
            setToken(_token)
            setVisible(true)
          } else {
            setNoMatch(true)
          }
        } catch (err) {
          console.error(err)
          setError('root', {})
        }
      } else {
        setNoMatch(true)
      }
    } else {
      setNoMatch(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      {visible && (
        <div className="reset-password">
          <Paper className="reset-password-form" elevation={0}>
            <div className="reset-password-icon" aria-hidden>
              <LockResetOutlined />
            </div>
            <h1 className="reset-password-title">{rpStrings.NEW_PASSWORD_HEADING}</h1>
            <p className="reset-password-subtitle">{rpStrings.NEW_PASSWORD_SUBTITLE}</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <PasswordInput
                label={commonStrings.PASSWORD}
                variant="standard"
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
                autoComplete="new-password"
              />

              <PasswordInput
                label={commonStrings.CONFIRM_PASSWORD}
                variant="standard"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                onChange={(e) => {
                  if (errors.confirmPassword) {
                    clearErrors('confirmPassword')
                  }
                  setValue('confirmPassword', e.target.value)
                }}
                required
                inputProps={{
                  autoComplete: 'new-password',
                  form: {
                    autoComplete: 'off',
                  },
                }}
              />

              <div className="reset-password-buttons">
                <Button
                  type="button"
                  variant="outlined"
                  className="btn-reset-secondary"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/sign-in')}
                  disabled={isSubmitting}
                >
                  {rpStrings.BACK_TO_SIGN_IN}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    rpStrings.SAVE_PASSWORD
                  )}
                </Button>
              </div>
            </form>
          </Paper>
        </div>
      )}

      {errors.root && <Error />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default ResetPassword
