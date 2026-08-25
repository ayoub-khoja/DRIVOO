import { z } from 'zod'

const required = 'Champ requis'
const ibanInvalid = 'Le RIB doit contenir exactement 20 chiffres'

export const agencyProfileSchema = z.object({
  fullName: z.string().trim().min(2, required).max(120),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  bio: z.string().trim().max(500).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(80).optional(),
  governorate: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(12).optional(),
  taxId: z.string().trim().max(64).optional(),
  rneNumber: z.string().trim().max(64).optional(),
  iban: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{20}$/.test(value.replace(/\D/g, '')), { message: ibanInvalid }),
  legalRepFirstName: z.string().trim().max(80).optional(),
  legalRepLastName: z.string().trim().max(80).optional(),
  legalRepTitle: z.string().trim().max(80).optional(),
  legalRepCin: z.string().trim().max(16).optional(),
})

export type AgencyProfileFormFields = z.infer<typeof agencyProfileSchema>
