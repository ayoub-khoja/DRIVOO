import { z } from 'zod'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'

const required = 'Champ requis'
const emailInvalid = 'E-mail invalide'
const phoneInvalid = 'Téléphone invalide'
const birthDateInvalid = `Âge minimum : ${env.MINIMUM_AGE} ans`

const birthDateSchema = z.string().trim().min(1, required).refine((value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }
  const years = intervalToDuration({ start: date, end: new Date() }).years ?? 0
  return years >= env.MINIMUM_AGE
}, birthDateInvalid)

export const agencyBookingSchema = z.object({
  fullName: z.string().trim().min(2, required),
  email: z.string().trim().email(emailInvalid),
  phone: z.string().trim().refine((val) => validator.isMobilePhone(val), {
    message: phoneInvalid,
  }),
  birthDate: birthDateSchema,

  carId: z.string().trim().min(1, required),
  pickupLocationId: z.string().trim().min(1, required),
  dropOffLocationId: z.string().trim().min(1, required),
  from: z.string().trim().min(1, required),
  to: z.string().trim().min(1, required),

  status: z.enum(bookcarsHelper.getAllBookingStatuses() as [string, ...string[]]),

  cancellation: z.boolean().default(false),
  amendments: z.boolean().default(false),
  theftProtection: z.boolean().default(false),
  collisionDamageWaiver: z.boolean().default(false),
  fullInsurance: z.boolean().default(false),
  additionalDriver: z.boolean().default(false),

  additionalDriverFullName: z.string().trim().optional(),
  additionalDriverEmail: z.string().trim().email(emailInvalid).optional().or(z.literal('')),
  additionalDriverPhone: z.string().trim().optional(),
  additionalDriverBirthDate: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const from = new Date(data.from)
  const to = new Date(data.to)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de fin doit être après la date de début',
      path: ['to'],
    })
  }

  if (data.additionalDriver) {
    if (!data.additionalDriverFullName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: required, path: ['additionalDriverFullName'] })
    }
    if (!data.additionalDriverEmail?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: required, path: ['additionalDriverEmail'] })
    }
    if (!data.additionalDriverPhone?.trim() || !validator.isMobilePhone(data.additionalDriverPhone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneInvalid, path: ['additionalDriverPhone'] })
    }
    if (!data.additionalDriverBirthDate?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: required, path: ['additionalDriverBirthDate'] })
    } else {
      const date = new Date(data.additionalDriverBirthDate)
      const years = intervalToDuration({ start: date, end: new Date() }).years ?? 0
      if (Number.isNaN(date.getTime()) || years < env.MINIMUM_AGE) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: birthDateInvalid, path: ['additionalDriverBirthDate'] })
      }
    }
  }
})

export type AgencyBookingFormFields = z.infer<typeof agencyBookingSchema>
