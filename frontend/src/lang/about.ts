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
  es: {
    TITLE1: `${env.WEBSITE_NAME} - Tu servicio de alquiler de coches`,
    SUBTITLE1: 'Tu socio de confianza para el alquiler de coches',
    CONTENT1: `En ${env.WEBSITE_NAME}, entendemos que cada viaje es único. Nos comprometemos a ofrecer a nuestros clientes una amplia selección de vehículos que satisfacen todas las necesidades de viaje. Ya sea que estés explorando una ciudad, desplazándote por negocios o buscando aventura, nuestros fiables servicios de alquiler de coches garantizan que tu aventura comience sin contratiempos. Nuestra misión es ofrecer un servicio al cliente excepcional, haciendo que tu experiencia sea agradable y sin estrés. Con tarifas competitivas, una variedad de vehículos bien mantenidos y un equipo dedicado listo para asistirte, nos esforzamos por ser tu socio de confianza en la carretera. Elige ${env.WEBSITE_NAME} para todas tus necesidades de alquiler y disfruta de la libertad de explorar a tu ritmo.`,
    TITLE2: `¿Por qué elegir ${env.WEBSITE_NAME}?`,
    SUBTITLE2: 'Excelencia en cada viaje',
    CONTENT2: 'Disfruta de una comodidad, fiabilidad y valor inigualables con nuestro servicio de alquiler de coches. Desde reservas sin esfuerzo hasta vehículos de alta calidad, somos tu socio de viaje de confianza.',
    FIND_DEAL: 'Buscar oferta',
  },
  it: {
    TITLE1: `${env.WEBSITE_NAME} - Il tuo servizio di noleggio auto`,
    SUBTITLE1: 'Il tuo partner di fiducia per il noleggio auto',
    CONTENT1: `In ${env.WEBSITE_NAME}, sappiamo che ogni viaggio è unico. Ci impegniamo a offrire ai nostri clienti un\'ampia selezione di veicoli per ogni esigenza di viaggio. Che tu stia esplorando una città, viaggiando per lavoro o cercando avventura, i nostri affidabili servizi di noleggio auto garantiscono che la tua avventura inizi senza intoppi. La nostra missione è fornire un servizio clienti eccezionale, rendendo la tua esperienza piacevole e senza stress. Con tariffe competitive, una varietà di veicoli ben mantenuti e un team dedicato pronto ad assisterti, ci impegniamo a essere il tuo partner di fiducia sulla strada. Scegli ${env.WEBSITE_NAME} per tutte le tue esigenze di noleggio e vivi la libertà di esplorare al tuo ritmo.`,
    TITLE2: `Perché scegliere ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Eccellenza in ogni viaggio',
    CONTENT2: 'Goditi comodità, affidabilità e valore senza pari con il nostro servizio di noleggio auto. Dalle prenotazioni semplici ai veicoli di alta qualità, siamo il tuo partner di viaggio di fiducia.',
    FIND_DEAL: 'Trova offerta',
  },
  de: {
    TITLE1: `${env.WEBSITE_NAME} - Ihr erstklassiger Mietwagenservice`,
    SUBTITLE1: 'Ihr vertrauenswürdiger Partner für Mietwagen',
    CONTENT1: `Bei ${env.WEBSITE_NAME} wissen wir, dass jede Reise einzigartig ist. Wir sind bestrebt, unseren Kunden eine vielfältige Auswahl an Fahrzeugen für jedes Reisebedürfnis zu bieten. Ob Sie eine Stadt erkunden, geschäftlich unterwegs sind oder Abenteuer suchen – unser zuverlässiger Mietwagenservice sorgt dafür, dass Ihr Abenteuer reibungslos beginnt. Unsere Mission ist es, außergewöhnlichen Kundenservice zu bieten und Ihr Erlebnis angenehm und stressfrei zu gestalten. Mit wettbewerbsfähigen Preisen, einer Vielzahl gepflegter Fahrzeuge und einem engagierten Team, das Ihnen zur Seite steht, streben wir danach, Ihr vertrauenswürdiger Partner auf der Straße zu sein. Wählen Sie ${env.WEBSITE_NAME} für alle Ihre Mietwagenbedürfnisse und erleben Sie die Freiheit, in Ihrem eigenen Tempo zu entdecken.`,
    TITLE2: `Warum ${env.WEBSITE_NAME} wählen`,
    SUBTITLE2: 'Exzellenz bei jeder Reise',
    CONTENT2: 'Genießen Sie unübertroffenen Komfort, Zuverlässigkeit und Preis-Leistung mit unserem erstklassigen Mietwagenservice. Von mühelosen Buchungen bis hin zu hochwertigen Fahrzeugen – wir sind Ihr vertrauenswürdiger Reisepartner.',
    FIND_DEAL: 'Angebot finden',
  },
})

langHelper.setLanguage(strings)
export { strings }
