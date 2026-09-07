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
  es: {
    CONGRATULATIONS: '¡Felicidades!',
    SUCCESS: 'Tu pago se ha completado con éxito. Te hemos enviado un correo de confirmación.',
    SUCCESS_PAY_LATER: 'Tu reserva ha sido confirmada. Te hemos enviado un correo de confirmación.',
    SUCCESS_GUEST_ACTIVATION: 'También recibirás un correo para activar tu cuenta y hacer seguimiento de tu reserva.',
    ERROR: 'Algo salió mal. Por favor, inténtalo de nuevo más tarde.',
    STATUS_TITLE: `${env.WEBSITE_NAME} — Confirmación de reserva`,
    STATUS_MESSAGE: 'Revisa tu bandeja de entrada y sigue los pasos indicados en el correo de confirmación de reserva.',
    STATUS_MESSAGE_GUEST: 'Revisa tu bandeja de entrada: encontrarás la confirmación de reserva y el enlace para activar tu cuenta.',
  },
  it: {
    CONGRATULATIONS: 'Congratulazioni!',
    SUCCESS: 'Il pagamento è stato completato con successo. Ti abbiamo inviato un\'email di conferma.',
    SUCCESS_PAY_LATER: 'La tua prenotazione è stata confermata. Ti abbiamo inviato un\'email di conferma.',
    SUCCESS_GUEST_ACTIVATION: 'Riceverai anche un\'email per attivare il tuo account e seguire la tua prenotazione.',
    ERROR: 'Qualcosa è andato storto. Riprova più tardi.',
    STATUS_TITLE: `${env.WEBSITE_NAME} — Conferma prenotazione`,
    STATUS_MESSAGE: 'Controlla la tua casella di posta e segui i passaggi indicati nell\'email di conferma della prenotazione.',
    STATUS_MESSAGE_GUEST: 'Controlla la tua casella di posta: troverai la conferma della prenotazione e il link per attivare il tuo account.',
  },
  de: {
    CONGRATULATIONS: 'Herzlichen Glückwunsch!',
    SUCCESS: 'Ihre Zahlung wurde erfolgreich abgeschlossen. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.',
    SUCCESS_PAY_LATER: 'Ihre Buchung wurde bestätigt. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.',
    SUCCESS_GUEST_ACTIVATION: 'Sie erhalten außerdem eine E-Mail zur Aktivierung Ihres Kontos und zur Nachverfolgung Ihrer Buchung.',
    ERROR: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.',
    STATUS_TITLE: `${env.WEBSITE_NAME} — Buchungsbestätigung`,
    STATUS_MESSAGE: 'Überprüfen Sie Ihren Posteingang und folgen Sie den Schritten in der Buchungsbestätigungs-E-Mail.',
    STATUS_MESSAGE_GUEST: 'Überprüfen Sie Ihren Posteingang: Sie finden dort die Buchungsbestätigung und den Link zur Kontoaktivierung.',
  },
})

langHelper.setLanguage(strings)
export { strings }
