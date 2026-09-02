import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  Check as CheckIcon,
  InfoOutlined as InfoIcon,
  Person as SeatsIcon,
  AccountTree as GearboxIcon,
  Luggage as BagsIcon,
  Speed as MileageIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarPlaceholderIcon,
  AccountCircle as SupplierPlaceholderIcon,
  AccessTime as TimeIcon,
  Badge as BadgeIcon,
  CreditCard as CardIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import {
  formatBookingRating,
  getRatingLabel,
  getSimilarCategoryLabel,
} from '@/utils/searchFacetsHelper'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import OfferSearchBar from '@/components/offer/OfferSearchBar'
import OfferPriceSidebar from '@/components/offer/OfferPriceSidebar'
import OfferProgressBar from '@/components/offer/OfferProgressBar'
import Progress from '@/components/Progress'

import '@/assets/css/offer.css'

type PickupTab = 'arrive' | 'documents' | 'deposit'

const Offer = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [price, setPrice] = useState(0)
  const [depositPrice, setDepositPrice] = useState(0)
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [pickupTab, setPickupTab] = useState<PickupTab>('arrive')
  const [showExtrasBanner, setShowExtrasBanner] = useState(true)

  const getDeliveryLabel = (deliveryType?: string) => {
    if (deliveryType === bookcarsTypes.DeliveryType.Airport) return strings.IN_TERMINAL
    if (deliveryType === bookcarsTypes.DeliveryType.Delivery) return strings.SHUTTLE
    return strings.MEET_GREET
  }

  const onLoad = async () => {
    setLanguage(UserService.getLanguage())
    const { state } = location
    if (!state) {
      setNoMatch(true)
      return
    }

    const { carId, pickupLocationId, dropOffLocationId, from: _from, to: _to } = state
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
      const _price = await PaymentService.convertPrice(
        bookcarsHelper.calculateTotalPrice(_car, _from, _to, priceChangeRate),
      )
      const _deposit = _car.deposit > 0
        ? await PaymentService.convertPrice(_car.deposit + _car.deposit * (priceChangeRate / 100))
        : 0

      setCar(_car)
      setPickupLocation(_pickupLocation)
      setDropOffLocation(_dropOffLocation)
      setFrom(_from)
      setTo(_to)
      setPrice(_price)
      setDepositPrice(_deposit)
      setVisible(true)
    } catch {
      setNoMatch(true)
    }
  }

  const handleContinue = () => {
    if (!car || !pickupLocation || !dropOffLocation || !from || !to) return
    navigate('/offer/extras', {
      state: {
        carId: car._id,
        pickupLocationId: pickupLocation._id,
        dropOffLocationId: dropOffLocation._id,
        from,
        to,
      },
    })
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

  const locale = language === 'fr' ? fr : language === 'ar' ? arTN : enUS
  const pickupTime = format(from, 'HH:mm', { locale })
  const carImageUrl = car.image ? bookcarsHelper.joinURL(env.CDN_CARS, car.image) : ''
  const supplierAvatarUrl = car.supplier?.avatar ? bookcarsHelper.joinURL(env.CDN_USERS, car.supplier.avatar) : ''
  const bookingScore = formatBookingRating(car.rating)
  const ratingLabel = getRatingLabel(car.rating, language)
  const similarLabel = getSimilarCategoryLabel(car.range, language)
  const bagCount = Math.max(1, Math.floor(car.seats / 2))
  const hasFreeCancellation = car.cancellation === 0

  const highlights = [
    `${strings.HIGHLIGHT_RATING} ${bookingScore || '—'}/10`,
    strings.HIGHLIGHT_FUEL,
    strings.HIGHLIGHT_COUNTER,
    strings.HIGHLIGHT_TERMINAL,
    strings.HIGHLIGHT_QUEUE,
    ...(hasFreeCancellation ? [strings.HIGHLIGHT_CANCEL] : []),
  ]

  const includedItems = [
    ...(hasFreeCancellation ? [strings.INC_CANCEL] : []),
    ...(car.theftProtection >= 0 ? [`${strings.INC_THEFT} ${bookcarsHelper.formatPrice(depositPrice || car.deposit, commonStrings.CURRENCY, language)}`] : []),
    ...(car.collisionDamageWaiver >= 0 ? [`${strings.INC_COLLISION} ${bookcarsHelper.formatPrice(depositPrice || car.deposit, commonStrings.CURRENCY, language)}`] : []),
    ...(car.mileage === -1 ? [strings.INC_MILEAGE] : []),
  ]

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

        <button type="button" className="offer-back-link" onClick={() => navigate(-1)}>
          {strings.BACK_TO_SEARCH}
        </button>

        <div className="offer-header">
          <div>
            <h1>{strings.YOUR_OFFER}</h1>
            <p className="offer-subtitle">{strings.NEXT_STEP_OPTIONS}</p>
          </div>
        </div>

        <OfferProgressBar activeStep={1} />

        <div className="offer-layout">
          <div className="offer-main">
            {hasFreeCancellation && (
              <div className="offer-banner-success">
                <CheckIcon />
                <span>{strings.FREE_CANCEL}</span>
              </div>
            )}

            <div className="offer-car-card">
              <div className="offer-car-card-top">
                {carImageUrl ? (
                  <img src={carImageUrl} alt={car.name} className="offer-car-image" />
                ) : (
                  <div className="offer-car-image offer-car-image-placeholder">
                    <CarPlaceholderIcon />
                  </div>
                )}
                <div className="offer-car-info">
                  <h2>
                    {car.name}
                    <span>{similarLabel}</span>
                  </h2>
                  <ul className="offer-car-specs">
                    <li><SeatsIcon /><span>{car.seats} {strings.SEATS}</span></li>
                    <li><BagsIcon /><span>{bagCount} {bagCount > 1 ? strings.BAGS : strings.BAG}</span></li>
                    <li><GearboxIcon /><span>{helper.getGearboxTypeShort(car.gearbox)}</span></li>
                    <li><MileageIcon /><span>{car.mileage === -1 ? strings.UNLIMITED_MILEAGE : strings.LIMITED_MILEAGE}</span></li>
                  </ul>
                  <p className="offer-car-location">
                    <LocationIcon />
                    <span>
                      {pickupLocation.name}
                      , {getDeliveryLabel(car.deliveryType)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="offer-car-card-footer">
                <div className="offer-supplier">
                  {supplierAvatarUrl ? (
                    <img src={supplierAvatarUrl} alt={car.supplier?.fullName} />
                  ) : (
                    <SupplierPlaceholderIcon />
                  )}
                  <span>{car.supplier?.fullName}</span>
                </div>
                {bookingScore && (
                  <div className="offer-rating">
                    <span className="offer-rating-score">{bookingScore}</span>
                    <div>
                      <strong>{ratingLabel}</strong>
                      {car.trips >= 10 && (
                        <span>{car.trips}+ {strings.REVIEWS}</span>
                      )}
                    </div>
                  </div>
                )}
                <button type="button" className="offer-link">
                  <InfoIcon fontSize="small" />
                  {strings.IMPORTANT_INFO}
                </button>
              </div>
            </div>

            <section className="offer-section offer-excellent">
              <h3>{strings.EXCELLENT_CHOICE}</h3>
              <div className="offer-highlights">
                {highlights.map((item) => (
                  <div key={item} className="offer-highlight-item">
                    <CheckIcon className="offer-check" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="offer-section">
              <h3>
                {strings.TRAVELERS_SAY}
                {' '}
                {car.supplier?.fullName}
              </h3>
              <p className="offer-muted">{strings.TRAVELERS_HINT}</p>
              <div className="offer-tags">
                <span className="offer-tag">{strings.TAG_VEHICLE}</span>
                <span className="offer-tag">{strings.TAG_LOCATION}</span>
                <span className="offer-tag">{strings.TAG_CLEANLINESS}</span>
              </div>
            </section>

            {includedItems.length > 0 && (
              <section className="offer-section">
                <h3>{strings.INCLUDED}</h3>
                <div className="offer-included">
                  {includedItems.map((item) => (
                    <div key={item} className="offer-included-item">
                      <CheckIcon className="offer-check" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showExtrasBanner && (
              <div className="offer-extras-banner">
                <button type="button" className="offer-extras-close" onClick={() => setShowExtrasBanner(false)}>
                  <CloseIcon fontSize="small" />
                </button>
                <div>
                  <strong>{strings.EXTRAS_BANNER_TITLE}</strong>
                  <p>{strings.EXTRAS_BANNER_TEXT}</p>
                </div>
              </div>
            )}

            <section className="offer-section offer-pickup-section">
              <h3>{strings.PICKUP_TITLE}</h3>
              <div className="offer-tabs">
                <button
                  type="button"
                  className={pickupTab === 'arrive' ? 'active' : ''}
                  onClick={() => setPickupTab('arrive')}
                >
                  <TimeIcon />
                  {strings.TAB_ARRIVE}
                </button>
                <button
                  type="button"
                  className={pickupTab === 'documents' ? 'active' : ''}
                  onClick={() => setPickupTab('documents')}
                >
                  <BadgeIcon />
                  {strings.TAB_DOCUMENTS}
                </button>
                <button
                  type="button"
                  className={pickupTab === 'deposit' ? 'active' : ''}
                  onClick={() => setPickupTab('deposit')}
                >
                  <CardIcon />
                  {strings.TAB_DEPOSIT}
                </button>
              </div>
              <div className="offer-tab-content">
                {pickupTab === 'arrive' && (
                  <>
                    <p>{strings.ARRIVE_TEXT}</p>
                    <p>
                      <strong>
                        {strings.PICKUP_AT}
                        {' '}
                        {pickupTime}
                      </strong>
                    </p>
                  </>
                )}
                {pickupTab === 'documents' && <p>{strings.DOCS_TEXT}</p>}
                {pickupTab === 'deposit' && (
                  <>
                    <p>{strings.DEPOSIT_TEXT}</p>
                    {depositPrice > 0 && (
                      <p>
                        <strong>
                          {strings.DEPOSIT_AMOUNT}
                          {' '}
                          {bookcarsHelper.formatPrice(depositPrice, commonStrings.CURRENCY, language)}
                        </strong>
                      </p>
                    )}
                  </>
                )}
              </div>
              <p className="offer-terms-note">
                {strings.TERMS_NOTE}
                {' '}
                <button type="button" className="offer-link">{strings.RENTAL_CONDITIONS}</button>
                {' '}
                {strings.TERMS_NOTE_END}
              </p>
              <div className="offer-continue-row">
                <Button variant="contained" className="offer-continue-btn" onClick={handleContinue}>
                  {strings.CONTINUE}
                </Button>
              </div>
            </section>
          </div>

          <OfferPriceSidebar
            pickupLocation={pickupLocation}
            dropOffLocation={dropOffLocation}
            from={from}
            to={to}
            price={price}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Offer
