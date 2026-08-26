import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const create = (data: bookcarsTypes.CreateCarPayload): Promise<bookcarsTypes.Car> =>
  agencyAxiosInstance
    .post('/api/create-car', data)
    .then((res) => res.data)

export const update = (data: bookcarsTypes.UpdateCarPayload): Promise<bookcarsTypes.Car> =>
  agencyAxiosInstance
    .put('/api/update-car', data)
    .then((res) => res.data)

export const getCar = (id: string, language = 'fr'): Promise<bookcarsTypes.Car> =>
  agencyAxiosInstance
    .get(`/api/car/${encodeURIComponent(id)}/${encodeURIComponent(language)}`)
    .then((res) => res.data)

export const createImage = (file: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  return agencyAxiosInstance
    .post('/api/create-car-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export const deleteTempImage = (image: string): Promise<number> =>
  agencyAxiosInstance
    .post(`/api/delete-temp-car-image/${encodeURIComponent(image)}`)
    .then((res) => res.status)

export const validateLicensePlate = (licensePlate: string): Promise<number> =>
  agencyAxiosInstance
    .get(`/api/validate-license-plate/${encodeURIComponent(licensePlate)}`)
    .then((res) => res.status)

export const getCars = (
  keyword: string,
  data: bookcarsTypes.GetCarsPayload,
  page: number,
  size: number,
): Promise<bookcarsTypes.Result<bookcarsTypes.Car>> =>
  agencyAxiosInstance
    .post(`/api/cars/${page}/${size}/?s=${encodeURIComponent(keyword)}`, data)
    .then((res) => res.data)

export const deleteCar = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/delete-car/${encodeURIComponent(id)}`)
    .then((res) => res.status)

export const updateAvailability = (
  id: string,
  available: boolean,
): Promise<bookcarsTypes.Car> =>
  agencyAxiosInstance
    .put(`/api/agency/car/${encodeURIComponent(id)}/availability`, { available })
    .then((res) => res.data)

/** Build a full update payload from an existing car + partial edits. */
export const buildUpdatePayload = (
  car: bookcarsTypes.Car,
  agencyId: string,
  patch: Partial<{
    brand: string
    model: string
    year: number
    licensePlate: string
    dailyPrice: number
    discountedDailyPrice: number | null
    deposit: number
    mileage: number
    available: boolean
    seats: number
    doors: number
    aircon: boolean
    type: string
    gearbox: string
    range: string
  }>,
): bookcarsTypes.UpdateCarPayload => {
  const supplierId = typeof car.supplier === 'object' && car.supplier
    ? String(car.supplier._id)
    : String(car.supplier || agencyId)

  const locationIds = (car.locations || []).map((loc) =>
    (typeof loc === 'object' && loc ? String(loc._id) : String(loc)))

  return {
    _id: car._id,
    loggedUser: agencyId,
    supplier: supplierId,
    name: `${(patch.brand ?? car.brand ?? '').trim()} ${(patch.model ?? car.model ?? '').trim()}`.trim() || car.name,
    brand: patch.brand ?? car.brand,
    model: patch.model ?? car.model,
    year: patch.year ?? car.year,
    licensePlate: patch.licensePlate ?? car.licensePlate,
    chassisNumber: car.chassisNumber,
    registrationDoc: car.registrationDoc,
    insuranceExpiry: car.insuranceExpiry,
    technicalVisitExpiry: car.technicalVisitExpiry,
    nextOilChange: car.nextOilChange,
    deliveryType: car.deliveryType,
    minimumAge: car.minimumAge,
    locations: locationIds,
    image: car.image,
    images: car.images,
    range: patch.range ?? car.range,
    type: patch.type ?? car.type,
    gearbox: patch.gearbox ?? car.gearbox,
    seats: patch.seats ?? car.seats,
    doors: patch.doors ?? car.doors,
    aircon: patch.aircon ?? car.aircon,
    dailyPrice: patch.dailyPrice ?? car.dailyPrice,
    discountedDailyPrice: patch.discountedDailyPrice !== undefined
      ? patch.discountedDailyPrice
      : car.discountedDailyPrice,
    deposit: patch.deposit ?? car.deposit,
    mileage: patch.mileage ?? car.mileage,
    available: patch.available ?? car.available,
    fullyBooked: car.fullyBooked,
    comingSoon: car.comingSoon,
    hourlyPrice: car.hourlyPrice,
    discountedHourlyPrice: car.discountedHourlyPrice,
    biWeeklyPrice: car.biWeeklyPrice,
    discountedBiWeeklyPrice: car.discountedBiWeeklyPrice,
    weeklyPrice: car.weeklyPrice,
    discountedWeeklyPrice: car.discountedWeeklyPrice,
    monthlyPrice: car.monthlyPrice,
    discountedMonthlyPrice: car.discountedMonthlyPrice,
    isDateBasedPrice: car.isDateBasedPrice,
    dateBasedPrices: (car.dateBasedPrices || []).map((row) => ({
      _id: row._id,
      startDate: row.startDate,
      endDate: row.endDate,
      dailyPrice: row.dailyPrice,
    })),
    fuelPolicy: car.fuelPolicy,
    cancellation: car.cancellation,
    amendments: car.amendments,
    theftProtection: car.theftProtection,
    collisionDamageWaiver: car.collisionDamageWaiver,
    fullInsurance: car.fullInsurance,
    additionalDriver: car.additionalDriver,
    multimedia: car.multimedia || [],
    blockOnPay: car.blockOnPay,
  }
}
