import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    ACTIVATE_HEADING: 'Activation du compte',
    TOKEN_EXPIRED: "Votre lien d'activation du compte a expiré.",
    ACTIVATE: 'Activer',
  },
  en: {
    ACTIVATE_HEADING: 'Account Activation',
    TOKEN_EXPIRED: 'Your account activation link expired.',
    ACTIVATE: 'Activate',
  },
  ar: {
    ACTIVATE_HEADING: 'تفعيل الحساب',
    TOKEN_EXPIRED: 'انتهت صلاحية رابط تفعيل حسابك.',
    ACTIVATE: 'تفعيل',
  },
})

langHelper.setLanguage(strings)
export { strings }
