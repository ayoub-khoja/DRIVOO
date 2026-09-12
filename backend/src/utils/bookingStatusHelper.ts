import * as bookcarsTypes from ':bookcars-types'

/**
 * Status after a successful online payment.
 * Advance (isDeposit) → auto-accepted as Reserved (isDeposit flag stays on the booking).
 * Full payment → Paid / PaidInFull.
 * Unpaid / pay-later stays Pending for agency accept / refuse.
 */
export const statusAfterSuccessfulPayment = (flags: {
  isDeposit?: boolean
  isPayedInFull?: boolean
}): bookcarsTypes.BookingStatus => {
  if (flags.isDeposit) {
    return bookcarsTypes.BookingStatus.Reserved
  }
  if (flags.isPayedInFull) {
    return bookcarsTypes.BookingStatus.PaidInFull
  }
  return bookcarsTypes.BookingStatus.Paid
}

/** Pending bookings await an agency accept / refuse decision. */
export const isAwaitingAgencyDecision = (status: bookcarsTypes.BookingStatus): boolean =>
  status === bookcarsTypes.BookingStatus.Pending
