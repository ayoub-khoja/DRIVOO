import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  Person as SeatsIcon,
  AccountTree as GearboxIcon,
  Luggage as BagsIcon,
  Speed as MileageIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarPlaceholderIcon,
  AccountCircle as SupplierPlaceholderIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/search-filters'
import {
  formatBookingRating,
  getRatingLabel,
  getSimilarCategoryLabel,
} from '@/utils/searchFacetsHelper'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'

import '@/assets/css/search-car-card.css'

interface SearchCarCardProps {
  car: bookcarsTypes.Car
  from: Date
  to: Date
  pickupLocation?: string
  dropOffLocation?: string
  pickupLocationName?: string
  recommended?: boolean
}

const SearchCarCard = ({
  car,
  from,
  to,
  pickupLocation,
  dropOffLocation,
  pickupLocationName,
  recommended,
}: SearchCarCardProps) => {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('')
  const [days, setDays] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    setLanguage(UserService.getLanguage())
  }, [])

  useEffect(() => {
    const init = async () => {
      if (from && to) {
        const price = await PaymentService.convertPrice(
          bookcarsHelper.calculateTotalPrice(car, from, to, car.supplier?.priceChangeRate || 0),
        )
        setTotalPrice(price)
        setDays(bookcarsHelper.days(from, to))
      }
    }
    init()
  }, [car, from, to])

  if (!language || !days || !totalPrice) {
    return null
  }

  const carImageUrl = car.image ? bookcarsHelper.joinURL(env.CDN_CARS, car.image) : ''
  const supplierAvatarUrl = car.supplier?.avatar ? bookcarsHelper.joinURL(env.CDN_USERS, car.supplier.avatar) : ''
  const bookingScore = formatBookingRating(car.rating)
  const ratingLabel = getRatingLabel(car.rating, language)
  const similarLabel = getSimilarCategoryLabel(car.range, language)
  const hasFreeCancellation = car.cancellation === 0

  return (
    <article className={`search-car-card${recommended ? ' recommended' : ''}`}>
      {recommended && <div className="search-car-badge">{strings.SORT_RECOMMENDED}</div>}

      <div className="search-car-card-body">
        <div className="search-car-media">
          {carImageUrl ? (
            <img src={carImageUrl} alt={car.name} className="search-car-image" />
          ) : (
            <div className="search-car-image search-car-image-placeholder">
              <CarPlaceholderIcon />
            </div>
          )}
        </div>

        <div className="search-car-details">
          <h3 className="search-car-title">
            {car.name}
            <span className="search-car-similar">{similarLabel}</span>
          </h3>

          <ul className="search-car-specs">
            <li><SeatsIcon /><span>{car.seats}</span></li>
            <li><GearboxIcon /><span>{helper.getGearboxTypeShort(car.gearbox)}</span></li>
            <li><BagsIcon /><span>{Math.max(1, Math.floor(car.seats / 2))}</span></li>
            <li>
              <MileageIcon />
              <span>{car.mileage === -1 ? strings.UNLIMITED_MILEAGE : strings.LIMITED_MILEAGE}</span>
            </li>
          </ul>

          {pickupLocationName && (
            <p className="search-car-location">
              <LocationIcon />
              <span>{pickupLocationName}</span>
            </p>
          )}
        </div>

        <div className="search-car-pricing">
          <span className="search-car-price-label">
            {strings.PRICE_FOR}
            {' '}
            {days}
            {' '}
            {strings.DAYS}
            :
          </span>
          <span className="search-car-price">{bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}</span>
          {hasFreeCancellation && (
            <span className="search-car-free-cancel">{strings.FREE_CANCELLATION}</span>
          )}
          {car.available && !car.comingSoon && !car.fullyBooked && (
            <Button
              variant="contained"
              className="search-car-cta"
              onClick={() => {
                navigate('/offer', {
                  state: {
                    carId: car._id,
                    pickupLocationId: pickupLocation,
                    dropOffLocationId: dropOffLocation,
                    from,
                    to,
                  },
                })
              }}
            >
              {strings.VIEW_OFFER}
            </Button>
          )}
        </div>
      </div>

      <div className="search-car-footer">
        <div className="search-car-supplier">
          {supplierAvatarUrl ? (
            <img src={supplierAvatarUrl} alt={car.supplier?.fullName} className="search-car-supplier-logo" />
          ) : (
            <SupplierPlaceholderIcon className="search-car-supplier-placeholder" />
          )}
          <span>{car.supplier?.fullName}</span>
        </div>
        {bookingScore && (
          <div className="search-car-rating">
            <span className="search-car-rating-score">{bookingScore}</span>
            <div className="search-car-rating-text">
              <strong>{ratingLabel}</strong>
              {car.trips >= 10 && (
                <span>
                  {car.trips}
                  +
                  {' '}
                  {strings.REVIEWS_COUNT}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default SearchCarCard
