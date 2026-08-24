import { z } from 'zod'

const required = 'Champ requis'

/**
 * One billable line of the invoice. `total` is not part of the form: it is derived
 * from quantity x unitPrice for the live preview, and recomputed server side on save.
 */
export const agencyInvoiceLineSchema = z.object({
  designation: z.string().trim().min(2, required).max(240),
  contractNumber: z.string().trim().max(40).optional(),
  vehicleLabel: z.string().trim().max(160).optional(),
  periodFrom: z.string().trim().optional(),
  periodTo: z.string().trim().optional(),
  quantity: z.coerce.number().min(0, 'Valeur invalide'),
  unitPrice: z.coerce.number().min(0, 'Valeur invalide'),
})

export const agencyInvoicePaymentsSchema = z.object({
  cash: z.coerce.number().min(0, 'Valeur invalide'),
  cheque: z.coerce.number().min(0, 'Valeur invalide'),
  draft: z.coerce.number().min(0, 'Valeur invalide'),
  card: z.coerce.number().min(0, 'Valeur invalide'),
  transfer: z.coerce.number().min(0, 'Valeur invalide'),
})

export const agencyInvoiceSchema = z.object({
  clientCode: z.string().trim().max(40).optional(),
  clientName: z.string().trim().min(2, required).max(120),
  clientIdNumber: z.string().trim().max(40).optional(),
  clientPhone: z.string().trim().max(32).optional(),
  clientAddress: z.string().trim().max(240).optional(),
  issueCity: z.string().trim().max(80).optional(),
  issueDate: z.string().trim().min(1, required),
  object: z.string().trim().max(300).optional(),
  lines: z.array(agencyInvoiceLineSchema).min(1, required),
  discount: z.coerce.number().min(0, 'Valeur invalide'),
  vatRate: z.coerce.number().min(0, 'Valeur invalide').max(100, 'Valeur invalide'),
  stampDuty: z.coerce.number().min(0, 'Valeur invalide'),
  payments: agencyInvoicePaymentsSchema,
  notes: z.string().trim().max(500).optional(),
})

export type AgencyInvoiceFormFields = z.infer<typeof agencyInvoiceSchema>
export type AgencyInvoiceLineFields = z.infer<typeof agencyInvoiceLineSchema>
