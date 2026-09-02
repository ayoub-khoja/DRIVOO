import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'

export interface SearchFacets {
  gearbox: Record<string, number>
  suppliers: Record<string, number>
  mileage: Record<string, number>
  ranges: Record<string, number>
  carType: Record<string, number>
  fuelPolicy: Record<string, number>
  seats: Record<string, number>
  rating: Record<string, number>
  deposit: Record<string, number>
  pricePerDay: Record<string, number>
  deliveryType: Record<string, number>
  specs: { aircon: number; fourPlusDoors: number; additionalDriver: number }
  total: number
}

export type PriceBucket = '0-50' | '50-100' | '100-150' | '150-200' | '200+'

export const PRICE_BUCKETS: PriceBucket[] = ['0-50', '50-100', '100-150', '150-200', '200+']

export const getDailyPrice = (car: bookcarsTypes.Car): number =>
  car.discountedDailyPrice || car.dailyPrice || 0

export const getPriceBucket = (dailyPrice: number): PriceBucket => {
  if (dailyPrice < 50) return '0-50'
  if (dailyPrice < 100) return '50-100'
  if (dailyPrice < 150) return '100-150'
  if (dailyPrice < 200) return '150-200'
  return '200+'
}

export const getDepositBucket = (deposit: number): string => {
  if (deposit <= 300) return '0-300'
  if (deposit <= 600) return '300-600'
  return '600+'
}

export const computeSearchFacets = (cars: bookcarsTypes.Car[]): SearchFacets => {
  const facets: SearchFacets = {
    gearbox: {},
    suppliers: {},
    mileage: {},
    ranges: {},
    carType: {},
    fuelPolicy: {},
    seats: {},
    rating: {},
    deposit: {},
    pricePerDay: {},
    deliveryType: {},
    specs: { aircon: 0, fourPlusDoors: 0, additionalDriver: 0 },
    total: cars.length,
  }

  for (const car of cars) {
    facets.gearbox[car.gearbox] = (facets.gearbox[car.gearbox] || 0) + 1

    const supplierId = car.supplier?._id?.toString?.() || String(car.supplier?._id || '')
    if (supplierId) {
      facets.suppliers[supplierId] = (facets.suppliers[supplierId] || 0) + 1
    }

    const mileageKey = car.mileage === -1 ? bookcarsTypes.Mileage.Unlimited : bookcarsTypes.Mileage.Limited
    facets.mileage[mileageKey] = (facets.mileage[mileageKey] || 0) + 1

    if (car.range) {
      facets.ranges[car.range] = (facets.ranges[car.range] || 0) + 1
    }

    if (car.type) {
      facets.carType[car.type] = (facets.carType[car.type] || 0) + 1
    }

    if (car.fuelPolicy) {
      facets.fuelPolicy[car.fuelPolicy] = (facets.fuelPolicy[car.fuelPolicy] || 0) + 1
    }

    const seatKey = car.seats > 5 ? '6+' : '5'
    facets.seats[seatKey] = (facets.seats[seatKey] || 0) + 1

    if ((car.rating || 0) >= 4) {
      facets.rating['8+'] = (facets.rating['8+'] || 0) + 1
    }
    if ((car.rating || 0) >= 3.5) {
      facets.rating['7+'] = (facets.rating['7+'] || 0) + 1
    }

    const depositBucket = getDepositBucket(car.deposit || 0)
    facets.deposit[depositBucket] = (facets.deposit[depositBucket] || 0) + 1

    const priceBucket = getPriceBucket(getDailyPrice(car))
    facets.pricePerDay[priceBucket] = (facets.pricePerDay[priceBucket] || 0) + 1

    const deliveryKey = car.deliveryType || bookcarsTypes.DeliveryType.Office
    facets.deliveryType[deliveryKey] = (facets.deliveryType[deliveryKey] || 0) + 1

    if (car.aircon) facets.specs.aircon += 1
    if (car.doors >= 4) facets.specs.fourPlusDoors += 1
    if (car.additionalDriver >= 0) facets.specs.additionalDriver += 1
  }

  return facets
}

export const getMinPrice = (cars: bookcarsTypes.Car[]): number => {
  if (cars.length === 0) return 0
  return Math.min(...cars.map(getDailyPrice))
}

export type CarSortOption = 'recommended' | 'priceAsc' | 'priceDesc' | 'ratingDesc'

export const sortCars = (
  cars: bookcarsTypes.Car[],
  sortBy: CarSortOption,
): bookcarsTypes.Car[] => {
  const sorted = [...cars]

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return getDailyPrice(a) - getDailyPrice(b)
      case 'priceDesc':
        return getDailyPrice(b) - getDailyPrice(a)
      case 'ratingDesc':
        return (b.rating || 0) - (a.rating || 0)
      case 'recommended':
      default:
        return (b.searchScore || 0) - (a.searchScore || 0)
    }
  })

  return sorted
}

export const filterCarsByPriceBuckets = (
  cars: bookcarsTypes.Car[],
  buckets: PriceBucket[],
): bookcarsTypes.Car[] => {
  if (buckets.length === 0) return cars
  return cars.filter((car) => buckets.includes(getPriceBucket(getDailyPrice(car))))
}

export const filterCarsByDeliveryTypes = (
  cars: bookcarsTypes.Car[],
  types: string[],
): bookcarsTypes.Car[] => {
  if (types.length === 0) return cars
  return cars.filter((car) => types.includes(car.deliveryType || bookcarsTypes.DeliveryType.Office))
}

export const getSimilarCategoryLabel = (range: string, language: string): string => {
  const labels: Record<string, Record<string, string>> = {
    fr: {
      mini: 'ou petite voiture similaire',
      midi: 'ou voiture moyenne similaire',
      maxi: 'ou grande voiture similaire',
      scooter: 'ou scooter similaire',
      bus: 'ou minibus similaire',
      truck: 'ou utilitaire similaire',
      caravan: 'ou camping-car similaire',
    },
    en: {
      mini: 'or similar small car',
      midi: 'or similar medium car',
      maxi: 'or similar large car',
      scooter: 'or similar scooter',
      bus: 'or similar minibus',
      truck: 'or similar van',
      caravan: 'or similar caravan',
    },
  }
  const lang = labels[language] ? language : 'en'
  return labels[lang][range] || labels.en.mini
}

export const formatBookingRating = (rating?: number): string => {
  if (!rating) return ''
  return (rating * 2).toFixed(1)
}

export const getRatingLabel = (rating?: number, language = 'fr'): string => {
  const score = (rating || 0) * 2
  if (language === 'fr') {
    if (score >= 8) return 'Très bien'
    if (score >= 7) return 'Bien'
    return 'Correct'
  }
  if (score >= 8) return 'Very good'
  if (score >= 7) return 'Good'
  return 'Fair'
}
