import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SEATS: 'Sièges',
    TWO: '2 sièges',
    FOUR: '4 sièges',
    FIVE: '5 sièges',
    FIVE_PLUS: '5+ sièges',
  },
  en: {
    SEATS: 'Seats',
    TWO: '2 seats',
    FOUR: '4 seats',
    FIVE: '5 seats',
    FIVE_PLUS: '5+ seats',
  },
  ar: {
    SEATS: 'المقاعد',
    TWO: 'مقعدان',
    FOUR: '4 مقاعد',
    FIVE: '5 مقاعد',
    FIVE_PLUS: 'أكثر من 5 مقاعد',
  },
  es: {
    SEATS: 'Asientos',
    TWO: '2 asientos',
    FOUR: '4 asientos',
    FIVE: '5 asientos',
    FIVE_PLUS: '5+ asientos',
  },
  it: {
    SEATS: 'Posti',
    TWO: '2 posti',
    FOUR: '4 posti',
    FIVE: '5 posti',
    FIVE_PLUS: '5+ posti',
  },
  de: {
    SEATS: 'Sitze',
    TWO: '2 Sitze',
    FOUR: '4 Sitze',
    FIVE: '5 Sitze',
    FIVE_PLUS: '5+ Sitze',
  },
})

langHelper.setLanguage(strings)
export { strings }
