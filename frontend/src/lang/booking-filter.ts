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
})

langHelper.setLanguage(strings)
export { strings }
