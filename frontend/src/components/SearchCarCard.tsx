import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  Person as SeatsIcon,
  AccountTree as GearboxIcon,
  LocalGasStation as FuelIcon,
  AcUnit as AirconIcon,
  DirectionsCar as CarPlaceholderIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/search-filters'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'

import DoorsIcon from '@/assets/img/car-door.png'

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
  recommended,
}: SearchCarCardProps) => {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('')
  const [days, setDays] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [dailyPrice, setDailyPrice] = useState(0)
  const [deposit, setDeposit] = useState(0)

  useEffect(() => {
    setLanguage(UserService.getLanguage())
  }, [])

  useEffect(() => {
    const init = async () => {
      if (from && to) {
        const price = await PaymentService.convertPrice(
          bookcarsHelper.calculateTotalPrice(car, from, to, car.supplier?.priceChangeRate || 0),
        )
        const _days = bookcarsHelper.days(from, to)
        setTotalPrice(price)
        setDays(_days)
        setDailyPrice(_days > 0 ? price / _days : price)
        setDeposit(await PaymentService.convertPrice(car.deposit))
      }
    }
    init()
  }, [car, from, to])

  if (!language || !days || !totalPrice) {
    return null
  }

  const carImageUrl = car.image ? bookcarsHelper.joinURL(env.CDN_CARS, car.image) : ''
  const fuelLabel = helper.getCarTypeShort(car.type)
  const gearboxLabel =
    car.gearbox === bookcarsTypes.GearboxType.Automatic ? strings.AUTOMATIC : strings.MANUAL
  const mileageLabel =
    car.mileage === -1
      ? strings.UNLIMITED
      : `${bookcarsHelper.formatNumber(car.mileage, language)} KM`

  return (
    <article className={`search-car-card${recommended ? ' recommended' : ''}`}>
      <div className="search-car-media">
        {carImageUrl ? (
          <img src={carImageUrl} alt={car.name} className="search-car-image" />
        ) : (
          <div className="search-car-image search-car-image-placeholder">
            <CarPlaceholderIcon />
          </div>
        )}
      </div>

      <div className="search-car-content">
        <h3 className="search-car-title">{car.name}</h3>

        {recommended && (
          <span className="search-car-badge">{strings.RECOMMENDED_BADGE}</span>
        )}

        <ul className="search-car-specs">
          <li>
            <SeatsIcon />
            <span>
              {car.seats}
              {' '}
              {strings.PERSONS}
            </span>
          </li>
          {car.doors > 0 && (
            <li>
              <img src={DoorsIcon} alt="" className="search-car-doors-icon" />
              <span>
                {car.doors}
                {' '}
                {strings.DOORS}
              </span>
            </li>
          )}
          {fuelLabel && (
            <li>
              <FuelIcon />
              <span>{fuelLabel}</span>
            </li>
          )}
          <li>
            <GearboxIcon />
            <span>{gearboxLabel}</span>
          </li>
          {car.aircon && (
            <li>
              <AirconIcon />
              <span>{strings.AC_SHORT}</span>
            </li>
          )}
        </ul>

        <div className="search-car-bottom">
          <div className="search-car-day-price">
            {bookcarsHelper.formatPrice(dailyPrice, commonStrings.CURRENCY, language)}
            {' '}
            {strings.PER_DAY_SHORT}
          </div>

          <div className="search-car-terms">
            {deposit > 0 && (
              <div className="is-caution">
                {strings.CAUTION}
                {' : '}
                <strong>{bookcarsHelper.formatPrice(deposit, commonStrings.CURRENCY, language)}</strong>
              </div>
            )}
            {car.mileage !== 0 && (
              <div className="is-driving">
                {strings.DRIVING}
                {' : '}
                <strong>{mileageLabel}</strong>
              </div>
            )}
          </div>

          <div className="search-car-total">
            <span className="search-car-total-price">
              {bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}
            </span>
            <span className="search-car-total-label">
              {strings.PRICE_FOR}
              {' '}
              {days}
              {' '}
              {strings.DAYS}
            </span>
          </div>

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
    </article>
  )
}

export default SearchCarCard
