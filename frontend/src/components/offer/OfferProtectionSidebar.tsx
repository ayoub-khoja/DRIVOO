import React from 'react'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import { Check as CheckIcon, Place as PlaceIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/offer'
import * as UserService from '@/services/UserService'

interface OfferProtectionSidebarProps {
  pickupLocation: bookcarsTypes.Location
  dropOffLocation: bookcarsTypes.Location
  from: Date
  to: Date
  basePrice: number
  extrasPickupTotal?: number
  protectionPrice: number
  coverageAmount: number
}

const OfferProtectionSidebar = ({
  pickupLocation,
  dropOffLocation,
  from,
  to,
  basePrice,
  extrasPickupTotal = 0,
  protectionPrice,
  coverageAmount,
}: OfferProtectionSidebarProps) => {
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
            </div>
          </div>
          <div className="offer-timeline-line" />
          <div className="offer-timeline-item">
            <div className="offer-timeline-dot" />
            <div>
              <strong>{strings.RETURN}</strong>
              <p>{format(to, dateFmt, { locale })}</p>
              <p className="offer-location">{dropOffLocation.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="offer-protection-upsell">
        <h3>{strings.PROTECTION_COL_FULL}</h3>
        <ul>
          <li>
            <CheckIcon />
            {strings.PROTECTION_UPSELL_COVERAGE
              .replace('{amount}', bookcarsHelper.formatPrice(coverageAmount, commonStrings.CURRENCY, language))
              .replace('{price}', bookcarsHelper.formatPrice(protectionPrice, commonStrings.CURRENCY, language))}
          </li>
          <li><CheckIcon />{strings.PROTECTION_UPSELL_CANCEL}</li>
          <li><CheckIcon />{strings.PROTECTION_UPSELL_CLAIMS}</li>
        </ul>
        <div className="offer-protection-social">
          <PlaceIcon />
          <span>{strings.PROTECTION_SOCIAL_PROOF}</span>
        </div>
      </div>

      <div className="offer-sidebar-card">
        <h3>{strings.PRICE_DETAIL}</h3>
        <div className="offer-price-row">
          <span>{strings.RENTAL_AMOUNT}</span>
          <span>{bookcarsHelper.formatPrice(basePrice, commonStrings.CURRENCY, language)}</span>
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
          <strong>{bookcarsHelper.formatPrice(basePrice, commonStrings.CURRENCY, language)}</strong>
        </div>
      </div>
    </aside>
  )
}

export default OfferProtectionSidebar
