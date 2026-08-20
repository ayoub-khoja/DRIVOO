import { z } from 'zod'

const required = 'Champ requis'

export const agencyReceiptSchema = z.object({
  clientName: z.string().trim().min(2, required),
  clientEmail: z.string().trim().email('E-mail invalide').optional().or(z.literal('')),
  clientPhone: z.string().trim().optional(),
  vehicleLabel: z.string().trim().optional(),
  description: z.string().trim().min(3, required),
  amount: z.coerce.number().positive('Montant invalide'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'cheque']),
  paidAt: z.string().trim().min(1, required),
  notes: z.string().trim().optional(),
})

export type AgencyReceiptFormFields = z.infer<typeof agencyReceiptSchema>
