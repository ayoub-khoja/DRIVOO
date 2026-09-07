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
  es: {
    PICK_UP_DATE: 'Fecha de recogida',
    DROP_OFF_DATE: 'Fecha de devolución',
    DROP_OFF: 'Devolver el coche en otro lugar',
    MIN_PICK_UP_HOURS_ERROR: 'La hora de recogida debe ser con al menos unas horas de antelación',
    MIN_RENTAL_HOURS_ERROR: 'La duración del alquiler es demasiado corta',
    INVALID_PICK_UP_TIME: 'Hora de recogida no válida',
    INVALID_DROP_OFF_TIME: 'Hora de devolución no válida',
  },
  it: {
    PICK_UP_DATE: 'Data di ritiro',
    DROP_OFF_DATE: 'Data di riconsegna',
    DROP_OFF: "Riconsegnare l'auto in un altro luogo",
    MIN_PICK_UP_HOURS_ERROR: "L'orario di ritiro deve essere almeno qualche ora nel futuro",
    MIN_RENTAL_HOURS_ERROR: 'La durata del noleggio è troppo breve',
    INVALID_PICK_UP_TIME: 'Orario di ritiro non valido',
    INVALID_DROP_OFF_TIME: 'Orario di riconsegna non valido',
  },
  de: {
    PICK_UP_DATE: 'Abholdatum',
    DROP_OFF_DATE: 'Rückgabedatum',
    DROP_OFF: 'Das Auto an einem anderen Ort zurückgeben',
    MIN_PICK_UP_HOURS_ERROR: 'Die Abholzeit muss mindestens einige Stunden in der Zukunft liegen',
    MIN_RENTAL_HOURS_ERROR: 'Die Mietdauer ist zu kurz',
    INVALID_PICK_UP_TIME: 'Ungültige Abholzeit',
    INVALID_DROP_OFF_TIME: 'Ungültige Rückgabezeit',
  },
})

langHelper.setLanguage(strings)
export { strings }
