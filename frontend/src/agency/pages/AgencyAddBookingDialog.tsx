import React from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material'
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { strings as csStrings } from '@/lang/cars'
import { strings as commonStrings } from '@/lang/common'
import {
  agencyBookingSchema,
  type AgencyBookingFormFields,
} from '@/agency/models/AgencyBookingForm'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import * as AgencyLocationService from '@/agency/services/AgencyLocationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'

interface AgencyAddBookingDialogProps {
  open: boolean
  agency: bookcarsTypes.User
  onClose: () => void
  onCreated: () => void
}

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

const locationLabel = (loc: bookcarsTypes.Location) =>
  loc.name || loc.values?.find((v) => v.language === 'fr')?.value || loc._id

const AgencyAddBookingDialog = ({
  open,
  agency,
  onClose,
  onCreated,
}: AgencyAddBookingDialogProps) => {
  const language = agency.language || env.DEFAULT_LANGUAGE
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState('')
  const [cars, setCars] = React.useState<bookcarsTypes.Car[]>([])
  const [locations, setLocations] = React.useState<bookcarsTypes.Location[]>([])
  const [selectedCar, setSelectedCar] = React.useState<bookcarsTypes.Car | null>(null)
  const [loadingMeta, setLoadingMeta] = React.useState(false)

  const defaults = React.useCallback((): AgencyBookingFormFields => ({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    carId: '',
    pickupLocationId: '',
    dropOffLocationId: '',
    from: nowLocal(),
    to: nowLocal(),
    status: bookcarsTypes.BookingStatus.Reserved,
    cancellation: false,
    amendments: false,
    theftProtection: false,
    collisionDamageWaiver: false,
    fullInsurance: false,
    additionalDriver: false,
    additionalDriverFullName: '',
    additionalDriverEmail: '',
    additionalDriverPhone: '',
    additionalDriverBirthDate: '',
  }), [])

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AgencyBookingFormFields>({
    resolver: zodResolver(agencyBookingSchema) as Resolver<AgencyBookingFormFields>,
    mode: 'onBlur',
    defaultValues: defaults(),
  })

  const watched = useWatch({ control })
  const carId = watched.carId
  const from = watched.from
  const to = watched.to
  const additionalDriverEnabled = watched.additionalDriver

  React.useEffect(() => {
    if (!open || !agency._id) {
      return
    }

    let cancelled = false
    const load = async () => {
      setLoadingMeta(true)
      setSubmitError('')
      reset(defaults())
      setSelectedCar(null)
      try {
        const [carsResult, locationsResult] = await Promise.all([
          AgencyCarService.getCars('', { suppliers: [agency._id!] }, 1, 200),
          AgencyLocationService.getLocations('', 1, 200),
        ])
        if (cancelled) {
          return
        }
        setCars((carsResult?.[0]?.resultData || []).filter((car) => car.available !== false))
        setLocations(locationsResult?.[0]?.resultData || [])
      } catch {
        if (!cancelled) {
          setSubmitError(strings.BOOKING_SAVE_ERROR)
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, agency._id, reset, defaults])

  React.useEffect(() => {
    if (!carId) {
      setSelectedCar(null)
      return
    }

    let cancelled = false
    const loadCar = async () => {
      try {
        const car = await AgencyCarService.getCar(carId, language)
        if (cancelled) {
          return
        }
        setSelectedCar(car)
        const carLocations = (car.locations || [])
          .map((loc) => (typeof loc === 'object' && loc ? loc as bookcarsTypes.Location : null))
          .filter(Boolean) as bookcarsTypes.Location[]

        if (carLocations.length > 0) {
          setLocations((prev) => {
            const map = new Map(prev.map((loc) => [loc._id, loc]))
            carLocations.forEach((loc) => map.set(loc._id, loc))
            return Array.from(map.values())
          })
          const firstId = carLocations[0]._id
          setValue('pickupLocationId', firstId)
          setValue('dropOffLocationId', firstId)
        }

        setValue('cancellation', car.cancellation === 0)
        setValue('amendments', car.amendments === 0)
        setValue('theftProtection', car.theftProtection === 0)
        setValue('collisionDamageWaiver', car.collisionDamageWaiver === 0)
        setValue('fullInsurance', car.fullInsurance === 0)
        setValue('additionalDriver', car.additionalDriver === 0)
      } catch {
        if (!cancelled) {
          setSelectedCar(null)
        }
      }
    }

    void loadCar()
    return () => {
      cancelled = true
    }
  }, [carId, language, setValue])

  const estimatedPrice = React.useMemo(() => {
    if (!selectedCar || !from || !to) {
      return 0
    }
    const fromDate = new Date(from)
    const toDate = new Date(to)
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
      return 0
    }
    const rate = typeof selectedCar.supplier === 'object' && selectedCar.supplier
      ? (selectedCar.supplier.priceChangeRate || 0)
      : (agency.priceChangeRate || 0)
    return bookcarsHelper.calculateTotalPrice(selectedCar, fromDate, toDate, rate, {
      cancellation: !!watched.cancellation,
      amendments: !!watched.amendments,
      theftProtection: !!watched.theftProtection,
      collisionDamageWaiver: !!watched.collisionDamageWaiver,
      fullInsurance: !!watched.fullInsurance,
      additionalDriver: !!watched.additionalDriver,
    })
  }, [
    selectedCar,
    from,
    to,
    watched.cancellation,
    watched.amendments,
    watched.theftProtection,
    watched.collisionDamageWaiver,
    watched.fullInsurance,
    watched.additionalDriver,
    agency.priceChangeRate,
  ])

  const priceLabel = bookcarsHelper.formatPrice(
    estimatedPrice,
    env.BASE_CURRENCY || 'TND',
    language,
  )

  const onSubmit = async (values: AgencyBookingFormFields) => {
    if (!selectedCar) {
      setSubmitError(strings.BOOKING_SAVE_ERROR)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const fromDate = new Date(values.from)
      const toDate = new Date(values.to)
      const rate = typeof selectedCar.supplier === 'object' && selectedCar.supplier
        ? (selectedCar.supplier.priceChangeRate || 0)
        : (agency.priceChangeRate || 0)

      const additionalDriverSet = helper.carOptionAvailable(selectedCar, 'additionalDriver') && values.additionalDriver
      const carOptions: bookcarsTypes.CarOptions = {
        cancellation: values.cancellation,
        amendments: values.amendments,
        theftProtection: values.theftProtection,
        collisionDamageWaiver: values.collisionDamageWaiver,
        fullInsurance: values.fullInsurance,
        additionalDriver: additionalDriverSet,
      }

      const price = bookcarsHelper.calculateTotalPrice(selectedCar, fromDate, toDate, rate, carOptions)

      const emailStatus = await AgencyBookingService.validateEmail(values.email)
      const existingDriver = emailStatus === 204
        ? await AgencyBookingService.findDriverByEmail(values.email)
        : null

      if (emailStatus === 204 && !existingDriver) {
        setSubmitError(strings.BOOKING_EMAIL_IN_USE)
        return
      }

      const booking: bookcarsTypes.Booking = {
        supplier: agency._id!,
        car: selectedCar._id,
        driver: existingDriver?._id,
        pickupLocation: values.pickupLocationId,
        dropOffLocation: values.dropOffLocationId,
        from: fromDate,
        to: toDate,
        status: values.status as bookcarsTypes.BookingStatus,
        cancellation: values.cancellation,
        amendments: values.amendments,
        theftProtection: values.theftProtection,
        collisionDamageWaiver: values.collisionDamageWaiver,
        fullInsurance: values.fullInsurance,
        additionalDriver: additionalDriverSet,
        price,
      }

      let additionalDriver: bookcarsTypes.AdditionalDriver | undefined
      if (additionalDriverSet) {
        additionalDriver = {
          fullName: values.additionalDriverFullName!,
          email: values.additionalDriverEmail!,
          phone: values.additionalDriverPhone!,
          birthDate: new Date(values.additionalDriverBirthDate!),
        }
      }

      if (existingDriver) {
        const created = await AgencyBookingService.create({ booking, additionalDriver })
        if (!created?._id) {
          throw new Error('create failed')
        }
      } else {
        const driver: bookcarsTypes.User = {
          email: values.email,
          phone: values.phone,
          fullName: values.fullName,
          birthDate: new Date(values.birthDate),
          language,
        }
        const { status, bookingId } = await AgencyBookingService.checkout({
          driver,
          booking,
          additionalDriver,
          payLater: true,
        })
        if (status !== 200 || !bookingId) {
          throw new Error('checkout failed')
        }
      }

      helper.info(strings.BOOKING_CREATED)
      onCreated()
    } catch {
      setSubmitError(strings.BOOKING_SAVE_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  const optionDisabled = (option: keyof bookcarsTypes.CarOptions) =>
    !selectedCar || !helper.carOptionAvailable(selectedCar, option)

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      className="agency-branch-dialog agency-invoice-dialog"
    >
      <DialogContent className="agency-branch-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <h2>{strings.BOOKING_ADD_TITLE}</h2>
            <p>{strings.BOOKING_ADD_SUBTITLE}</p>
          </div>
        </div>

        {loadingMeta ? (
          <div className="agency-inline-loading">
            <CircularProgress size={28} />
            <span>{strings.LOADING}</span>
          </div>
        ) : (
          <form className="agency-branch-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <h4 className="agency-invoice-section-title">{strings.BOOKING_SECTION_CLIENT}</h4>
            <div className="agency-car-grid">
              <TextField
                className="agency-car-span-2"
                label={commonStrings.FULL_NAME}
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
                label={commonStrings.PHONE}
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <TextField
                className="agency-car-span-2"
                label={commonStrings.BIRTH_DATE}
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('birthDate')}
                error={!!errors.birthDate}
                helperText={errors.birthDate?.message}
              />
            </div>

            <h4 className="agency-invoice-section-title">{strings.BOOKING_SECTION_TRIP}</h4>
            <div className="agency-car-grid">
              <TextField
                className="agency-car-span-2"
                select
                label={strings.BOOKING_CAR}
                {...register('carId')}
                error={!!errors.carId}
                helperText={errors.carId?.message || (cars.length === 0 ? strings.BOOKING_NO_CARS : undefined)}
              >
                {cars.map((car) => (
                  <MenuItem key={car._id} value={car._id}>
                    {car.name}{car.licensePlate ? ` · ${car.licensePlate}` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={strings.BOOKING_PICKUP}
                {...register('pickupLocationId')}
                error={!!errors.pickupLocationId}
                helperText={errors.pickupLocationId?.message}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc._id} value={loc._id}>{locationLabel(loc)}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={strings.BOOKING_DROPOFF}
                {...register('dropOffLocationId')}
                error={!!errors.dropOffLocationId}
                helperText={errors.dropOffLocationId?.message}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc._id} value={loc._id}>{locationLabel(loc)}</MenuItem>
                ))}
              </TextField>
              <TextField
                label={commonStrings.FROM}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...register('from')}
                error={!!errors.from}
                helperText={errors.from?.message}
              />
              <TextField
                label={commonStrings.TO}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...register('to')}
                error={!!errors.to}
                helperText={errors.to?.message}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    className="agency-car-span-2"
                    label={strings.BOOKING_STATUS}
                    {...field}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    {ACTIVE_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {helper.getBookingStatus(status)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </div>

            <h4 className="agency-invoice-section-title">{strings.BOOKING_SECTION_OPTIONS}</h4>
            <div className="agency-booking-options">
              {([
                ['cancellation', csStrings.CANCELLATION],
                ['amendments', csStrings.AMENDMENTS],
                ['theftProtection', csStrings.THEFT_PROTECTION],
                ['collisionDamageWaiver', csStrings.COLLISION_DAMAGE_WAVER],
                ['fullInsurance', csStrings.FULL_INSURANCE],
                ['additionalDriver', csStrings.ADDITIONAL_DRIVER],
              ] as const).map(([name, label]) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={(
                        <Switch
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          color="primary"
                          disabled={optionDisabled(name)}
                        />
                      )}
                      label={label}
                    />
                  )}
                />
              ))}
            </div>

            {selectedCar && helper.carOptionAvailable(selectedCar, 'additionalDriver') && additionalDriverEnabled && (
              <>
                <h4 className="agency-invoice-section-title">{csStrings.ADDITIONAL_DRIVER}</h4>
                <div className="agency-car-grid">
                  <TextField
                    className="agency-car-span-2"
                    label={commonStrings.FULL_NAME}
                    {...register('additionalDriverFullName')}
                    error={!!errors.additionalDriverFullName}
                    helperText={errors.additionalDriverFullName?.message}
                  />
                  <TextField
                    label={strings.EMAIL}
                    type="email"
                    {...register('additionalDriverEmail')}
                    error={!!errors.additionalDriverEmail}
                    helperText={errors.additionalDriverEmail?.message}
                  />
                  <TextField
                    label={commonStrings.PHONE}
                    {...register('additionalDriverPhone')}
                    error={!!errors.additionalDriverPhone}
                    helperText={errors.additionalDriverPhone?.message}
                  />
                  <TextField
                    className="agency-car-span-2"
                    label={commonStrings.BIRTH_DATE}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    {...register('additionalDriverBirthDate')}
                    error={!!errors.additionalDriverBirthDate}
                    helperText={errors.additionalDriverBirthDate?.message}
                  />
                </div>
              </>
            )}

            <aside className="agency-invoice-totals-card agency-booking-totals">
              <div className="agency-invoice-total-row is-strong">
                <span>{strings.BOOKING_ESTIMATED_PRICE}</span>
                <strong>{priceLabel}</strong>
              </div>
              <p className="agency-booking-price-hint">{strings.BOOKING_PRICE_HINT}</p>
            </aside>

            {submitError ? <p className="agency-car-error">{submitError}</p> : null}

            <div className="agency-car-actions">
              <Button onClick={onClose} disabled={submitting}>
                {strings.CANCEL}
              </Button>
              <Button
                type="submit"
                variant="contained"
                className="btn-primary"
                disabled={submitting || cars.length === 0}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : strings.BOOKING_SAVE}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ACTIVE_STATUSES: bookcarsTypes.BookingStatus[] = [
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
]

export default AgencyAddBookingDialog
