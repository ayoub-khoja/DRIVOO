import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Paper,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  FormHelperText,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import { schema, FormFields } from '@/models/SignInForm'
import PasswordInput from '@/components/PasswordInput'
import Error from '@/components/Error'
import * as AdminAuthService from '@/admin/services/AdminAuthService'
import { useAdminContext } from '@/admin/context/AdminContext'
import env from '@/config/env.config'
import logo from '@/assets/img/logoWhite.png'

const AdminSignIn = () => {
  const navigate = useNavigate()
  const { admin, adminLoaded, setAdmin, refreshAdmin } = useAdminContext()
  const [visible, setVisible] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (!adminLoaded) {
      return
    }
    if (admin) {
      navigate('/admin/dashboard', { replace: true })
    } else {
      setVisible(true)
    }
  }, [admin, adminLoaded, navigate])

  const onSubmit = async ({ email, password }: FormFields) => {
    try {
      clearErrors('root')
      const res = await AdminAuthService.signin({ email, password })

      if (res.status !== 200) {
        setError('root', { message: strings.ERROR })
        return
      }

      const user = await AdminAuthService.getUser(res.data._id)
      if (!user || user.type !== bookcarsTypes.UserType.Admin) {
        await AdminAuthService.signout(false)
        setError('root', { message: strings.FORBIDDEN })
        return
      }

      if (user.blacklisted) {
        await AdminAuthService.signout(false)
        setError('root', { message: strings.ERROR })
        return
      }

      setAdmin(user)
      await refreshAdmin()
      navigate('/admin/dashboard', { replace: true })
    } catch {
      setError('root', { message: strings.ERROR })
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="admin-signin">
      <div className="admin-signin-panel">
        <div className="admin-signin-brand">
          <img src={logo} alt={env.WEBSITE_NAME} />
          <h1>{strings.SIGN_IN_TITLE}</h1>
          <p>{strings.SIGN_IN_SUBTITLE}</p>
        </div>

        <Paper className="admin-signin-card" elevation={0}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth margin="dense" error={!!errors.email}>
              <InputLabel className="required">{strings.EMAIL}</InputLabel>
              <OutlinedInput
                type="email"
                {...register('email')}
                label={strings.EMAIL}
                autoComplete="username"
                required
              />
              <FormHelperText>{errors.email?.message || ''}</FormHelperText>
            </FormControl>

            <PasswordInput
              label={strings.PASSWORD}
              variant="outlined"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              onChange={(e) => setValue('password', e.target.value)}
              required
              inputProps={{ autoComplete: 'current-password' }}
            />

            <div className="admin-signin-actions">
              <Button type="submit" variant="contained" className="btn-primary" disabled={isSubmitting} fullWidth>
                {strings.SIGN_IN}
              </Button>
            </div>

            {errors.root && <Error message={errors.root.message!} />}
          </form>
        </Paper>

        <a className="admin-back-site" href="/">{strings.BACK_SITE}</a>
      </div>
    </div>
  )
}

export default AdminSignIn
