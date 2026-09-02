import React from 'react'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/offer'
import * as UserService from '@/services/UserService'

interface OfferPriceSidebarProps {
  pickupLocation: bookcarsTypes.Location
  dropOffLocation: bookcarsTypes.Location
  from: Date
  to: Date
  price: number
  extrasPickupTotal?: number
}

const OfferPriceSidebar = ({
  pickupLocation,
  dropOffLocation,
  from,
  to,
  price,
  extrasPickupTotal = 0,
}: OfferPriceSidebarProps) => {
  const language = UserService.getLanguage()
  const locale = language === 'fr' ? fr : language === 'ar' ? arTN : enUS
  const dateFmt = language === 'fr' ? 'eee d MMM - HH:mm' : 'eee, d MMM - HH:mm'

  return (
    <aside className="offer-sidebar">
      <div className="offer-sidebar-card">
        <h3>{strings.PICKUP_RETURN}</h3>
        <div className="offer-timeline">
          <div className="offer-timeline-item">
            <div className="offer-timeline-dot" />
            <div>
              <strong>{strings.PICKUP}</strong>
              <p>{format(from, dateFmt, { locale })}</p>
              <p className="offer-location">{pickupLocation.name}</p>
              <button type="button" className="offer-link">{strings.PICKUP_INSTRUCTIONS}</button>
            </div>
          </div>
          <div className="offer-timeline-line" />
          <div className="offer-timeline-item">
            <div className="offer-timeline-dot" />
            <div>
              <strong>{strings.RETURN}</strong>
              <p>{format(to, dateFmt, { locale })}</p>
              <p className="offer-location">{dropOffLocation.name}</p>
              <button type="button" className="offer-link">{strings.RETURN_INSTRUCTIONS}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="offer-sidebar-card">
        <h3>{strings.PRICE_DETAIL}</h3>
        <div className="offer-price-row">
          <span>{strings.RENTAL_AMOUNT}</span>
          <span>{bookcarsHelper.formatPrice(price, commonStrings.CURRENCY, language)}</span>
        </div>
        {extrasPickupTotal > 0 && (
          <div className="offer-price-row offer-price-extras">
            <span>{strings.EXTRAS_AT_PICKUP}</span>
            <span>{bookcarsHelper.formatPrice(extrasPickupTotal, commonStrings.CURRENCY, language)}</span>
          </div>
        )}
        <div className="offer-price-divider" />
        <div className="offer-price-row offer-price-total">
          <span>{strings.TOTAL}</span>
          <strong>{bookcarsHelper.formatPrice(price, commonStrings.CURRENCY, language)}</strong>
        </div>
        {extrasPickupTotal > 0 && (
          <p className="offer-price-note">{strings.EXTRAS_DISCLAIMER_END}</p>
        )}
      </div>

      <div className="offer-value-box">
        <p>
          {strings.VALUE_TITLE}
          {' '}
          <strong>{bookcarsHelper.formatPrice(price, commonStrings.CURRENCY, language)}</strong>
          {' '}
          {strings.VALUE_BARGAIN}
        </p>
      </div>
    </aside>
  )
}

export default OfferPriceSidebar
