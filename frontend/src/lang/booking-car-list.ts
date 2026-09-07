import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    REQUIRED_FIELD: 'Veuillez renseigner le champ : ',
    REQUIRED_FIELDS: 'Veuillez renseigner les champs : ',
  },
  en: {
    REQUIRED_FIELD: 'Please fill in the field: ',
    REQUIRED_FIELDS: 'Please fill in the fields: ',
  },
  ar: {
    REQUIRED_FIELD: 'يرجى ملء الحقل: ',
    REQUIRED_FIELDS: 'يرجى ملء الحقول: ',
  },
  es: {
    REQUIRED_FIELD: 'Por favor, rellena el campo: ',
    REQUIRED_FIELDS: 'Por favor, rellena los campos: ',
  },
  it: {
    REQUIRED_FIELD: 'Compila il campo: ',
    REQUIRED_FIELDS: 'Compila i campi: ',
  },
  de: {
    REQUIRED_FIELD: 'Bitte füllen Sie das Feld aus: ',
    REQUIRED_FIELDS: 'Bitte füllen Sie die Felder aus: ',
  },
})

langHelper.setLanguage(strings)
export { strings }
