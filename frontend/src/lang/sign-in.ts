import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SIGN_IN_HEADING: 'Connexion',
    SIGN_IN_SUBTITLE: 'Accédez à votre espace DRIVOO.',
    SIGN_IN: 'Se connecter',
    ERROR_IN_SIGN_IN: 'E-mail ou mot de passe incorrect.',
    IS_BLACKLISTED: 'Votre compte est suspendu.',
    RESET_PASSWORD: 'Mot de passe oublié ?',
    STAY_CONNECTED: 'Rester connecté',
  },
  en: {
    SIGN_IN_HEADING: 'Sign in',
    SIGN_IN_SUBTITLE: 'Access your DRIVOO account.',
    SIGN_IN: 'Sign in',
    ERROR_IN_SIGN_IN: 'Incorrect email or password.',
    IS_BLACKLISTED: 'Your account is suspended.',
    RESET_PASSWORD: 'Forgot password?',
    STAY_CONNECTED: 'Stay connected',
  },
  ar: {
    SIGN_IN_HEADING: 'تسجيل الدخول',
    SIGN_IN_SUBTITLE: 'ادخل إلى حسابك على DRIVOO.',
    SIGN_IN: 'تسجيل الدخول',
    ERROR_IN_SIGN_IN: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    IS_BLACKLISTED: 'حسابك موقوف.',
    RESET_PASSWORD: 'نسيت كلمة المرور؟',
    STAY_CONNECTED: 'البقاء متصلاً',
  },
})

langHelper.setLanguage(strings)
export { strings }
