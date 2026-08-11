import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CAR_SPECS: 'Spécificités du véhicule',
    AIRCON: 'Climatisation',
    MORE_THAN_FOOR_DOORS: '4+ portes',
    MORE_THAN_FIVE_SEATS: '5+ sièges',
  },
  en: {
    CAR_SPECS: 'Car specs',
    AIRCON: 'Air Conditioning',
    MORE_THAN_FOOR_DOORS: '4+ doors',
    MORE_THAN_FIVE_SEATS: '5+ seats',
  },
  ar: {
    CAR_SPECS: 'مواصفات السيارة',
    AIRCON: 'تكييف الهواء',
    MORE_THAN_FOOR_DOORS: 'أكثر من 4 أبواب',
    MORE_THAN_FIVE_SEATS: 'أكثر من 5 مقاعد',
  },
})

langHelper.setLanguage(strings)
export { strings }
