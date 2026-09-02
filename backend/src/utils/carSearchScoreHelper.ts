import * as bookcarsTypes from ':bookcars-types'
import * as helper from './helper'

export interface CarSearchScoreWeights {
  price: number
  rating: number
  availability: number
  trust: number
  value: number
}

export const DEFAULT_SCORE_WEIGHTS: CarSearchScoreWeights = {
  price: 0.35,
  rating: 0.25,
  availability: 0.20,
  trust: 0.10,
  value: 0.10,
}

export interface AgencyReviewStats {
  avgRating: number
  count: number
}

export interface RankCarsOptions {
  from: Date
  to: Date
  reviewMap?: Map<string, AgencyReviewStats>
  weights?: CarSearchScoreWeights
}

export interface ScoredCar extends bookcarsTypes.Car {
  searchScore: number
  effectiveDailyPrice: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeRange = (value: number, min: number, max: number) => {
  if (max <= min) {
    return 100
  }
  return clamp(((max - value) / (max - min)) * 100, 0, 100)
}

const getDailyRateForDate = (car: bookcarsTypes.Car, date: Date): number => {
  let rate = car.discountedDailyPrice || car.dailyPrice || 0

  if (car.isDateBasedPrice && car.dateBasedPrices?.length) {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)

    for (const dateBasedPrice of car.dateBasedPrices) {
      const startDate = new Date(dateBasedPrice.startDate!)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateBasedPrice.endDate!)
      endDate.setHours(0, 0, 0, 0)

      if (day.getTime() >= startDate.getTime() && day.getTime() <= endDate.getTime()) {
        rate = Number(dateBasedPrice.dailyPrice)
        break
      }
    }
  }

  return rate
}

export const getEffectiveDailyPrice = (car: bookcarsTypes.Car, from: Date, to: Date): number => {
  const rentalDays = helper.days(from, to)

  if (rentalDays <= 0) {
    return car.discountedDailyPrice || car.dailyPrice || 0
  }

  if (car.isDateBasedPrice && car.dateBasedPrices?.length) {
    let total = 0
    const currentDate = new Date(from)
    currentDate.setHours(0, 0, 0, 0)

    for (let day = 1; day <= rentalDays; day += 1) {
      total += getDailyRateForDate(car, currentDate)
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(0, 0, 0, 0)
    }

    return total / rentalDays
  }

  return car.discountedDailyPrice || car.dailyPrice || 0
}

export const computeCarSearchScore = (
  car: bookcarsTypes.Car,
  context: {
    minPrice: number
    maxPrice: number
    agencyReview?: AgencyReviewStats
    weights?: CarSearchScoreWeights
  },
): number => {
  const weights = context.weights || DEFAULT_SCORE_WEIGHTS
  const effectiveDailyPrice = car.discountedDailyPrice || car.dailyPrice || 0

  const priceScore = normalizeRange(effectiveDailyPrice, context.minPrice, context.maxPrice)

  const carRating = clamp(car.rating || 0, 0, 5)
  const agencyRating = clamp(context.agencyReview?.avgRating || 0, 0, 5)
  const agencyWeight = context.agencyReview?.count ? 0.4 : 0
  const carWeight = 1 - agencyWeight
  const ratingScore = ((carRating * carWeight + agencyRating * agencyWeight) / 5) * 100

  let availabilityScore = 30
  if (car.available && !car.fullyBooked && !car.comingSoon) {
    availabilityScore = 100
  } else if (car.available && !car.fullyBooked) {
    availabilityScore = 75
  } else if (car.available) {
    availabilityScore = 50
  }

  const trips = car.trips || 0
  const trustScore = clamp((Math.log10(trips + 1) / Math.log10(101)) * 100, 0, 100)

  let valueScore = 40
  if (car.mileage === -1) {
    valueScore += 25
  }
  if ((car.deposit || 0) === 0) {
    valueScore += 15
  }
  if (car.cancellation === 0) {
    valueScore += 15
  }
  if (car.fullInsurance === 0) {
    valueScore += 5
  }
  valueScore = clamp(valueScore, 0, 100)

  return (
    priceScore * weights.price
    + ratingScore * weights.rating
    + availabilityScore * weights.availability
    + trustScore * weights.trust
    + valueScore * weights.value
  )
}

export const rankCars = (
  cars: bookcarsTypes.Car[],
  options: RankCarsOptions,
): ScoredCar[] => {
  if (cars.length === 0) {
    return []
  }

  const effectivePrices = cars.map((car) => ({
    car,
    effectiveDailyPrice: getEffectiveDailyPrice(car, options.from, options.to),
  }))

  const minPrice = Math.min(...effectivePrices.map((entry) => entry.effectiveDailyPrice))
  const maxPrice = Math.max(...effectivePrices.map((entry) => entry.effectiveDailyPrice))

  const scoredCars = effectivePrices.map(({ car, effectiveDailyPrice }) => {
    const supplierId = car.supplier?._id?.toString?.() || String(car.supplier?._id || '')
    const agencyReview = supplierId ? options.reviewMap?.get(supplierId) : undefined
    const searchScore = computeCarSearchScore(
      { ...car, discountedDailyPrice: effectiveDailyPrice, dailyPrice: effectiveDailyPrice },
      {
        minPrice,
        maxPrice,
        agencyReview,
        weights: options.weights,
      },
    )

    return {
      ...car,
      effectiveDailyPrice,
      searchScore,
    }
  })

  const carsBySupplier = new Map<string, ScoredCar[]>()

  for (const car of scoredCars) {
    const supplierId = car.supplier?._id?.toString?.() || String(car.supplier?._id || 'unknown')
    const supplierCars = carsBySupplier.get(supplierId) || []
    supplierCars.push(car)
    carsBySupplier.set(supplierId, supplierCars)
  }

  const limitedCars: ScoredCar[] = []

  for (const supplierCars of carsBySupplier.values()) {
    const sortedSupplierCars = [...supplierCars].sort((a, b) => {
      if (b.searchScore !== a.searchScore) {
        return b.searchScore - a.searchScore
      }
      return String(a._id).localeCompare(String(b._id))
    })

    const supplierLimit = sortedSupplierCars[0]?.supplier?.supplierCarLimit
    const maxAllowedCars = supplierLimit === 0
      ? 0
      : supplierLimit ?? Number.MAX_SAFE_INTEGER

    limitedCars.push(...sortedSupplierCars.slice(0, maxAllowedCars))
  }

  return limitedCars.sort((a, b) => {
    if (b.searchScore !== a.searchScore) {
      return b.searchScore - a.searchScore
    }
    if (a.effectiveDailyPrice !== b.effectiveDailyPrice) {
      return a.effectiveDailyPrice - b.effectiveDailyPrice
    }
    return String(a._id).localeCompare(String(b._id))
  })
}
