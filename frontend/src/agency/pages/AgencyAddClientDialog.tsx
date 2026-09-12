import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { intervalToDuration } from 'date-fns'
import validator from 'validator'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as AgencyClientService from '@/agency/services/AgencyClientService'
import PhoneInputField from '@/components/PhoneInputField'
import env from '@/config/env.config'

interface AgencyAddClientDialogProps {
  open: boolean
  agency: bookcarsTypes.User
  onClose: () => void
  onCreated: () => void
}

const schema = z.object({
  fullName: z.string().trim().min(2, 'Champ requis'),
  email: z.string().trim().email('E-mail invalide'),
  phone: z.string().trim().refine((val) => !val || validator.isMobilePhone(val), {
    message: 'Téléphone invalide',
  }),
  cin: z.string().trim().min(6, 'CIN invalide').max(20, 'CIN invalide'),
  birthDate: z.string().trim().min(1, 'Champ requis').refine((value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return false
    }
    const years = intervalToDuration({ start: date, end: new Date() }).years ?? 0
    return years >= env.MINIMUM_AGE
  }, `Âge minimum : ${env.MINIMUM_AGE} ans`),
})

type FormFields = z.infer<typeof schema>

const AgencyAddClientDialog = ({
  open,
  agency,
  onClose,
  onCreated,
}: AgencyAddClientDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', cin: '', birthDate: '' },
  })

  React.useEffect(() => {
    if (open) {
      reset({ fullName: '', email: '', phone: '', cin: '', birthDate: '' })
      setSubmitError('')
    }
  }, [open, reset])

  const onSubmit = async (values: FormFields) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const emailStatus = await AgencyClientService.validateEmail(values.email)
      if (emailStatus === 204) {
        setSubmitError(strings.CLIENTS_EMAIL_TAKEN)
        return
      }

      const status = await AgencyClientService.createClient({
        fullName: values.fullName,
        email: values.email.trim().toLowerCase(),
        phone: values.phone || '',
        cin: values.cin.trim(),
        birthDate: new Date(values.birthDate),
        location: '',
        bio: '',
        type: bookcarsTypes.UserType.User,
        language: agency.language || env.DEFAULT_LANGUAGE,
        supplier: agency._id,
      })

      if (status === 200) {
        onCreated()
        onClose()
      } else {
        setSubmitError(strings.CLIENTS_CREATE_ERROR)
      }
    } catch {
      setSubmitError(strings.CLIENTS_CREATE_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      className="agency-branch-dialog"
    >
      <DialogContent className="agency-branch-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <h2>{strings.CLIENTS_ADD_TITLE}</h2>
            <p>{strings.CLIENTS_ADD_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="agency-car-grid">
            <TextField
              className="agency-car-span-2"
              label={strings.CLIENTS_FULL_NAME}
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              disabled={submitting}
            />
            <TextField
              label={strings.CLIENTS_EMAIL}
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={submitting}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInputField
                  label={strings.CLIENTS_PHONE}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={submitting}
                />
              )}
            />
            <TextField
              label={strings.CLIENTS_CIN}
              {...register('cin')}
              error={!!errors.cin}
              helperText={errors.cin?.message}
              disabled={submitting}
            />
            <TextField
              label={strings.CLIENTS_BIRTH_DATE}
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('birthDate')}
              error={!!errors.birthDate}
              helperText={errors.birthDate?.message}
              disabled={submitting}
            />
          </div>

          {submitError ? <p className="agency-car-error">{submitError}</p> : null}

          <div className="agency-car-actions">
            <Button onClick={onClose} disabled={submitting}>
              {strings.CANCEL}
            </Button>
            <Button type="submit" variant="contained" className="btn-primary" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : strings.CLIENTS_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddClientDialog
