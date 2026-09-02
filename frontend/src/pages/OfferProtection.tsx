import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { InfoOutlined as InfoIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import Progress from '@/components/Progress'
import OfferSearchBar from '@/components/offer/OfferSearchBar'
import OfferProgressBar from '@/components/offer/OfferProgressBar'
import OfferProtectionTable from '@/components/offer/OfferProtectionTable'
import OfferProtectionSidebar from '@/components/offer/OfferProtectionSidebar'
import {
  EMPTY_EXTRA_QUANTITIES,
  OfferExtraQuantities,
  getExtrasPayAtPickupTotal,
} from '@/utils/offerExtrasHelper'
import {
  buildProtectionRows,
  getFranchiseAmount,
  getFullProtectionTotal,
  getProtectionCoverageAmount,
} from '@/utils/offerProtectionHelper'

import '@/assets/css/offer.css'

const OfferProtection = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [basePrice, setBasePrice] = useState(0)
  const [depositPrice, setDepositPrice] = useState(0)
  const [protectionPrice, setProtectionPrice] = useState(0)
  const [coverageAmount, setCoverageAmount] = useState(0)
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [extras, setExtras] = useState<OfferExtraQuantities>({ ...EMPTY_EXTRA_QUANTITIES })

  const days = from && to ? bookcarsHelper.days(from, to) : 0
  const extrasPickupTotal = car ? getExtrasPayAtPickupTotal(car, extras, days) : 0
  const protectionRows = useMemo(() => buildProtectionRows(''), [])

  const franchiseFormatted = useMemo(() => {
    if (!car) return ''
    return bookcarsHelper.formatPrice(
      getFranchiseAmount(car, depositPrice),
      commonStrings.CURRENCY,
      language,
    )
  }, [car, depositPrice, language])

  const protectionPriceFormatted = useMemo(
    () => bookcarsHelper.formatPrice(protectionPrice, commonStrings.CURRENCY, language),
    [protectionPrice, language],
  )

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
      const _protectionTotal = await PaymentService.convertPrice(
        getFullProtectionTotal(_car, bookcarsHelper.days(_from, _to), priceChangeRate),
      )
      const _coverage = getProtectionCoverageAmount(_car, _deposit)

      setCar(_car)
      setPickupLocation(_pickupLocation)
      setDropOffLocation(_dropOffLocation)
      setFrom(_from)
      setTo(_to)
      setBasePrice(_basePrice)
      setDepositPrice(_deposit)
      setProtectionPrice(_protectionTotal)
      setCoverageAmount(_coverage)
      if (savedExtras) {
        setExtras({ ...EMPTY_EXTRA_QUANTITIES, ...savedExtras })
      }
      setVisible(true)
    } catch {
      setNoMatch(true)
    }
  }

  const getNavigationState = (fullInsurance: boolean) => ({
    carId: car!._id,
    pickupLocationId: pickupLocation!._id,
    dropOffLocationId: dropOffLocation!._id,
    from,
    to,
    extras,
    offerOptions: {
      fullInsurance,
      additionalDriver: extras.additionalDriver > 0,
    },
  })

  const handleBook = (withProtection: boolean) => {
    if (!car || !pickupLocation || !dropOffLocation || !from || !to) return
    navigate('/offer/payment', { state: getNavigationState(withProtection) })
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
          onClick={() => navigate('/offer/extras', { state: getNavigationState(false) })}
        >
          ← {strings.BACK_TO_OPTIONS}
        </button>

        <div className="offer-header">
          <h1>{strings.PROTECTION_TITLE}</h1>
          <p className="offer-subtitle">{strings.NEXT_STEP_PROTECTION}</p>
        </div>

        <OfferProgressBar activeStep={3} />

        <div className="offer-layout">
          <div className="offer-main">
            <div className="offer-protection-intro">
              <h2>
                <span className="offer-protection-headline-green">{strings.PROTECTION_HEADLINE.split(' ')[0]}</span>
                {' '}
                {strings.PROTECTION_HEADLINE.split(' ').slice(1).join(' ')}
              </h2>
              <p>
                {strings.PROTECTION_INTRO}
                {' '}
                <button type="button" className="offer-link-btn">{strings.PROTECTION_TERMS_LINK}</button>
              </p>
            </div>

            <OfferProtectionTable
              rows={protectionRows}
              franchiseFormatted={franchiseFormatted}
              protectionPriceFormatted={protectionPriceFormatted}
              language={language}
            />

            <div className="offer-protection-warning">
              <InfoIcon />
              <span>{strings.PROTECTION_DISCLAIMER}</span>
            </div>

            <div className="offer-protection-actions">
              <Button
                variant="outlined"
                className="offer-protection-btn outline"
                onClick={() => handleBook(false)}
              >
                {strings.PROTECTION_BOOK_WITHOUT}
              </Button>
              <Button
                variant="contained"
                className="offer-protection-btn primary"
                onClick={() => handleBook(true)}
              >
                {strings.PROTECTION_BOOK_WITH}
              </Button>
            </div>
          </div>

          <OfferProtectionSidebar
            pickupLocation={pickupLocation}
            dropOffLocation={dropOffLocation}
            from={from}
            to={to}
            basePrice={basePrice}
            extrasPickupTotal={extrasPickupTotal}
            protectionPrice={protectionPrice}
            coverageAmount={coverageAmount}
          />
        </div>
      </div>
    </Layout>
  )
}

export default OfferProtection
