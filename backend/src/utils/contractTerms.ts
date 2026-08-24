/**
 * "CONDITIONS GENERALES DE LOCATION" printed on the back of the rental contract,
 * transcribed from the agency's paper form.
 *
 * `{{AGENCY}}` is replaced at render time by the agency trade name, so the same
 * clauses serve every agency on the platform.
 */

export interface ContractTermsArticle {
  title: string
  paragraphs: string[]
}

export const CONTRACT_TERMS_TITLE_FR = 'CONDITIONS GENERALES DE LOCATION'
export const CONTRACT_TERMS_TITLE_AR = 'الشروط العامة لكراء السيارات'

export const CONTRACT_TERMS_FR: ContractTermsArticle[] = [
  {
    title: 'ARTICLE I : PRISE EN CHARGE ET RESTITUTION DU VEHICULE',
    paragraphs: [
      "Hormis les réserves dommages signalées dans ce contrat, le locataire déclare que le véhicule loué lui a été remis en bon état de marche, de carrosserie, d'équipement, de propreté, de sécurité, et avoir vérifié le niveau d'eau, de carburation, témoins et indicateurs du tableau de bord. Il s'oblige à en faire un usage personnel normal conforme aux règles et usages de bonne conduite et de prudence, et à s'interdire d'intervenir personnellement : en cas de signal lumineux, d'arrêter le moteur et d'attendre l'intervention des techniciens de {{AGENCY}}. Il s'engage à restituer le véhicule dans l'état où il l'a reçu, dans le délai, le lieu et l'horaire convenus, sans retard ni négligence.",
      "Tout dommage subi par le véhicule après la remise des clefs reste à la charge du locataire comme risque normal d'usage convenu. La restitution du véhicule et de ses accessoires doit avoir lieu pendant l'horaire d'ouverture des services de {{AGENCY}} affichés ; à défaut, le locataire reste tenu de payer le loyer jusqu'à restitution conforme et assume pleinement tout risque, dommage, préjudice ou perte.",
      "Le locataire doit remettre les clefs, documents et papiers à lui remis ; à défaut il demeure tenu au loyer convenu jusqu'à la remise, et en cas de perte ou de vol, durant le délai normal pour en obtenir un duplicata et à condition de produire un certificat administratif de perte.",
      "Le véhicule est remis au locataire en bon état. Les dommages constatés au retour et non reportés sur le contrat seront à la charge du locataire. La restitution du véhicule doit être faite pendant les heures d'ouverture de l'agence.",
    ],
  },
  {
    title: 'ARTICLE II : UTILISATION DU VEHICULE',
    paragraphs: [
      "Le locataire s'engage à ne pas utiliser le véhicule à des fins illicites ou à des transports de marchandise.",
    ],
  },
  {
    title: 'ARTICLE III : ASSURANCE',
    paragraphs: [
      "Les cas mentionnés aux sous-paragraphes (a, b, c) ne sont pas couverts par l'assurance :",
      'a) Coût du remorquage des voitures endommagées à notre atelier de réparation, vol du véhicule, dommages causés par des catastrophes naturelles ou cas de force majeure.',
      "b) Le véhicule n'est assuré que pour la durée de la location indiquée au recto. Passé ce délai, et sauf si la prolongation est acceptée et mentionnée par écrit, {{AGENCY}} décline toute responsabilité pour les accidents que le locataire aurait pu causer et dont il devra faire son affaire personnelle.",
      'c) Les dégâts occasionnés aux pneumatiques, bris de glace, optiques avant et feux arrière, qui sont exclusivement à la charge du locataire.',
      "En dehors des heures d'utilisation et surtout pendant la nuit, le locataire s'engage à tenir le véhicule fermé et verrouillé, dans des endroits gardés ou dans un garage. Sinon, le locataire est considéré comme solidaire en cas de vol du véhicule et sera tenu par suite de payer la valeur vénale de ce dernier.",
    ],
  },
  {
    title: 'ARTICLE IV : LE LOCATAIRE',
    paragraphs: [
      "En signant ce contrat, le locataire s'engage à rembourser à {{AGENCY}} tous frais de réparation pour les dégâts survenus au véhicule et pour lesquels il n'a pas remis un constat dûment complété prouvant la responsabilité d'un tiers, dans les délais prescrits (4 jours au maximum à partir de la date de l'accident).",
    ],
  },
  {
    title: 'ARTICLE V : RESTITUTION AVANT TERME',
    paragraphs: [
      "En cas de retour avant terme, le locataire n'a pas le droit de demander le remboursement de la période restante.",
    ],
  },
  {
    title: 'ARTICLE VI : IMMOBILISATION DU VEHICULE',
    paragraphs: [
      "L'immobilisation de la voiture pour quelque cause que ce soit, même à l'extérieur, ou pour une cause indépendante de la volonté du locataire, donnera lieu au paiement par celui-ci d'une indemnité égale aux trois cinquièmes (3/5) du prix de location par jour de la voiture, sans kilométrage, pour toute la période de l'immobilisation.",
    ],
  },
  {
    title: 'ARTICLE VII : RESPONSABILITE ET GARANTIE DE {{AGENCY}}',
    paragraphs: [
      "La garantie de la bailleresse est limitée aux termes de ce contrat. Elle ne peut être tenue pour responsable de tout préjudice ou dommage, perte, manque à gagner en cas de retard, d'interruption du voyage ou du parcours dus à une panne quelconque du véhicule loué, étant un risque convenu d'utilisation à la charge du locataire.",
    ],
  },
  {
    title: 'ARTICLE VIII : COMPETENCE',
    paragraphs: [
      "Tout litige concernant l'interprétation ou l'exécution de ce contrat non résolu à l'amiable sera de la compétence des juridictions du siège de la bailleresse, qui constitue aussi le lieu d'exécution convenu du contrat. La partie succombante supporte les frais de justice et honoraires d'avocat fixés à 400 dinars en première instance, 500 dinars en appel, 600 dinars en cassation, quelle que soit la nature de l'affaire, même de référé.",
    ],
  },
]

/**
 * Arabic counterpart of the clauses above, kept in sync with the paper form.
 * Not rendered yet: PDFKit ships only the 14 standard Latin PDF fonts, so printing
 * this column needs an embedded Arabic font plus a shaping/bidi pass.
 */
export const CONTRACT_TERMS_AR: ContractTermsArticle[] = [
  {
    title: 'الفصل 1 : تسليم وحفظ وترجيع العربة',
    paragraphs: [
      'في ما عدا الاحترازات و الأضرار المبينة بهذا العقد يشهد المتسوغ بتسلمه للعربة موضوع تسويغ على حالة جيدة من الاشتغال و الهيكل و التجهيزات و النظافة و السلامة كما قام بمعاينة مستوى الزيت و الماء و سلامة المنبه و المقود و اكتمال أجهزة إشارة لوحة القيادة، و يلتزم باستعمالها استعمالا عاديا طبق ما يقضيه عرف و قواعد السياقة و الوقاية و إشعار المسوغة بكل خلل أو تنبيه، و يلتزم بعدم التدخل لمعالجته شخصيا و توقيف المحرك و انتظار تدخل فني المسوغة.',
      'و يلتزم المتسوغ بإرجاع العربة على الحالة التي تسلمها عليها في الوقت و المكان المحددين بالعقد دون تأخير أو إهمال، و كل ضرر أو تلف يصيب العربة أو تجهيزاتها أو توابعها يسجل بعد تسلم العربة يكون محمولا على المتسوغ باعتباره من تبعة الاستعمال العادي.',
      'و يتم الإرجاع أثناء أوقات العمل، و في صورة التأخير عن وقت العمل و على المتسوغ متحملا لكل تبعة أو ضرر أو تلف إلى أن يتم التسليم في وقت العمل.',
      'و على المتسوغ إرجاع مفاتيح العربة و كل وثائقها التي تسلمها، و إلا تحمل عليه مدة بقائها في حوزته بمعين الكراء الاتفاقي، و المصاريف الضرورية لاستخراج مفاتيح أو وثائق جديدة.',
    ],
  },
  {
    title: 'الفصل 2 : استعمال السيارة',
    paragraphs: ['يلتزم المكتري بعدم استعمال السيارة لغايات غير شرعية أو لنقل البضائع.'],
  },
  {
    title: 'الفصل 3 : التأمينات',
    paragraphs: [
      'إن الحالات المذكورة بالفقرة (أ، ب، ج) لا تدخل ضمن إطار التأمين :',
      'أ - مصاريف جر السيارة المتضررة لمستودع التصليح، سرقة السيارة، الأضرار التي تحدث بسبب قوة طبيعية أو حالة القوة القاهرة.',
      'ب - لا تأمين السيارة إلا بالنسبة لفترة الكراء المحددة بظهر الصفحة. بعد مرور هذا الأجل تنفي شركة كراء السيارات أي مسؤولية بالنسبة للحوادث التي قد يتسبب فيها المكتري، و التي يجب عليها أن يتحمل نتائج شخصيا إلا في صورة التمديد إذا ما تم التنصيص على ذلك كتابيا.',
      'ج - يتحمل المكتري مسؤولية الأضرار التي تتسبب فيها للعجلات و البلور و بلور الإنارة الخلفية.',
      'كما ينفي حيان لكراء السيارات أية مسؤولية في ما يتعلق بسرقة الأشياء التي تم تركها بالسيارة عند نهاية الكراء. ما عدا حالات الاستعمال، و خصوصا خلال الليل، يلتزم المكتري بأن يحافظ على السيارة مغلقة و بأماكن محروسة أو مستودع، و إلا يعتبر المكتري و كأنه متضامن في صورة سرقة السيارة، سيكون مجبرا تبعا لذلك بدفع القيمة التجارية للسيارة.',
    ],
  },
  {
    title: 'الفصل 4 : المكتري',
    paragraphs: [
      'عند إمضاء هذا العقد يلتزم المكتري بأن يسدد لشركة كراء السيارات كافة المصاريف المتعلقة بتصليح الأضرار التي تحدث و التي لم تكن موضوع معاينة طبق للقانون، و التي تثبت مسؤولية الغير، و ذلك خلال الآجال المحددة 4 أيام كأقصى تقدير من تاريخ الحادث.',
    ],
  },
  {
    title: 'الفصل 5 : إرجاع السيارة قبل الأجل المحدد',
    paragraphs: ['لا يمكن للمكتري أن يطالب في صورة إرجاع السيارة قبل الأجل المحدد بتسديد قيمة المدة الباقية.'],
  },
  {
    title: 'الفصل 6 : تثبيت السيارة',
    paragraphs: [
      'إن تثبيت السيارة لأي سبب كان، حتى و لو كان في الخارج أو بسبب أمر خارج عن إرادة المكتري، يكون هذا الأخير مجبرا على دفع غرامة تساوي 3/5 من ثمن الكراء في اليوم للسيارة بدون احتساب كيلومترات فترة التثبيت.',
    ],
  },
  {
    title: 'الفصل 7 : مسؤولية و ضمان المسوغة',
    paragraphs: [
      'ضمان شركة كراء السيارات لبنود هذا العقد و تتار في حدود ما تخضع مسؤولية و ضمانها، و هي لا تتحمل أية تبعة أو خسارة أو ربح فات أو ضياع فرصة ناجم عن قطع لرحلة المتسوغ أو مساره بسبب أي عطب أو خلل ما طرأ على العربة أثناء الطريق، باعتباره من قبيل تبعة قانونية و تعاقدية للاستعمال العادي للعربة المكتراة.',
    ],
  },
  {
    title: 'الفصل 8 : الاختصاص',
    paragraphs: [
      'في صورة حصول خلاف في شأن تفسير أو تنفيذ هذا العقد لم تتم تسوية رضائية في شأنه، يكون النزاع من اختصاص محاكم مقر الشركة المسوغة الذي يعتبر كذلك مكان تنفيذ العقد التعاقدي، و يتحمل الطرف المحكوم ضده بغرامة أتعاب نقاض و أجرة محاماة اتفاقية قدرها 400 دينار ابتدائيا، 500 دينار استئنافيا، 600 دينار تعقيبيا عن كل قضية و لو استعجالية.',
    ],
  },
]

/** Boxed warning printed next to the header of the paper form. */
export const CONTRACT_TERMS_IMPORTANT_FR = "IMPORTANT : le remorquage de la voiture, pour n'importe quelle cause, est à la charge du locataire."

/** Walk-around checklist printed under the vehicle diagram ("Si non : mauvais état"). */
export const CONTRACT_CHECKLIST: { key: string, label: string }[] = [
  { key: 'wheels', label: 'Roues' },
  { key: 'jack', label: 'Crick + outils' },
  { key: 'hubcaps', label: 'Enjoliveurs' },
  { key: 'ashtray', label: 'Cendrier' },
  { key: 'mats', label: 'Tapis' },
  { key: 'mirror', label: 'Rétroviseur' },
  { key: 'windshield', label: 'Bris de glace' },
  { key: 'headlights', label: 'Phares' },
  { key: 'radio', label: 'Radio' },
  { key: 'antenna', label: 'Antenne' },
  { key: 'wipers', label: 'Essuie-glaces' },
  { key: 'doorLock', label: 'Serrure de porte' },
  { key: 'ceiling', label: 'Plafonnier' },
  { key: 'windowLift', label: 'Lève-vitre' },
  { key: 'cleanliness', label: 'Propreté intérieure' },
  { key: 'handles', label: 'Poignées' },
  { key: 'seatbelt', label: 'Ceinture de sécurité' },
  { key: 'ac', label: 'Climatiseur' },
  { key: 'heating', label: 'Chauffage' },
  { key: 'babySeat', label: 'Siège bébé' },
]

/**
 * Resolve `{{AGENCY}}` in a clause.
 */
export const withAgencyName = (text: string, agencyName: string): string =>
  text.replace(/\{\{AGENCY\}\}/g, agencyName || "l'agence")
