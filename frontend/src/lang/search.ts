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
  es: {
    SHOW_FILTERS: 'Mostrar filtros',
    HILE_FILTERS: 'Ocultar filtros',
  },
  it: {
    SHOW_FILTERS: 'Mostra filtri',
    HILE_FILTERS: 'Nascondi filtri',
  },
  de: {
    SHOW_FILTERS: 'Filter anzeigen',
    HILE_FILTERS: 'Filter ausblenden',
  },
})

langHelper.setLanguage(strings)
export { strings }
