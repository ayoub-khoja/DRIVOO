import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE1: `${env.WEBSITE_NAME} - Votre service de location de voitures`,
    SUBTITLE1: 'Votre partenaire de confiance pour la location de voitures',
    CONTENT1: `Chez ${env.WEBSITE_NAME}, nous comprenons que chaque voyage est unique. Nous nous engageons à fournir à nos clients une sélection diversifiée de véhicules qui répondent à tous les besoins de voyage. Que vous exploriez une ville, que vous vous déplaciez pour affaires ou que vous recherchiez l'aventure, nos services de location de voitures fiables garantissent que votre aventure commence en toute transparence. Notre mission est de fournir un service client exceptionnel, rendant votre expérience agréable et sans stress. Avec des tarifs compétitifs, une variété de véhicules bien entretenus et une équipe dédiée prête à vous aider, nous nous efforçons d'être votre partenaire de confiance sur la route. Choisissez ${env.WEBSITE_NAME} pour tous vos besoins de location de voiture et découvrez la liberté d'explorer à votre rythme.`,
    TITLE2: `Pourquoi choisir ${env.WEBSITE_NAME}`,
    SUBTITLE2: "Découvrez l'excellence à chaque voyage",
    CONTENT2: "Profitez d'une commodité, d'une fiabilité et d'une valeur inégalées avec notre service de location de voitures. Des réservations sans effort aux véhicules de haute qualité, nous sommes votre partenaire de voyage de confiance.",
    FIND_DEAL: 'Trouver une Offre',
  },
  en: {
    TITLE1: `${env.WEBSITE_NAME} - Your Premier Car Rental Service`,
    SUBTITLE1: 'Your Trusted Partner for Car Rentals',
    CONTENT1: `At ${env.WEBSITE_NAME}, we understand that every journey is unique. We are committed to providing our customers with a diverse selection of vehicles that cater to every travel need. Whether you're exploring a city, commuting for business, or seeking adventure, our reliable car rental services ensure that your adventure begins seamlessly. Our mission is to deliver exceptional customer service, making your experience enjoyable and stress-free. With competitive rates, a variety of well-maintained vehicles, and a dedicated team ready to assist you, we strive to be your trusted partner on the road. Choose ${env.WEBSITE_NAME} for all your car rental needs and experience the freedom to explore at your own pace.`,
    TITLE2: `Why Choose ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experience Excellence in Every Journey',
    CONTENT2: "Enjoy unmatched convenience, reliability, and value with our premier car rental service. From effortless bookings to high-quality vehicles, we're your trusted travel partner.",
    FIND_DEAL: 'Find Deal',
  },
  ar: {
    TITLE1: `${env.WEBSITE_NAME} - خدمة تأجير السيارات الخاصة بك`,
    SUBTITLE1: 'شريكك الموثوق لتأجير السيارات',
    CONTENT1: `في ${env.WEBSITE_NAME}، ندرك أن كل رحلة فريدة. نحن ملتزمون بتقديم مجموعة متنوعة من المركبات التي تلبي جميع احتياجات السفر. سواء كنت تستكشف مدينة، أو تتنقل للعمل، أو تبحث عن المغامرة، تضمن خدمات تأجير السيارات الموثوقة لدينا أن تبدأ رحلتك بسلاسة. مهمتنا هي تقديم خدمة عملاء استثنائية، لجعل تجربتك ممتعة وخالية من التوتر. مع أسعار تنافسية، ومجموعة من المركبات المُعتنى بها جيدًا، وفريق مخصص جاهز لمساعدتك، نسعى لنكون شريكك الموثوق على الطريق. اختر ${env.WEBSITE_NAME} لجميع احتياجات تأجير السيارات واستمتع بحرية الاستكشاف وفقًا لوتيرتك.`,
    TITLE2: `لماذا تختار ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'اختبر التميز في كل رحلة',
    CONTENT2: 'استمتع براحة وموثوقية وقيمة لا مثيل لها مع خدمة تأجير السيارات لدينا. من الحجوزات السهلة إلى المركبات عالية الجودة، نحن شريك سفرك الموثوق.',
    FIND_DEAL: 'ابحث عن عرض',
  },
})

langHelper.setLanguage(strings)
export { strings }
