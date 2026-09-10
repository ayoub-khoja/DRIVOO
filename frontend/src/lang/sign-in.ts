import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SIGN_IN_HEADING: 'Connexion',
    SIGN_IN_SUBTITLE: 'Accédez à votre espace DRIVOO.',
    SIGN_IN: 'Se connecter',
    ERROR_IN_SIGN_IN: 'E-mail ou mot de passe incorrect.',
    SESSION_ERROR: 'Connexion réussie, mais la session n\'a pas pu être établie. Réessayez.',
    SERVICE_ERROR: 'Service temporairement indisponible. Réessayez dans un instant.',
    IS_BLACKLISTED: 'Votre compte est suspendu.',
    RESET_PASSWORD: 'Mot de passe oublié ?',
    STAY_CONNECTED: 'Rester connecté',
  },
  en: {
    SIGN_IN_HEADING: 'Sign in',
    SIGN_IN_SUBTITLE: 'Access your DRIVOO account.',
    SIGN_IN: 'Sign in',
    ERROR_IN_SIGN_IN: 'Incorrect email or password.',
    SESSION_ERROR: 'Signed in, but the session could not be established. Please try again.',
    SERVICE_ERROR: 'Service temporarily unavailable. Please try again in a moment.',
    IS_BLACKLISTED: 'Your account is suspended.',
    RESET_PASSWORD: 'Forgot password?',
    STAY_CONNECTED: 'Stay connected',
  },
  ar: {
    SIGN_IN_HEADING: 'تسجيل الدخول',
    SIGN_IN_SUBTITLE: 'ادخل إلى حسابك على DRIVOO.',
    SIGN_IN: 'تسجيل الدخول',
    ERROR_IN_SIGN_IN: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    SESSION_ERROR: 'تم تسجيل الدخول لكن تعذر إنشاء الجلسة. حاول مرة أخرى.',
    SERVICE_ERROR: 'الخدمة غير متاحة مؤقتاً. حاول مرة أخرى بعد لحظات.',
    IS_BLACKLISTED: 'حسابك موقوف.',
    RESET_PASSWORD: 'نسيت كلمة المرور؟',
    STAY_CONNECTED: 'البقاء متصلاً',
  },
  es: {
    SIGN_IN_HEADING: 'Iniciar sesión',
    SIGN_IN_SUBTITLE: 'Accede a tu cuenta DRIVOO.',
    SIGN_IN: 'Iniciar sesión',
    ERROR_IN_SIGN_IN: 'Correo electrónico o contraseña incorrectos.',
    SESSION_ERROR: 'Inicio de sesión correcto, pero no se pudo crear la sesión. Inténtalo de nuevo.',
    SERVICE_ERROR: 'Servicio temporalmente no disponible. Inténtalo de nuevo en un momento.',
    IS_BLACKLISTED: 'Tu cuenta está suspendida.',
    RESET_PASSWORD: '¿Olvidaste tu contraseña?',
    STAY_CONNECTED: 'Mantener la sesión iniciada',
  },
  it: {
    SIGN_IN_HEADING: 'Accedi',
    SIGN_IN_SUBTITLE: 'Accedi al tuo account DRIVOO.',
    SIGN_IN: 'Accedi',
    ERROR_IN_SIGN_IN: 'Email o password non corretti.',
    SESSION_ERROR: 'Accesso riuscito, ma la sessione non è stata creata. Riprova.',
    SERVICE_ERROR: 'Servizio temporaneamente non disponibile. Riprova tra un momento.',
    IS_BLACKLISTED: 'Il tuo account è sospeso.',
    RESET_PASSWORD: 'Password dimenticata?',
    STAY_CONNECTED: 'Resta connesso',
  },
  de: {
    SIGN_IN_HEADING: 'Anmelden',
    SIGN_IN_SUBTITLE: 'Zugang zu Ihrem DRIVOO-Konto.',
    SIGN_IN: 'Anmelden',
    ERROR_IN_SIGN_IN: 'Falsche E-Mail-Adresse oder falsches Passwort.',
    SESSION_ERROR: 'Anmeldung erfolgreich, aber die Sitzung konnte nicht erstellt werden. Bitte erneut versuchen.',
    SERVICE_ERROR: 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich erneut.',
    IS_BLACKLISTED: 'Ihr Konto ist gesperrt.',
    RESET_PASSWORD: 'Passwort vergessen?',
    STAY_CONNECTED: 'Angemeldet bleiben',
  },
})

langHelper.setLanguage(strings)
export { strings }
