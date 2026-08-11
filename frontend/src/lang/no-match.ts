import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NO_MATCH: 'Rien à voir ici !',
  },
  en: {
    NO_MATCH: 'Nothing to see here!',
  },
  ar: {
    NO_MATCH: 'لا يوجد شيء هنا!',
  },
})

langHelper.setLanguage(strings)
export { strings }
