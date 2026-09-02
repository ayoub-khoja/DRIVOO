import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import * as UserService from '@/services/UserService'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import Progress from '@/components/Progress'
import OfferSearchBar from '@/components/offer/OfferSearchBar'
import OfferPriceSidebar from '@/components/offer/OfferPriceSidebar'
import OfferProgressBar from '@/components/offer/OfferProgressBar'
import OfferExtraCard, { formatExtraPriceLabel } from '@/components/offer/OfferExtraCard'
import {
  EMPTY_EXTRA_QUANTITIES,
  OFFER_EXTRAS,
  OfferExtraId,
  OfferExtraQuantities,
  getExtrasPayAtPickupTotal,
} from '@/utils/offerExtrasHelper'

import '@/assets/css/offer.css'

const EXTRA_LABELS: Record<OfferExtraId, { title: string; desc: string }> = {
  additionalDriver: { title: strings.EXTRA_ADDITIONAL_DRIVER, desc: strings.EXTRA_ADDITIONAL_DRIVER_DESC },
  childSeat: { title: strings.EXTRA_CHILD_SEAT, desc: strings.EXTRA_CHILD_SEAT_DESC },
  gps: { title: strings.EXTRA_GPS, desc: strings.EXTRA_GPS_DESC },
  booster: { title: strings.EXTRA_BOOSTER, desc: strings.EXTRA_BOOSTER_DESC },
  babySeat: { title: strings.EXTRA_BABY_SEAT, desc: strings.EXTRA_BABY_SEAT_DESC },
}

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

  const days = from && to ? bookcarsHelper.days(from, to) : 0

  const availableExtras = useMemo(
    () => (car ? OFFER_EXTRAS.filter((e) => e.isAvailable(car)) : []),
    [car],
  )

  const extrasPickupTotal = car ? getExtrasPayAtPickupTotal(car, quantities, days) : 0

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
      setVisible(true)
    } catch {
      setNoMatch(true)
    }
  }

  const updateQuantity = (id: OfferExtraId, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }))
  }

  const getNavigationState = () => ({
    carId: car!._id,
    pickupLocationId: pickupLocation!._id,
    dropOffLocationId: dropOffLocation!._id,
    from,
    to,
    extras: quantities,
  })

  const handleContinue = () => {
    if (!car || !pickupLocation || !dropOffLocation || !from || !to) return
    navigate('/offer/protection', { state: getNavigationState() })
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

  const supplierName = car.supplier?.fullName || env.WEBSITE_NAME

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

        <div className="offer-header">
          <h1>{strings.EXTRAS_TITLE}</h1>
          <p className="offer-subtitle">{strings.NEXT_STEP_PROTECTION}</p>
        </div>

        <OfferProgressBar activeStep={2} />

        <div className="offer-layout">
          <div className="offer-main">
            <div className="offer-extras-grid">
              {availableExtras.map((extra) => {
                const labels = EXTRA_LABELS[extra.id]
                const unitPrice = convertedPrices[extra.id] ?? extra.defaultUnitPrice
                return (
                  <OfferExtraCard
                    key={extra.id}
                    title={labels.title}
                    priceLabel={formatExtraPriceLabel(unitPrice, extra.perDay, language)}
                    description={labels.desc}
                    quantity={quantities[extra.id]}
                    maxQuantity={extra.maxQuantity}
                    onChange={(qty) => updateQuantity(extra.id, qty)}
                  />
                )
              })}
            </div>

            <p className="offer-extras-disclaimer">
              {strings.EXTRAS_DISCLAIMER}
              {' '}
              <strong>{supplierName}</strong>
              {' '}
              {strings.EXTRAS_DISCLAIMER_END}
            </p>

            <div className="offer-continue-row">
              <Button variant="contained" className="offer-continue-btn" onClick={handleContinue}>
                {strings.CONTINUE_BOOKING}
              </Button>
            </div>
          </div>

          <OfferPriceSidebar
            pickupLocation={pickupLocation}
            dropOffLocation={dropOffLocation}
            from={from}
            to={to}
            price={basePrice}
            extrasPickupTotal={extrasPickupTotal}
          />
        </div>
      </div>
    </Layout>
  )
}

export default OfferExtras
