import React from 'react'
import { format } from 'date-fns'
import {
  DirectionsCar as CarPlaceholderIcon,
  Speed as MileageIcon,
} from '@mui/icons-material'
import { getDateFnsLocale } from '@/utils/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/offer'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'

interface OfferOrderRecapProps {
  car: bookcarsTypes.Car
  pickupLocation: bookcarsTypes.Location
  dropOffLocation: bookcarsTypes.Location
  from: Date
  to: Date
  language: string
  totalPrice: number
  protectionPrice?: number
  hasProtection?: boolean
}

const OfferOrderRecap = ({
  car,
  pickupLocation,
  dropOffLocation,
  from,
  to,
  language,
  totalPrice,
  protectionPrice = 0,
  hasProtection = false,
}: OfferOrderRecapProps) => {
  const locale = getDateFnsLocale(language)
  const days = bookcarsHelper.days(from, to)
  const dateFmt = language === 'fr' ? 'dd/MM/yyyy à HH:mm' : 'dd/MM/yyyy HH:mm'
  const carImageUrl = car.image ? bookcarsHelper.joinURL(env.CDN_CARS, car.image) : ''
  const avgPerDay = days > 0 ? totalPrice / days : totalPrice
  const depositLabel = car.deposit > 0
    ? bookcarsHelper.formatPrice(car.deposit, commonStrings.CURRENCY, language)
    : '—'

  return (
    <section className="offer-recap-card">
      <header className="offer-section-header">
        <h2>{strings.RECAP_TITLE}</h2>
      </header>

      <div className="offer-recap-body">
        <ul className="offer-recap-details">
          <li>
            <span>{strings.RECAP_PICKUP}</span>
            <strong>{pickupLocation.name}</strong>
          </li>
          <li>
            <span>{strings.RECAP_DROPOFF}</span>
            <strong>{dropOffLocation.name}</strong>
          </li>
          <li>
            <span>{strings.RECAP_FROM}</span>
            <strong>{format(from, dateFmt, { locale })}</strong>
          </li>
          <li>
            <span>{strings.RECAP_TO}</span>
            <strong>{format(to, dateFmt, { locale })}</strong>
          </li>
          <li>
            <span>{strings.RECAP_DAYS}</span>
            <strong>{helper.getDays(days)}</strong>
          </li>
        </ul>

        <div className="offer-recap-car">
          {carImageUrl ? (
            <img src={carImageUrl} alt={car.name} className="offer-recap-car-img" />
          ) : (
            <div className="offer-recap-car-img offer-recap-car-placeholder">
              <CarPlaceholderIcon />
            </div>
          )}
          <h3 className="offer-recap-car-name">{car.name}</h3>
          {car.available !== false && (
            <p className="offer-recap-availability">{strings.RECAP_LAST_AVAILABLE}</p>
          )}
        </div>

        <div className="offer-recap-meta">
          <div className="offer-recap-meta-item">
            <span className="offer-recap-meta-label">{strings.RECAP_DEPOSIT}</span>
            <strong>{depositLabel}</strong>
          </div>
          <div className="offer-recap-meta-item">
            <span className="offer-recap-meta-label">
              <MileageIcon fontSize="inherit" />
              {strings.RECAP_MILEAGE}
            </span>
            <strong>
              {car.mileage === -1 ? strings.UNLIMITED_MILEAGE : strings.LIMITED_MILEAGE}
            </strong>
          </div>
        </div>

        {hasProtection && protectionPrice > 0 && (
          <div className="offer-price-row">
            <span>{strings.PAYMENT_PROTECTION}</span>
            <span>{bookcarsHelper.formatPrice(protectionPrice, commonStrings.CURRENCY, language)}</span>
          </div>
        )}

        <div className="offer-recap-total">
          <span className="offer-recap-total-label">{strings.RECAP_PRICE}</span>
          <strong className="offer-recap-total-value">
            {bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}
          </strong>
          <span className="offer-recap-avg">
            {strings.RECAP_AVG_DAY
              .replace('{price}', bookcarsHelper.formatPrice(avgPerDay, commonStrings.CURRENCY, language))}
          </span>
        </div>
      </div>
    </section>
  )
}

export default OfferOrderRecap
