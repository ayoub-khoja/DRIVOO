import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    FAQ_TITLE: 'FAQ',
    MORE_QUESTIONS: 'Plus de questions ?',
    FAQ_DOCUMENTS_TITLE: 'De quels documents ai-je besoin pour louer un véhicule ?',
    FAQ_DOCUMENTS_TEXT: "Pour louer un véhicule, vous aurez généralement besoin d'un permis de conduire valide, d'une carte de crédit pour le paiement et le dépôt de garantie, ainsi que d'une preuve d'assurance. Des exigences supplémentaires peuvent varier en fonction de votre emplacement et du type de véhicule que vous louez.",
    FAQ_SERVICES_TITLE: 'Proposez-vous des services de livraison et de restitution ?',
    FAQ_SERVICES_TEXT: 'Oui, nous le faisons ! Nous proposons des services de livraison et de ramassage pratiques à divers endroits, notamment les aéroports, les hôtels, etc. Dites-nous simplement votre destination préférée et nous nous occuperons du reste.',
    FAQ_AGE_TITLE: "Y a-t-il une limite d'âge pour louer un véhicule ?",
    FAQ_AGE_TEXT: "Oui, l'âge minimum requis pour louer un véhicule est généralement de 18 ans. Cependant, certains endroits peuvent avoir des exigences d'âge plus élevées ou des restrictions supplémentaires pour certains types de véhicules.",
    FAQ_CANCEL_TITLE: 'Que se passe-t-il si je dois annuler ma réservation ?',
    FAQ_CANCEL_TEXT: "Nous comprenons que les plans peuvent changer, c'est pourquoi nous proposons des politiques d'annulation flexibles. Selon le moment de votre annulation, des frais peuvent s'appliquer. Veuillez vous référer à nos conditions générales ou contacter notre équipe d'assistance client pour obtenir de l'aide concernant les annulations.",
  },
  en: {
    FAQ_TITLE: 'FAQ',
    MORE_QUESTIONS: 'More questions?',
    FAQ_DOCUMENTS_TITLE: 'What documents do I need to rent a vehicle?',
    FAQ_DOCUMENTS_TEXT: "To rent a vehicle, you'll typically need a valid driver's license, a credit card for payment and security deposit, and proof of insurance. Additional requirements may vary depending on your location and the type of vehicle you're renting.",
    FAQ_SERVICES_TITLE: 'Do you offer delivery and pickup services?',
    FAQ_SERVICES_TEXT: "Yes, we do! We offer convenient delivery and pickup services to various locations, including airports, hotels, and more. Just let us know your preferred location, and we'll take care of the rest.",
    FAQ_AGE_TITLE: 'Is there an age requirement for renting a vehicle?',
    FAQ_AGE_TEXT: 'Yes, the minimum age requirement for renting a vehicle is usually 18 years old. However, some locations may have higher age requirements or additional restrictions for certain vehicle types.',
    FAQ_CANCEL_TITLE: 'What happens if I need to cancel my reservation?',
    FAQ_CANCEL_TEXT: 'We understand that plans can change, which is why we offer flexible cancellation policies. Depending on the timing of your cancellation, there may be applicable fees. Please refer to our terms and conditions or contact our customer support team for assistance with cancellations.',
  },
  ar: {
    FAQ_TITLE: 'الأسئلة الشائعة',
    MORE_QUESTIONS: 'لديك المزيد من الأسئلة؟',
    FAQ_DOCUMENTS_TITLE: 'ما المستندات المطلوبة لاستئجار مركبة؟',
    FAQ_DOCUMENTS_TEXT: 'لاستئجار مركبة، ستحتاج عادةً إلى رخصة قيادة سارية، وبطاقة ائتمان للدفع والتأمين، وإثبات تأمين. قد تختلف المتطلبات الإضافية حسب موقعك ونوع المركبة التي تستأجرها.',
    FAQ_SERVICES_TITLE: 'هل تقدمون خدمات التوصيل والاستلام؟',
    FAQ_SERVICES_TEXT: 'نعم! نقدم خدمات توصيل واستلام مريحة في مواقع متعددة، بما في ذلك المطارات والفنادق وغيرها. أخبرنا بموقعك المفضل وسنتولى الباقي.',
    FAQ_AGE_TITLE: 'هل هناك شرط للعمر لاستئجار مركبة؟',
    FAQ_AGE_TEXT: 'نعم، الحد الأدنى للعمر المطلوب لاستئجار مركبة عادةً ما يكون 18 سنة. ومع ذلك، قد تكون لبعض المواقع متطلبات عمر أعلى أو قيود إضافية لأنواع معينة من المركبات.',
    FAQ_CANCEL_TITLE: 'ماذا يحدث إذا احتجت إلى إلغاء حجزي؟',
    FAQ_CANCEL_TEXT: 'ندرك أن الخطط قد تتغير، ولهذا نقدم سياسات إلغاء مرنة. حسب توقيت الإلغاء، قد تُطبق رسوم. يرجى الرجوع إلى شروطنا وأحكامنا أو الاتصال بفريق دعم العملاء للمساعدة في عمليات الإلغاء.',
  },
})

langHelper.setLanguage(strings)
export { strings }
