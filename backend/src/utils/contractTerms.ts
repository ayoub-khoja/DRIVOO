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

/** Intro sentence printed above the French clauses. */
export const CONTRACT_TERMS_INTRO_FR = 'La location du véhicule indiqué en page 1 est basée sur les conditions et les articles suivants, acceptés par le locataire :'

export const CONTRACT_TERMS_FR: ContractTermsArticle[] = [
  {
    title: 'Article 1 : Utilisation de la voiture',
    paragraphs: [
      "Le locataire s'engage à appliquer les points suivants :",
      "a. Seul le locataire peut conduire le véhicule, dont il se porte garant, et ne l'utiliser que pour ses besoins personnels ; à ne pas utiliser le véhicule à des fins illicites ou pour le transport de marchandises ; à ne pas le surcharger en transportant un nombre de passagers supérieur à celui indiqué sur la carte grise.",
      '- Respecter le code de la route et ne pas dépasser 110 km/h.',
      '- Ne pas dépasser 300 km par jour.',
      '- Ne pas conduire sur les pistes.',
      '- Ne pas transporter de produits dangereux dans la voiture.',
    ],
  },
  {
    title: 'Article 2 : Assurance',
    paragraphs: [
      "L'assurance n'est valable que pour la période de location et de prolongation. Le locataire est garanti pour les risques suivants :",
      '- Pour une somme illimitée pour les accidents causés aux personnes transportées dans le véhicule à titre gracieux.',
      "- Contre l'incendie du véhicule, sauf négligence grave du conducteur.",
      '- Contre les accidents routiers avec une franchise égale à 4% de la valeur de la voiture, qui reste à la charge du client.',
      "L'assurance ne rembourse pas les points suivants :",
      "- Si la durée de location est écoulée et que la voiture n'est pas restituée, {{AGENCY}} décline toute responsabilité pour les accidents que le locataire aurait causés, sauf si la prolongation a été acceptée par {{AGENCY}}.",
      "- Les vêtements et les objets transportés ne sont pas garantis par l'assurance.",
      '- Les dégâts occasionnés par la conduite sur piste ou une mauvaise manipulation du véhicule.',
      "- L'assurance est annulée en cas d'ivresse.",
      "- L'assurance tous risques n'inclut pas les dommages causés aux phares, pare-chocs avant et arrière, peinture du véhicule, ni toute perte d'équipements tels que papiers, clefs et autoradio, qui restent à la charge du client.",
      "- Le remorquage de la voiture en cas d'accident ou de panne est à la charge du locataire.",
    ],
  },
  {
    title: 'Article 3 : Accidents',
    paragraphs: [
      "Le locataire est tenu d'informer {{AGENCY}} par écrit de tout accident ou incendie impliquant le véhicule, dans un délai maximal de 24 heures à compter de la survenance de l'événement. Il est également tenu d'aviser immédiatement les services de la police ou de la garde nationale de tout accident ou sinistre. Le contrat de location demeure en vigueur ; le locataire s'engage toutefois à payer une majoration de 30% du tarif journalier convenu, et ce jusqu'à la régularisation de la situation et la restitution du véhicule dans son état d'origine.",
      "a. Lors de la rédaction de la déclaration, le locataire doit obligatoirement mentionner les causes de l'accident, la date, l'heure et le lieu de l'accident.",
      'b. La déclaration doit être accompagnée de toutes les pièces et documents délivrés par la police, la garde nationale ou les huissiers de justice, le cas échéant.',
      "c. Il est strictement interdit au locataire de discuter de la responsabilité de l'accident ou de conclure un accord amiable avec les personnes impliquées ou responsables.",
      "d. En cas de fourniture par le locataire d'informations fausses ou erronées (permis de conduire, adresse, etc.), {{AGENCY}} se dégage de toute responsabilité concernant les dommages causés aux tiers.",
    ],
  },
  {
    title: 'Article 4 : Essence et huile',
    paragraphs: [
      "Le carburant est à la charge du locataire. Celui-ci s'engage à restituer le véhicule avec le même niveau de carburant que celui constaté lors de la prise en charge.",
      "{{AGENCY}} n'assume aucune responsabilité concernant tout excédent de carburant laissé dans le véhicule lors de sa restitution. Le locataire est également tenu de vérifier régulièrement le niveau d'huile et d'eau, et de veiller au bon entretien du véhicule durant toute la période de location.",
    ],
  },
  {
    title: 'Article 5 : Entretien et réparation',
    paragraphs: [
      "Le client supporte l'ensemble des frais résultant de toute panne ou avarie mécanique causée par sa négligence ou son mauvais usage du véhicule.",
      'a. Le conducteur est tenu de présenter les pièces remplacées sur le véhicule, accompagnées des documents justificatifs attestant leur remplacement.',
      "b. {{AGENCY}} n'assume aucune responsabilité en cas d'accident résultant d'un défaut de fabrication du véhicule ou d'une réparation effectuée antérieurement à la location.",
    ],
  },
  {
    title: 'Article 6 : État de la voiture',
    paragraphs: [
      'a. Le locataire reconnaît avoir reçu le véhicule en bon état de propreté et de fonctionnement, apte à la circulation. Il dispose du droit de formuler toute réserve ou réclamation immédiatement après la prise en charge du véhicule.',
      "b. Le véhicule doit être restitué dans le même état que lors de sa remise. À défaut, le locataire supportera l'ensemble des frais de réparation nécessaires à sa remise en état.",
      'c. Les cinq pneumatiques (roue de secours comprise) doivent être présents et dans le même état que lors de la remise du véhicule. À défaut, le locataire prendra en charge le coût de leur remplacement.',
    ],
  },
  {
    title: 'Article 7 : Circulation',
    paragraphs: [
      "Le contrat est valable uniquement pour la circulation à l'intérieur de la République tunisienne.",
      'Il est strictement interdit au locataire de sortir du territoire tunisien avec un véhicule de {{AGENCY}}, sauf autorisation préalable de la direction générale de la société et accord des autorités compétentes.',
    ],
  },
  {
    title: 'Article 8 : Location, caution, prolongation',
    paragraphs: [
      'a. La garantie fournie dans le cadre du présent contrat ne peut en aucun cas être utilisée pour prolonger la durée de la location, quelle que soit la situation.',
      "b. Si le locataire souhaite conserver le véhicule au-delà de la période de location initiale, il doit obtenir l'accord préalable de {{AGENCY}} et payer le tarif de location convenu. À défaut, il s'expose à des poursuites judiciaires pour détournement de véhicule, abus de confiance et non-paiement.",
    ],
  },
  {
    title: 'Article 9 : Retour du véhicule',
    paragraphs: [
      "a. Si le locataire ne restitue pas le véhicule à l'heure convenue, le contrat de location demeure en vigueur jusqu'à sa restitution effective. En cas de non-notification préalable, une majoration de 30% du prix convenu sera appliquée.",
      'b. En cas de restitution du véhicule dans un lieu différent de celui où il a été pris en charge, le locataire sera tenu de payer des frais de 400 millimes par kilomètre, calculés sur la distance parcourue.',
    ],
  },
  {
    title: 'Article 10 : Papiers de la voiture',
    paragraphs: [
      "a. Le locataire est tenu de restituer le véhicule à l'expiration de la durée de location, accompagné de l'ensemble de ses documents (carte grise et documents officiels). À défaut, le contrat de location demeure en vigueur jusqu'à la restitution complète desdits documents, avec une majoration de 30%.",
      "b. En cas de perte des documents du véhicule, le locataire supporte l'intégralité des frais liés à leur renouvellement.",
    ],
  },
  {
    title: 'Article 11 : Pénalités',
    paragraphs: [
      "a. En cas de non-respect de l'article 1, point « b », une pénalité de 500 millimes par kilomètre sera appliquée pour chaque kilomètre supplémentaire parcouru.",
      "b. Le locataire assume l'entière responsabilité en cas de violation de l'une quelconque des clauses du présent contrat.",
      'c. Le locataire demeure seul et entièrement responsable de toutes les infractions, contraventions et procès-verbaux établis à son encontre.',
    ],
  },
  {
    title: 'Article 12 : Compétences',
    paragraphs: [
      "En cas de non-paiement, le locataire s'expose à des poursuites judiciaires et supporte l'ensemble des frais résultant des litiges juridiques entre {{AGENCY}} et le locataire. Tous les litiges relèvent exclusivement de la compétence des tribunaux tunisiens.",
    ],
  },
]

/** Intro sentence printed above the Arabic clauses. */
export const CONTRACT_TERMS_INTRO_AR = 'عملية تسويغ السيارة المشار اليها في الصفحة الأمامية و الفصول تخضع الى جملة من الشروط و الفصول يجب على المتسوغ قبولها و هي على النحو التالي:'

/**
 * Arabic clauses, transcribed from the agency's own terms document.
 * Rendered by `arabicText.ts`, which handles the contextual shaping and the bidi
 * reordering PDFKit cannot do on its own.
 */
export const CONTRACT_TERMS_AR: ContractTermsArticle[] = [
  {
    title: 'الفصل 1 : استعمال السيارة',
    paragraphs: [
      'على المتسوغ الالتزام بالنقاط التالية :',
      '- لا يقود السيارة احد غيره اذ انه المتحصل الوحيد لمسؤوليتها و لا يجوز له ان يستعملها الا لقضاء حاجته، كما لا يحق له حمل أكثر مما قدرته البطاقة الرمادية.',
      '- أن يحترم السرعة المحددة من قبل علامات المرور و ان لا يتجاوز في كل الحالات 110 كلم/ساعة.',
      '- أن لا يتجاوز 300 كلم في اليوم كحد أقصى.',
      '- أن لا يسوق السيارة في حالة سكر أو مرض.',
      '- ان لا يضع بالسيارة مواد قابلة للالتهاب.',
      '- أن لا يسوق داخل الطرقات غير المعبدة.',
    ],
  },
  {
    title: 'المادة 2 : التأمين',
    paragraphs: [
      'التأمين لا يصلح الا لمدة التسويغ و التمديد المصدق من طرف {{AGENCY}}. المتسوغ مؤمن من الأخطار التالية :',
      '- مبلغ غير محدد للحوادث المرتكبة للغير أو للأشخاص الراكبين في السيارة بدون مقابل.',
      '- ضد حريق السيارة الا اذا تبين خطأ السائق.',
      '- ضد حوادث المرور مع اعفاء قدره 4 من ثمن شراء السيارة التي تبقى على كاهل المتسوغ.',
      'التأمين لا يشمل النقاط التالية :',
      '- اذا انقضت مدة الكراء و لم ترجع السيارة فان شركة {{AGENCY}} تتنحى عن المسؤولية في صورة وقوع حادث الا في حالة قبول تجديد مدة الكراء من طرفها.',
      '- الامتعة المنقولة في السيارة لا تدخل مجال التأمين.',
      '- الاضرار الحاصلة لأضواء السيارة و الدرع الامامي و طلاء السيارة و الاكسسوارات داخل و خارج السيارة، و كل ضياع للتجهيزات مثل الورق و المفاتيح و الاجهزة الضوئية التي تكون على عاتق المتسوغ.',
      '- نقل السيارة في حالة وقوع حادث أو عطب ميكانيكي.',
    ],
  },
  {
    title: 'المادة 3 : الحوادث',
    paragraphs: [
      '- اعلام {{AGENCY}} بالحادث في 24 ساعة كتابيا و اعلام الشرطة في الحين بكل حادث أو حريق، و يبقى العقد ساري المفعول مع زيادة 30 على السعر المتفق عليه باليوم حتى تسوية الوضعية و ارجاع السيارة الى حالتها الاصلية.',
      '- عند تحرير الاعلام يجب على المتسوغ أن يكتب أسباب وقوع الحادث و التاريخ و الساعة و مكان الحادث.',
      '- تضمن الوثائق المسلمة من طرف الشرطة و الحرس و العدول المنفذين.',
      '- يمنع التناقش في مسؤولية الحادث أو الصلح مع الاشخاص المتسببين في الحادث.',
      '- إذا أدلى المتسوغ بمعلومات مزيفة أو خاطئة (رخصة سياقة أو عنوان خاطئ) فإن {{AGENCY}} تتنحى عن كل مسؤولية في الحوادث للغير.',
    ],
  },
  {
    title: 'المادة 4 : الوقود و البنزين',
    paragraphs: [
      'الوقود على كاهل المتسوغ و يجب أن يرجعه على نفس المستوى الذي استلمه عليه، كما أن {{AGENCY}} لا تتحمل مسؤولية الوقود الزائد، كما يجب أن يتفقد بالاستمرار الزيت و الماء.',
    ],
  },
  {
    title: 'المادة 5 : الصيانة و الإصلاح',
    paragraphs: [
      '- يتحمل الحريف مصاريف العطب الميكانيكي الناتج عن تهاونه.',
      '- على السائق أن يستظهر بالقطع التي غيرت في السيارة مصحوبة بالوثائق التي تثبت ذلك.',
      '- {{AGENCY}} لا تتحمل المسؤولية في حادث ناتج عن خلل في صنع السيارة.',
    ],
  },
  {
    title: 'المادة 6 : حالة السيارة',
    paragraphs: [
      '- يستلم المتسوغ السيارة في حالة حسنة من ناحية النظافة و السير، و له الحق في الاعتراض أو التغيير بعد استلامه لها.',
      '- ترجع السيارة على حالة تسليمها و الا فان المتسوغ يتحمل مصاريف اصلاحها.',
      '- ينبغي أن تكون الخمسة مطاطات موجودة و على نفس الحالة التي سلمت عليها و الا فان المتسوغ يتحمل ثمن تعويضها.',
    ],
  },
  {
    title: 'المادة 7 : الجولان',
    paragraphs: [
      'العقد لا يصلح الا للجولان داخل الجمهورية التونسية، و يمنع على الحرفاء مغادرة التراب التونسي بسيارة {{AGENCY}} منعا باتا الا بإذن من الإدارة العامة التابعة لها و المصادقة من طرف السلطات المختصة.',
    ],
  },
  {
    title: 'المادة 8 : التسويغ و الرهن و التمديد',
    paragraphs: [
      '- الضمان لا يصلح لتمديد مدة التسويغ مهما كانت الحالة.',
      '- إذا اراد المتسوغ الاحتفاظ بالسيارة لمدة أطول ينبغي عليه أن يطلب موافقة {{AGENCY}} و ان يرسل معلوم الكراء المتفق عليه، و الا فإنه يتعرض الى تتبعات عدلية في اختلاس سيارة و خيانة مؤتمن و عدم خلاص.',
    ],
  },
  {
    title: 'المادة 9 : إرجاع السيارة',
    paragraphs: [
      '- إذا لم يقم المتسوغ بارجاع السيارة في الوقت المتفق عليه فان التسويغ يبقى قائم المفعول الى حدود ارجاعها مع زيادة 30 من السعر المتفق عليه في حالة عدم الاعلام.',
      '- في حالة تسليم السيارة في غير المكان الذي استلمها فيه فانه مطالب بدفع تكلفة 400 مليم على الكيلومتر الواحد من المسافة.',
    ],
  },
  {
    title: 'المادة 10 : وثائق السيارة',
    paragraphs: [
      '- على المتسوغ ارجاع السيارة اثر انهاء مدة التسويغ مصحوبة بجميع وثائقها (البطاقة الرمادية و الوثائق الرسمية) و الا يبقى التسويغ ساري المفعول حتى ترجع الوثائق مع زيادة 30.',
      '- في حالة ضياع أوراق السيارة يتحمل المتسوغ مصاريف تجديدها.',
    ],
  },
  {
    title: 'المادة 11 : العقوبات',
    paragraphs: [
      '- في حالة مخالفة الفصل 1 النقطة (ب) فانه سيتم دفع 500 مليم على الكيلومتر الواحد بالنسبة الى المسافة المضافة.',
      '- يتحمل المتسوغ المسؤولية الكاملة في حالة مخالفته أي فصل من فصول هذا العقد.',
      '- المتسوغ يبقى المسؤول الوحيد على المخالفات و المحاضر التي تحرر من شأنه.',
    ],
  },
  {
    title: 'المادة 12 : النزاعات القانونية',
    paragraphs: [
      'في حالة عدم الخلاص يعرض المتسوغ نفسه الى تتبعات عدلية و يتحمل جميع المصاريف الناتجة عن النزاعات القانونية بين {{AGENCY}} و المتسوغ، و تكون كل النزاعات من مشمولات المحاكم التونسية لا غير.',
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
