import 'dotenv/config'
import * as bookcarsTypes from ':bookcars-types'
import * as carSearchScoreHelper from '../src/utils/carSearchScoreHelper'

const baseCar = (overrides: Partial<bookcarsTypes.Car> = {}): bookcarsTypes.Car => ({
  _id: 'car-1',
  name: 'Test Car',
  supplier: {
    _id: 'supplier-1',
    fullName: 'Supplier',
  } as bookcarsTypes.User,
  minimumAge: 21,
  locations: [],
  dailyPrice: 100,
  discountedDailyPrice: null,
  hourlyPrice: null,
  discountedHourlyPrice: null,
  biWeeklyPrice: null,
  discountedBiWeeklyPrice: null,
  weeklyPrice: null,
  discountedWeeklyPrice: null,
  monthlyPrice: null,
  discountedMonthlyPrice: null,
  isDateBasedPrice: false,
  dateBasedPrices: [],
  deposit: 500,
  available: true,
  fullyBooked: false,
  comingSoon: false,
  type: bookcarsTypes.CarType.Diesel,
  gearbox: bookcarsTypes.GearboxType.Automatic,
  aircon: true,
  seats: 5,
  doors: 4,
  fuelPolicy: bookcarsTypes.FuelPolicy.LikeForLike,
  mileage: -1,
  cancellation: 0,
  amendments: -1,
  theftProtection: -1,
  collisionDamageWaiver: -1,
  fullInsurance: -1,
  additionalDriver: -1,
  range: '',
  multimedia: [],
  rating: 4.5,
  trips: 20,
  ...overrides,
})

describe('carSearchScoreHelper', () => {
  it('should rank cheaper highly-rated available cars first', () => {
    const from = new Date('2026-09-01T10:00:00.000Z')
    const to = new Date('2026-09-04T10:00:00.000Z')

    const expensive = baseCar({
      _id: 'expensive',
      dailyPrice: 200,
      rating: 3,
      trips: 2,
    })
    const best = baseCar({
      _id: 'best',
      dailyPrice: 80,
      discountedDailyPrice: 70,
      rating: 4.8,
      trips: 50,
      deposit: 0,
      cancellation: 0,
    })

    const ranked = carSearchScoreHelper.rankCars([expensive, best], { from, to })

    expect(ranked[0]._id).toBe('best')
    expect(ranked[0].searchScore).toBeGreaterThan(ranked[1].searchScore)
  })

  it('should apply supplier car limits after scoring', () => {
    const from = new Date('2026-09-01T10:00:00.000Z')
    const to = new Date('2026-09-04T10:00:00.000Z')

    const cars = [
      baseCar({ _id: 'car-a', dailyPrice: 120, supplier: { _id: 'supplier-1', supplierCarLimit: 1 } as bookcarsTypes.User }),
      baseCar({ _id: 'car-b', dailyPrice: 60, supplier: { _id: 'supplier-1', supplierCarLimit: 1 } as bookcarsTypes.User }),
      baseCar({ _id: 'car-c', dailyPrice: 90, supplier: { _id: 'supplier-2', supplierCarLimit: 2 } as bookcarsTypes.User }),
    ]

    const ranked = carSearchScoreHelper.rankCars(cars, { from, to })
    const supplierOneCars = ranked.filter((car) => car.supplier._id === 'supplier-1')

    expect(supplierOneCars).toHaveLength(1)
    expect(supplierOneCars[0]._id).toBe('car-b')
  })

  it('should boost cars when agency reviews are available', () => {
    const from = new Date('2026-09-01T10:00:00.000Z')
    const to = new Date('2026-09-04T10:00:00.000Z')

    const car = baseCar({ dailyPrice: 100, rating: 4 })
    const withoutReviews = carSearchScoreHelper.computeCarSearchScore(car, {
      minPrice: 100,
      maxPrice: 100,
    })
    const withReviews = carSearchScoreHelper.computeCarSearchScore(car, {
      minPrice: 100,
      maxPrice: 100,
      agencyReview: { avgRating: 5, count: 12 },
    })

    expect(withReviews).toBeGreaterThan(withoutReviews)
  })
})
