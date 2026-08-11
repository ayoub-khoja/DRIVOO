import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_PICK_UP_LOCATION: 'Choisir ce lieu',
    SELECT_DROP_OFF_LOCATION: 'Choisir comme lieu de restitution',
  },
  en: {
    SELECT_PICK_UP_LOCATION: 'Select Location',
    SELECT_DROP_OFF_LOCATION: 'Set as Drop-off Location',
  },
  ar: {
    SELECT_PICK_UP_LOCATION: 'اختر هذا المكان',
    SELECT_DROP_OFF_LOCATION: 'تعيين كمكان تسليم',
  },
})

langHelper.setLanguage(strings)
export { strings }
