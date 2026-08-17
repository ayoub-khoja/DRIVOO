import { z } from 'zod'

const required = 'Champ requis'

export const agencyBranchSchema = z.object({
  fullName: z.string().trim().min(2, required),
  email: z.string().trim().email('E-mail invalide'),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  governorate: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

export type AgencyBranchFormFields = z.infer<typeof agencyBranchSchema>
