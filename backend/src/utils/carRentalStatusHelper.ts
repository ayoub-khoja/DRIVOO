import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import Booking from '../models/Booking'
import Car from '../models/Car'

const ACTIVE_STATUSES = [
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
]

/**
 * Recompute fullyBooked for a car based on active future bookings.
 * Returns the updated fullyBooked flag.
 */
export const syncCarFullyBooked = async (carId: string | mongoose.Types.ObjectId): Promise<boolean> => {
  const now = new Date()
  const hasActiveBooking = await Booking.exists({
    car: carId,
    status: { $in: ACTIVE_STATUSES },
    to: { $gte: now },
  })
  const fullyBooked = !!hasActiveBooking

  await Car.updateOne(
    { _id: carId },
    { $set: { fullyBooked } },
  )

  return fullyBooked
}

/**
 * Sync rental status for multiple cars.
 * Returns a map of carId -> fullyBooked.
 */
export const syncCarsFullyBooked = async (
  carIds: Array<string | mongoose.Types.ObjectId | undefined | null>,
): Promise<Record<string, boolean>> => {
  const uniqueIds = [...new Set(carIds.filter(Boolean).map((id) => id!.toString()))]
  const entries = await Promise.all(
    uniqueIds.map(async (id) => [id, await syncCarFullyBooked(id)] as const),
  )
  return Object.fromEntries(entries)
}
