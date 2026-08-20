import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { strings } from '@/agency/lang/agency'
import { agencyReceiptSchema, AgencyReceiptFormFields } from '@/agency/models/AgencyReceiptForm'
import * as AgencyReceiptService from '@/agency/services/AgencyReceiptService'
import type { AgencyReceipt } from '@/agency/types/receipt'
import env from '@/config/env.config'

interface AgencyAddReceiptDialogProps {
  open: boolean
  agencyId: string
  onClose: () => void
  onCreated: (receipt: AgencyReceipt) => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyValues: AgencyReceiptFormFields = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  vehicleLabel: '',
  description: '',
  amount: '' as unknown as number,
  paymentMethod: 'cash',
  paidAt: today(),
  notes: '',
}

const AgencyAddReceiptDialog = ({
  open,
  agencyId,
  onClose,
  onCreated,
}: AgencyAddReceiptDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyReceiptFormFields>({
    resolver: zodResolver(agencyReceiptSchema),
    mode: 'onBlur',
    defaultValues: emptyValues,
  })

  React.useEffect(() => {
    if (open) {
      reset({ ...emptyValues, paidAt: today() })
      setSubmitError('')
    }
  }, [open, reset])

  const onSubmit = async (values: AgencyReceiptFormFields) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const created = await AgencyReceiptService.createReceipt(agencyId, {
        clientName: values.clientName,
        clientEmail: values.clientEmail || undefined,
        clientPhone: values.clientPhone || undefined,
        vehicleLabel: values.vehicleLabel || undefined,
        description: values.description,
        amount: values.amount,
        currency: env.BASE_CURRENCY || 'TND',
        paymentMethod: values.paymentMethod,
        paidAt: values.paidAt,
        notes: values.notes || undefined,
      })
      onCreated(created)
    } catch {
      setSubmitError(strings.RECEIPT_SAVE_ERROR)
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
            <h2>{strings.RECEIPT_ADD_TITLE}</h2>
            <p>{strings.RECEIPT_ADD_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="agency-car-grid">
            <TextField
              className="agency-car-span-2"
              label={strings.RECEIPT_CLIENT}
              {...register('clientName')}
              error={!!errors.clientName}
              helperText={errors.clientName?.message}
            />
            <TextField
              label={strings.EMAIL}
              type="email"
              {...register('clientEmail')}
              error={!!errors.clientEmail}
              helperText={errors.clientEmail?.message}
            />
            <TextField
              label={strings.RECEIPT_PHONE}
              {...register('clientPhone')}
            />
            <TextField
              className="agency-car-span-2"
              label={strings.RECEIPT_VEHICLE}
              placeholder={strings.RECEIPT_VEHICLE_HINT}
              {...register('vehicleLabel')}
            />
            <TextField
              className="agency-car-span-2"
              label={strings.RECEIPT_DESCRIPTION}
              multiline
              minRows={2}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              label={strings.RECEIPT_AMOUNT}
              type="number"
              inputProps={{ min: 0, step: '0.001' }}
              {...register('amount')}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label={strings.RECEIPT_PAYMENT}
                  {...field}
                  error={!!errors.paymentMethod}
                  helperText={errors.paymentMethod?.message}
                >
                  <MenuItem value="cash">{strings.RECEIPT_PAY_CASH}</MenuItem>
                  <MenuItem value="card">{strings.RECEIPT_PAY_CARD}</MenuItem>
                  <MenuItem value="transfer">{strings.RECEIPT_PAY_TRANSFER}</MenuItem>
                  <MenuItem value="cheque">{strings.RECEIPT_PAY_CHEQUE}</MenuItem>
                </TextField>
              )}
            />
            <TextField
              label={strings.RECEIPT_DATE}
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('paidAt')}
              error={!!errors.paidAt}
              helperText={errors.paidAt?.message}
            />
            <TextField
              className="agency-car-span-2"
              label={strings.RECEIPT_NOTES}
              {...register('notes')}
            />
          </div>

          {submitError ? <p className="agency-car-error">{submitError}</p> : null}

          <div className="agency-car-actions">
            <Button onClick={onClose} disabled={submitting}>
              {strings.CANCEL}
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : strings.RECEIPT_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddReceiptDialog
