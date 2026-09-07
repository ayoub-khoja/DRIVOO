import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    RESET_PASSWORD_HEADING: 'Réinitialisation du mot de passe',
    RESET_PASSWORD: 'Veuillez saisir votre adresse e-mail afin de vous envoyer un e-mail pour réinitialiser votre mot de passe.',
    EMAIL_ERROR: 'Adresse e-mail non enregistrée',
    RESET: 'Réinitialiser',
    EMAIL_SENT: 'E-mail de réinitialisation du mot de passe envoyé.',
  },
  en: {
    RESET_PASSWORD_HEADING: 'Password Reset',
    RESET_PASSWORD: 'Please enter your email address so we can send you an email to reset your password.',
    EMAIL_ERROR: 'Email address not registered',
    RESET: 'Reset',
    EMAIL_SENT: 'Password reset email sent.',
  },
  ar: {
    RESET_PASSWORD_HEADING: 'إعادة تعيين كلمة المرور',
    RESET_PASSWORD: 'يرجى إدخال عنوان بريدك الإلكتروني حتى نتمكن من إرسال رسالة لإعادة تعيين كلمة المرور.',
    EMAIL_ERROR: 'عنوان البريد الإلكتروني غير مسجل',
    RESET: 'إعادة التعيين',
    EMAIL_SENT: 'تم إرسال رسالة إعادة تعيين كلمة المرور.',
  },
  es: {
    RESET_PASSWORD_HEADING: 'Restablecer contraseña',
    RESET_PASSWORD: 'Introduce tu dirección de correo electrónico para que podamos enviarte un email y restablecer tu contraseña.',
    EMAIL_ERROR: 'Dirección de correo no registrada',
    RESET: 'Restablecer',
    EMAIL_SENT: 'Email de restablecimiento de contraseña enviado.',
  },
  it: {
    RESET_PASSWORD_HEADING: 'Reimpostazione password',
    RESET_PASSWORD: 'Inserisci il tuo indirizzo email per ricevere un\'email di reimpostazione della password.',
    EMAIL_ERROR: 'Indirizzo email non registrato',
    RESET: 'Reimposta',
    EMAIL_SENT: 'Email di reimpostazione password inviata.',
  },
  de: {
    RESET_PASSWORD_HEADING: 'Passwort zurücksetzen',
    RESET_PASSWORD: 'Bitte geben Sie Ihre E-Mail-Adresse ein, damit wir Ihnen eine E-Mail zum Zurücksetzen Ihres Passworts senden können.',
    EMAIL_ERROR: 'E-Mail-Adresse nicht registriert',
    RESET: 'Zurücksetzen',
    EMAIL_SENT: 'E-Mail zum Zurücksetzen des Passworts gesendet.',
  },
})

langHelper.setLanguage(strings)
export { strings }
