import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'

const required = 'Champ requis'

export const agencyCarSchema = z.object({
  brand: z.string().min(1, required),
  model: z.string().min(1, required),
  year: z.string().min(4, 'Année invalide').refine((v) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 1980 && n <= new Date().getFullYear() + 1
  }, 'Année invalide'),
  range: z.string().min(1, required),
  images: z.array(z.string().min(1)).min(1, 'Au moins une photo est obligatoire').max(8, 'Maximum 8 photos'),

  licensePlate: z.string().min(1, required),
  chassisNumber: z.string().min(1, required),
  registrationDoc: z.string().optional(),

  gearbox: z.nativeEnum(bookcarsTypes.GearboxType),
  type: z.string().min(1, required),
  seats: z.string().min(1, required),
  doors: z.string().min(1, required),
  aircon: z.boolean(),

  insuranceExpiry: z.string().min(1, required),
  technicalVisitExpiry: z.string().min(1, required),
  nextOilChange: z.string().min(1, required),

  deliveryType: z.nativeEnum(bookcarsTypes.DeliveryType),
  locationName: z.string().min(2, 'Indiquez le lieu de prise en charge'),

  dailyPrice: z.string().min(1, required).refine((v) => Number(v) > 0, 'Prix invalide'),
  discountedDailyPrice: z.string().optional(),
  deposit: z.string().min(1, required).refine((v) => Number(v) >= 0, 'Caution invalide'),
  mileage: z.string().min(1, required),
  available: z.boolean(),
})

export type AgencyCarFormFields = z.infer<typeof agencyCarSchema>

export const STEPS = [
  'basic',
  'admin',
  'ops',
  'maintenance',
  'location',
  'pricing',
] as const

export type AgencyCarStep = typeof STEPS[number]

export const stepFields: Record<AgencyCarStep, (keyof AgencyCarFormFields)[]> = {
  basic: ['brand', 'model', 'year', 'range', 'images'],
  admin: ['licensePlate', 'chassisNumber', 'registrationDoc'],
  ops: ['gearbox', 'type', 'seats', 'doors', 'aircon'],
  maintenance: ['insuranceExpiry', 'technicalVisitExpiry', 'nextOilChange'],
  location: ['deliveryType', 'locationName'],
  pricing: ['dailyPrice', 'discountedDailyPrice', 'deposit', 'mileage', 'available'],
}
