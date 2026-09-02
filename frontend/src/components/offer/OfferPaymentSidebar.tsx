import React from 'react'
import { Check as CheckIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/offer'

interface OfferPaymentSidebarProps {
  car: bookcarsTypes.Car
  language: string
  basePrice: number
  protectionPrice: number
  totalPrice: number
  hasProtection: boolean
  highlights: string[]
}

const OfferPaymentSidebar = ({
  language,
  basePrice,
  protectionPrice,
  totalPrice,
  hasProtection,
  highlights,
}: OfferPaymentSidebarProps) => (
  <aside className="offer-sidebar">
    <div className="offer-sidebar-card">
      <h3>{strings.PRICE_DETAIL}</h3>
      <div className="offer-price-row">
        <span>{strings.RENTAL_AMOUNT}</span>
        <span>{bookcarsHelper.formatPrice(basePrice, commonStrings.CURRENCY, language)}</span>
      </div>
      {hasProtection && protectionPrice > 0 && (
        <div className="offer-price-row">
          <span>{strings.PAYMENT_PROTECTION}</span>
          <span>{bookcarsHelper.formatPrice(protectionPrice, commonStrings.CURRENCY, language)}</span>
        </div>
      )}
      <div className="offer-price-divider" />
      <div className="offer-price-row offer-price-total">
        <span>{strings.TOTAL}</span>
        <strong>{bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}</strong>
      </div>
    </div>

    <div className="offer-sidebar-card offer-excellent-sidebar">
      <h3>{strings.EXCELLENT_CHOICE}</h3>
      <ul className="offer-sidebar-highlights">
        {highlights.map((item) => (
          <li key={item}>
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="offer-sidebar-card offer-loyalty-card">
      <h3>{strings.LOYALTY_TITLE}</h3>
      <p>{strings.LOYALTY_TEXT}</p>
      <span className="offer-genius-logo">{strings.GENIUS_BADGE}</span>
    </div>
  </aside>
)

export default OfferPaymentSidebar
