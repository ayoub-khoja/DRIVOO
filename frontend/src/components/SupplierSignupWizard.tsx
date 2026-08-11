import React, { useRef, useState } from 'react'
import {
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
} from '@mui/material'
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUploadOutlined as CloudUploadOutlinedIcon,
  DeleteOutline as DeleteOutlineIcon,
  InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import Error from '@/components/Error'
import {
  supplierSchema,
  SupplierFormFields,
  supplierCompanySchema,
  supplierAddressBankSchema,
  supplierContactSchema,
} from '@/models/SignUpForm'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (completed) {
      setSuccessOpen(true)
    }
  }, [completed])

  const updateStep = (next: number) => {
    setStep(next)
    onStepChange?.(next)
  }

  const form = useForm<SupplierFormFields>({
    resolver: zodResolver(supplierSchema),
    mode: 'onSubmit',
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

  const { register, formState: { errors, isSubmitting }, setValue, clearErrors, setError, getValues, trigger, watch } = form
  const rneDocument = watch('rneDocument')

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

    return trigger()
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
      setValue('rneDocument', filename, { shouldValidate: true })
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
      if (!(await validateStep())) {
        return
      }

      const emailStatus = await UserService.validateEmail({ email: data.email })
      if (emailStatus !== 200) {
        setError('email', { message: commonStrings.EMAIL_ALREADY_REGISTERED })
        updateStep(2)
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

  return (
    <>
      {!completed && (
      <form
        className="signup-step supplier-wizard"
        onSubmit={(event) => {
          if (step < LAST_STEP) {
            event.preventDefault()
            void goNext()
            return
          }
          void form.handleSubmit(onSubmit)(event)
        }}
        noValidate
      >
        {step === 0 && (
          <div className="signup-panel">
            <div className="signup-panel-intro">
              <h3>{strings.STEP_COMPANY}</h3>
              <p>{strings.COMPANY_NAME_HINT}</p>
            </div>

            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!errors.fullName}>
                <InputLabel className="required">{strings.COMPANY_NAME}</InputLabel>
                <OutlinedInput
                  type="text"
                  {...register('fullName')}
                  label={strings.COMPANY_NAME}
                  autoComplete="organization"
                  required
                />
                <FormHelperText error={!!errors.fullName}>{errors.fullName?.message || strings.COMPANY_NAME_HINT}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!errors.taxId}>
                <InputLabel className="required">{strings.TAX_ID}</InputLabel>
                <OutlinedInput type="text" {...register('taxId')} label={strings.TAX_ID} required />
                <FormHelperText error={!!errors.taxId}>{errors.taxId?.message || strings.TAX_ID_HINT}</FormHelperText>
              </FormControl>

              <FormControl fullWidth margin="dense" error={!!errors.rneNumber}>
                <InputLabel className="required">{strings.RNE_NUMBER}</InputLabel>
                <OutlinedInput type="text" {...register('rneNumber')} label={strings.RNE_NUMBER} required />
                <FormHelperText error={!!errors.rneNumber}>{errors.rneNumber?.message || strings.RNE_NUMBER_HINT}</FormHelperText>
              </FormControl>
            </div>

            <div className={`signup-upload ${errors.rneDocument ? 'is-error' : ''} ${rneDocument ? 'has-file' : ''}`}>
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
              {errors.rneDocument && <FormHelperText error>{errors.rneDocument.message}</FormHelperText>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="signup-panel">
            <div className="signup-panel-intro">
              <h3>{strings.STEP_ADDRESS_BANK}</h3>
              <p>{strings.IBAN_HINT}</p>
            </div>
            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!errors.address} className="signup-span-2">
                <InputLabel className="required">{strings.ADDRESS}</InputLabel>
                <OutlinedInput type="text" {...register('address')} label={strings.ADDRESS} required />
                <FormHelperText error={!!errors.address}>{errors.address?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.city}>
                <InputLabel className="required">{strings.CITY}</InputLabel>
                <OutlinedInput type="text" {...register('city')} label={strings.CITY} required />
                <FormHelperText error={!!errors.city}>{errors.city?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.governorate}>
                <InputLabel className="required">{strings.GOVERNORATE}</InputLabel>
                <OutlinedInput type="text" {...register('governorate')} label={strings.GOVERNORATE} required />
                <FormHelperText error={!!errors.governorate}>{errors.governorate?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.postalCode}>
                <InputLabel className="required">{strings.POSTAL_CODE}</InputLabel>
                <OutlinedInput type="text" {...register('postalCode')} label={strings.POSTAL_CODE} required />
                <FormHelperText error={!!errors.postalCode}>{errors.postalCode?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.iban}>
                <InputLabel className="required">{strings.IBAN}</InputLabel>
                <OutlinedInput type="text" {...register('iban')} label={strings.IBAN} required />
                <FormHelperText error={!!errors.iban}>{errors.iban?.message || strings.IBAN_HINT}</FormHelperText>
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
              <FormControl fullWidth margin="dense" error={!!errors.legalRepFirstName}>
                <InputLabel className="required">{strings.LEGAL_FIRST_NAME}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepFirstName')} label={strings.LEGAL_FIRST_NAME} required />
                <FormHelperText error={!!errors.legalRepFirstName}>{errors.legalRepFirstName?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.legalRepLastName}>
                <InputLabel className="required">{strings.LEGAL_LAST_NAME}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepLastName')} label={strings.LEGAL_LAST_NAME} required />
                <FormHelperText error={!!errors.legalRepLastName}>{errors.legalRepLastName?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.legalRepTitle}>
                <InputLabel className="required">{strings.LEGAL_TITLE}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepTitle')} label={strings.LEGAL_TITLE} required />
                <FormHelperText error={!!errors.legalRepTitle}>{errors.legalRepTitle?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.legalRepCin}>
                <InputLabel className="required">{strings.LEGAL_CIN}</InputLabel>
                <OutlinedInput type="text" {...register('legalRepCin')} label={strings.LEGAL_CIN} required />
                <FormHelperText error={!!errors.legalRepCin}>{errors.legalRepCin?.message || ''}</FormHelperText>
              </FormControl>
            </div>

            <div className="signup-panel-intro signup-panel-intro-spaced">
              <h3>{strings.CONTACT_SECTION}</h3>
              <p>{strings.EMAIL_OFFICIAL_HINT}</p>
            </div>
            <div className="signup-grid-2">
              <FormControl fullWidth margin="dense" error={!!errors.phone}>
                <InputLabel className="required">{strings.PHONE_MAIN}</InputLabel>
                <OutlinedInput type="text" {...register('phone')} label={strings.PHONE_MAIN} required />
                <FormHelperText error={!!errors.phone}>{errors.phone?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.whatsapp}>
                <InputLabel className="required">{strings.WHATSAPP}</InputLabel>
                <OutlinedInput type="text" {...register('whatsapp')} label={strings.WHATSAPP} required />
                <FormHelperText error={!!errors.whatsapp}>{errors.whatsapp?.message || ''}</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="dense" error={!!errors.email} className="signup-span-2">
                <InputLabel className="required">{strings.EMAIL_OFFICIAL}</InputLabel>
                <OutlinedInput type="text" {...register('email')} label={strings.EMAIL_OFFICIAL} required />
                <FormHelperText error={!!errors.email}>{errors.email?.message || strings.EMAIL_OFFICIAL_HINT}</FormHelperText>
              </FormControl>
            </div>

            <div className="signup-tos">
              <table>
                <tbody>
                  <tr>
                    <td>
                      <Checkbox
                        checked={!!watch('tos')}
                        onChange={(e) => setValue('tos', e.target.checked, { shouldValidate: true })}
                        color="primary"
                      />
                    </td>
                    <td>
                      <Link href="/tos" target="_blank" rel="noreferrer">
                        {commonStrings.TOS}
                      </Link>
                      {errors.tos && <FormHelperText error>{errors.tos.message}</FormHelperText>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="buttons signup-step-actions">
          {step < LAST_STEP ? (
            <Button type="button" variant="contained" className="btn-primary" onClick={goNext} disabled={uploading}>
              {strings.CONTINUE}
            </Button>
          ) : (
            <Button type="submit" variant="contained" className="btn-primary" disabled={isSubmitting || uploading}>
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

export const supplierStepLabels = () => [
  strings.STEP_ROLE,
  strings.STEP_COMPANY,
  strings.STEP_ADDRESS_BANK,
  strings.STEP_CONTACT,
]
