import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: 'Abonnez-vous',
    SUB_TITLE: 'Abonnez-vous à notre liste de diffusion pour recevoir les dernières mises à jour !',
    SUBSCRIBE: "S'abonner",
    SUCCESS: 'Inscription réussie !',
  },
  en: {
    TITLE: 'Subscribe',
    SUB_TITLE: 'Subscribe to our mailing list for the latest updates!',
    SUBSCRIBE: 'Subscribe',
    SUCCESS: 'Subscription successful!',
  },
  ar: {
    TITLE: 'اشترك',
    SUB_TITLE: 'اشترك في قائمتنا البريدية لتلقي آخر التحديثات!',
    SUBSCRIBE: 'اشتراك',
    SUCCESS: 'تم الاشتراك بنجاح!',
  },
  es: {
    TITLE: 'Suscríbete',
    SUB_TITLE: '¡Suscríbete a nuestra lista de correo para recibir las últimas novedades!',
    SUBSCRIBE: 'Suscribirse',
    SUCCESS: '¡Suscripción exitosa!',
  },
  it: {
    TITLE: 'Iscriviti',
    SUB_TITLE: 'Iscriviti alla nostra mailing list per ricevere gli ultimi aggiornamenti!',
    SUBSCRIBE: 'Iscriviti',
    SUCCESS: 'Iscrizione avvenuta con successo!',
  },
  de: {
    TITLE: 'Abonnieren',
    SUB_TITLE: 'Abonnieren Sie unseren Newsletter für die neuesten Updates!',
    SUBSCRIBE: 'Abonnieren',
    SUCCESS: 'Abonnement erfolgreich!',
  },
})

langHelper.setLanguage(strings)
export { strings }
