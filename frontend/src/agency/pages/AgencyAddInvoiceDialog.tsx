import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material'
import { AddRounded, DeleteOutlineRounded } from '@mui/icons-material'
import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import {
  agencyInvoiceSchema,
  type AgencyInvoiceFormFields,
  type AgencyInvoiceLineFields,
} from '@/agency/models/AgencyInvoiceForm'
import * as AgencyInvoiceService from '@/agency/services/AgencyInvoiceService'
import type { AgencyInvoice } from '@/agency/types/invoice'
import { computeInvoiceTotals, formatMoney } from '@/agency/utils/invoiceMath'
import env from '@/config/env.config'

interface AgencyAddInvoiceDialogProps {
  open: boolean
  agency: bookcarsTypes.User
  onClose: () => void
  onCreated: (invoice: AgencyInvoice) => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyLine: AgencyInvoiceLineFields = {
  designation: '',
  contractNumber: '',
  vehicleLabel: '',
  periodFrom: '',
  periodTo: '',
  quantity: 1,
  unitPrice: 0,
}

const AgencyAddInvoiceDialog = ({
  open,
  agency,
  onClose,
  onCreated,
}: AgencyAddInvoiceDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')

  const defaults = React.useCallback((): AgencyInvoiceFormFields => ({
    clientCode: '',
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    clientAddress: '',
    issueCity: agency.city || '',
    issueDate: today(),
    object: '',
    lines: [{ ...emptyLine }],
    discount: 0,
    // Tunisian defaults, overridable per agency from the profile
    vatRate: agency.invoiceVatRate ?? 19,
    stampDuty: agency.invoiceStampDuty ?? 1,
    payments: { cash: 0, cheque: 0, draft: 0, card: 0, transfer: 0 },
    notes: '',
  }), [agency.city, agency.invoiceVatRate, agency.invoiceStampDuty])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyInvoiceFormFields>({
    resolver: zodResolver(agencyInvoiceSchema) as Resolver<AgencyInvoiceFormFields>,
    mode: 'onBlur',
    defaultValues: defaults(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  React.useEffect(() => {
    if (open) {
      reset(defaults())
      setSubmitError('')
    }
  }, [open, reset, defaults])

  // Live totals, mirroring what the server will recompute on save
  const watched = useWatch({ control })
  const totals = React.useMemo(() => computeInvoiceTotals({
    lines: (watched.lines || []).map((line) => ({
      quantity: Number(line?.quantity) || 0,
      unitPrice: Number(line?.unitPrice) || 0,
    })),
    discount: Number(watched.discount) || 0,
    vatRate: Number(watched.vatRate) || 0,
    stampDuty: Number(watched.stampDuty) || 0,
    payments: {
      cash: Number(watched.payments?.cash) || 0,
      cheque: Number(watched.payments?.cheque) || 0,
      draft: Number(watched.payments?.draft) || 0,
      card: Number(watched.payments?.card) || 0,
      transfer: Number(watched.payments?.transfer) || 0,
    },
  }), [watched])

  const currency = env.BASE_CURRENCY || 'TND'

  const onSubmit = async (values: AgencyInvoiceFormFields) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const lineTotals = computeInvoiceTotals({
        lines: values.lines.map((line) => ({ quantity: line.quantity, unitPrice: line.unitPrice })),
      }).lineTotals

      const created = await AgencyInvoiceService.createInvoice({
        issueCity: values.issueCity?.trim() || '',
        issueDate: values.issueDate,
        clientCode: values.clientCode?.trim() || undefined,
        clientName: values.clientName.trim(),
        clientIdNumber: values.clientIdNumber?.trim() || undefined,
        clientPhone: values.clientPhone?.trim() || undefined,
        clientAddress: values.clientAddress?.trim() || undefined,
        object: values.object?.trim() || '',
        lines: values.lines.map((line, index) => ({
          designation: line.designation.trim(),
          contractNumber: line.contractNumber?.trim() || undefined,
          vehicleLabel: line.vehicleLabel?.trim() || undefined,
          periodFrom: line.periodFrom || undefined,
          periodTo: line.periodTo || undefined,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          total: lineTotals[index],
        })),
        discount: values.discount,
        vatRate: values.vatRate,
        stampDuty: values.stampDuty,
        payments: values.payments,
        currency,
        notes: values.notes?.trim() || undefined,
      })
      onCreated(created)
    } catch {
      setSubmitError(strings.INVOICE_SAVE_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      className="agency-branch-dialog agency-invoice-dialog"
    >
      <DialogContent className="agency-branch-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <h2>{strings.INVOICE_ADD_TITLE}</h2>
            <p>{strings.INVOICE_ADD_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Client */}
          <h4 className="agency-invoice-section-title">{strings.INVOICE_CLIENT}</h4>
          <div className="agency-car-grid">
            <TextField
              label={strings.INVOICE_CLIENT_NAME}
              className="agency-car-span-2"
              {...register('clientName')}
              error={!!errors.clientName}
              helperText={errors.clientName?.message}
            />
            <TextField label={strings.INVOICE_CLIENT_CODE} {...register('clientCode')} />
            <TextField label={strings.INVOICE_CLIENT_ID} {...register('clientIdNumber')} />
            <TextField label={strings.INVOICE_CLIENT_PHONE} {...register('clientPhone')} />
            <TextField label={strings.INVOICE_CLIENT_ADDRESS} {...register('clientAddress')} />
            <TextField label={strings.INVOICE_ISSUE_CITY} {...register('issueCity')} />
            <TextField
              label={strings.INVOICE_ISSUE_DATE}
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('issueDate')}
              error={!!errors.issueDate}
              helperText={errors.issueDate?.message}
            />
            <TextField
              className="agency-car-span-2"
              label={strings.INVOICE_OBJECT}
              placeholder={strings.INVOICE_OBJECT_HINT}
              {...register('object')}
            />
          </div>

          {/* Lines */}
          <div className="agency-invoice-lines-head">
            <h4 className="agency-invoice-section-title">{strings.INVOICE_LINES}</h4>
            <Button
              size="small"
              startIcon={<AddRounded />}
              onClick={() => append({ ...emptyLine })}
            >
              {strings.INVOICE_LINE_ADD}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div className="agency-invoice-line-card" key={field.id}>
              <div className="agency-invoice-line-head">
                <span>{index + 1}</span>
                {fields.length > 1 && (
                  <Tooltip title={strings.INVOICE_LINE_REMOVE}>
                    <IconButton size="small" onClick={() => remove(index)}>
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
              <div className="agency-car-grid">
                <TextField
                  className="agency-car-span-2"
                  label={strings.INVOICE_DESIGNATION}
                  {...register(`lines.${index}.designation` as const)}
                  error={!!errors.lines?.[index]?.designation}
                  helperText={errors.lines?.[index]?.designation?.message}
                />
                <TextField
                  label={strings.INVOICE_CONTRACT_NUMBER}
                  {...register(`lines.${index}.contractNumber` as const)}
                />
                <TextField
                  label={strings.INVOICE_VEHICLE}
                  {...register(`lines.${index}.vehicleLabel` as const)}
                />
                <TextField
                  label={strings.INVOICE_PERIOD_FROM}
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register(`lines.${index}.periodFrom` as const)}
                />
                <TextField
                  label={strings.INVOICE_PERIOD_TO}
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register(`lines.${index}.periodTo` as const)}
                />
                <TextField
                  label={strings.INVOICE_QUANTITY}
                  type="number"
                  inputProps={{ min: 0, step: '1' }}
                  {...register(`lines.${index}.quantity` as const)}
                  error={!!errors.lines?.[index]?.quantity}
                  helperText={errors.lines?.[index]?.quantity?.message}
                />
                <TextField
                  label={strings.INVOICE_UNIT_PRICE}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register(`lines.${index}.unitPrice` as const)}
                  error={!!errors.lines?.[index]?.unitPrice}
                  helperText={errors.lines?.[index]?.unitPrice?.message}
                />
              </div>
              <p className="agency-invoice-line-total">
                {strings.INVOICE_LINE_TOTAL} : <strong>{formatMoney(totals.lineTotals[index] || 0)}</strong>
              </p>
            </div>
          ))}

          {/* Payments and fiscal parameters */}
          <div className="agency-invoice-bottom">
            <div className="agency-invoice-bottom-col">
              <h4 className="agency-invoice-section-title">{strings.INVOICE_PAYMENTS}</h4>
              <div className="agency-car-grid">
                <TextField
                  label={strings.INVOICE_PAY_CASH}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('payments.cash')}
                />
                <TextField
                  label={strings.INVOICE_PAY_CHEQUE}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('payments.cheque')}
                />
                <TextField
                  label={strings.INVOICE_PAY_DRAFT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('payments.draft')}
                />
                <TextField
                  label={strings.INVOICE_PAY_CARD}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('payments.card')}
                />
                <TextField
                  label={strings.INVOICE_PAY_TRANSFER}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('payments.transfer')}
                />
              </div>

              <div className="agency-car-grid agency-invoice-fiscal">
                <TextField
                  label={strings.INVOICE_DISCOUNT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('discount')}
                />
                <TextField
                  label={strings.INVOICE_VAT_RATE}
                  type="number"
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  {...register('vatRate')}
                />
                <TextField
                  label={strings.INVOICE_STAMP_DUTY}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('stampDuty')}
                />
                <TextField
                  className="agency-car-span-2"
                  label={strings.INVOICE_NOTES}
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Live totals */}
            <aside className="agency-invoice-totals-card">
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_TOTAL_GROSS}</span>
                <strong>{formatMoney(totals.totalGross)}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_TOTAL_HT}</span>
                <strong>{formatMoney(totals.totalHT)}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_TOTAL_VAT}</span>
                <strong>{formatMoney(totals.totalVAT)}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_STAMP_DUTY}</span>
                <strong>{formatMoney(Number(watched.stampDuty) || 0)}</strong>
              </div>
              <div className="agency-invoice-total-row is-strong">
                <span>{strings.INVOICE_TOTAL_TTC}</span>
                <strong>{`${formatMoney(totals.totalTTC)} ${currency}`}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_PAYMENTS}</span>
                <strong>{formatMoney(totals.totalPaid)}</strong>
              </div>
              <div className={`agency-invoice-total-row ${totals.balanceDue > 0 ? 'is-due' : ''}`}>
                <span>{strings.INVOICE_BALANCE_DUE}</span>
                <strong>{`${formatMoney(totals.balanceDue)} ${currency}`}</strong>
              </div>
            </aside>
          </div>

          {submitError ? <p className="agency-car-error">{submitError}</p> : null}
          {errors.lines?.message ? <p className="agency-car-error">{strings.INVOICE_LINE_REQUIRED}</p> : null}

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
              {submitting ? <CircularProgress size={20} color="inherit" /> : strings.INVOICE_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddInvoiceDialog
