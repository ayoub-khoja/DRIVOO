import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UNAUTHORIZED: 'Accès non autorisé',
  },
  en: {
    UNAUTHORIZED: 'Unauthorized access',
  },
  ar: {
    UNAUTHORIZED: 'دخول غير مصرح به',
  },
  es: {
    UNAUTHORIZED: 'Acceso no autorizado',
  },
  it: {
    UNAUTHORIZED: 'Accesso non autorizzato',
  },
  de: {
    UNAUTHORIZED: 'Unbefugter Zugriff',
  },
})

langHelper.setLanguage(strings)
export { strings }
