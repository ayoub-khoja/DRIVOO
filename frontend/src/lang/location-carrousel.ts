import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_LOCATION: 'Choisir ce lieu',
    AVALIABLE_LOCATION: 'lieu disponible',
    AVALIABLE_LOCATIONS: 'lieux disponibles',
  },
  en: {
    SELECT_LOCATION: 'Select Location',
    AVALIABLE_LOCATION: 'available location',
    AVALIABLE_LOCATIONS: 'available locations',
  },
  ar: {
    SELECT_LOCATION: 'اختر هذا المكان',
    AVALIABLE_LOCATION: 'مكان متاح',
    AVALIABLE_LOCATIONS: 'أماكن متاحة',
  },
})

langHelper.setLanguage(strings)
export { strings }
