import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CircularProgress, Paper } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import { needsAgencyPlan } from '@/agency/utils/subscriptionPlan'
import PasswordInput from '@/components/PasswordInput'
import Error from '@/components/Error'
import { schema, FormFields } from '@/models/ActivateForm'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/agency/lang/agency'
import logo from '@/assets/img/logoWhite.png'
import activateHero from '@/assets/img/first-login-agence.png'

const AgencyActivate = () => {
  const navigate = useNavigate()
  const { setAgency } = useAgencyContext()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(window.location.search)
      const _userId = params.get('u')
      const _email = params.get('e')
      const _token = params.get('t')

      if (!_userId || !_email || !_token) {
        setInvalid(true)
        setLoading(false)
        return
      }

      try {
        const status = await UserService.checkToken(
          _userId,
          _email,
          _token,
          bookcarsTypes.AppType.Agency,
        )
        if (status === 200) {
          setUserId(_userId)
          setEmail(_email)
          setToken(_token)
        } else {
          setInvalid(true)
        }
      } catch {
        setInvalid(true)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const onSubmit = async ({ password }: FormFields) => {
    setSubmitError(false)
    try {
      const status = await UserService.activate({ userId, token, password })
      if (status !== 200) {
        setSubmitError(true)
        return
      }

      await UserService.deleteTokens(userId)

      const signInResult = await AgencyAuthService.signin({ email, password })
      if (signInResult.status !== 200 || !signInResult.data?._id) {
        setSubmitError(true)
        return
      }

      const user = await AgencyAuthService.getUser(signInResult.data._id)
      if (!user || user.type !== bookcarsTypes.UserType.Supplier) {
        setSubmitError(true)
        return
      }

      if (needsAgencyPlan(user)) {
        await AgencyAuthService.signout(false)
        setAgency(null)
        AgencyAuthService.setOnboardingCredentials(email, password)
        navigate('/agency/choose-plan', { replace: true })
        return
      }

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
      setAgency(user)
      navigate('/agency/dashboard', { replace: true })
    } catch {
      setSubmitError(true)
    }
  }

  return (
    <div className="agency-signin agency-activate">
      <div className="agency-signin-ambient" aria-hidden />
      <div className="agency-activate-shell">
        <Paper className="agency-signin-card agency-activate-form" elevation={0}>
          <div className="agency-signin-brand">
            <img src={logo} alt="DRIVOO" />
            <h1>{strings.ACTIVATE_TITLE}</h1>
            <p>{strings.ACTIVATE_SUBTITLE}</p>
          </div>

          {loading ? (
            <div className="agency-inline-loading">
              <CircularProgress size={28} />
              <span>{strings.LOADING}</span>
            </div>
          ) : invalid ? (
            <div className="form-error">
              <Error message={strings.ACTIVATE_INVALID} />
              <Button variant="outlined" color="inherit" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
                {strings.BACK_SITE}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <PasswordInput
                label={commonStrings.PASSWORD}
                variant="outlined"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                formControlProps={{ fullWidth: true, margin: 'dense', required: true }}
              />
              <PasswordInput
                label={commonStrings.CONFIRM_PASSWORD}
                variant="outlined"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                formControlProps={{ fullWidth: true, margin: 'dense', required: true }}
              />
              <Button
                type="submit"
                variant="contained"
                className="btn-primary agency-signin-btn"
                disabled={isSubmitting}
              >
                {strings.ACTIVATE_SUBMIT}
              </Button>
              {submitError && (
                <div className="form-error">
                  <Error message={strings.ACTIVATE_ERROR} />
                </div>
              )}
            </form>
          )}
        </Paper>

        <aside className="agency-activate-visual" aria-hidden>
          <img src={activateHero} alt="" />
        </aside>
      </div>
    </div>
  )
}

export default AgencyActivate
