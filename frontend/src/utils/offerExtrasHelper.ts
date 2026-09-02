import * as bookcarsTypes from ':bookcars-types'

export type OfferExtraId =
  | 'additionalDriver'
  | 'childSeat'
  | 'gps'
  | 'booster'
  | 'babySeat'

export type OfferExtraQuantities = Record<OfferExtraId, number>

export const EMPTY_EXTRA_QUANTITIES: OfferExtraQuantities = {
  additionalDriver: 0,
  childSeat: 0,
  gps: 0,
  booster: 0,
  babySeat: 0,
}

export interface OfferExtraDefinition {
  id: OfferExtraId
  perDay: boolean
  defaultUnitPrice: number
  maxQuantity: number
  isAvailable: (car: bookcarsTypes.Car) => boolean
  getUnitPrice: (car: bookcarsTypes.Car) => number
}

export const OFFER_EXTRAS: OfferExtraDefinition[] = [
  {
    id: 'additionalDriver',
    perDay: true,
    defaultUnitPrice: 9,
    maxQuantity: 1,
    isAvailable: (car) => car.additionalDriver > -1,
    getUnitPrice: (car) => (car.additionalDriver > 0 ? car.additionalDriver : 9),
  },
  {
    id: 'childSeat',
    perDay: false,
    defaultUnitPrice: 9,
    maxQuantity: 3,
    isAvailable: () => true,
    getUnitPrice: () => 9,
  },
  {
    id: 'gps',
    perDay: false,
    defaultUnitPrice: 27,
    maxQuantity: 1,
    isAvailable: () => true,
    getUnitPrice: () => 27,
  },
  {
    id: 'booster',
    perDay: false,
    defaultUnitPrice: 9,
    maxQuantity: 3,
    isAvailable: () => true,
    getUnitPrice: () => 9,
  },
  {
    id: 'babySeat',
    perDay: false,
    defaultUnitPrice: 9,
    maxQuantity: 3,
    isAvailable: () => true,
    getUnitPrice: () => 9,
  },
]

export const getExtraLineTotal = (
  extra: OfferExtraDefinition,
  car: bookcarsTypes.Car,
  quantity: number,
  days: number,
): number => {
  if (quantity <= 0) return 0
  const unit = extra.getUnitPrice(car)
  const multiplier = extra.perDay ? days : 1
  return unit * quantity * multiplier
}

export const getExtrasPayAtPickupTotal = (
  car: bookcarsTypes.Car,
  quantities: OfferExtraQuantities,
  days: number,
): number => OFFER_EXTRAS.reduce(
  (sum, extra) => sum + getExtraLineTotal(extra, car, quantities[extra.id], days),
  0,
)

export const hasSelectedExtras = (quantities: OfferExtraQuantities): boolean =>
  Object.values(quantities).some((qty) => qty > 0)

export const toCarOptions = (quantities: OfferExtraQuantities): bookcarsTypes.CarOptions => ({
  additionalDriver: quantities.additionalDriver > 0,
  cancellation: false,
  amendments: false,
  theftProtection: false,
  collisionDamageWaiver: false,
  fullInsurance: false,
})
