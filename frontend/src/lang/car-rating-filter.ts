import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    RATING: 'Classement',
    RATING_1: '(1 et plus)',
    RATING_2: '(2 et plus)',
    RATING_3: '(3 et plus)',
    RATING_4: '(4 et plus)',
  },
  en: {
    RATING: 'Rating',
    RATING_1: '(1 and up)',
    RATING_2: '(2 and up)',
    RATING_3: '(3 and up)',
    RATING_4: '(4 and up)',
  },
  ar: {
    RATING: 'التقييم',
    RATING_1: '(1 فأكثر)',
    RATING_2: '(2 فأكثر)',
    RATING_3: '(3 فأكثر)',
    RATING_4: '(4 فأكثر)',
  },
  es: {
    RATING: 'Valoración',
    RATING_1: '(1 y más)',
    RATING_2: '(2 y más)',
    RATING_3: '(3 y más)',
    RATING_4: '(4 y más)',
  },
  it: {
    RATING: 'Valutazione',
    RATING_1: '(1 e oltre)',
    RATING_2: '(2 e oltre)',
    RATING_3: '(3 e oltre)',
    RATING_4: '(4 e oltre)',
  },
  de: {
    RATING: 'Bewertung',
    RATING_1: '(1 und mehr)',
    RATING_2: '(2 und mehr)',
    RATING_3: '(3 und mehr)',
    RATING_4: '(4 und mehr)',
  },
})

langHelper.setLanguage(strings)
export { strings }
