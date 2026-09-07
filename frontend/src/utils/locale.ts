import { fr, enUS, arSA, es, it, de, Locale } from 'date-fns/locale'

/** date-fns locale for pickers / formatters */
export const getDateFnsLocale = (language?: string): Locale => {
  switch (language) {
    case 'fr':
      return fr
    case 'ar':
      return arSA
    case 'es':
      return es
    case 'it':
      return it
    case 'de':
      return de
    default:
      return enUS
  }
}

/** BCP 47 tag for `toLocaleDateString` / `Intl` */
export const getIntlLocale = (language?: string): string => {
  switch (language) {
    case 'fr':
      return 'fr-FR'
    case 'ar':
      return 'ar-SA'
    case 'es':
      return 'es-ES'
    case 'it':
      return 'it-IT'
    case 'de':
      return 'de-DE'
    default:
      return 'en-GB'
  }
}
