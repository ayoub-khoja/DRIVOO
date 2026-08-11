import React, { useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Checkbox,
  Link,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import {
  PersonOutline as PersonOutlineIcon,
  StorefrontOutlined as StorefrontOutlinedIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import { schema, FormFields } from '@/models/SignUpForm'
import PasswordInput from '@/components/PasswordInput'
import SupplierSignupWizard, { supplierStepLabels } from '@/components/SupplierSignupWizard'

import '@/assets/css/signup.css'

type SignUpRole = bookcarsTypes.UserType.User | bookcarsTypes.UserType.Supplier

const SignUp = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [role, setRole] = useState<SignUpRole | null>(null)
  const [supplierDone, setSupplierDone] = useState(false)
  const [supplierWizardStep, setSupplierWizardStep] = useState(0)

  const clientForm = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  })

  const isClient = role === bookcarsTypes.UserType.User
  const isSupplier = role === bookcarsTypes.UserType.Supplier
  const steps = isSupplier ? supplierStepLabels() : [strings.STEP_ROLE, strings.STEP_DETAILS]
  const stepperActive = (() => {
    if (supplierDone) {
      return steps.length
    }
    if (isSupplier && activeStep >= 1) {
      return 1 + supplierWizardStep
    }
    return activeStep
  })()

  const verifyRecaptcha = async () => {
    let recaptchaToken = ''
    if (reCaptchaLoaded) {
      recaptchaToken = await generateReCaptchaToken()
      if (!(await helper.verifyReCaptcha(recaptchaToken))) {
        recaptchaToken = ''
      }
    }

    if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
      setRecaptchaError(true)
      return false
    }

    setRecaptchaError(false)
    return true
  }

  const onClientSubmit = async (data: FormFields) => {
    try {
      const emailStatus = await UserService.validateEmail({ email: data.email })
      if (emailStatus !== 200) {
        clientForm.setError('email', { message: commonStrings.EMAIL_ALREADY_REGISTERED })
        return
      }

      if (!(await verifyRecaptcha())) {
        return
      }

      const payload: bookcarsTypes.SignUpPayload = {
        email: data.email,
        phone: data.phone,
        password: data.password,
        fullName: data.fullName,
        birthDate: data.birthDate,
        language: UserService.getLanguage(),
      }

      const status = await UserService.signup(payload)

      if (status === 200) {
        const signInResult = await UserService.signin({
          email: data.email,
          password: data.password,
        })

        if (signInResult.status === 200 && signInResult.data?._id) {
          const user = await UserService.getUser(signInResult.data._id)
          if (user) {
            setUser(user)
            setUserLoaded(true)
            navigate('/bookings')
            return
          }
        }

        clientForm.setError('root', { message: strings.SIGN_UP_ERROR })
      } else {
        clientForm.setError('root', { message: strings.SIGN_UP_ERROR })
      }
    } catch (err) {
      console.error(err)
      clientForm.setError('root', { message: strings.SIGN_UP_ERROR })
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user) {
      navigate('/')
    } else {
      setLanguage(UserService.getLanguage())
      setVisible(true)
    }
  }

  const selectRole = (nextRole: SignUpRole) => {
    setRole(nextRole)
    setSupplierDone(false)
  }

  const goToDetails = () => {
    if (!role) {
      return
    }
    setActiveStep(1)
  }

  const goBackToRole = () => {
    setActiveStep(0)
    setSupplierDone(false)
    setSupplierWizardStep(0)
    clientForm.clearErrors()
  }

  const renderTos = (
    registerTos: ReturnType<typeof clientForm.register>,
    errorMessage: string | undefined,
    clearTosError: () => void,
  ) => (
    <div className="signup-tos">
      <table>
        <tbody>
          <tr>
            <td aria-label="tos">
              <Checkbox
                {...registerTos}
                color="primary"
                onChange={() => {
                  clearTosError()
                }}
              />
            </td>
            <td>
              <Link href="/tos" target="_blank" rel="noreferrer">
                {commonStrings.TOS}
              </Link>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <FormHelperText error={!!errorMessage}>{errorMessage || ''}</FormHelperText>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div className={`signup ${visible ? 'is-visible' : ''}`}>
        <Paper className={`signup-form ${isSupplier ? 'signup-form-wide' : ''} ${visible ? '' : 'hidden'}`} elevation={0}>
          <div className="signup-form-head">
            <h1 className="signup-form-title">{strings.SIGN_UP_HEADING}</h1>
            <p className="signup-form-subtitle">
              {isClient && activeStep >= 1 ? strings.STEP_DETAILS : strings.ROLE_SUBTITLE}
            </p>

            <Stepper activeStep={stepperActive} alternativeLabel className="signup-stepper">
              {steps.map((label) => (
                <Step key={label} completed={supplierDone || undefined}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </div>

          <div className="signup-form-body">
          {activeStep === 0 && !supplierDone && (
            <div className="signup-step signup-role-step">
              <div className="signup-role-intro">
                <h2>{strings.ROLE_TITLE}</h2>
                <p>{strings.ROLE_SUBTITLE}</p>
              </div>

              <div className="signup-role-grid" role="radiogroup" aria-label={strings.STEP_ROLE}>
                <button
                  type="button"
                  className={`signup-role-card ${role === bookcarsTypes.UserType.User ? 'selected' : ''}`}
                  onClick={() => selectRole(bookcarsTypes.UserType.User)}
                  aria-pressed={role === bookcarsTypes.UserType.User}
                >
                  <span className="signup-role-icon" aria-hidden>
                    <PersonOutlineIcon />
                  </span>
                  <span className="signup-role-title">{strings.ROLE_CLIENT}</span>
                  <span className="signup-role-desc">{strings.ROLE_CLIENT_DESC}</span>
                </button>

                <button
                  type="button"
                  className={`signup-role-card ${role === bookcarsTypes.UserType.Supplier ? 'selected' : ''}`}
                  onClick={() => selectRole(bookcarsTypes.UserType.Supplier)}
                  aria-pressed={role === bookcarsTypes.UserType.Supplier}
                >
                  <span className="signup-role-icon" aria-hidden>
                    <StorefrontOutlinedIcon />
                  </span>
                  <span className="signup-role-title">{strings.ROLE_AGENCY}</span>
                  <span className="signup-role-desc">{strings.ROLE_AGENCY_DESC}</span>
                </button>
              </div>

              <div className="buttons signup-step-actions">
                <Button
                  type="button"
                  variant="contained"
                  className="btn-primary"
                  disabled={!role}
                  onClick={goToDetails}
                >
                  {strings.CONTINUE}
                </Button>
                <Button variant="outlined" color="primary" onClick={() => navigate('/')}>
                  {commonStrings.CANCEL}
                </Button>
              </div>
            </div>
          )}

          {activeStep >= 1 && isClient && (
            <form className="signup-step signup-client-step" onSubmit={clientForm.handleSubmit(onClientSubmit)}>
              <div className="signup-panel-intro">
                <h2>{strings.STEP_DETAILS}</h2>
                <p>{strings.ROLE_CLIENT_DESC}</p>
              </div>

              <FormControl fullWidth margin="dense" error={!!clientForm.formState.errors.fullName}>
                <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                <OutlinedInput
                  type="text"
                  {...clientForm.register('fullName')}
                  label={commonStrings.FULL_NAME}
                  autoComplete="off"
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!clientForm.formState.errors.email}>
                <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                <OutlinedInput
                  type="text"
                  {...clientForm.register('email', {
                    onChange: () => {
                      if (clientForm.formState.errors.email) {
                        clientForm.clearErrors('email')
                      }
                    },
                  })}
                  label={commonStrings.EMAIL}
                  autoComplete="off"
                  required
                />
                <FormHelperText error={!!clientForm.formState.errors.email}>
                  {clientForm.formState.errors.email?.message || ''}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!clientForm.formState.errors.phone}>
                <InputLabel className="required">{commonStrings.PHONE}</InputLabel>
                <OutlinedInput
                  type="text"
                  {...clientForm.register('phone', {
                    onChange: () => {
                      if (clientForm.formState.errors.phone) {
                        clientForm.clearErrors('phone')
                      }
                    },
                  })}
                  label={commonStrings.PHONE}
                  autoComplete="off"
                  required
                />
                <FormHelperText error={!!clientForm.formState.errors.phone}>
                  {clientForm.formState.errors.phone?.message || ''}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!clientForm.formState.errors.birthDate}>
                <DatePicker
                  label={commonStrings.BIRTH_DATE}
                  variant="outlined"
                  required
                  onChange={(birthDate) => {
                    if (birthDate) {
                      if (clientForm.formState.errors.birthDate) {
                        clientForm.clearErrors('birthDate')
                      }
                      clientForm.setValue('birthDate', birthDate, { shouldValidate: true })
                    }
                  }}
                  language={language}
                />
                <FormHelperText error={!!clientForm.formState.errors.birthDate}>
                  {clientForm.formState.errors.birthDate?.message || ''}
                </FormHelperText>
              </FormControl>

              <PasswordInput
                label={commonStrings.PASSWORD}
                variant="outlined"
                {...clientForm.register('password')}
                error={!!clientForm.formState.errors.password}
                helperText={clientForm.formState.errors.password?.message}
                onChange={(e) => {
                  if (clientForm.formState.errors.password) {
                    clientForm.clearErrors('password')
                  }
                  clientForm.setValue('password', e.target.value)
                }}
                required
                inputProps={{
                  autoComplete: 'new-password',
                  form: { autoComplete: 'off' },
                }}
              />

              <PasswordInput
                label={commonStrings.CONFIRM_PASSWORD}
                variant="outlined"
                {...clientForm.register('confirmPassword')}
                error={!!clientForm.formState.errors.confirmPassword}
                helperText={clientForm.formState.errors.confirmPassword?.message}
                onChange={(e) => {
                  if (clientForm.formState.errors.confirmPassword) {
                    clientForm.clearErrors('confirmPassword')
                  }
                  clientForm.setValue('confirmPassword', e.target.value)
                }}
                required
                inputProps={{
                  autoComplete: 'new-password',
                  form: { autoComplete: 'off' },
                }}
              />

              {renderTos(
                clientForm.register('tos'),
                clientForm.formState.errors.tos?.message,
                () => {
                  if (clientForm.formState.errors.tos) {
                    clientForm.clearErrors('tos')
                  }
                },
              )}

              <SocialLogin redirectToHomepage />

              <div className="buttons signup-step-actions">
                <Button type="submit" variant="contained" className="btn-primary" disabled={clientForm.formState.isSubmitting}>
                  {strings.SIGN_UP}
                </Button>
                <Button type="button" variant="outlined" color="primary" onClick={goBackToRole}>
                  {strings.BACK}
                </Button>
              </div>

              <div className="form-error">
                {clientForm.formState.errors.root && <Error message={clientForm.formState.errors.root.message!} />}
                {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
              </div>
            </form>
          )}

          {activeStep >= 1 && isSupplier && (
            <SupplierSignupWizard
              verifyRecaptcha={verifyRecaptcha}
              onBackToRole={goBackToRole}
              onDone={() => {
                setSupplierDone(true)
              }}
              onStepChange={setSupplierWizardStep}
              setRecaptchaError={setRecaptchaError}
              recaptchaError={recaptchaError}
              completed={supplierDone}
            />
          )}
          </div>
        </Paper>
      </div>

      {clientForm.formState.isSubmitting && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default SignUp
