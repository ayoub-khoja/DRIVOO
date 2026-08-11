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
})

langHelper.setLanguage(strings)
export { strings }
