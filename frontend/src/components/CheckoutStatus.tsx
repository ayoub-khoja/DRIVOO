import React, { useEffect, useState } from 'react'
import { DirectionsCar as CarIcon, MarkEmailReadOutlined } from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as helper from '@/utils/helper'
import * as BookingService from '@/services/BookingService'
import * as PaymentService from '@/services/PaymentService'
import { strings } from '@/lang/checkout-status'
import { strings as commonStrings } from '@/lang/common'
import { strings as checkoutStrings } from '@/lang/checkout'
import Toast from '@/components/Toast'
import Progress from '@/components/Progress'

import '@/assets/css/checkout-status.css'

export interface CheckoutSummary {
  carName: string
  pickupLocationName: string
  dropOffLocationName: string
  from: Date
  to: Date
  price: number
}

interface CheckoutStatusProps {
  bookingId: string
  payLater?: boolean
  guestCheckout?: boolean
  language: string
  status: 'success' | 'error'
  className?: string
  summary?: CheckoutSummary
}

const CheckoutStatus = ({
  bookingId,
  payLater,
  guestCheckout,
  language,
  status,
  className,
  summary,
}: CheckoutStatusProps) => {
  const [booking, setBooking] = useState<bookcarsTypes.Booking>()
  const [price, setPrice] = useState(summary?.price ?? 0)
  const [loading, setLoading] = useState(!summary)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (summary) {
      return
    }

    const init = async () => {
      try {
        const _booking = await BookingService.getBooking(bookingId)
        if (!_booking) {
          setLoadError(true)
          return
        }
        setBooking(_booking)
        setPrice(await PaymentService.convertPrice(_booking.price || 0))
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      void init()
    }
  }, [bookingId, summary])

  if (loading) {
    return <Progress />
  }

  const _fr = language === 'fr'
  const _ar = language === 'ar'
  const _locale = _fr ? fr : _ar ? arTN : enUS
  const _format = _fr ? 'eee d LLL yyyy kk:mm' : 'eee, d LLL yyyy, p'
  const fromDate = summary?.from ?? (booking ? new Date(booking.from) : null)
  const toDate = summary?.to ?? (booking ? new Date(booking.to) : null)
  const days = fromDate && toDate ? bookcarsHelper.days(fromDate, toDate) : 0
  const success = status === 'success'
  const carName = summary?.carName ?? (booking?.car as bookcarsTypes.Car | undefined)?.name
  const pickupName = summary?.pickupLocationName ?? (booking?.pickupLocation as bookcarsTypes.Location | undefined)?.name
  const dropOffName = summary?.dropOffLocationName ?? (booking?.dropOffLocation as bookcarsTypes.Location | undefined)?.name
  const displayPrice = summary?.price ?? price
  const hasDetails = !!(carName && pickupName && dropOffName && fromDate && toDate)

  const toastText = !success
    ? strings.ERROR
    : [
        payLater ? strings.SUCCESS_PAY_LATER : strings.SUCCESS,
        guestCheckout ? strings.SUCCESS_GUEST_ACTIVATION : '',
      ].filter(Boolean).join(' ')

  return (
    <div className={`checkout-status ${className || ''}`}>
      <Toast
        title={success ? strings.CONGRATULATIONS : undefined}
        text={toastText}
        status={status}
      />

      {success && guestCheckout && (
        <div className="checkout-activation-note">
          <MarkEmailReadOutlined />
          <p>{strings.SUCCESS_GUEST_ACTIVATION}</p>
        </div>
      )}

      {success && hasDetails && !loadError && (
        <div className="details">
          <div className="status-details-container">
            <div className="status-info">
              <CarIcon />
              <span>{checkoutStrings.BOOKING_DETAILS}</span>
            </div>
            <div className="status-details">
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.CAR}</span>
                <div className="status-detail-value">
                  <span>{carName}</span>
                </div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.DAYS}</span>
                <div className="status-detail-value">
                  {`${helper.getDaysShort(days)} (${bookcarsHelper.capitalize(
                    format(fromDate!, _format, { locale: _locale }),
                  )} - ${bookcarsHelper.capitalize(format(toDate!, _format, { locale: _locale }))})`}
                </div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{commonStrings.PICK_UP_LOCATION}</span>
                <div className="status-detail-value">{pickupName}</div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{commonStrings.DROP_OFF_LOCATION}</span>
                <div className="status-detail-value">{dropOffName}</div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.COST}</span>
                <div className="status-detail-value status-price">{bookcarsHelper.formatPrice(displayPrice, commonStrings.CURRENCY, language)}</div>
              </div>
            </div>
          </div>

          <div className="side-panel">
            <h1>{strings.STATUS_TITLE}</h1>
            <p>{guestCheckout ? strings.STATUS_MESSAGE_GUEST : strings.STATUS_MESSAGE}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutStatus
