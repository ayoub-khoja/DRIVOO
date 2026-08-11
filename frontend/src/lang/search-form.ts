import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    PICK_UP_DATE: 'Date de prise en charge',
    DROP_OFF_DATE: 'Date de retour',
    DROP_OFF: 'Restituer la voiture à un autre endroit',
    MIN_PICK_UP_HOURS_ERROR: "L'heure de retrait doit être prévue quelques heures à l'avance",
    MIN_RENTAL_HOURS_ERROR: 'La durée de location est trop courte',
    INVALID_PICK_UP_TIME: 'Heure de prise en charge invalide',
    INVALID_DROP_OFF_TIME: 'Heure de restitution invalide',
  },
  en: {
    PICK_UP_DATE: 'Pick-up Date',
    DROP_OFF_DATE: 'Drop-off Date',
    DROP_OFF: 'Return the car to another location',
    MIN_PICK_UP_HOURS_ERROR: 'Pick-up time must be at least a few hours in the future',
    MIN_RENTAL_HOURS_ERROR: 'Rental duration is too short',
    INVALID_PICK_UP_TIME: 'Invalid pick-up time',
    INVALID_DROP_OFF_TIME: 'Invalid drop-off time',
  },
  ar: {
    PICK_UP_DATE: 'تاريخ الاستلام',
    DROP_OFF_DATE: 'تاريخ التسليم',
    DROP_OFF: 'تسليم السيارة في مكان آخر',
    MIN_PICK_UP_HOURS_ERROR: 'يجب جدولة وقت الاستلام قبل عدة ساعات على الأقل',
    MIN_RENTAL_HOURS_ERROR: 'مدة الإيجار قصيرة جدًا',
    INVALID_PICK_UP_TIME: 'وقت الاستلام غير صالح',
    INVALID_DROP_OFF_TIME: 'وقت التسليم غير صالح',
  },
})

langHelper.setLanguage(strings)
export { strings }
