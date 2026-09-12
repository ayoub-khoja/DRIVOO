import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
} from '@mui/material'
import {
  Check as CheckIcon,
  FlightTakeoff as FlightIcon,
} from '@mui/icons-material'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { PayPalButtons } from '@paypal/react-paypal-js'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/locale'
import validator from 'validator'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { createSchema, FormFields } from '@/models/CheckoutForm'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import { strings as checkoutStrings } from '@/lang/checkout'
import { strings as headerStrings } from '@/lang/header'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import * as BookingService from '@/services/BookingService'
import * as StripeService from '@/services/StripeService'
import * as PayPalService from '@/services/PayPalService'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import PhoneInputField from '@/components/PhoneInputField'
import NoMatch from './NoMatch'
import Progress from '@/components/Progress'
import Error from '@/components/Error'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import CheckoutOptions from '@/components/CheckoutOptions'
import CheckoutStatus, { CheckoutSummary } from '@/components/CheckoutStatus'
import Backdrop from '@/components/SimpleBackdrop'
import Unauthorized from '@/components/Unauthorized'
import DriverLicense from '@/components/DriverLicense'
import OfferSearchBar from '@/components/offer/OfferSearchBar'
import OfferProgressBar from '@/components/offer/OfferProgressBar'
import OfferOrderRecap from '@/components/offer/OfferOrderRecap'
import OfferRentalSteps from '@/components/offer/OfferRentalSteps'
import {
  EMPTY_EXTRA_QUANTITIES,
  OfferExtraQuantities,
} from '@/utils/offerExtrasHelper'
import { getFullProtectionTotal } from '@/utils/offerProtectionHelper'

import '@/assets/css/offer.css'

const stripePromise = env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe
  ? loadStripe(env.STRIPE_PUBLISHABLE_KEY)
  : null

const COUNTRIES = ['Tunisie', 'France', 'Maroc', 'Algérie', 'Belgique', 'Canada', 'Autre']

const OfferPayment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [basePrice, setBasePrice] = useState(0)
  const [protectionPrice, setProtectionPrice] = useState(0)
  const [price, setPrice] = useState(0)
  const [depositPrice, setDepositPrice] = useState(0)
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [authenticated, setAuthenticated] = useState(false)
  const [offerOptions, setOfferOptions] = useState<{ fullInsurance: boolean; additionalDriver: boolean }>()
  const [extras, setExtras] = useState<OfferExtraQuantities>({ ...EMPTY_EXTRA_QUANTITIES })
  const [emailRegistered, setEmailRegistered] = useState(false)
  const [emailInfo, setEmailInfo] = useState(true)
  const [phoneInfo, setPhoneInfo] = useState(true)
  const [success, setSuccess] = useState(false)
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary>()
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [licenseRequired, setLicenseRequired] = useState(false)
  const [license, setLicense] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string>()
  const [sessionId, setSessionId] = useState<string>()
  const [payPalLoaded, setPayPalLoaded] = useState(false)
  const [payPalInit, setPayPalInit] = useState(false)
  const [payPalProcessing, setPayPalProcessing] = useState(false)
  const [offerInitialOptions, setOfferInitialOptions] = useState<Partial<bookcarsTypes.CarOptions>>()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('Tunisie')
  const [paymentMethod, setPaymentMethod] = useState('payLater')

  const birthDateRef = useRef<HTMLInputElement | null>(null)

  const applyPaymentMethod = (method: string) => {
    setPaymentMethod(method)
    setValue('payLater', method === 'payLater')
    setValue('payDeposit', method === 'payDeposit')
    setValue('payInFull', method === 'payInFull')
  }

  const schema = createSchema(car)
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    clearErrors,
    trigger,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { additionalDriverEmail: '', additionalDriverPhone: '' },
  })

  const payLater = useWatch({ control, name: 'payLater' })
  const payDeposit = useWatch({ control, name: 'payDeposit' })
  const payInFull = useWatch({ control, name: 'payInFull' })
  const additionalDriver = useWatch({ control, name: 'additionalDriver' })

  const days = from && to ? bookcarsHelper.days(from, to) : 0
  const locale = getDateFnsLocale(language)
  const dateFmt = language === 'fr' ? 'eee d LLL yyyy kk:mm' : 'eee, d LLL yyyy, p'
  const daysLabel = from && to
    ? `${helper.getDaysShort(days)} (${bookcarsHelper.capitalize(format(from, dateFmt, { locale }))} - ${bookcarsHelper.capitalize(format(to, dateFmt, { locale }))})`
    : ''

  const hasProtection = !!offerOptions?.fullInsurance
  const hasFreeCancellation = car?.cancellation === 0
  const checkoutPrice = price > 0
    ? price
    : basePrice + (hasProtection ? protectionPrice : 0)

  useEffect(() => {
    if (!visible || !car) return
    if (car.supplier?.payLater) {
      applyPaymentMethod('payLater')
    } else {
      applyPaymentMethod(depositPrice > 0 ? 'payOnline' : 'payInFull')
    }
  }, [visible, car, depositPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const getNavigationState = () => ({
    carId: car!._id,
    pickupLocationId: pickupLocation!._id,
    dropOffLocationId: dropOffLocation!._id,
    from,
    to,
    extras,
    offerOptions,
    contact: (location.state as { contact?: unknown } | null)?.contact,
    pricing: (location.state as { pricing?: unknown } | null)?.pricing,
  })

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
    setAuthenticated(!!_user)
    setLanguage(UserService.getLanguage())

    const { state } = location
    if (!state) {
      setNoMatch(true)
      return
    }

    const {
      carId,
      pickupLocationId,
      dropOffLocationId,
      from: _from,
      to: _to,
      offerOptions: _offerOptions,
      extras: savedExtras,
      contact,
    } = state

    if (!carId || !pickupLocationId || !dropOffLocationId || !_from || !_to) {
      setNoMatch(true)
      return
    }

    try {
      const _car = await CarService.getCar(carId)
      if (!_car) {
        setNoMatch(true)
        return
      }

      const _pickupLocation = await LocationService.getLocation(pickupLocationId)
      if (!_pickupLocation) {
        setNoMatch(true)
        return
      }

      const _dropOffLocation = dropOffLocationId !== pickupLocationId
        ? await LocationService.getLocation(dropOffLocationId)
        : _pickupLocation

      if (!_dropOffLocation) {
        setNoMatch(true)
        return
      }

      const priceChangeRate = _car.supplier?.priceChangeRate || 0
      const _basePrice = await PaymentService.convertPrice(
        bookcarsHelper.calculateTotalPrice(_car, _from, _to, priceChangeRate),
      )
      const _deposit = _car.deposit > 0
        ? await PaymentService.convertPrice(_car.deposit + _car.deposit * (priceChangeRate / 100))
        : 0
      const _protectionPrice = _offerOptions?.fullInsurance
        ? await PaymentService.convertPrice(getFullProtectionTotal(_car, bookcarsHelper.days(_from, _to), priceChangeRate))
        : 0

      const included = (val: number) => val === 0
      const opts: Partial<bookcarsTypes.CarOptions> = {
        fullInsurance: _offerOptions?.fullInsurance ?? false,
        additionalDriver: _offerOptions?.additionalDriver ?? false,
      }

      setCar(_car)
      setPickupLocation(_pickupLocation)
      setDropOffLocation(_dropOffLocation)
      setFrom(_from)
      setTo(_to)
      setBasePrice(_basePrice)
      setProtectionPrice(_protectionPrice)
      setDepositPrice(_deposit)
      setOfferOptions(_offerOptions)
      setOfferInitialOptions(opts)
      const initialOptions: bookcarsTypes.CarOptions = {
        cancellation: included(_car.cancellation),
        amendments: included(_car.amendments),
        theftProtection: included(_car.theftProtection),
        collisionDamageWaiver: included(_car.collisionDamageWaiver),
        fullInsurance: opts.fullInsurance ?? false,
        additionalDriver: opts.additionalDriver ?? false,
      }
      const _initialPrice = await PaymentService.convertPrice(
        bookcarsHelper.calculateTotalPrice(_car, _from, _to, priceChangeRate, initialOptions),
      )
      setPrice(_initialPrice)
      if (savedExtras) {
        setExtras({ ...EMPTY_EXTRA_QUANTITIES, ...savedExtras })
      }
      setValue('cancellation', included(_car.cancellation))
      setValue('amendments', included(_car.amendments))
      setValue('theftProtection', included(_car.theftProtection))
      setValue('collisionDamageWaiver', included(_car.collisionDamageWaiver))
      setValue('fullInsurance', opts.fullInsurance ?? false)
      if (opts.additionalDriver) {
        setValue('additionalDriver', true)
      }

      if (contact?.fullName) {
        const parts = String(contact.fullName).trim().split(/\s+/)
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
        setValue('fullName', contact.fullName)
        if (contact.email) setValue('email', contact.email)
        if (contact.whatsapp) {
          setValue('phone', contact.whatsapp.startsWith('+') ? contact.whatsapp : `+216${contact.whatsapp}`)
        }
        if (contact.age) {
          const birthYear = new Date().getFullYear() - Number(contact.age)
          setValue('birthDate', new Date(birthYear, 0, 1))
        }
        if (contact.tosAccepted) setValue('tos', true)
      } else if (_user?.fullName) {
        const parts = _user.fullName.trim().split(/\s+/)
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
        setValue('fullName', _user.fullName)
        if (_user.email) setValue('email', _user.email)
        if (_user.phone) setValue('phone', _user.phone)
      }

      setLicense(_user?.license || null)
      setVisible(true)
    } catch {
      setNoMatch(true)
    }
  }

  const onSubmit = async (data: FormFields) => {
    try {
      if (!car || !pickupLocation || !dropOffLocation || !from || !to) {
        helper.error()
        return
      }

      let recaptchaToken = ''
      if (reCaptchaLoaded) {
        recaptchaToken = await generateReCaptchaToken()
        if (!(await helper.verifyReCaptcha(recaptchaToken))) {
          recaptchaToken = ''
        }
      }
      if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
        setRecaptchaError(true)
        return
      }

      const fullName = authenticated
        ? (user?.fullName || '')
        : `${firstName.trim()} ${lastName.trim()}`.trim()

      if (!authenticated) {
        setValue('fullName', fullName)
        const status = await UserService.validateEmail({ email: data.email! })
        if (status !== 200) {
          setEmailRegistered(true)
          setEmailInfo(false)
          return
        }
      }

      if (car.supplier.licenseRequired && !license) {
        setLicenseRequired(true)
        return
      }

      setPaymentFailed(false)

      let driver: bookcarsTypes.User | undefined
      if (!authenticated) {
        driver = {
          email: data.email,
          phone: data.phone,
          fullName,
          birthDate: data.birthDate,
          language: UserService.getLanguage(),
          license: license || undefined,
        }
      }

      const basePriceConverted = await PaymentService.toBaseCurrency(checkoutPrice)

      const booking: bookcarsTypes.Booking = {
        supplier: car.supplier._id as string,
        car: car._id,
        driver: authenticated ? user?._id : undefined,
        pickupLocation: pickupLocation._id,
        dropOffLocation: dropOffLocation._id,
        from,
        to,
        status: bookcarsTypes.BookingStatus.Pending,
        cancellation: data.cancellation,
        amendments: data.amendments,
        theftProtection: data.theftProtection,
        collisionDamageWaiver: data.collisionDamageWaiver,
        fullInsurance: data.fullInsurance,
        additionalDriver,
        price: basePriceConverted,
      }

      let _customerId: string | undefined
      let _sessionId: string | undefined

      if (!payLater) {
        if (env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe) {
          const name = bookcarsHelper.truncateString(`${env.WEBSITE_NAME} - ${car.name}`, StripeService.ORDER_NAME_MAX_LENGTH)
          const description = bookcarsHelper.truncateString(
            `${env.WEBSITE_NAME} - ${car.name} - ${daysLabel}`,
            StripeService.ORDER_DESCRIPTION_MAX_LENGTH,
          )
          let finalPrice = checkoutPrice
          if (payDeposit) finalPrice = depositPrice
          else if (payInFull) finalPrice = checkoutPrice + depositPrice

          const res = await StripeService.createCheckoutSession({
            amount: finalPrice,
            currency: PaymentService.getCurrency(),
            locale: language,
            receiptEmail: (!authenticated ? driver?.email : user?.email) as string,
            name,
            description,
            customerName: (!authenticated ? driver?.fullName : user?.fullName) as string,
          })
          setClientSecret(res.clientSecret)
          _sessionId = res.sessionId
          _customerId = res.customerId
        } else {
          setPayPalLoaded(true)
        }
      }

      booking.isDeposit = payDeposit
      booking.isPayedInFull = payInFull

      const { status, bookingId: _bookingId } = await BookingService.checkout({
        driver,
        booking,
        payLater: !!data.payLater,
        sessionId: _sessionId,
        customerId: _customerId,
        payPal: env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal,
      })

      if (status === 200) {
        setCheckoutSummary({
          carName: car.name,
          pickupLocationName: pickupLocation.name || '',
          dropOffLocationName: dropOffLocation.name || '',
          from,
          to,
          price: checkoutPrice,
        })
        if (payLater) {
          setVisible(false)
          setSuccess(true)
        }
        setBookingId(_bookingId)
        setSessionId(_sessionId)
      } else {
        helper.error(undefined, checkoutStrings.PAYMENT_FAILED)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  if (noMatch) return <NoMatch hideHeader />
  if (user?.blacklisted) return <Unauthorized />

  if (success && bookingId) {
    return (
      <Layout onLoad={onLoad} strict={false}>
        <CheckoutStatus
          bookingId={bookingId}
          language={language}
          payLater={!!payLater}
          guestCheckout={!authenticated}
          status="success"
          className="status"
          summary={checkoutSummary}
        />
      </Layout>
    )
  }

  if (!visible || !car || !pickupLocation || !dropOffLocation || !from || !to) {
    return (
      <Layout onLoad={onLoad} strict={false}>
        <Progress />
      </Layout>
    )
  }

  return (
    <>
      <Layout onLoad={onLoad} strict={false}>
          <div className="offer-page">
            <OfferSearchBar
              pickupLocation={pickupLocation}
              dropOffLocation={dropOffLocation}
              from={from}
              to={to}
              onModify={() => navigate('/search', { state: location.state })}
            />

            <button
              type="button"
              className="offer-back-link"
              onClick={() => navigate('/offer/extras', { state: getNavigationState() })}
            >
              ← {strings.BACK_TO_OPTIONS}
            </button>

            <OfferProgressBar activeStep={3} />

            <form className="offer-payment-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="offer-checkout-options-hidden">
                <CheckoutOptions
                  car={car}
                  from={from}
                  to={to}
                  language={language}
                  clientSecret={clientSecret}
                  payPalLoaded={payPalLoaded}
                  initialOptions={offerInitialOptions}
                  onPriceChange={(value) => setPrice(value)}
                  onAdManuallyCheckedChange={() => {}}
                  onCancellationChange={(v) => setValue('cancellation', v)}
                  onAmendmentsChange={(v) => setValue('amendments', v)}
                  onTheftProtectionChange={(v) => setValue('theftProtection', v)}
                  onCollisionDamageWaiverChange={(v) => setValue('collisionDamageWaiver', v)}
                  onFullInsuranceChange={(v) => setValue('fullInsurance', v)}
                  onAdditionalDriverChange={(v) => setValue('additionalDriver', v)}
                />
              </div>

              <div className="offer-checkout-top">
                <OfferOrderRecap
                  car={car}
                  pickupLocation={pickupLocation}
                  dropOffLocation={dropOffLocation}
                  from={from}
                  to={to}
                  language={language}
                  totalPrice={checkoutPrice}
                  protectionPrice={protectionPrice}
                  hasProtection={hasProtection}
                />

                <section className="offer-contact-card">
                  <header className="offer-section-header">
                    <h2>{strings.CONTACT_TITLE}</h2>
                  </header>
                  <div className="offer-contact-body">
                    {!authenticated ? (
                      <>
                        <div className="offer-form-row">
                          <FormControl fullWidth margin="dense" className="offer-form-field">
                            <InputLabel className="required">{strings.FIRST_NAME}</InputLabel>
                            <OutlinedInput
                              value={firstName}
                              label={strings.FIRST_NAME}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </FormControl>
                          <FormControl fullWidth margin="dense" className="offer-form-field">
                            <InputLabel className="required">{strings.LAST_NAME}</InputLabel>
                            <OutlinedInput
                              value={lastName}
                              label={strings.LAST_NAME}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </FormControl>
                        </div>

                        <FormControl fullWidth margin="dense" className="offer-form-field">
                          <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                          <OutlinedInput
                            type="email"
                            label={commonStrings.EMAIL}
                            error={!!errors.email || emailRegistered}
                            onChange={(e) => {
                              clearErrors('email')
                              setEmailRegistered(false)
                              setValue('email', e.target.value)
                            }}
                            onBlur={async (e) => {
                              trigger('email')
                              if (validator.isEmail(e.target.value)) {
                                const status = await UserService.validateEmail({ email: e.target.value })
                                setEmailRegistered(status !== 200)
                                setEmailInfo(status === 200)
                              }
                            }}
                          />
                          <FormHelperText error={!!errors.email || emailRegistered}>
                            {(errors.email?.message) || (emailRegistered && commonStrings.EMAIL_ALREADY_REGISTERED) || (emailInfo && checkoutStrings.EMAIL_INFO) || ''}
                          </FormHelperText>
                        </FormControl>

                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <PhoneInputField
                              className="offer-form-field"
                              label={commonStrings.PHONE}
                              value={field.value || ''}
                              onChange={(v) => {
                                clearErrors('phone')
                                setPhoneInfo(false)
                                field.onChange(v)
                              }}
                              onBlur={() => {
                                field.onBlur()
                                trigger('phone')
                                setPhoneInfo(validator.isMobilePhone(getValues('phone') || ''))
                              }}
                              name={field.name}
                              required
                              error={!!errors.phone}
                              helperText={(errors.phone?.message) || (phoneInfo && checkoutStrings.PHONE_INFO) || ''}
                            />
                          )}
                        />

                        <FormControl fullWidth margin="dense" className="offer-form-field">
                          <DatePicker
                            {...register('birthDate')}
                            ref={birthDateRef}
                            label={commonStrings.BIRTH_DATE}
                            variant="outlined"
                            required
                            onChange={(d) => setValue('birthDate', d ?? undefined, { shouldValidate: true })}
                            language={language}
                          />
                          <FormHelperText error={!!errors.birthDate}>{errors.birthDate?.message || ''}</FormHelperText>
                        </FormControl>

                        <FormControl fullWidth margin="dense" className="offer-form-field">
                          <InputLabel className="required">{strings.COUNTRY_RESIDENCE}</InputLabel>
                          <Select value={country} label={strings.COUNTRY_RESIDENCE} onChange={(e) => setCountry(e.target.value)}>
                            {COUNTRIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth margin="dense" className="offer-form-field">
                          <OutlinedInput
                            startAdornment={<FlightIcon className="offer-flight-icon" />}
                            placeholder={strings.FLIGHT_SEARCH_PLACEHOLDER}
                          />
                        </FormControl>

                        <p className="offer-privacy-note">
                          {strings.PRIVACY_NOTE}
                          {' '}
                          <Link href="/privacy" target="_blank">{headerStrings.PRIVACY_POLICY}</Link>
                        </p>
                        <SocialLogin reloadPage />
                      </>
                    ) : (
                      <p className="offer-form-subtitle">
                        {user?.fullName}
                        {user?.email ? ` · ${user.email}` : ''}
                      </p>
                    )}

                    <FormControl margin="dense" className="offer-tos-row">
                      <FormControlLabel
                        control={<Checkbox {...register('tos')} color="primary" />}
                        label={<Link href="/tos" target="_blank">{commonStrings.TOS}</Link>}
                      />
                      <FormHelperText error={!!errors.tos}>{errors.tos?.message || ''}</FormHelperText>
                    </FormControl>
                  </div>
                </section>
              </div>

              <section className="offer-form-card offer-payment-choice-card">
                <header className="offer-section-header offer-section-header-inline">
                  <h2>{strings.PAYMENT_CHOICE_TITLE}</h2>
                </header>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => applyPaymentMethod(e.target.value)}
                  className="offer-payment-methods"
                >
                  {car.supplier.payLater && (
                    <FormControlLabel value="payLater" control={<Radio />} disabled={!!clientSecret || payPalLoaded} label={checkoutStrings.PAY_LATER} />
                  )}
                  {car.deposit > 0 && (
                    <FormControlLabel value="payDeposit" control={<Radio />} disabled={!!clientSecret || payPalLoaded} label={checkoutStrings.PAY_DEPOSIT} />
                  )}
                  {depositPrice > 0 && (
                    <FormControlLabel value="payOnline" control={<Radio />} disabled={!!clientSecret || payPalLoaded} label={checkoutStrings.PAY_ONLINE} />
                  )}
                  {depositPrice <= 0 && (
                    <FormControlLabel value="payInFull" control={<Radio />} disabled={!!clientSecret || payPalLoaded} label={checkoutStrings.PAY_IN_FULL} />
                  )}
                </RadioGroup>

                <div className="offer-payment-breakdown">
                  <div className="offer-price-row">
                    <span>{strings.TOTAL_RENTAL}</span>
                    <span>{bookcarsHelper.formatPrice(basePrice, commonStrings.CURRENCY, language)}</span>
                  </div>
                  {hasProtection && protectionPrice > 0 && (
                    <div className="offer-price-row">
                      <span>{strings.PAYMENT_PROTECTION}</span>
                      <span>{bookcarsHelper.formatPrice(protectionPrice, commonStrings.CURRENCY, language)}</span>
                    </div>
                  )}
                  <div className="offer-price-row offer-price-total-ttc">
                    <span>{strings.TOTAL_TTC}</span>
                    <strong>{bookcarsHelper.formatPrice(checkoutPrice, commonStrings.CURRENCY, language)}</strong>
                  </div>
                  {!payLater && (
                    <>
                      <div className="offer-price-row offer-pay-now">
                        <span>{strings.PAY_NOW_AMOUNT}</span>
                        <strong>
                          {bookcarsHelper.formatPrice(
                            payDeposit ? depositPrice : (payInFull ? checkoutPrice + depositPrice : checkoutPrice),
                            commonStrings.CURRENCY,
                            language,
                          )}
                        </strong>
                      </div>
                      {(payDeposit) && (
                        <div className="offer-price-row">
                          <span>{strings.PAY_REMAINING}</span>
                          <span>
                            {bookcarsHelper.formatPrice(
                              Math.max(0, checkoutPrice - depositPrice),
                              commonStrings.CURRENCY,
                              language,
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {clientSecret && stripePromise && (
                  <div className="offer-stripe-embed">
                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                )}

                {payPalLoaded && (
                  <PayPalButtons
                    createOrder={async () => {
                      let amount = checkoutPrice
                      if (payDeposit) amount = depositPrice
                      else if (payInFull) amount = checkoutPrice + depositPrice
                      return PayPalService.createOrder(
                        bookingId!,
                        amount,
                        PaymentService.getCurrency(),
                        bookcarsHelper.truncateString(car.name, PayPalService.ORDER_NAME_MAX_LENGTH),
                        bookcarsHelper.truncateString(`${car.name} - ${daysLabel}`, PayPalService.ORDER_DESCRIPTION_MAX_LENGTH),
                      )
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        setPayPalProcessing(true)
                        await actions.order?.capture()
                        const status = await PayPalService.checkOrder(bookingId!, data.orderID)
                        if (status === 200) { setVisible(false); setSuccess(true) }
                        else setPaymentFailed(true)
                      } catch (err) {
                        helper.error(err)
                      } finally {
                        setPayPalProcessing(false)
                      }
                    }}
                    onInit={() => setPayPalInit(true)}
                  />
                )}
              </section>

              {car.supplier.licenseRequired && (
                <section className="offer-form-card">
                  <h3>{commonStrings.DRIVER_LICENSE}</h3>
                  <DriverLicense
                    user={user}
                    variant="outlined"
                    onUpload={(filename) => {
                      setLicenseRequired(!filename)
                      setLicense(filename)
                    }}
                    onDelete={() => { setLicense(null); setLicenseRequired(true) }}
                    hideDelete={!!clientSecret || payPalLoaded}
                  />
                </section>
              )}

              {hasFreeCancellation && (
                <div className="offer-banner-success offer-payment-footer-banner">
                  <CheckIcon />
                  <span>{strings.FREE_CANCEL}</span>
                </div>
              )}

              <div className="offer-payment-submit-row">
                {((env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe && !clientSecret)
                  || (env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal && !payPalInit)
                  || payLater) && (
                  <Button
                    type="submit"
                    variant="contained"
                    className="offer-payment-submit-btn"
                    disabled={isSubmitting || (payPalLoaded && !payPalInit) || (!authenticated && (!firstName.trim() || !lastName.trim()))}
                  >
                    {(isSubmitting || (payPalLoaded && !payPalInit))
                      ? <CircularProgress color="inherit" size={24} />
                      : (payLater
                        ? checkoutStrings.BOOK
                        : strings.PAY_CTA.replace(
                          '{amount}',
                          bookcarsHelper.formatPrice(
                            payDeposit ? depositPrice : (payInFull ? checkoutPrice + depositPrice : checkoutPrice),
                            commonStrings.CURRENCY,
                            language,
                          ),
                        ))}
                  </Button>
                )}
              </div>

              <div className="form-error">
                {paymentFailed && <Error message={checkoutStrings.PAYMENT_FAILED} />}
                {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                {licenseRequired && <Error message={checkoutStrings.LICENSE_REQUIRED} />}
              </div>

              <OfferRentalSteps
                depositLabel={car.deposit > 0
                  ? bookcarsHelper.formatPrice(car.deposit, commonStrings.CURRENCY, language)
                  : undefined}
              />
            </form>
          </div>
      </Layout>
      {payPalProcessing && <Backdrop text={checkoutStrings.CHECKING} />}
    </>
  )
}

export default OfferPayment
