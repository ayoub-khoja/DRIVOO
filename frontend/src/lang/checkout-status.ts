import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    CONGRATULATIONS: 'Félicitations !',
    SUCCESS: 'Votre paiement a été effectué avec succès. Nous vous avons envoyé un e-mail de confirmation.',
    SUCCESS_PAY_LATER: 'Votre réservation a bien été enregistrée. Nous vous avons envoyé un e-mail de confirmation.',
    SUCCESS_GUEST_ACTIVATION: 'Vous allez également recevoir un e-mail pour activer votre compte et suivre votre réservation.',
    ERROR: 'Une erreur est survenue. Veuillez réessayer plus tard.',
    STATUS_TITLE: `${env.WEBSITE_NAME} — Confirmation de réservation`,
    STATUS_MESSAGE: 'Vérifiez votre boîte mail et suivez les étapes indiquées dans l’e-mail de confirmation.',
    STATUS_MESSAGE_GUEST: 'Vérifiez votre boîte mail : vous y trouverez la confirmation de réservation et le lien pour activer votre compte.',
  },
  en: {
    CONGRATULATIONS: 'Congratulations!',
    SUCCESS: 'Your payment was completed successfully. We sent you a confirmation email.',
    SUCCESS_PAY_LATER: 'Your booking has been confirmed. We sent you a confirmation email.',
    SUCCESS_GUEST_ACTIVATION: 'You will also receive an email to activate your account and track your booking.',
    ERROR: 'Something went wrong. Please try again later.',
    STATUS_TITLE: `${env.WEBSITE_NAME} — Booking confirmation`,
    STATUS_MESSAGE: 'Check your mailbox and follow the steps in the booking confirmation email.',
    STATUS_MESSAGE_GUEST: 'Check your mailbox: you will find the booking confirmation and the link to activate your account.',
  },
  ar: {
    CONGRATULATIONS: 'تهانينا!',
    SUCCESS: 'تم الدفع بنجاح. لقد أرسلنا إليك رسالة تأكيد عبر البريد الإلكتروني.',
    SUCCESS_PAY_LATER: 'تم تسجيل حجزك بنجاح. لقد أرسلنا إليك رسالة تأكيد عبر البريد الإلكتروني.',
    SUCCESS_GUEST_ACTIVATION: 'ستتلقى أيضًا رسالة لتفعيل حسابك ومتابعة حجزك.',
    ERROR: 'حدث خطأ ما! حاول مرة أخرى لاحقًا',
    STATUS_TITLE: `تأكيد الحجز لدى ${env.WEBSITE_NAME}`,
    STATUS_MESSAGE: 'تحقق من بريدك الإلكتروني واتبع الخطوات الموضحة في رسالة تأكيد الحجز.',
    STATUS_MESSAGE_GUEST: 'تحقق من بريدك الإلكتروني: ستجد تأكيد الحجز ورابط تفعيل الحساب.',
  },
})

langHelper.setLanguage(strings)
export { strings }
