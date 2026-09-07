import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    PICK_UP_LOCATION: 'Lieu de prise en charge',
    DROP_OFF_LOCATION: 'Lieu de restitution',
  },
  en: {
    PICK_UP_LOCATION: 'Pick-up location',
    DROP_OFF_LOCATION: 'Drop-off location',
  },
  ar: {
    PICK_UP_LOCATION: 'مكان الاستلام',
    DROP_OFF_LOCATION: 'مكان التسليم',
  },
  es: {
    PICK_UP_LOCATION: 'Lugar de recogida',
    DROP_OFF_LOCATION: 'Lugar de devolución',
  },
  it: {
    PICK_UP_LOCATION: 'Luogo di ritiro',
    DROP_OFF_LOCATION: 'Luogo di riconsegna',
  },
  de: {
    PICK_UP_LOCATION: 'Abholort',
    DROP_OFF_LOCATION: 'Rückgabeort',
  },
})

langHelper.setLanguage(strings)
export { strings }
