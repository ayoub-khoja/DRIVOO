import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Autocomplete,
  Button,
  Checkbox,
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
  TextField,
} from '@mui/material'
import { CreditCard as CardIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import * as GeoService from '@/services/GeoService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import Progress from '@/components/Progress'
import OfferSearchBar from '@/components/offer/OfferSearchBar'
import OfferProgressBar from '@/components/offer/OfferProgressBar'
import OfferOrderRecap from '@/components/offer/OfferOrderRecap'
import OfferRentalSteps from '@/components/offer/OfferRentalSteps'
import PhoneInputField from '@/components/PhoneInputField'
import {
  EMPTY_EXTRA_QUANTITIES,
  OfferExtraQuantities,
  getExtraLineTotal,
  OFFER_EXTRAS,
} from '@/utils/offerExtrasHelper'

import '@/assets/css/offer.css'

const FISCAL_STAMP = 1
const AGE_OPTIONS = Array.from({ length: 55 }, (_, i) => i + 21)
const LICENSE_OPTIONS = Array.from({ length: 21 }, (_, i) => i + 1)
const CIVILITY_OPTIONS = ['Mr', 'Mme', 'Mlle'] as const

const OfferExtras = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [basePrice, setBasePrice] = useState(0)
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [quantities, setQuantities] = useState<OfferExtraQuantities>({ ...EMPTY_EXTRA_QUANTITIES })
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({})

  const [civility, setCivility] = useState('Mr')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [licenseYears, setLicenseYears] = useState<number | ''>('')
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [flightInfo, setFlightInfo] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [tosAccepted, setTosAccepted] = useState(false)
  const [tosError, setTosError] = useState(false)
  const [formError, setFormError] = useState('')

  const [cities, setCities] = useState<bookcarsTypes.GeoCity[]>([])
  const [municipalities, setMunicipalities] = useState<bookcarsTypes.GeoMunicipality[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const days = from && to ? bookcarsHelper.days(from, to) : 0
  const additionalDriverExtra = OFFER_EXTRAS.find((e) => e.id === 'additionalDriver')!
  const babySeatExtra = OFFER_EXTRAS.find((e) => e.id === 'babySeat')!

  const optionsTotal = useMemo(() => {
    if (!car) return 0
    return (['additionalDriver', 'babySeat'] as const).reduce((sum, id) => {
      const extra = OFFER_EXTRAS.find((e) => e.id === id)!
      return sum + getExtraLineTotal(extra, car, quantities[id], days)
    }, 0)
  }, [car, quantities, days])

  const totalTTC = basePrice + optionsTotal + FISCAL_STAMP
  const payNow = Math.max(FISCAL_STAMP, Number((totalTTC * 0.05).toFixed(2)))
  const remaining = Number((totalTTC - payNow).toFixed(2))

  useEffect(() => {
    let cancelled = false
    GeoService.getTunisiaCatalog()
      .then((catalog) => {
        if (cancelled) return
        setCities(catalog.cities || [])
        setMunicipalities(catalog.municipalities || [])
      })
      .catch(() => { /* geo optional */ })
    return () => { cancelled = true }
  }, [])

  const onLoad = async () => {
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

      const prices: Record<string, number> = {}
      for (const extra of OFFER_EXTRAS) {
        if (extra.isAvailable(_car)) {
          let unit = extra.getUnitPrice(_car)
          unit += unit * (priceChangeRate / 100)
          prices[extra.id] = await PaymentService.convertPrice(unit)
        }
      }

      setCar(_car)
      setPickupLocation(_pickupLocation)
      setDropOffLocation(_dropOffLocation)
      setFrom(_from)
      setTo(_to)
      setBasePrice(_basePrice)
      setConvertedPrices(prices)
      if (savedExtras) {
        setQuantities({ ...EMPTY_EXTRA_QUANTITIES, ...savedExtras })
      }
      if (contact) {
        setCivility(contact.civility || 'Mr')
        setFullName(contact.fullName || '')
        setEmail(contact.email || '')
        setAge(contact.age ?? '')
        setLicenseYears(contact.licenseYears ?? '')
        setGovernorate(contact.governorate || '')
        setCity(contact.city || '')
        setFlightInfo(contact.flightInfo || '')
        setWhatsapp(contact.whatsapp || '')
        setTosAccepted(!!contact.tosAccepted)
        if (contact.governorate) {
          const match = (await GeoService.getTunisiaCatalog()).cities.find(
            (item) => GeoService.getGeoLabel(item.names, UserService.getLanguage()) === contact.governorate,
          )
          if (match) setSelectedCityId(match.id)
        }
      }
      setVisible(true)
    } catch {
      setNoMatch(true)
    }
  }

  const toggleExtra = (id: 'additionalDriver' | 'babySeat') => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] > 0 ? 0 : 1,
    }))
  }

  const getNavigationState = () => ({
    carId: car!._id,
    pickupLocationId: pickupLocation!._id,
    dropOffLocationId: dropOffLocation!._id,
    from,
    to,
    extras: quantities,
    offerOptions: {
      additionalDriver: quantities.additionalDriver > 0,
      fullInsurance: false,
    },
    contact: {
      civility,
      fullName: fullName.trim(),
      email: email.trim(),
      age,
      licenseYears,
      governorate,
      city,
      flightInfo: flightInfo.trim(),
      whatsapp: whatsapp.trim(),
      tosAccepted,
    },
    pricing: {
      basePrice,
      optionsTotal,
      fiscalStamp: FISCAL_STAMP,
      totalTTC,
      payNow,
      remaining,
    },
  })

  const validate = () => {
    if (!fullName.trim() || !email.trim() || !whatsapp.trim() || !age || !licenseYears) {
      setFormError(strings.CONTACT_REQUIRED)
      return false
    }
    if (!tosAccepted) {
      setTosError(true)
      setFormError('')
      return false
    }
    setTosError(false)
    setFormError('')
    return true
  }

  const handleContinue = () => {
    if (!car || !pickupLocation || !dropOffLocation || !from || !to) return
    if (!validate()) return
    navigate('/offer/payment', { state: getNavigationState() })
  }

  if (noMatch) {
    return <NoMatch hideHeader />
  }

  if (!visible || !car || !pickupLocation || !dropOffLocation || !from || !to) {
    return (
      <Layout onLoad={onLoad} strict={false}>
        <Progress />
      </Layout>
    )
  }

  const additionalDriverPrice = convertedPrices.additionalDriver
    ?? additionalDriverExtra.getUnitPrice(car)
  const babySeatPrice = convertedPrices.babySeat
    ?? babySeatExtra.getUnitPrice(car)
  const babySeatPerDay = babySeatExtra.perDay
    ? babySeatPrice
    : Number((babySeatPrice / Math.max(days, 1)).toFixed(2))

  const formatMoney = (value: number) =>
    bookcarsHelper.formatPrice(value, commonStrings.CURRENCY, language)

  const cityOptions = selectedCityId
    ? municipalities.filter((item) => item.cityId === selectedCityId)
    : municipalities

  return (
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
          onClick={() => navigate('/offer', { state: getNavigationState() })}
        >
          {strings.BACK_TO_OFFER}
        </button>

        <OfferProgressBar activeStep={2} />

        <div className="offer-checkout-top">
          <OfferOrderRecap
            car={car}
            pickupLocation={pickupLocation}
            dropOffLocation={dropOffLocation}
            from={from}
            to={to}
            language={language}
            totalPrice={basePrice}
          />

          <section className="offer-contact-card">
            <header className="offer-section-header">
              <h2>{strings.CONTACT_TITLE}</h2>
            </header>
            <div className="offer-contact-body offer-contact-form">
              <div className="offer-form-row">
                <FormControl fullWidth margin="dense" className="offer-form-field offer-form-field-sm">
                  <InputLabel>{strings.CONTACT_CIVILITY}</InputLabel>
                  <Select
                    value={civility}
                    label={strings.CONTACT_CIVILITY}
                    onChange={(e) => setCivility(e.target.value)}
                  >
                    {CIVILITY_OPTIONS.map((item) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense" className="offer-form-field">
                  <InputLabel className="required">{strings.CONTACT_FULL_NAME}</InputLabel>
                  <OutlinedInput
                    value={fullName}
                    label={strings.CONTACT_FULL_NAME}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </FormControl>
              </div>

              <FormControl fullWidth margin="dense" className="offer-form-field">
                <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                <OutlinedInput
                  type="email"
                  value={email}
                  label={commonStrings.EMAIL}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <div className="offer-form-row">
                <FormControl fullWidth margin="dense" className="offer-form-field">
                  <InputLabel shrink>{strings.CONTACT_AGE}</InputLabel>
                  <Select
                    value={age === '' ? '' : age}
                    label={strings.CONTACT_AGE}
                    displayEmpty
                    notched
                    onChange={(e) => {
                      const next = e.target.value as number | string
                      setAge(next === '' ? '' : Number(next))
                    }}
                  >
                    <MenuItem value="">{strings.CONTACT_AGE_PLACEHOLDER}</MenuItem>
                    {AGE_OPTIONS.map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense" className="offer-form-field">
                  <InputLabel shrink>{strings.CONTACT_LICENSE_YEARS}</InputLabel>
                  <Select
                    value={licenseYears === '' ? '' : licenseYears}
                    label={strings.CONTACT_LICENSE_YEARS}
                    displayEmpty
                    notched
                    onChange={(e) => {
                      const next = e.target.value as number | string
                      setLicenseYears(next === '' ? '' : Number(next))
                    }}
                  >
                    <MenuItem value="">{strings.CONTACT_LICENSE_PLACEHOLDER}</MenuItem>
                    {LICENSE_OPTIONS.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value} {strings.CONTACT_YEARS_UNIT}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="offer-form-row">
                <FormControl fullWidth margin="dense" className="offer-form-field">
                  <Autocomplete
                    options={cities}
                    value={cities.find((item) => GeoService.getGeoLabel(item.names, language) === governorate) || null}
                    getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_event, nextCity) => {
                      setSelectedCityId(nextCity?.id ?? null)
                      setGovernorate(nextCity ? GeoService.getGeoLabel(nextCity.names, language) : '')
                      setCity('')
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label={strings.CONTACT_GOVERNORATE} />
                    )}
                  />
                </FormControl>
                <FormControl fullWidth margin="dense" className="offer-form-field">
                  <Autocomplete
                    options={cityOptions}
                    disabled={!selectedCityId && !governorate}
                    value={cityOptions.find((item) => GeoService.getGeoLabel(item.names, language) === city) || null}
                    getOptionLabel={(option) => GeoService.getGeoLabel(option.names, language)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_event, nextMunicipality) => {
                      setCity(nextMunicipality ? GeoService.getGeoLabel(nextMunicipality.names, language) : '')
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label={strings.CONTACT_CITY} />
                    )}
                  />
                </FormControl>
              </div>

              <FormControl fullWidth margin="dense" className="offer-form-field">
                <InputLabel>{strings.CONTACT_FLIGHT}</InputLabel>
                <OutlinedInput
                  value={flightInfo}
                  label={strings.CONTACT_FLIGHT}
                  onChange={(e) => setFlightInfo(e.target.value)}
                />
              </FormControl>

              <PhoneInputField
                className="offer-form-field"
                label={strings.CONTACT_WHATSAPP}
                value={whatsapp}
                onChange={setWhatsapp}
                required
              />

              <FormControl margin="dense" className="offer-tos-row" error={tosError}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={tosAccepted}
                      onChange={(e) => {
                        setTosAccepted(e.target.checked)
                        if (e.target.checked) setTosError(false)
                      }}
                      color="primary"
                    />
                  )}
                  label={(
                    <span>
                      {strings.CONTACT_TOS}
                      {' '}
                      <Link href="/tos" target="_blank">{strings.CONTACT_TOS_VIEW}</Link>
                    </span>
                  )}
                />
                {tosError && <FormHelperText error>{strings.CONTACT_REQUIRED}</FormHelperText>}
              </FormControl>
              {formError && <FormHelperText error>{formError}</FormHelperText>}
            </div>
          </section>
        </div>

        <section className="offer-form-card offer-services-card">
          <header className="offer-section-header offer-section-header-inline">
            <h2>
              <span className="offer-section-badge">3</span>
              {strings.SERVICES_TITLE.replace(/^\d+\.\s*/, '')}
            </h2>
          </header>

          <div className="offer-services-list">
            {additionalDriverExtra.isAvailable(car) && (
              <label className="offer-service-row">
                <Checkbox
                  checked={quantities.additionalDriver > 0}
                  onChange={() => toggleExtra('additionalDriver')}
                  color="primary"
                />
                <span className="offer-service-name">{strings.EXTRA_ADDITIONAL_DRIVER}</span>
                <span className="offer-service-price">
                  {strings.SERVICES_FROM.replace('{price}', formatMoney(additionalDriverPrice))}
                </span>
              </label>
            )}
            <label className="offer-service-row">
              <Checkbox
                checked={quantities.babySeat > 0}
                onChange={() => toggleExtra('babySeat')}
                color="primary"
              />
              <span className="offer-service-name">{strings.EXTRA_BABY_SEAT}</span>
              <span className="offer-service-price">
                {strings.SERVICES_FROM.replace('{price}', formatMoney(babySeatPerDay))}
              </span>
            </label>
          </div>

          <div className="offer-services-totals">
            <div className="offer-price-row">
              <span>{strings.TOTAL_RENTAL}</span>
              <span>{formatMoney(basePrice)}</span>
            </div>
            <div className="offer-price-row">
              <span>{strings.TOTAL_OPTIONS}</span>
              <span>{formatMoney(optionsTotal)}</span>
            </div>
            <div className="offer-price-row">
              <span>{strings.FISCAL_STAMP}</span>
              <span>{formatMoney(FISCAL_STAMP)}</span>
            </div>
            <div className="offer-price-row offer-price-total-ttc">
              <span>{strings.TOTAL_TTC}</span>
              <strong>{formatMoney(totalTTC)}</strong>
            </div>
          </div>
        </section>

        <section className="offer-form-card offer-payment-choice-card">
          <header className="offer-section-header offer-section-header-inline">
            <h2>
              <span className="offer-section-badge">4</span>
              {strings.PAYMENT_CHOICE_TITLE.replace(/^\d+\.\s*/, '')}
            </h2>
          </header>

          <RadioGroup value="payOnline" className="offer-payment-methods">
            <FormControlLabel
              value="payOnline"
              control={<Radio checked />}
              label={(
                <span className="offer-payment-online-label">
                  {strings.PAYMENT_ONLINE}
                  <CardIcon fontSize="small" />
                </span>
              )}
            />
          </RadioGroup>

          <div className="offer-payment-breakdown">
            <div className="offer-price-row offer-pay-now">
              <span>{strings.PAY_NOW_AMOUNT}</span>
              <strong>{formatMoney(payNow)}</strong>
            </div>
            <div className="offer-price-row">
              <span>{strings.PAY_REMAINING}</span>
              <span>{formatMoney(remaining)}</span>
            </div>
          </div>
        </section>

        <div className="offer-payment-submit-row">
          <Button
            type="button"
            variant="contained"
            className="offer-payment-submit-btn"
            onClick={handleContinue}
          >
            {strings.PAY_CTA.replace('{amount}', formatMoney(payNow))}
          </Button>
        </div>

        <OfferRentalSteps
          depositLabel={car.deposit > 0 ? formatMoney(car.deposit) : undefined}
        />
      </div>
    </Layout>
  )
}

export default OfferExtras
