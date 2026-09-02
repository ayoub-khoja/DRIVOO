import React from 'react'
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/offer'

interface OfferExtraCardProps {
  title: string
  priceLabel: string
  description: string
  quantity: number
  maxQuantity: number
  onChange: (quantity: number) => void
}

const OfferExtraCard = ({
  title,
  priceLabel,
  description,
  quantity,
  maxQuantity,
  onChange,
}: OfferExtraCardProps) => (
  <div className="offer-extra-card">
    <h4>{title}</h4>
    <p className="offer-extra-price">{priceLabel}</p>
    <p className="offer-extra-desc">{description}</p>
    <div className="offer-extra-qty">
      <button
        type="button"
        aria-label="decrease"
        disabled={quantity <= 0}
        onClick={() => onChange(Math.max(0, quantity - 1))}
      >
        <RemoveIcon fontSize="small" />
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        aria-label="increase"
        disabled={quantity >= maxQuantity}
        onClick={() => onChange(Math.min(maxQuantity, quantity + 1))}
      >
        <AddIcon fontSize="small" />
      </button>
    </div>
  </div>
)

export default OfferExtraCard

export const formatExtraPriceLabel = (
  unitPrice: number,
  perDay: boolean,
  language: string,
): string => {
  const formatted = bookcarsHelper.formatPrice(unitPrice, commonStrings.CURRENCY, language)
  if (perDay) {
    return `${formatted} ${strings.EXTRA_PER_DAY}`
  }
  return `${formatted} ${strings.EXTRA_PER_RENTAL}`
}
