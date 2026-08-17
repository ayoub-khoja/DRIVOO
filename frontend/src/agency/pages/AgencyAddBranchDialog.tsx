import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  TextField,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as AgencyBranchService from '@/agency/services/AgencyBranchService'
import { agencyBranchSchema, AgencyBranchFormFields } from '@/agency/models/AgencyBranchForm'

interface AgencyAddBranchDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (branch: bookcarsTypes.SubAgency) => void
}

const emptyValues: AgencyBranchFormFields = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  governorate: '',
  address: '',
}

const AgencyAddBranchDialog = ({ open, onClose, onCreated }: AgencyAddBranchDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyBranchFormFields>({
    resolver: zodResolver(agencyBranchSchema),
    mode: 'onBlur',
    defaultValues: emptyValues,
  })

  React.useEffect(() => {
    if (open) {
      reset(emptyValues)
      setSubmitError('')
    }
  }, [open, reset])

  const onSubmit = async (values: AgencyBranchFormFields) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const created = await AgencyBranchService.createSubAgency({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        city: values.city?.trim() || undefined,
        governorate: values.governorate?.trim() || undefined,
        address: values.address?.trim() || undefined,
      })
      onCreated(created)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setSubmitError(strings.BRANCH_EMAIL_EXISTS)
      } else {
        setSubmitError(strings.BRANCH_SAVE_ERROR)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm" className="agency-branch-dialog">
      <DialogContent className="agency-branch-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <h2>{strings.BRANCH_ADD_TITLE}</h2>
            <p>{strings.BRANCH_ADD_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="agency-car-grid">
            <TextField
              className="agency-car-span-2"
              label={strings.BRANCH_NAME}
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
            <TextField
              label={strings.EMAIL}
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label={strings.BRANCH_PHONE}
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
            <TextField
              label={strings.BRANCH_CITY}
              {...register('city')}
            />
            <TextField
              label={strings.BRANCH_GOVERNORATE}
              {...register('governorate')}
            />
            <TextField
              className="agency-car-span-2"
              label={strings.BRANCH_ADDRESS}
              {...register('address')}
            />
          </div>

          {submitError ? <p className="agency-car-error">{submitError}</p> : null}

          <div className="agency-car-actions">
            <Button onClick={onClose} disabled={submitting}>
              {strings.CANCEL}
            </Button>
            <Button type="submit" variant="contained" className="btn-primary" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : strings.BRANCH_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddBranchDialog
