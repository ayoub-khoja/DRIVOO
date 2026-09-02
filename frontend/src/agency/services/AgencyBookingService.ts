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
