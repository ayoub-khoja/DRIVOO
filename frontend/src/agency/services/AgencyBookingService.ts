import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const ACTIVE_BOOKING_STATUSES: bookcarsTypes.BookingStatus[] = [
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
]

export const getBookings = (
  payload: bookcarsTypes.GetBookingsPayload,
  page: number,
  size: number,
  language: string,
): Promise<bookcarsTypes.Result<bookcarsTypes.Booking>> =>
  agencyAxiosInstance
    .post(`/api/bookings/${page}/${size}/${language}`, payload)
    .then((res) => res.data)

export const getBookingsCount = async (supplierId: string, language: string): Promise<number> => {
  const data = await getBookings({
    suppliers: [supplierId],
    statuses: ACTIVE_BOOKING_STATUSES,
  }, 1, 1, language)

  const pageInfo = data?.[0]?.pageInfo as unknown as { totalRecords?: number }[] | { totalRecords?: number } | undefined
  return (Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0
}

/** 200 = email available, 204 = already registered */
export const validateEmail = (email: string): Promise<number> =>
  agencyAxiosInstance
    .post('/api/validate-email', { email })
    .then((res) => res.status)
    .catch((err) => {
      if (err?.response?.status === 204) {
        return 204
      }
      throw err
    })

export const findDriverByEmail = async (email: string): Promise<bookcarsTypes.User | null> => {
  const data = await agencyAxiosInstance
    .post(`/api/users/1/20/?s=${encodeURIComponent(email)}`, {
      types: [bookcarsTypes.UserType.User],
    })
    .then((res) => res.data as bookcarsTypes.Result<bookcarsTypes.User>)

  const users = data?.[0]?.resultData || []
  return users.find((user) => user.email?.toLowerCase() === email.trim().toLowerCase()) || null
}

/**
 * Create a booking the same way as client pay-later checkout:
 * creates the driver if needed, then persists the reservation.
 */
export const checkout = (
  payload: bookcarsTypes.CheckoutPayload,
): Promise<{ status: number; bookingId: string }> =>
  agencyAxiosInstance
    .post('/api/checkout', payload)
    .then((res) => ({ status: res.status, bookingId: res.data.bookingId }))

export const create = (payload: bookcarsTypes.UpsertBookingPayload): Promise<bookcarsTypes.Booking> =>
  agencyAxiosInstance
    .post('/api/create-booking', payload)
    .then((res) => res.data)

export const updateStatus = (ids: string[], status: bookcarsTypes.BookingStatus): Promise<number> =>
  agencyAxiosInstance
    .post('/api/update-booking-status', { ids, status })
    .then((res) => res.status)

/** Pending = awaiting agency accept / refuse. */
export const isAwaitingDecision = (status: bookcarsTypes.BookingStatus): boolean =>
  status === bookcarsTypes.BookingStatus.Pending

/** Accepted manually (Reserved) or via payment (Deposit / Paid*). */
export const isAccepted = (status: bookcarsTypes.BookingStatus): boolean => [
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
].includes(status)
