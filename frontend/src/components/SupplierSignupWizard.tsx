import React, { useRef, useState } from 'react'
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Checkbox,
  Link,
  TextField,
} from '@mui/material'
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUploadOutlined as CloudUploadOutlinedIcon,
  DeleteOutline as DeleteOutlineIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { LoginSocialGoogle, IResolveParams } from ':reactjs-social-login'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import * as GeoService from '@/services/GeoService'
import * as langHelper from '@/utils/langHelper'
import * as helper from '@/utils/helper'
import Error from '@/components/Error'
import {
  SupplierFormFields,
  supplierCompanySchema,
  supplierAddressBankSchema,
  supplierContactSchema,
} from '@/models/SignUpForm'

import GoogleIcon from '@/assets/img/google-icon.png'

type SupplierSignupWizardProps = {
  verifyRecaptcha: () => Promise<boolean>
  onBackToRole: () => void
  onDone: () => void
  onStepChange?: (wizardStep: number) => void
  setRecaptchaError: (value: boolean) => void
  recaptchaError: boolean
  completed?: boolean
}

const companyFields = ['fullName', 'taxId', 'rneNumber', 'rneDocument'] as const
const addressBankFields = ['address', 'city', 'governorate', 'postalCode', 'iban'] as const
const contactFields = [
  'legalRepFirstName',
  'legalRepLastName',
  'legalRepTitle',
  'legalRepCin',
  'phone',
  'whatsapp',
  'email',
  'tos',
] as const
const LAST_STEP = 2

const SupplierSignupWizard = ({
  verifyRecaptcha,
  onBackToRole,
  onDone,
  onStepChange,
  recaptchaError,
  completed = false,
}: SupplierSignupWizardProps) => {
  const [step, setStep] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [fileLabel, setFileLabel] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [cities, setCities] = useState<bookcarsTypes.GeoCity[]>([])
  const [municipalities, setMunicipalities] = useState<bookcarsTypes.GeoMunicipality[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [geoError, setGeoError] = useState('')
  /** Only show field errors after an explicit Continue / Submit click on the current step */
  const [showErrors, setShowErrors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const language = langHelper.getLanguage()

  React.useEffect(() => {
    if (completed) {
      setSuccessOpen(true)
    }
  }, [completed])

  // No zodResolver: full-schema validation was marking contact fields invalid before step 4 submit
  const form = useForm<SupplierFormFields>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      fullName: '',
      taxId: '',
      rneNumber: '',
      rneDocument: '',
      address: '',
      city: '',
      governorate: '',
      postalCode: '',
      iban: '',
      legalRepFirstName: '',
      legalRepLastName: '',
      legalRepTitle: '',
      legalRepCin: '',
      phone: '',
      whatsapp: '',
      email: '',
      tos: false,
    },
  })

  const { register, formState: { errors, isSubmitting }, setValue, clearErrors, setError, getValues, watch } = form
  const rneDocument = watch('rneDocument')
  const governorate = watch('governorate')
  const city = watch('city')
  const postalCode = watch('postalCode')
  const email = watch('email')

  const fieldError = (name: keyof typeof errors) => (showErrors ? errors[name] : undefined)

  const updateStep = (next: number) => {
    setShowErrors(false)
    clearErrors()
    setStep(next)
    onStepChange?.(next)
  }

  React.useEffect(() => {
    let cancelled = false
    const loadGeo = async () => {
      try {
        const catalog = await GeoService.getTunisiaCatalog()
        if (!cancelled) {
          setCities(catalog.cities)
          setMunicipalities(catalog.municipalities)
        }
      } catch {
        if (!cancelled) {
          setGeoError(strings.GEO_LOAD_ERROR)
        }
      }
    }
    void loadGeo()
    return () => {
      cancelled = true
    }
  }, [])

  const validateStep = async () => {
    if (step === 0) {
      const parsed = supplierCompanySchema.safeParse({
        fullName: getValues('fullName'),
        taxId: getValues('taxId'),
        rneNumber: getValues('rneNumber'),
        rneDocument: getValues('rneDocument'),
      })
      companyFields.forEach((field) => clearErrors(field))
      if (!parsed.success) {
        setShowErrors(true)
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as typeof companyFields[number]
          if (companyFields.includes(field)) {
            setError(field, { message: issue.message })
          }
        })
        return false
      }
      return true
    }

    if (step === 1) {
      const parsed = supplierAddressBankSchema.safeParse({
        address: getValues('address'),
        city: getValues('city'),
        governorate: getValues('governorate'),
        postalCode: getValues('postalCode'),
        iban: getValues('iban'),
      })
      addressBankFields.forEach((field) => clearErrors(field))
      if (!parsed.success) {
        setShowErrors(true)
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as typeof addressBankFields[number]
          if (addressBankFields.includes(field)) {
            setError(field, { message: issue.message })
          }
        })
        return false
      }
      return true
    }

    if (step === 2) {
      const parsed = supplierContactSchema.safeParse({
        legalRepFirstName: getValues('legalRepFirstName'),
        legalRepLastName: getValues('legalRepLastName'),
        legalRepTitle: getValues('legalRepTitle'),
        legalRepCin: getValues('legalRepCin'),
        phone: getValues('phone'),
        whatsapp: getValues('whatsapp'),
        email: getValues('email'),
        tos: getValues('tos'),
      })
      contactFields.forEach((field) => clearErrors(field))
      if (!parsed.success) {
        setShowErrors(true)
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as typeof contactFields[number]
          if (contactFields.includes(field)) {
            setError(field, { message: issue.message })
          }
        })
        return false
      }
      return true
    }

    return true
  }

  const goNext = async () => {
    if (await validateStep()) {
      updateStep(Math.min(step + 1, LAST_STEP))
    }
  }

  const goBack = () => {
    if (step === 0) {
      onBackToRole()
      return
    }
    updateStep(step - 1)
  }

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const previous = getValues('rneDocument')
      if (previous) {
        try {
          await UserService.deleteTempSupplierDoc(previous)
        } catch {
          // ignore cleanup errors
        }
      }

      const filename = await UserService.createSupplierDoc(file)
      setValue('rneDocument', filename, { shouldDirty: true })
      setFileLabel(file.name)
      clearErrors('rneDocument')
    } catch (err) {
      helper.error(err)
      setError('rneDocument', { message: strings.UPLOAD_ERROR })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeDocument = async () => {
    const previous = getValues('rneDocument')
    if (previous) {
      try {
        await UserService.deleteTempSupplierDoc(previous)
      } catch {
        // ignore
      }
    }
    setValue('rneDocument', '')
    setFileLabel('')
  }

  const goHome = () => {
    setSuccessOpen(false)
    window.location.href = '/'
  }

  const closeSuccess = () => {
    setSuccessOpen(false)
  }

  const onSubmit = async (data: SupplierFormFields) => {
    try {
      const emailStatus = await UserService.validateEmail({ email: data.email })
      if (emailStatus !== 200) {
        setShowErrors(true)
        setError('email', { message: commonStrings.EMAIL_ALREADY_REGISTERED })
        return
      }

      if (!(await verifyRecaptcha())) {
        return
      }

      const payload: bookcarsTypes.SignUpPayload = {
        email: data.email,
        phone: data.phone,
        fullName: data.fullName,
        language: UserService.getLanguage(),
        taxId: data.taxId,
        rneNumber: data.rneNumber,
        rneDocument: data.rneDocument,
        address: data.address,
        city: data.city,
        governorate: data.governorate,
        postalCode: data.postalCode,
        iban: data.iban,
        legalRepFirstName: data.legalRepFirstName,
        legalRepLastName: data.legalRepLastName,
        legalRepTitle: data.legalRepTitle,
        legalRepCin: data.legalRepCin,
        whatsapp: data.whatsapp,
      }

      const status = await UserService.supplierSignup(payload)
      if (status === 200) {
        onDone()
        setSuccessOpen(true)
        return
      }

      setError('root', { message: strings.SIGN_UP_ERROR })
    } catch (err) {
      console.error(err)
      setError('root', { message: strings.SIGN_UP_ERROR })
    }
  }

  const submitRequest = async () => {
    if (!(await validateStep())) {
      return
    }
    // handleSubmit (no resolver) only tracks isSubmitting — validation already done above
    await form.handleSubmit(onSubmit)()
  }

  return (
    <>
      {!completed && (
      <form
        className="signup-step supplier-wizard"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (step < LAST_STEP) {
            void goNext()
            return
          }
          void submitRequest()
        }}
      >
        {step === 0 && (
          <div className="signup-panel">
            <div className="signup-panel-intro">
              <h3>{strings.STEP_COMPANY}</h3>
              <p>{strings.COMPANY_NAME_HINT}</p>
            </div>

            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!fieldError('fullName')}>
                <InputLabel className="required">{strings.COMPANY_NAME}</InputLabel>
                <OutlinedInput
                  type="text"
                  {...register('fullName')}
                  label={strings.COMPANY_NAME}
                  autoComplete="organization"
                />
                <FormHelperText error={!!fieldError('fullName')}>{fieldError('fullName')?.message || strings.COMPANY_NAME_HINT}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!fieldError('taxId')}>
                <InputLabel className="required">{strings.TAX_ID}</InputLabel>
                <OutlinedInput type="text" {...register('taxId')} label={strings.TAX_ID} />
                <FormHelperText error={!!fieldError('taxId')}>{fieldError('taxId')?.message || strings.TAX_ID_HINT}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!fieldError('rneNumber')}>
                <InputLabel className="required">{strings.RNE_NUMBER}</InputLabel>
                <OutlinedInput type="text" {...register('rneNumber')} label={strings.RNE_NUMBER} />
                <FormHelperText error={!!fieldError('rneNumber')}>{fieldError('rneNumber')?.message || strings.RNE_NUMBER_HINT}</FormHelperText>
              </FormControl>
            </div>

            <div className={`signup-upload ${fieldError('rneDocument') ? 'is-error' : ''} ${rneDocument ? 'has-file' : ''}`}>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf" hidden onChange={onFileChange} />
              {!rneDocument ? (
                <button type="button" className="signup-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <CloudUploadOutlinedIcon />
                  <span>{uploading ? commonStrings.LOADING : strings.RNE_UPLOAD}</span>
                  <small>{strings.RNE_DOCUMENT_HINT}</small>
                </button>
              ) : (
                <div className="signup-upload-file">
                  <InsertDriveFileOutlinedIcon />
                  <div>
                    <strong>{strings.RNE_UPLOADED}</strong>
                    <span>{fileLabel || rneDocument}</span>
                  </div>
                  <Button type="button" color="error" startIcon={<DeleteOutlineIcon />} onClick={removeDocument}>
                    {strings.RNE_REMOVE}
                  </Button>
                </div>
              )}
              {fieldError('rneDocument') && <FormHelperText error>{fieldError('rneDocument')?.message}</FormHelperText>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="signup-panel">
            <div className="signup-panel-intro">
              <h3>{strings.STEP_ADDRESS_BANK}</h3>
            </div>
            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!fieldError('address')} className="signup-span-2">
                <InputLabel className="required">{strings.ADDRESS}</InputLabel>
                <OutlinedInput type="text" {...register('address')} label={strings.ADDRESS} />
                <FormHelperText error={!!fieldError('address')}>{fieldError('address')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('governorate')}>
                <Autocomplete
                  options={cities}
                  value={cities.find((item) => GeoService.getGeoLabel(item.names, language) === governorate) || null}
                  getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_event, nextCity) => {
                    setSelectedCityId(nextCity?.id ?? null)
                    setValue('governorate', nextCity ? GeoService.getGeoLabel(nextCity.names, language) : '', { shouldDirty: true })
                    setValue('city', '', { shouldDirty: true })
                    setValue('postalCode', '', { shouldDirty: true })
                    clearErrors(['governorate', 'city', 'postalCode'])
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={strings.GOVERNORATE}
                      required
                      error={!!fieldError('governorate')}
                      helperText={fieldError('governorate')?.message || ''}
                    />
                  )}
                />
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('city')}>
                <Autocomplete
                  options={selectedCityId
                    ? municipalities.filter((item) => item.cityId === selectedCityId)
                    : []}
                  disabled={!selectedCityId}
                  value={municipalities.find((item) => item.cityId === selectedCityId && GeoService.getGeoLabel(item.names, language) === city) || null}
                  getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_event, nextMunicipality) => {
                    const nextCity = nextMunicipality
                      ? GeoService.getGeoLabel(nextMunicipality.names, language)
                      : ''
                    const nextPostal = nextMunicipality?.postalCode?.trim() || ''
                    setValue('city', nextCity, { shouldDirty: true })
                    setValue('postalCode', nextPostal, { shouldDirty: true })
                    clearErrors(['city', 'postalCode'])
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={strings.CITY}
                      required
                      error={!!fieldError('city')}
                      helperText={fieldError('city')?.message || (selectedCityId ? '' : strings.GEO_PLACEHOLDER_MUNICIPALITY)}
                    />
                  )}
                />
              </FormControl>
              {geoError ? <FormHelperText className="signup-span-2" error>{geoError}</FormHelperText> : null}
              <FormControl fullWidth margin="dense" error={!!fieldError('postalCode')}>
                <InputLabel className="required" shrink={postalCode ? true : undefined}>{strings.POSTAL_CODE}</InputLabel>
                <OutlinedInput
                  type="text"
                  name="postalCode"
                  label={strings.POSTAL_CODE}
                  value={postalCode}
                  notched={postalCode ? true : undefined}
                  onChange={(event) => {
                    setValue('postalCode', event.target.value, { shouldDirty: true })
                    if (errors.postalCode) {
                      clearErrors('postalCode')
                    }
                  }}
                />
                <FormHelperText error={!!fieldError('postalCode')}>
                  {fieldError('postalCode')?.message || ''}
                </FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('iban')}>
                <InputLabel className="required">{strings.IBAN}</InputLabel>
                <OutlinedInput
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  {...register('iban')}
                  label={strings.IBAN}
                  inputProps={{ maxLength: 20, inputMode: 'numeric', pattern: '[0-9]*' }}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, 20)
                    setValue('iban', digits, { shouldDirty: true })
                    if (errors.iban) {
                      clearErrors('iban')
                    }
                  }}
                />
                <FormHelperText error={!!fieldError('iban')}>{fieldError('iban')?.message || strings.IBAN_HINT}</FormHelperText>
              </FormControl>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="signup-panel">
            <div className="signup-panel-intro">
              <h3>{strings.LEGAL_REP_SECTION}</h3>
            </div>
            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!fieldError('legalRepFirstName')}>
                <InputLabel className="required">{strings.LEGAL_FIRST_NAME}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepFirstName')} label={strings.LEGAL_FIRST_NAME} />
                <FormHelperText error={!!fieldError('legalRepFirstName')}>{fieldError('legalRepFirstName')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('legalRepLastName')}>
                <InputLabel className="required">{strings.LEGAL_LAST_NAME}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepLastName')} label={strings.LEGAL_LAST_NAME} />
                <FormHelperText error={!!fieldError('legalRepLastName')}>{fieldError('legalRepLastName')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('legalRepTitle')}>
                <InputLabel className="required">{strings.LEGAL_TITLE}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepTitle')} label={strings.LEGAL_TITLE} />
                <FormHelperText error={!!fieldError('legalRepTitle')}>{fieldError('legalRepTitle')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('legalRepCin')}>
                <InputLabel className="required">{strings.LEGAL_CIN}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepCin')} label={strings.LEGAL_CIN} />
                <FormHelperText error={!!fieldError('legalRepCin')}>{fieldError('legalRepCin')?.message || ''}</FormHelperText>
              </FormControl>
            </div>

            <div className="signup-panel-intro signup-panel-intro-spaced">
              <h3>{strings.CONTACT_SECTION}</h3>
              <p>{strings.EMAIL_OFFICIAL_HINT}</p>
            </div>
            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!fieldError('phone')}>
                <InputLabel className="required">{strings.PHONE_MAIN}</InputLabel>
                <OutlinedInput type="text" {...register('phone')} label={strings.PHONE_MAIN} />
                <FormHelperText error={!!fieldError('phone')}>{fieldError('phone')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('whatsapp')}>
                <InputLabel className="required">{strings.WHATSAPP}</InputLabel>
                <OutlinedInput type="text" {...register('whatsapp')} label={strings.WHATSAPP} required />
                <FormHelperText error={!!fieldError('whatsapp')}>{fieldError('whatsapp')?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!fieldError('email')} className="signup-span-2">
                <InputLabel className="required" shrink={email ? true : undefined}>{strings.EMAIL_OFFICIAL}</InputLabel>
                <OutlinedInput
                  type="email"
                  name="email"
                  label={strings.EMAIL_OFFICIAL}
                  value={email}
                  notched={email ? true : undefined}
                  onChange={(event) => {
                    setValue('email', event.target.value, { shouldDirty: true })
                    if (errors.email) {
                      clearErrors('email')
                    }
                  }}
                />
                <FormHelperText error={!!fieldError('email')}>{fieldError('email')?.message || strings.EMAIL_OFFICIAL_HINT}</FormHelperText>
              </FormControl>
            </div>

            <div className="social-login signup-google-email">
              <div className="separator">
                <hr />
                <span>{commonStrings.OR}</span>
                <hr />
              </div>
              <div className="login-buttons">
                <LoginSocialGoogle
                  client_id={env.GG_APP_ID}
                  typeResponse="idToken"
                  redirect_uri={window.location.href}
                  scope="openid email"
                  discoveryDocs="claims_supported"
                  onResolve={({ data }: IResolveParams) => {
                    let emailFromGoogle = String(data?.email || '').trim()
                    if (!emailFromGoogle && data?.credential) {
                      try {
                        emailFromGoogle = String(UserService.parseJwt(String(data.credential))?.email || '').trim()
                      } catch {
                        emailFromGoogle = ''
                      }
                    }
                    if (!emailFromGoogle) {
                      return
                    }
                    setValue('email', emailFromGoogle, { shouldDirty: true })
                    clearErrors('email')
                  }}
                  onReject={() => {
                    // Keep the form as-is; user can type the email manually
                  }}
                  className="social"
                >
                  <img alt="Google" src={GoogleIcon} className="social" title={strings.EMAIL_OFFICIAL} />
                </LoginSocialGoogle>
              </div>
            </div>

            <div className="signup-tos">
              <table>
                <tbody>
                  <tr>
                    <td>
                      <Checkbox
                        checked={!!watch('tos')}
                        onChange={(e) => {
                          setValue('tos', e.target.checked, { shouldDirty: true })
                          if (errors.tos) {
                            clearErrors('tos')
                          }
                        }}
                        color="primary"
                      />
                    </td>
                    <td>
                      <Link href="/tos" target="_blank" rel="noreferrer">
                        {commonStrings.TOS}
                      </Link>
                      {fieldError('tos') && <FormHelperText error>{fieldError('tos')?.message}</FormHelperText>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="buttons signup-step-actions">
          {step < LAST_STEP ? (
            <Button
              type="button"
              variant="contained"
              className="btn-primary"
              onClick={() => {
                void goNext()
              }}
              disabled={uploading}
            >
              {strings.CONTINUE}
            </Button>
          ) : (
            <Button
              type="button"
              variant="contained"
              className="btn-primary"
              onClick={() => {
                void submitRequest()
              }}
              disabled={isSubmitting || uploading}
            >
              {strings.SUBMIT_REQUEST}
            </Button>
          )}
          <Button type="button" variant="outlined" color="primary" onClick={goBack} disabled={isSubmitting}>
            {strings.BACK}
          </Button>
        </div>

        <div className="form-error">
          {errors.root && <Error message={errors.root.message!} />}
          {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
        </div>
      </form>
      )}

      <Dialog
        open={successOpen}
        onClose={closeSuccess}
        className="signup-success-dialog"
        PaperProps={{ className: 'signup-success-paper' }}
      >
        <DialogContent className="signup-success-content">
          <div className="signup-success-burst" aria-hidden />
          <CheckCircleOutlineIcon className="signup-success-icon" />
          <h2>{strings.SUPPLIER_SUCCESS_TITLE}</h2>
          <p>{strings.SUPPLIER_SUCCESS_TEXT}</p>
        </DialogContent>
        <DialogActions className="signup-success-actions">
          <Button variant="outlined" color="primary" onClick={closeSuccess}>
            {strings.SUPPLIER_SUCCESS_CLOSE}
          </Button>
          <Button variant="contained" className="btn-primary" onClick={goHome}>
            {strings.SUPPLIER_SUCCESS_CTA}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SupplierSignupWizard
