import { z } from 'zod'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import env from '@/config/env.config'

export const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().refine((value) => !!value && validator.isEmail(value), { message: commonStrings.EMAIL_NOT_VALID }),
  phone: z.string().refine((value) => !!value && validator.isMobilePhone(value), { message: commonStrings.PHONE_NOT_VALID }),
  birthDate: z.date().refine((value) => {
    const sub = intervalToDuration({ start: value, end: new Date() }).years ?? 0
    return sub >= env.MINIMUM_AGE
  }, { message: commonStrings.BIRTH_DATE_NOT_VALID }),
  password: z.string().min(env.PASSWORD_MIN_LENGTH, { message: commonStrings.PASSWORD_ERROR }),
  confirmPassword: z.string(),
  tos: z.boolean().refine((value) => value, { message: commonStrings.TOS_ERROR })
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: commonStrings.PASSWORDS_DONT_MATCH,
})

export type FormFields = z.infer<typeof schema>

const requiredString = (message: string) => z.string().trim().min(1, { message })

export const supplierCompanySchema = z.object({
  fullName: requiredString(strings.REQUIRED_FIELD),
  taxId: requiredString(strings.REQUIRED_FIELD),
  rneNumber: requiredString(strings.REQUIRED_FIELD),
  rneDocument: requiredString(strings.RNE_DOC_REQUIRED),
})

export const supplierAddressBankSchema = z.object({
  address: requiredString(strings.REQUIRED_FIELD),
  city: requiredString(strings.REQUIRED_FIELD),
  governorate: requiredString(strings.REQUIRED_FIELD),
  postalCode: requiredString(strings.REQUIRED_FIELD).regex(/^\d{4,5}$/, { message: strings.POSTAL_CODE_INVALID }),
  iban: requiredString(strings.REQUIRED_FIELD).min(15, { message: strings.IBAN_INVALID }),
})

export const supplierContactSchema = z.object({
  legalRepFirstName: requiredString(strings.REQUIRED_FIELD),
  legalRepLastName: requiredString(strings.REQUIRED_FIELD),
  legalRepTitle: requiredString(strings.REQUIRED_FIELD),
  legalRepCin: requiredString(strings.REQUIRED_FIELD).regex(/^\d{8}$/, { message: strings.CIN_INVALID }),
  phone: z.string().refine((value) => !!value && validator.isMobilePhone(value), { message: commonStrings.PHONE_NOT_VALID }),
  whatsapp: z.string().refine((value) => !!value && validator.isMobilePhone(value), { message: commonStrings.PHONE_NOT_VALID }),
  email: z.string().refine((value) => !!value && validator.isEmail(value), { message: commonStrings.EMAIL_NOT_VALID }),
  tos: z.boolean().refine((value) => value, { message: commonStrings.TOS_ERROR }),
})

export const supplierAccountSchema = z.object({
  password: z.string().min(env.PASSWORD_MIN_LENGTH, { message: commonStrings.PASSWORD_ERROR }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: commonStrings.PASSWORDS_DONT_MATCH,
})

/** Full agency / supplier self-registration payload. */
export const supplierSchema = supplierCompanySchema
  .merge(supplierAddressBankSchema)
  .merge(supplierContactSchema)
  .merge(z.object({
    password: z.string().min(env.PASSWORD_MIN_LENGTH, { message: commonStrings.PASSWORD_ERROR }),
    confirmPassword: z.string(),
  }))
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: commonStrings.PASSWORDS_DONT_MATCH,
  })

export type SupplierFormFields = z.infer<typeof supplierSchema>
export type SupplierCompanyFields = z.infer<typeof supplierCompanySchema>
export type SupplierAddressBankFields = z.infer<typeof supplierAddressBankSchema>
export type SupplierContactFields = z.infer<typeof supplierContactSchema>
export type SupplierAccountFields = z.infer<typeof supplierAccountSchema>
