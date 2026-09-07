import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    VIEW_ON_MAP: 'Voir sur la carte',
  },
  en: {
    VIEW_ON_MAP: 'View on map',
  },
  ar: {
    VIEW_ON_MAP: 'عرض على الخريطة',
  },
  es: {
    VIEW_ON_MAP: 'Ver en el mapa',
  },
  it: {
    VIEW_ON_MAP: 'Vedi sulla mappa',
  },
  de: {
    VIEW_ON_MAP: 'Auf der Karte anzeigen',
  },
})

langHelper.setLanguage(strings)
export { strings }
