import { z } from 'zod'

const required = 'Champ requis'
const invalid = 'Valeur invalide'

/** Driver / co-driver identity block. */
export const agencyContractPartySchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  birthDate: z.string().trim().max(32).optional(),
  idNumber: z.string().trim().max(40).optional(),
  nationality: z.string().trim().max(60).optional(),
  licenseNumber: z.string().trim().max(40).optional(),
  licenseIssuedAt: z.string().trim().max(32).optional(),
  address: z.string().trim().max(240).optional(),
  phone: z.string().trim().max(32).optional(),
})

export const agencyContractSupplementSchema = z.object({
  label: z.string().trim().min(2, required).max(160),
  priceHT: z.coerce.number().min(0, invalid),
  vatRate: z.coerce.number().min(0, invalid).max(100, invalid),
})

export const agencyContractPaymentSchema = z.object({
  date: z.string().trim().optional(),
  amount: z.coerce.number().min(0, invalid),
  method: z.string().trim().min(1, required).max(40),
  status: z.string().trim().max(40).optional(),
})

export const agencyContractSchema = z.object({
  issueCity: z.string().trim().max(80).optional(),
  issueDate: z.string().trim().min(1, required),

  // Vehicle
  vehicleModel: z.string().trim().min(2, required).max(120),
  vehiclePlate: z.string().trim().min(1, required).max(40),
  vehicleCategory: z.string().trim().max(60).optional(),
  vehicleFuel: z.string().trim().max(40).optional(),

  // Parties — the main driver is the only mandatory one
  driver: agencyContractPartySchema.extend({
    fullName: z.string().trim().min(2, required).max(120),
  }),
  secondDriver: agencyContractPartySchema,

  // Rental window
  departureDate: z.string().trim().min(1, required),
  departurePlace: z.string().trim().max(160).optional(),
  departureKm: z.coerce.number().min(0, invalid),
  departureFuel: z.string().trim().max(40).optional(),
  returnDate: z.string().trim().min(1, required),
  returnPlace: z.string().trim().max(160).optional(),
  returnKm: z.coerce.number().min(0, invalid).optional(),
  returnFuel: z.string().trim().max(40).optional(),

  // Mileage and excess pricing
  kmLimitPerDay: z.coerce.number().min(0, invalid).optional(),
  extraKmPrice: z.coerce.number().min(0, invalid).optional(),
  extraHourPrice: z.coerce.number().min(0, invalid).optional(),
  extraDayPrice: z.coerce.number().min(0, invalid).optional(),

  // Money
  rentalHT: z.coerce.number().min(0, invalid),
  vatRate: z.coerce.number().min(0, invalid).max(100, invalid),
  deposit: z.coerce.number().min(0, invalid),
  depositReason: z.string().trim().max(240).optional(),

  supplements: z.array(agencyContractSupplementSchema),
  payments: z.array(agencyContractPaymentSchema),
  checklist: z.array(z.object({ key: z.string(), ok: z.boolean() })),

  notes: z.string().trim().max(500).optional(),
}).refine(
  (values) => !values.departureDate || !values.returnDate || values.returnDate >= values.departureDate,
  { message: 'La date de retour précède la date de départ', path: ['returnDate'] },
)

export type AgencyContractFormFields = z.infer<typeof agencyContractSchema>
export type AgencyContractSupplementFields = z.infer<typeof agencyContractSupplementSchema>
export type AgencyContractPaymentFields = z.infer<typeof agencyContractPaymentSchema>
