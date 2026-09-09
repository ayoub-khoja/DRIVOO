import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  EmailOutlined,
  MarkEmailReadOutlined,
  ArrowBack,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/reset-password'
import * as helper from '@/utils/helper'
import { schema, FormFields } from '@/models/ForgotPasswordForm'

import '@/assets/css/forgot-password.css'

const ForgotPassword = () => {
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    setValue,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user) {
      navigate('/')
    } else {
      setVisible(true)
    }
  }

  const onSubmit = async ({ email }: FormFields) => {
    try {
      const emailStatus = await UserService.validateEmail({ email })
      if (emailStatus === 200) {
        setError('email', { message: strings.EMAIL_ERROR })
        return
      }

      const status = await UserService.resend(email, true)
      if (status === 200) {
        setSentEmail(email)
        setSent(true)
      } else {
        helper.error()
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        setError('email', { message: strings.EMAIL_ERROR })
        return
      }
      helper.error(err)
    }
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="forgot-password">
        <Paper className={`forgot-password-form ${visible ? '' : 'hidden'}`} elevation={0}>
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <h1 className="forgot-password-title">{strings.RESET_PASSWORD_HEADING}</h1>
              <p className="forgot-password-subtitle">{strings.RESET_PASSWORD}</p>

              <FormControl fullWidth margin="dense" error={!!errors.email}>
                <InputLabel htmlFor="forgot-email" className="required">
                  {commonStrings.EMAIL}
                </InputLabel>
                <Input
                  id="forgot-email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  required
                  error={!!errors.email}
                  onChange={(e) => {
                    if (errors.email) {
                      clearErrors('email')
                    }
                    setValue('email', e.target.value)
                  }}
                  endAdornment={(
                    <InputAdornment position="end">
                      <EmailOutlined fontSize="small" />
                    </InputAdornment>
                  )}
                />
                <FormHelperText error={!!errors.email}>
                  {errors.email?.message || ''}
                </FormHelperText>
              </FormControl>

              <div className="forgot-password-buttons">
                <Button
                  type="button"
                  variant="outlined"
                  className="btn-forgot-secondary"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/sign-in')}
                  disabled={isSubmitting}
                >
                  {strings.BACK_TO_SIGN_IN}
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
                    strings.RESET
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="forgot-password-success">
              <div className="forgot-password-success-icon" aria-hidden>
                <MarkEmailReadOutlined />
              </div>
              <h1 className="forgot-password-title">{strings.EMAIL_SENT_TITLE}</h1>
              <p className="forgot-password-subtitle">
                {strings.EMAIL_SENT}
                {sentEmail ? (
                  <>
                    <br />
                    <strong>{sentEmail}</strong>
                  </>
                ) : null}
              </p>
              <p className="forgot-password-hint">{strings.EMAIL_SENT_HINT}</p>
              <div className="forgot-password-buttons is-success">
                <Button
                  type="button"
                  variant="outlined"
                  className="btn-forgot-secondary"
                  onClick={() => {
                    setSent(false)
                    setSentEmail('')
                  }}
                >
                  {strings.RESEND}
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  className="btn-primary"
                  onClick={() => navigate('/sign-in')}
                >
                  {strings.BACK_TO_SIGN_IN}
                </Button>
              </div>
            </div>
          )}
        </Paper>
      </div>
    </Layout>
  )
}

export default ForgotPassword
