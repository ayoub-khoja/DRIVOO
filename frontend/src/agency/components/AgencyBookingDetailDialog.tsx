import React, { useMemo } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
} from '@mui/material'
import { CloseRounded } from '@mui/icons-material'
import { format } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { getDateFnsLocale } from '@/utils/locale'
import { strings } from '@/agency/lang/agency'
import { strings as csStrings } from '@/lang/cars'
import BookingStatus from '@/components/BookingStatus'
import * as PaymentService from '@/services/PaymentService'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import env from '@/config/env.config'

type AgencyBookingDetailDialogProps = {
  open: boolean
  booking: bookcarsTypes.Booking | null
  language: string
  onClose: () => void
  onAccept?: (booking: bookcarsTypes.Booking) => void
  onRefuse?: (booking: bookcarsTypes.Booking) => void
  busy?: boolean
}

const locationName = (value?: bookcarsTypes.Location | string): string => {
  if (!value || typeof value === 'string') {
    return '—'
  }
  const name = value.name
  if (Array.isArray(name)) {
    return name[0] || '—'
  }
  return name || '—'
}

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="agency-booking-detail-row">
    <span className="label">{label}</span>
    <span className="value">{value || '—'}</span>
  </div>
)

const OptionChip = ({ label, on }: { label: string, on?: boolean }) => (
  <span className={`agency-booking-option-chip ${on ? 'is-on' : 'is-off'}`}>
    {label}
  </span>
)

/**
 * Full reservation dossier for the agency list (eye icon).
 */
const AgencyBookingDetailDialog = ({
  open,
  booking,
  language,
  onClose,
  onAccept,
  onRefuse,
  busy,
}: AgencyBookingDetailDialogProps) => {
  const locale = getDateFnsLocale(language)

  const car = booking?.car as bookcarsTypes.Car | undefined
  const driver = booking?.driver as bookcarsTypes.User | undefined
  const pickup = booking?.pickupLocation as bookcarsTypes.Location | undefined
  const dropOff = booking?.dropOffLocation as bookcarsTypes.Location | undefined
  const additional = booking?._additionalDriver as bookcarsTypes.AdditionalDriver | undefined

  const awaiting = booking ? AgencyBookingService.isAwaitingDecision(booking.status) : false
  const accepted = booking ? AgencyBookingService.isAccepted(booking.status) : false

  const formatDateTime = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    return format(new Date(value), language === 'fr' ? 'dd/MM/yyyy HH:mm' : 'Pp', { locale })
  }

  const carImage = useMemo(() => {
    const image = car?.image
    if (!image) {
      return ''
    }
    if (image.startsWith('http')) {
      return image
    }
    return bookcarsHelper.joinURL(env.CDN_CARS, image)
  }, [car?.image])

  const days = useMemo(() => {
    if (!booking?.from || !booking?.to) {
      return 0
    }
    return Math.max(1, bookcarsHelper.days(new Date(booking.from), new Date(booking.to)))
  }, [booking?.from, booking?.to])

  if (!booking) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      className="agency-booking-detail-dialog"
    >
      <div className="agency-booking-detail-head">
        <div>
          <p className="agency-booking-detail-kicker">{strings.BOOKING_DETAILS}</p>
          <h2>{car?.name || strings.BOOKING_CAR}</h2>
          <div className="agency-booking-detail-head-meta">
            <BookingStatus value={booking.status} />
            {awaiting ? <span className="agency-bookings-decision is-awaiting">{strings.BOOKING_AWAITING}</span> : null}
            {accepted && booking.isDeposit ? (
              <span className="agency-bookings-decision is-auto">{strings.BOOKING_PAYMENT_BADGE}</span>
            ) : null}
            {accepted && !booking.isDeposit ? (
              <span className="agency-bookings-decision is-accepted">{strings.BOOKING_ACCEPTED}</span>
            ) : null}
            {booking.status === bookcarsTypes.BookingStatus.Cancelled ? (
              <span className="agency-bookings-decision is-refused">{strings.BOOKING_REFUSED}</span>
            ) : null}
          </div>
        </div>
        <IconButton onClick={onClose} aria-label={strings.CLOSE || 'Close'}>
          <CloseRounded />
        </IconButton>
      </div>

      <DialogContent className="agency-booking-detail-content">
        <section className="agency-booking-detail-hero">
          <div className="agency-booking-detail-media">
            {carImage ? (
              <img src={carImage} alt={car?.name || ''} />
            ) : (
              <div className="agency-booking-detail-media-fallback">{car?.name?.[0] || 'C'}</div>
            )}
          </div>
          <div className="agency-booking-detail-summary">
            <DetailRow label={strings.BOOKING_REF} value={booking._id} />
            <DetailRow
              label={strings.BOOKING_PRICE}
              value={bookcarsHelper.formatPrice(
                Number(booking.price) || 0,
                PaymentService.getCurrency(),
                language,
              )}
            />
            <DetailRow label={strings.BOOKING_DURATION} value={`${days} ${days > 1 ? strings.BOOKING_DAYS : strings.BOOKING_DAY}`} />
            {car?.licensePlate ? <DetailRow label={strings.BOOKING_PLATE} value={car.licensePlate} /> : null}
            {booking.isDeposit ? <DetailRow label={strings.BOOKING_PAYMENT} value={strings.BOOKING_PAYMENT_BADGE} /> : null}
            {booking.isPayedInFull ? <DetailRow label={strings.BOOKING_PAYMENT} value={strings.BOOKING_PAID_FULL} /> : null}
          </div>
        </section>

        <div className="agency-booking-detail-grid">
          <section className="agency-booking-detail-panel">
            <h3>{strings.BOOKING_SECTION_CLIENT}</h3>
            <DetailRow label={strings.BOOKING_CLIENT} value={driver?.fullName} />
            <DetailRow label={strings.EMAIL || 'Email'} value={driver?.email} />
            <DetailRow label={strings.CLIENTS_PHONE} value={driver?.phone} />
            {driver?.birthDate ? (
              <DetailRow
                label={strings.CLIENTS_BIRTH_DATE}
                value={format(new Date(driver.birthDate), language === 'fr' ? 'dd/MM/yyyy' : 'P', { locale })}
              />
            ) : null}
          </section>

          <section className="agency-booking-detail-panel">
            <h3>{strings.BOOKING_SECTION_TRIP}</h3>
            <DetailRow label={strings.BOOKING_DATE_FROM} value={formatDateTime(booking.from)} />
            <DetailRow label={strings.BOOKING_DATE_TO} value={formatDateTime(booking.to)} />
            <DetailRow label={strings.BOOKING_PICKUP} value={locationName(pickup)} />
            <DetailRow label={strings.BOOKING_DROPOFF} value={locationName(dropOff)} />
          </section>

          <section className="agency-booking-detail-panel agency-booking-detail-span">
            <h3>{strings.BOOKING_SECTION_OPTIONS}</h3>
            <div className="agency-booking-options">
              <OptionChip label={csStrings.CANCELLATION} on={!!booking.cancellation} />
              <OptionChip label={csStrings.AMENDMENTS} on={!!booking.amendments} />
              <OptionChip label={csStrings.THEFT_PROTECTION} on={!!booking.theftProtection} />
              <OptionChip label={csStrings.COLLISION_DAMAGE_WAVER} on={!!booking.collisionDamageWaiver} />
              <OptionChip label={csStrings.FULL_INSURANCE} on={!!booking.fullInsurance} />
              <OptionChip label={csStrings.ADDITIONAL_DRIVER} on={!!booking.additionalDriver} />
            </div>
            {booking.additionalDriver && additional ? (
              <div className="agency-booking-additional">
                <DetailRow label={csStrings.ADDITIONAL_DRIVER} value={additional.fullName} />
                <DetailRow label={strings.EMAIL || 'Email'} value={additional.email} />
                <DetailRow label={strings.CLIENTS_PHONE} value={additional.phone} />
                {additional.birthDate ? (
                  <DetailRow label={strings.CLIENTS_BIRTH_DATE} value={formatDateTime(additional.birthDate)} />
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </DialogContent>

      <DialogActions className="agency-booking-detail-actions">
        <Button onClick={onClose}>{strings.CLOSE || 'OK'}</Button>
        {awaiting && onRefuse ? (
          <Button color="error" variant="outlined" disabled={busy} onClick={() => onRefuse(booking)}>
            {strings.BOOKING_REFUSE}
          </Button>
        ) : null}
        {awaiting && onAccept ? (
          <Button className="btn-primary" variant="contained" disabled={busy} onClick={() => onAccept(booking)}>
            {strings.BOOKING_ACCEPT}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  )
}

export default AgencyBookingDetailDialog
