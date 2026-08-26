import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
} from '@mui/material'
import { CloudUploadOutlined, CloseRounded } from '@mui/icons-material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import * as AgencyLocationService from '@/agency/services/AgencyLocationService'
import {
  AgencyCarFormFields,
  agencyCarSchema,
  STEPS,
  stepFields,
} from '@/agency/models/AgencyCarForm'

const MAX_CAR_IMAGES = 8

interface AgencyAddCarStepperProps {
  open: boolean
  agencyId: string
  onClose: () => void
  onCreated: (car: bookcarsTypes.Car) => void
}

const currentYear = new Date().getFullYear()

const AgencyAddCarStepper = ({ open, agencyId, onClose, onCreated }: AgencyAddCarStepperProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})

  const {
    control,
    register,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<AgencyCarFormFields>({
    resolver: zodResolver(agencyCarSchema),
    mode: 'onBlur',
    defaultValues: {
      brand: '',
      model: '',
      year: String(currentYear),
      range: bookcarsTypes.CarRange.Midi,
      images: [],
      licensePlate: '',
      chassisNumber: '',
      registrationDoc: '',
      gearbox: bookcarsTypes.GearboxType.Automatic,
      type: bookcarsTypes.CarType.Gasoline,
      seats: '5',
      doors: '4',
      aircon: true,
      insuranceExpiry: '',
      technicalVisitExpiry: '',
      nextOilChange: '',
      deliveryType: bookcarsTypes.DeliveryType.Office,
      locationName: '',
      dailyPrice: '',
      discountedDailyPrice: '',
      deposit: '',
      mileage: '250',
      available: true,
    },
  })

  const images = watch('images')
  const registrationDoc = watch('registrationDoc')
  const deliveryType = watch('deliveryType')
  const imagePreviewsRef = React.useRef(imagePreviews)
  imagePreviewsRef.current = imagePreviews

  useEffect(() => () => {
    Object.values(imagePreviewsRef.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }
    const suggested =
      deliveryType === bookcarsTypes.DeliveryType.Airport
        ? strings.CAR_DELIVERY_AIRPORT
        : deliveryType === bookcarsTypes.DeliveryType.Delivery
          ? strings.CAR_DELIVERY_HOME
          : strings.CAR_DELIVERY_OFFICE

    const current = getValues('locationName')?.trim() || ''
    const isDefault =
      !current
      || current === strings.CAR_DELIVERY_AIRPORT
      || current === strings.CAR_DELIVERY_OFFICE
      || current === strings.CAR_DELIVERY_HOME

    if (isDefault) {
      setValue('locationName', suggested, { shouldValidate: false })
    }
  }, [open, deliveryType, setValue, getValues])

  const stepLabels = useMemo(() => [
    strings.CAR_STEP_BASIC,
    strings.CAR_STEP_ADMIN,
    strings.CAR_STEP_OPS,
    strings.CAR_STEP_MAINTENANCE,
    strings.CAR_STEP_LOCATION,
    strings.CAR_STEP_PRICING,
  ], [])

  const clearImagePreviews = () => {
    Object.values(imagePreviews).forEach((url) => URL.revokeObjectURL(url))
    setImagePreviews({})
  }

  const handleClose = () => {
    if (submitting) {
      return
    }
    clearImagePreviews()
    reset()
    setActiveStep(0)
    setSubmitError('')
    onClose()
  }

  const onUploadImages = async (fileList?: FileList | null) => {
    if (!fileList?.length) {
      return
    }

    const current = getValues('images') || []
    const remaining = MAX_CAR_IMAGES - current.length
    if (remaining <= 0) {
      setSubmitError(strings.CAR_PHOTOS_MAX)
      return
    }

    const files = Array.from(fileList).slice(0, remaining)
    setUploadingImage(true)
    setSubmitError('')
    try {
      const uploaded: string[] = []
      const previews: Record<string, string> = {}
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          continue
        }
        const filename = await AgencyCarService.createImage(file)
        uploaded.push(filename)
        previews[filename] = URL.createObjectURL(file)
      }
      if (uploaded.length === 0) {
        setSubmitError(strings.CAR_UPLOAD_ERROR)
        return
      }
      setImagePreviews((prev) => ({ ...prev, ...previews }))
      setValue('images', [...current, ...uploaded], { shouldValidate: true })
    } catch {
      setSubmitError(strings.CAR_UPLOAD_ERROR)
    } finally {
      setUploadingImage(false)
    }
  }

  const onRemoveImage = async (filename: string) => {
    const current = getValues('images') || []
    const next = current.filter((name) => name !== filename)
    setValue('images', next, { shouldValidate: true })
    setImagePreviews((prev) => {
      const url = prev[filename]
      if (url) {
        URL.revokeObjectURL(url)
      }
      const { [filename]: _removed, ...rest } = prev
      return rest
    })
    try {
      await AgencyCarService.deleteTempImage(filename)
    } catch {
      // Temp cleanup is best-effort — create still validates presence.
    }
  }

  const onUploadDoc = async (file?: File | null) => {
    if (!file) {
      return
    }
    setUploadingDoc(true)
    try {
      const filename = await AgencyCarService.createImage(file)
      setValue('registrationDoc', filename, { shouldValidate: true })
    } catch {
      setSubmitError(strings.CAR_UPLOAD_ERROR)
    } finally {
      setUploadingDoc(false)
    }
  }

  const goNext = async () => {
    const stepKey = STEPS[activeStep]
    const ok = await trigger(stepFields[stepKey])
    if (!ok) {
      return
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0))

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const plateStatus = await AgencyCarService.validateLicensePlate(values.licensePlate.trim())
      if (plateStatus === 204) {
        setSubmitError(strings.CAR_PLATE_EXISTS)
        setActiveStep(1)
        setSubmitting(false)
        return
      }

      const mileageValue = Number(values.mileage)
      const locationId = await AgencyLocationService.ensurePickupLocation(values.locationName, agencyId)
      const payload: bookcarsTypes.CreateCarPayload = {
        loggedUser: agencyId,
        supplier: agencyId,
        name: `${values.brand.trim()} ${values.model.trim()}`.trim(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: Number(values.year),
        licensePlate: values.licensePlate.trim(),
        chassisNumber: values.chassisNumber.trim(),
        registrationDoc: values.registrationDoc || undefined,
        insuranceExpiry: values.insuranceExpiry,
        technicalVisitExpiry: values.technicalVisitExpiry,
        nextOilChange: values.nextOilChange,
        deliveryType: values.deliveryType,
        minimumAge: env.MINIMUM_AGE,
        locations: [locationId],
        image: values.images[0],
        images: values.images,
        range: values.range,
        type: values.type,
        gearbox: values.gearbox,
        seats: Number(values.seats),
        doors: Number(values.doors),
        aircon: values.aircon,
        dailyPrice: Number(values.dailyPrice),
        discountedDailyPrice: values.discountedDailyPrice ? Number(values.discountedDailyPrice) : null,
        deposit: Number(values.deposit),
        mileage: Number.isFinite(mileageValue) ? mileageValue : -1,
        available: values.available,
        hourlyPrice: null,
        discountedHourlyPrice: null,
        biWeeklyPrice: null,
        discountedBiWeeklyPrice: null,
        weeklyPrice: null,
        discountedWeeklyPrice: null,
        monthlyPrice: null,
        discountedMonthlyPrice: null,
        isDateBasedPrice: false,
        dateBasedPrices: [],
        fuelPolicy: bookcarsTypes.FuelPolicy.LikeForLike,
        cancellation: -1,
        amendments: -1,
        theftProtection: -1,
        collisionDamageWaiver: -1,
        fullInsurance: -1,
        additionalDriver: -1,
        multimedia: [],
        blockOnPay: true,
      }

      const car = await AgencyCarService.create(payload)
      clearImagePreviews()
      onCreated(car)
      reset()
      setActiveStep(0)
      onClose()
    } catch {
      setSubmitError(strings.CAR_SAVE_ERROR)
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" className="agency-car-dialog">
      <DialogContent className="agency-car-dialog-content">
        <div className="agency-car-dialog-head">
          <div>
            <p className="agency-kicker">{strings.FLEET}</p>
            <h2>{strings.CAR_ADD_TITLE}</h2>
            <p>{strings.CAR_ADD_SUBTITLE}</p>
          </div>
          <Button onClick={handleClose} color="inherit">{strings.CANCEL}</Button>
        </div>

        <Stepper activeStep={activeStep} alternativeLabel className="agency-car-stepper">
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form className="agency-car-form" onSubmit={onSubmit} noValidate>
          {activeStep === 0 && (
            <div className="agency-car-grid">
              <TextField label={strings.CAR_BRAND} {...register('brand')} error={!!errors.brand} helperText={errors.brand?.message} fullWidth />
              <TextField label={strings.CAR_MODEL} {...register('model')} error={!!errors.model} helperText={errors.model?.message} fullWidth />
              <TextField label={strings.CAR_YEAR} {...register('year')} error={!!errors.year} helperText={errors.year?.message} fullWidth />
              <FormControl fullWidth error={!!errors.range}>
                <InputLabel>{strings.CAR_CATEGORY}</InputLabel>
                <Controller
                  name="range"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label={strings.CAR_CATEGORY}>
                      <MenuItem value={bookcarsTypes.CarRange.Mini}>{strings.CAR_CAT_MINI}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Midi}>{strings.CAR_CAT_MIDI}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Maxi}>{strings.CAR_CAT_MAXI}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Scooter}>{strings.CAR_CAT_SCOOTER}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Bus}>{strings.CAR_CAT_BUS}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Truck}>{strings.CAR_CAT_TRUCK}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarRange.Caravan}>{strings.CAR_CAT_CARAVAN}</MenuItem>
                    </Select>
                  )}
                />
                {errors.range && <FormHelperText>{errors.range.message}</FormHelperText>}
              </FormControl>
              <div className="agency-car-upload agency-car-span-2 is-gallery">
                <div className="agency-car-upload-meta">
                  <strong>{strings.CAR_PHOTOS}</strong>
                  <span>{strings.CAR_PHOTOS_HINT}</span>
                  {errors.images && <em>{errors.images.message as string}</em>}
                </div>
                <label className={`agency-car-upload-btn${(images?.length || 0) >= MAX_CAR_IMAGES ? ' is-disabled' : ''}`}>
                  <CloudUploadOutlined />
                  {uploadingImage ? strings.LOADING : strings.CAR_UPLOAD}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={(images?.length || 0) >= MAX_CAR_IMAGES || uploadingImage}
                    onChange={(e) => {
                      void onUploadImages(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
                {(images?.length || 0) > 0 && (
                  <div className="agency-car-gallery">
                    {images.map((filename, index) => (
                      <figure key={filename} className={`agency-car-gallery-item${index === 0 ? ' is-cover' : ''}`}>
                        {imagePreviews[filename] ? (
                          <img src={imagePreviews[filename]} alt="" />
                        ) : (
                          <span className="agency-car-gallery-fallback">{filename}</span>
                        )}
                        {index === 0 && <em>{strings.CAR_PHOTO_COVER}</em>}
                        <button
                          type="button"
                          className="agency-car-gallery-remove"
                          aria-label={strings.CAR_PHOTO_REMOVE}
                          onClick={() => void onRemoveImage(filename)}
                        >
                          <CloseRounded fontSize="small" />
                        </button>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="agency-car-grid">
              <TextField label={strings.CAR_PLATE} {...register('licensePlate')} error={!!errors.licensePlate} helperText={errors.licensePlate?.message} fullWidth />
              <TextField label={strings.CAR_CHASSIS} {...register('chassisNumber')} error={!!errors.chassisNumber} helperText={errors.chassisNumber?.message} fullWidth />
              <div className="agency-car-upload agency-car-span-2">
                <div className="agency-car-upload-meta">
                  <strong>{strings.CAR_CARTE_GRISE}</strong>
                  <span>{strings.CAR_CARTE_GRISE_HINT}</span>
                </div>
                <label className="agency-car-upload-btn">
                  <CloudUploadOutlined />
                  {uploadingDoc ? strings.LOADING : strings.CAR_UPLOAD}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={(e) => void onUploadDoc(e.target.files?.[0])}
                  />
                </label>
                {registrationDoc && (
                  <div className="agency-car-preview">
                    <span>{registrationDoc}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="agency-car-grid">
              <FormControl fullWidth error={!!errors.gearbox}>
                <InputLabel>{strings.CAR_GEARBOX}</InputLabel>
                <Controller
                  name="gearbox"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label={strings.CAR_GEARBOX}>
                      <MenuItem value={bookcarsTypes.GearboxType.Manual}>{strings.CAR_GEAR_MANUAL}</MenuItem>
                      <MenuItem value={bookcarsTypes.GearboxType.Automatic}>{strings.CAR_GEAR_AUTO}</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>{strings.CAR_FUEL}</InputLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label={strings.CAR_FUEL}>
                      <MenuItem value={bookcarsTypes.CarType.Gasoline}>{strings.CAR_FUEL_GAS}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarType.Diesel}>{strings.CAR_FUEL_DIESEL}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarType.Hybrid}>{strings.CAR_FUEL_HYBRID}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarType.Electric}>{strings.CAR_FUEL_ELECTRIC}</MenuItem>
                      <MenuItem value={bookcarsTypes.CarType.PlugInHybrid}>{strings.CAR_FUEL_PHEV}</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              <TextField label={strings.CAR_SEATS} type="number" {...register('seats')} error={!!errors.seats} helperText={errors.seats?.message} fullWidth />
              <TextField label={strings.CAR_DOORS} type="number" {...register('doors')} error={!!errors.doors} helperText={errors.doors?.message} fullWidth />
              <FormControlLabel
                className="agency-car-span-2"
                control={<Controller name="aircon" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} />}
                label={strings.CAR_AIRCON}
              />
            </div>
          )}

          {activeStep === 3 && (
            <div className="agency-car-grid">
              <TextField
                label={strings.CAR_INSURANCE}
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('insuranceExpiry')}
                error={!!errors.insuranceExpiry}
                helperText={errors.insuranceExpiry?.message}
                fullWidth
              />
              <TextField
                label={strings.CAR_TECH_VISIT}
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('technicalVisitExpiry')}
                error={!!errors.technicalVisitExpiry}
                helperText={errors.technicalVisitExpiry?.message}
                fullWidth
              />
              <TextField
                label={strings.CAR_OIL_CHANGE}
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('nextOilChange')}
                error={!!errors.nextOilChange}
                helperText={errors.nextOilChange?.message}
                fullWidth
              />
            </div>
          )}

          {activeStep === 4 && (
            <div className="agency-car-grid">
              <FormControl fullWidth error={!!errors.deliveryType}>
                <InputLabel>{strings.CAR_DELIVERY}</InputLabel>
                <Controller
                  name="deliveryType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label={strings.CAR_DELIVERY}>
                      <MenuItem value={bookcarsTypes.DeliveryType.Airport}>{strings.CAR_DELIVERY_AIRPORT}</MenuItem>
                      <MenuItem value={bookcarsTypes.DeliveryType.Office}>{strings.CAR_DELIVERY_OFFICE}</MenuItem>
                      <MenuItem value={bookcarsTypes.DeliveryType.Delivery}>{strings.CAR_DELIVERY_HOME}</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              <TextField
                className="agency-car-span-2"
                label={strings.CAR_LOCATIONS}
                placeholder={strings.CAR_LOCATIONS_PLACEHOLDER}
                {...register('locationName')}
                error={!!errors.locationName}
                helperText={errors.locationName?.message || strings.CAR_LOCATIONS_HINT}
                fullWidth
              />
            </div>
          )}

          {activeStep === 5 && (
            <div className="agency-car-grid">
              <TextField label={strings.CAR_DAILY_PRICE} type="number" {...register('dailyPrice')} error={!!errors.dailyPrice} helperText={errors.dailyPrice?.message || strings.CAR_DAILY_PRICE_HINT} fullWidth />
              <TextField label={strings.CAR_OFF_SEASON_PRICE} type="number" {...register('discountedDailyPrice')} error={!!errors.discountedDailyPrice} helperText={errors.discountedDailyPrice?.message} fullWidth />
              <TextField label={strings.CAR_DEPOSIT} type="number" {...register('deposit')} error={!!errors.deposit} helperText={errors.deposit?.message || strings.CAR_DEPOSIT_HINT} fullWidth />
              <TextField label={strings.CAR_KM_LIMIT} type="number" {...register('mileage')} error={!!errors.mileage} helperText={errors.mileage?.message || strings.CAR_KM_HINT} fullWidth />
              <FormControlLabel
                className="agency-car-span-2"
                control={<Controller name="available" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} />}
                label={strings.CAR_AVAILABLE}
              />
            </div>
          )}

          {submitError && <p className="agency-car-error">{submitError}</p>}

          <div className="agency-car-actions">
            <Button color="inherit" disabled={activeStep === 0 || submitting} onClick={goBack}>
              {strings.BACK}
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" className="btn-primary" onClick={() => void goNext()}>
                {strings.NEXT}
              </Button>
            ) : (
              <Button type="submit" variant="contained" className="btn-primary" disabled={submitting}>
                {submitting ? <CircularProgress size={20} color="inherit" /> : strings.CAR_SAVE}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyAddCarStepper
