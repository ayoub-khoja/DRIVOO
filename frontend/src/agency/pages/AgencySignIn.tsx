import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  Paper,
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import PasswordInput from '@/components/PasswordInput'
import Error from '@/components/Error'
import logo from '@/assets/img/logoWhite.png'

const AgencySignIn = () => {
  const navigate = useNavigate()
  const { setAgency, refreshAgency } = useAgencyContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(false)
    setForbidden(false)
    setSubmitting(true)

    try {
      const result = await AgencyAuthService.signin({ email, password })
      if (result.status !== 200 || !result.data?._id) {
        setError(true)
        return
      }

      const user = await AgencyAuthService.getUser(result.data._id)
      if (!user || user.type !== bookcarsTypes.UserType.Supplier) {
        await AgencyAuthService.signout(false)
        setForbidden(true)
        return
      }

      setAgency(user)
      AgencyAuthService.setCurrentUser({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        language: user.language,
        type: user.type,
        agencyApproved: user.agencyApproved,
      })
      await refreshAgency()
      navigate('/agency/dashboard', { replace: true })
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="agency-signin">
      <div className="agency-signin-ambient" aria-hidden />
      <Paper className="agency-signin-card" elevation={0}>
        <div className="agency-signin-brand">
          <img src={logo} alt="DRIVOO" />
          <h1>{strings.SIGN_IN_TITLE}</h1>
          <p>{strings.SIGN_IN_SUBTITLE}</p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <FormControl fullWidth margin="dense">
            <InputLabel>{strings.EMAIL}</InputLabel>
            <OutlinedInput
              type="email"
              label={strings.EMAIL}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormControl>

          <PasswordInput
            label={strings.PASSWORD}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            formControlProps={{ fullWidth: true, margin: 'dense', required: true }}
          />

          <Button type="submit" variant="contained" className="btn-primary agency-signin-btn" disabled={submitting}>
            {strings.SIGN_IN}
          </Button>

          <div className="form-error">
            {error && <Error message={strings.ERROR} />}
            {forbidden && <Error message={strings.FORBIDDEN} />}
          </div>
        </form>
      </Paper>
    </div>
  )
}

export default AgencySignIn
