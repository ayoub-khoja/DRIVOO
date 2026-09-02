import React from 'react'
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
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import {
  formatBookingRating,
  getRatingLabel,
  getSimilarCategoryLabel,
} from '@/utils/searchFacetsHelper'

interface OfferPaymentCarCardProps {
  car: bookcarsTypes.Car
  pickupLocation: bookcarsTypes.Location
  language: string
}

const OfferPaymentCarCard = ({ car, pickupLocation, language }: OfferPaymentCarCardProps) => {
  const carImageUrl = car.image ? bookcarsHelper.joinURL(env.CDN_CARS, car.image) : ''
  const supplierAvatarUrl = car.supplier?.avatar ? bookcarsHelper.joinURL(env.CDN_USERS, car.supplier.avatar) : ''
  const bookingScore = formatBookingRating(car.rating)
  const ratingLabel = getRatingLabel(car.rating, language)
  const similarLabel = getSimilarCategoryLabel(car.range, language)
  const bagCount = Math.max(1, Math.floor(car.seats / 2))

  const getDeliveryLabel = (deliveryType?: string) => {
    if (deliveryType === bookcarsTypes.DeliveryType.Airport) return strings.IN_TERMINAL
    if (deliveryType === bookcarsTypes.DeliveryType.Delivery) return strings.SHUTTLE
    return strings.MEET_GREET
  }

  return (
    <div className="offer-car-card offer-payment-car-card">
      <span className="offer-genius-badge">{strings.GENIUS_BADGE}</span>
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
            <li><GearboxIcon /><span>{helper.getGearboxTypeShort(car.gearbox)}</span></li>
            <li><BagsIcon /><span>{bagCount} {bagCount > 1 ? strings.BAGS : strings.BAG}</span></li>
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
  )
}

export default OfferPaymentCarCard
