import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SHOW_FILTERS: 'Afficher les filtres',
    HILE_FILTERS: 'Masquer les filtres',
  },
  en: {
    SHOW_FILTERS: 'Show Filters',
    HILE_FILTERS: 'Hide Filters',
  },
  ar: {
    SHOW_FILTERS: 'إظهار عوامل التصفية',
    HILE_FILTERS: 'إخفاء عوامل التصفية',
  },
})

langHelper.setLanguage(strings)
export { strings }
