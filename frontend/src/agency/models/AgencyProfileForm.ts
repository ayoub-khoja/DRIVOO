import { z } from 'zod'

const required = 'Champ requis'

export const agencyProfileSchema = z.object({
  fullName: z.string().trim().min(2, required).max(120),
  phone: z.string().trim().max(32).optional(),
  phone2: z.string().trim().max(32).optional(),
  phone3: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  website: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(500).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(80).optional(),
  governorate: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(12).optional(),
  taxId: z.string().trim().max(64).optional(),
  rneNumber: z.string().trim().max(64).optional(),
  iban: z.string().trim().max(64).optional(),
  legalRepFirstName: z.string().trim().max(80).optional(),
  legalRepLastName: z.string().trim().max(80).optional(),
  legalRepTitle: z.string().trim().max(80).optional(),
  legalRepCin: z.string().trim().max(16).optional(),
  // Invoicing defaults, applied by the backend when an invoice is created
  invoicePrefix: z.string().trim().max(8).optional(),
  invoiceVatRate: z.coerce.number().min(0).max(100).optional(),
  invoiceStampDuty: z.coerce.number().min(0).max(1000).optional(),
})

export type AgencyProfileFormFields = z.infer<typeof agencyProfileSchema>
