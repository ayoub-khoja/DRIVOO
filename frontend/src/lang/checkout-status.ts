import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    CONGRATULATIONS: 'Félicitation!',
    SUCCESS: 'Votre paiement a été effectué avec succès. Nous vous avons envoyé un e-mail de confirmation.',
    SUCCESS_PAY_LATER: 'Votre réservation a été effectuée avec succès. Nous vous avons envoyé un e-mail de confirmation.',
    ERROR: 'Something went wrong! Try again later',
    STATUS_TITLE: `${env.WEBSITE_NAME} Confirmation de réservation`,
    STATUS_MESSAGE: "Vérifiez votre boîte mail et suivez les étapes décrites dans l'e-mail de confirmation de réservation pour réserver votre voiture.",
  },
  en: {
    CONGRATULATIONS: 'Congratulations!',
    SUCCESS: 'Your payment was successfully done. We sent you a confirmation email.',
    SUCCESS_PAY_LATER: 'Your booking was successfully done. We sent you a confirmation email.',
    ERROR: 'Something went wrong! Try again later',
    STATUS_TITLE: `${env.WEBSITE_NAME} Booking Confirmation`,
    STATUS_MESSAGE: 'Check your mailbox and follow the steps described in the booking confirmation email to book your car.',
  },
  ar: {
    CONGRATULATIONS: 'تهانينا!',
    SUCCESS: 'تم الدفع بنجاح. لقد أرسلنا إليك رسالة تأكيد عبر البريد الإلكتروني.',
    SUCCESS_PAY_LATER: 'تم الحجز بنجاح. لقد أرسلنا إليك رسالة تأكيد عبر البريد الإلكتروني.',
    ERROR: 'حدث خطأ ما! حاول مرة أخرى لاحقًا',
    STATUS_TITLE: `تأكيد الحجز لدى ${env.WEBSITE_NAME}`,
    STATUS_MESSAGE: 'تحقق من بريدك الإلكتروني واتبع الخطوات الموضحة في رسالة تأكيد الحجز لحجز سيارتك.',
  },
})

langHelper.setLanguage(strings)
export { strings }
