import React from 'react'
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material'
import { AddRounded, DeleteOutlineRounded } from '@mui/icons-material'
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import {
  agencyContractSchema,
  type AgencyContractFormFields,
} from '@/agency/models/AgencyContractForm'
import * as AgencyContractService from '@/agency/services/AgencyContractService'
import {
  CONTRACT_CHECKLIST,
  CONTRACT_KM_PACKAGES,
  CONTRACT_PAYMENT_METHODS,
  CONTRACT_PAYMENT_STATUSES,
  type AgencyContract,
} from '@/agency/types/contract'
import { computeContractTotals } from '@/agency/utils/contractMath'
import { formatMoney } from '@/agency/utils/invoiceMath'
import env from '@/config/env.config'

interface AgencyAddContractDialogProps {
  open: boolean
  agency: bookcarsTypes.User
  onClose: () => void
  onCreated: (contract: AgencyContract) => void
}

const today = () => new Date().toISOString().slice(0, 10)
const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

const emptyParty = {
  fullName: '',
  birthDate: '',
  idNumber: '',
  nationality: '',
  licenseNumber: '',
  licenseIssuedAt: '',
  address: '',
  phone: '',
}

const AgencyAddContractDialog = ({
  open,
  agency,
  onClose,
  onCreated,
}: AgencyAddContractDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')
  const [withSecondDriver, setWithSecondDriver] = React.useState(false)

  const defaults = React.useCallback((): AgencyContractFormFields => ({
    issueCity: agency.city || '',
    issueDate: today(),
    vehicleModel: '',
    vehiclePlate: '',
    vehicleCategory: '',
    vehicleFuel: '',
    driver: { ...emptyParty, nationality: 'Tunisienne' },
    secondDriver: { ...emptyParty },
    departureDate: nowLocal(),
    departurePlace: agency.address || '',
    departureKm: 0,
    departureFuel: '',
    returnDate: nowLocal(),
    returnPlace: agency.address || '',
    returnKm: undefined,
    returnFuel: '',
    kmLimitPerDay: 300,
    extraKmPrice: undefined,
    extraHourPrice: undefined,
    extraDayPrice: undefined,
    rentalHT: 0,
    vatRate: agency.invoiceVatRate ?? 19,
    deposit: 0,
    depositReason: '',
    supplements: [],
    payments: [],
    checklist: CONTRACT_CHECKLIST.map((item) => ({ key: item.key, ok: true })),
    notes: '',
  }), [agency.city, agency.address, agency.invoiceVatRate])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyContractFormFields>({
    resolver: zodResolver(agencyContractSchema) as Resolver<AgencyContractFormFields>,
    mode: 'onBlur',
    defaultValues: defaults(),
  })

  const supplements = useFieldArray({ control, name: 'supplements' })
  const payments = useFieldArray({ control, name: 'payments' })
  const checklist = useFieldArray({ control, name: 'checklist' })

  React.useEffect(() => {
    if (open) {
      reset(defaults())
      setWithSecondDriver(false)
      setSubmitError('')
    }
  }, [open, reset, defaults])

  // Live totals, mirroring what the server recomputes on save
  const watched = useWatch({ control })
  const totals = React.useMemo(() => computeContractTotals({
    rentalHT: Number(watched.rentalHT) || 0,
    supplements: (watched.supplements || []).map((s) => ({ priceHT: Number(s?.priceHT) || 0 })),
    vatRate: Number(watched.vatRate) || 0,
    payments: (watched.payments || []).map((p) => ({ amount: Number(p?.amount) || 0 })),
  }), [watched])

  const currency = env.BASE_CURRENCY || 'TND'

  const onSubmit = async (values: AgencyContractFormFields) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      // The co-driver block is optional in the form but its name is mandatory in the payload
      const secondDriverName = values.secondDriver?.fullName?.trim()
      const secondDriver = withSecondDriver && secondDriverName
        ? { ...values.secondDriver, fullName: secondDriverName }
        : undefined

      const created = await AgencyContractService.createContract({
        issueCity: values.issueCity?.trim() || '',
        issueDate: values.issueDate,
        vehicleModel: values.vehicleModel.trim(),
        vehiclePlate: values.vehiclePlate.trim(),
        vehicleCategory: values.vehicleCategory?.trim() || undefined,
        vehicleFuel: values.vehicleFuel?.trim() || undefined,
        driver: values.driver,
        secondDriver,
        departureDate: values.departureDate,
        departurePlace: values.departurePlace?.trim() || '',
        departureKm: values.departureKm,
        departureFuel: values.departureFuel?.trim() || undefined,
        returnDate: values.returnDate,
        returnPlace: values.returnPlace?.trim() || '',
        returnKm: values.returnKm,
        returnFuel: values.returnFuel?.trim() || undefined,
        kmLimitPerDay: values.kmLimitPerDay,
        extraKmPrice: values.extraKmPrice,
        extraHourPrice: values.extraHourPrice,
        extraDayPrice: values.extraDayPrice,
        rentalHT: values.rentalHT,
        vatRate: values.vatRate,
        deposit: values.deposit,
        depositReason: values.depositReason?.trim() || undefined,
        supplements: values.supplements.map((supplement) => ({
          label: supplement.label.trim(),
          priceHT: supplement.priceHT,
          vatRate: supplement.vatRate,
          priceTTC: supplement.priceHT * (1 + supplement.vatRate / 100),
        })),
        payments: values.payments.map((payment) => ({
          date: payment.date || undefined,
          amount: payment.amount,
          method: payment.method,
          status: payment.status || undefined,
        })),
        checklist: values.checklist,
        currency,
        notes: values.notes?.trim() || undefined,
      })
      onCreated(created)
    } catch {
      setSubmitError(strings.CONTRACT_SAVE_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  /** Identity fields, reused for the main driver and the co-driver. */
  const partyFields = (prefix: 'driver' | 'secondDriver') => (
    <div className="agency-car-grid">
      <TextField
        className="agency-car-span-2"
        label={strings.CONTRACT_DRIVER_NAME}
        {...register(`${prefix}.fullName` as const)}
        error={prefix === 'driver' && !!errors.driver?.fullName}
        helperText={prefix === 'driver' ? errors.driver?.fullName?.message : undefined}
      />
      <TextField
        label={strings.CONTRACT_DRIVER_BIRTH}
        type="date"
        InputLabelProps={{ shrink: true }}
        {...register(`${prefix}.birthDate` as const)}
      />
      <TextField label={strings.CONTRACT_DRIVER_ID} {...register(`${prefix}.idNumber` as const)} />
      <TextField label={strings.CONTRACT_DRIVER_NATIONALITY} {...register(`${prefix}.nationality` as const)} />
      <TextField label={strings.CONTRACT_DRIVER_LICENSE} {...register(`${prefix}.licenseNumber` as const)} />
      <TextField
        label={strings.CONTRACT_DRIVER_LICENSE_DATE}
        type="date"
        InputLabelProps={{ shrink: true }}
        {...register(`${prefix}.licenseIssuedAt` as const)}
      />
      <TextField label={strings.CONTRACT_DRIVER_PHONE} {...register(`${prefix}.phone` as const)} />
      <TextField
        className="agency-car-span-2"
        label={strings.CONTRACT_DRIVER_ADDRESS}
        {...register(`${prefix}.address` as const)}
      />
    </div>
  )

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
            <h2>{strings.CONTRACT_ADD_TITLE}</h2>
            <p>{strings.CONTRACT_ADD_SUBTITLE}</p>
          </div>
        </div>

        <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Vehicle */}
          <h4 className="agency-invoice-section-title">{strings.CONTRACT_VEHICLE}</h4>
          <div className="agency-car-grid">
            <TextField
              label={strings.CONTRACT_VEHICLE_MODEL}
              {...register('vehicleModel')}
              error={!!errors.vehicleModel}
              helperText={errors.vehicleModel?.message}
            />
            <TextField
              label={strings.CONTRACT_VEHICLE_PLATE}
              {...register('vehiclePlate')}
              error={!!errors.vehiclePlate}
              helperText={errors.vehiclePlate?.message}
            />
            <TextField label={strings.CONTRACT_VEHICLE_CATEGORY} {...register('vehicleCategory')} />
            <TextField label={strings.CONTRACT_VEHICLE_FUEL} {...register('vehicleFuel')} />
            <TextField label={strings.CONTRACT_ISSUE_CITY} {...register('issueCity')} />
            <TextField
              label={strings.CONTRACT_ISSUE_DATE}
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('issueDate')}
              error={!!errors.issueDate}
              helperText={errors.issueDate?.message}
            />
          </div>

          {/* Main driver */}
          <h4 className="agency-invoice-section-title">{strings.CONTRACT_DRIVER}</h4>
          {partyFields('driver')}

          {/* Co-driver */}
          <div className="agency-invoice-lines-head">
            <h4 className="agency-invoice-section-title">{strings.CONTRACT_SECOND_DRIVER}</h4>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={withSecondDriver}
                  onChange={(e) => setWithSecondDriver(e.target.checked)}
                />
              )}
              label={strings.CONTRACT_SECOND_DRIVER_ADD}
            />
          </div>
          {withSecondDriver && partyFields('secondDriver')}

          {/* Rental */}
          <h4 className="agency-invoice-section-title">{strings.CONTRACT_RENTAL}</h4>
          <div className="agency-car-grid">
            <TextField
              label={strings.CONTRACT_DEPARTURE_DATE}
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('departureDate')}
              error={!!errors.departureDate}
              helperText={errors.departureDate?.message}
            />
            <TextField
              label={strings.CONTRACT_RETURN_DATE}
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('returnDate')}
              error={!!errors.returnDate}
              helperText={errors.returnDate?.message}
            />
            <TextField label={strings.CONTRACT_DEPARTURE_PLACE} {...register('departurePlace')} />
            <TextField label={strings.CONTRACT_RETURN_PLACE} {...register('returnPlace')} />
            <TextField
              label={strings.CONTRACT_DEPARTURE_KM}
              type="number"
              inputProps={{ min: 0, step: '1' }}
              {...register('departureKm')}
            />
            <TextField
              label={strings.CONTRACT_RETURN_KM}
              type="number"
              inputProps={{ min: 0, step: '1' }}
              {...register('returnKm')}
            />
            <TextField label={strings.CONTRACT_DEPARTURE_FUEL} {...register('departureFuel')} />
            <TextField label={strings.CONTRACT_RETURN_FUEL} {...register('returnFuel')} />
            <Controller
              name="kmLimitPerDay"
              control={control}
              render={({ field }) => (
                <TextField select label={strings.CONTRACT_KM_LIMIT} {...field} value={field.value ?? ''}>
                  {CONTRACT_KM_PACKAGES.map((km) => (
                    <MenuItem key={km} value={km}>{`${km} Km/j`}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label={strings.CONTRACT_EXTRA_KM}
              type="number"
              inputProps={{ min: 0, step: '1' }}
              {...register('extraKmPrice')}
            />
            <TextField
              label={strings.CONTRACT_EXTRA_HOUR}
              type="number"
              inputProps={{ min: 0, step: '0.001' }}
              {...register('extraHourPrice')}
            />
            <TextField
              label={strings.CONTRACT_EXTRA_DAY}
              type="number"
              inputProps={{ min: 0, step: '0.001' }}
              {...register('extraDayPrice')}
            />
          </div>

          {/* Supplements */}
          <div className="agency-invoice-lines-head">
            <h4 className="agency-invoice-section-title">{strings.CONTRACT_SUPPLEMENTS}</h4>
            <Button
              size="small"
              startIcon={<AddRounded />}
              onClick={() => supplements.append({ label: '', priceHT: 0, vatRate: Number(watched.vatRate) || 19 })}
            >
              {strings.CONTRACT_SUPPLEMENT_ADD}
            </Button>
          </div>
          {supplements.fields.map((field, index) => (
            <div className="agency-invoice-line-card" key={field.id}>
              <div className="agency-invoice-line-head">
                <span>{index + 1}</span>
                <Tooltip title={strings.CONTRACT_SUPPLEMENT_REMOVE}>
                  <IconButton size="small" onClick={() => supplements.remove(index)}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="agency-car-grid">
                <TextField
                  className="agency-car-span-2"
                  label={strings.CONTRACT_SUPPLEMENT_LABEL}
                  {...register(`supplements.${index}.label` as const)}
                  error={!!errors.supplements?.[index]?.label}
                  helperText={errors.supplements?.[index]?.label?.message}
                />
                <TextField
                  label={strings.CONTRACT_SUPPLEMENT_HT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register(`supplements.${index}.priceHT` as const)}
                />
                <TextField
                  label={strings.INVOICE_VAT_RATE}
                  type="number"
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  {...register(`supplements.${index}.vatRate` as const)}
                />
              </div>
            </div>
          ))}

          {/* Payments */}
          <div className="agency-invoice-lines-head">
            <h4 className="agency-invoice-section-title">{strings.CONTRACT_PAYMENTS}</h4>
            <Button
              size="small"
              startIcon={<AddRounded />}
              onClick={() => payments.append({
                date: today(),
                amount: 0,
                method: CONTRACT_PAYMENT_METHODS[0],
                status: CONTRACT_PAYMENT_STATUSES[0],
              })}
            >
              {strings.CONTRACT_PAYMENT_ADD}
            </Button>
          </div>
          {payments.fields.map((field, index) => (
            <div className="agency-invoice-line-card" key={field.id}>
              <div className="agency-invoice-line-head">
                <span>{index + 1}</span>
                <Tooltip title={strings.CONTRACT_PAYMENT_REMOVE}>
                  <IconButton size="small" onClick={() => payments.remove(index)}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="agency-car-grid">
                <TextField
                  label={strings.CONTRACT_PAYMENT_DATE}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register(`payments.${index}.date` as const)}
                />
                <TextField
                  label={strings.CONTRACT_PAYMENT_AMOUNT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register(`payments.${index}.amount` as const)}
                />
                <Controller
                  name={`payments.${index}.method` as const}
                  control={control}
                  render={({ field: methodField }) => (
                    <TextField select label={strings.CONTRACT_PAYMENT_METHOD} {...methodField}>
                      {CONTRACT_PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>{method}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name={`payments.${index}.status` as const}
                  control={control}
                  render={({ field: statusField }) => (
                    <TextField select label={strings.CONTRACT_PAYMENT_STATUS} {...statusField} value={statusField.value ?? ''}>
                      {CONTRACT_PAYMENT_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </div>
            </div>
          ))}

          {/* Walk-around checklist */}
          <h4 className="agency-invoice-section-title">{strings.CONTRACT_CHECKLIST}</h4>
          <p className="agency-profile-hint">{strings.CONTRACT_CHECKLIST_HINT}</p>
          <div className="agency-contract-checklist">
            {checklist.fields.map((field, index) => (
              <Controller
                key={field.id}
                name={`checklist.${index}.ok` as const}
                control={control}
                render={({ field: checkField }) => (
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        checked={!!checkField.value}
                        onChange={(e) => checkField.onChange(e.target.checked)}
                      />
                    )}
                    label={CONTRACT_CHECKLIST[index]?.label || field.key}
                  />
                )}
              />
            ))}
          </div>

          {/* Money and live totals */}
          <div className="agency-invoice-bottom">
            <div className="agency-invoice-bottom-col">
              <h4 className="agency-invoice-section-title">{strings.CONTRACT_PRICING}</h4>
              <div className="agency-car-grid">
                <TextField
                  label={strings.CONTRACT_RENTAL_HT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('rentalHT')}
                  error={!!errors.rentalHT}
                  helperText={errors.rentalHT?.message}
                />
                <TextField
                  label={strings.INVOICE_VAT_RATE}
                  type="number"
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  {...register('vatRate')}
                />
                <TextField
                  label={strings.CONTRACT_DEPOSIT}
                  type="number"
                  inputProps={{ min: 0, step: '0.001' }}
                  {...register('deposit')}
                />
                <TextField label={strings.CONTRACT_DEPOSIT_REASON} {...register('depositReason')} />
                <TextField
                  className="agency-car-span-2"
                  label={strings.CONTRACT_NOTES}
                  multiline
                  minRows={2}
                  {...register('notes')}
                />
              </div>
            </div>

            <aside className="agency-invoice-totals-card">
              <div className="agency-invoice-total-row">
                <span>{strings.CONTRACT_TOTAL_HT}</span>
                <strong>{formatMoney(totals.totalHT)}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.INVOICE_TOTAL_VAT}</span>
                <strong>{formatMoney(totals.totalVAT)}</strong>
              </div>
              <div className="agency-invoice-total-row is-strong">
                <span>{strings.CONTRACT_TOTAL_TTC}</span>
                <strong>{`${formatMoney(totals.totalTTC)} ${currency}`}</strong>
              </div>
              <div className="agency-invoice-total-row">
                <span>{strings.CONTRACT_PAYMENTS}</span>
                <strong>{formatMoney(totals.totalPaid)}</strong>
              </div>
              <div className={`agency-invoice-total-row ${totals.balanceDue > 0 ? 'is-due' : ''}`}>
                <span>{strings.INVOICE_BALANCE_DUE}</span>
                <strong>{`${formatMoney(totals.balanceDue)} ${currency}`}</strong>
              </div>
            </aside>
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
              {submitting ? <CircularProgress size={20} color="inherit" /> : strings.CONTRACT_SAVE}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddContractDialog
