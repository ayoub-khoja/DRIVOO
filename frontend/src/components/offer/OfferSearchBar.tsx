import React from 'react'
import { Button } from '@mui/material'
import { InfoOutlined as InfoIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/offer'
import * as UserService from '@/services/UserService'

interface OfferSearchBarProps {
  pickupLocation: bookcarsTypes.Location
  dropOffLocation: bookcarsTypes.Location
  from: Date
  to: Date
  onModify: () => void
}

const OfferSearchBar = ({
  pickupLocation,
  dropOffLocation,
  from,
  to,
  onModify,
}: OfferSearchBarProps) => {
  const language = UserService.getLanguage()
  const locale = language === 'fr' ? fr : language === 'ar' ? arTN : enUS
  const dateFmt = language === 'fr' ? 'eee d MMM yyyy, HH:mm' : 'eee, d MMM yyyy, HH:mm'
  const pickupTime = format(from, 'HH:mm', { locale })
  const fromLabel = format(from, dateFmt, { locale })
  const toLabel = format(to, dateFmt, { locale })

  return (
    <div className="offer-search-bar">
      <div className="offer-search-bar-inner">
        <div className="offer-search-summary">
          <span className="offer-search-route">
            {pickupLocation.name}
            {' > '}
            {dropOffLocation.name}
          </span>
          <span className="offer-search-dates">
            {fromLabel}
            {' > '}
            {toLabel}
          </span>
        </div>
        <div className="offer-search-info">
          <InfoIcon fontSize="small" />
          <span>
            {strings.PICKUP_INFO}
            {' '}
            <strong>{pickupTime}</strong>
          </span>
        </div>
        <Button variant="outlined" className="offer-modify-btn" onClick={onModify}>
          {strings.MODIFY}
        </Button>
      </div>
    </div>
  )
}

export default OfferSearchBar
