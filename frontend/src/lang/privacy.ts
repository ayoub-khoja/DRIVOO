import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE: 'Politique de Confidentialité',
    PRIVACY_POLICY: `
Votre vie privée est importante pour nous chez ${env.WEBSITE_NAME}. Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre site Web et nos services. En accédant à nos services, vous consentez aux pratiques décrites dans cette politique.

1. Informations que nous collectons

Nous collectons des informations auprès de vous lorsque vous vous inscrivez sur notre site, passez une commande ou interagissez avec nos services. Les informations que nous pouvons collecter comprennent :

Nom
Adresse e-mail
Numéro de téléphone
Informations de paiement
Préférences de location
Vous pouvez visiter notre site de manière anonyme, mais certaines fonctionnalités peuvent être limitées.

2. Comment nous utilisons vos informations

Vos informations peuvent être utilisées des manières suivantes :

Pour traiter vos réservations et paiements
Pour améliorer le service client
Pour envoyer des e-mails périodiques concernant votre commande ou d'autres produits et services
Pour répondre aux demandes de renseignements et d'assistance

3. Comment nous protégeons vos informations

Nous mettons en œuvre diverses mesures de sécurité pour maintenir la sécurité de vos informations personnelles. Toutes les informations sensibles sont transmises via des serveurs sécurisés et ne sont accessibles qu'au personnel autorisé. Nous ne stockons pas vos informations de carte de crédit sur nos serveurs.

4. Partage de vos informations

Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles identifiables à des tiers, sauf à des partenaires de confiance qui nous aident à exploiter notre site Web, à mener nos activités ou à vous fournir des services, tant que ces parties acceptent de garder ces informations confidentielles. Nous pouvons également divulguer vos informations lorsque nous pensons que cette divulgation est appropriée pour se conformer à la loi, appliquer les politiques de notre site ou protéger nos droits ou ceux d'autrui, notre propriété ou notre sécurité.

5. Confidentialité des enfants

Nous respectons la loi sur la protection de la vie privée des enfants en ligne (Children's Online Privacy Protection Act, COPPA). Nos services ne sont pas destinés aux enfants de moins de 13 ans et nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 13 ans. Si nous apprenons que nous avons collecté des informations personnelles auprès d'un enfant de moins de 13 ans, nous prendrons des mesures pour supprimer ces informations.

6. Modifications de notre politique de confidentialité

Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page. Il vous est conseillé de consulter régulièrement cette politique de confidentialité pour prendre connaissance de tout changement.

7. Vos droits

Vous avez le droit de demander l'accès aux informations personnelles que nous détenons à votre sujet, de demander la correction de toute inexactitude et de demander la suppression de vos informations personnelles, sous réserve de certaines exceptions. Pour exercer ces droits, veuillez nous contacter en utilisant les informations fournies ci-dessous.

8. Contactez-nous

Si vous avez des questions sur cette politique de confidentialité ou sur nos pratiques en matière de données, veuillez nous contacter à l'adresse ${env.CONTACT_EMAIL}. Nous nous engageons à répondre à vos préoccupations et à protéger votre vie privée.

9. Reconnaissance

En utilisant nos services, vous reconnaissez avoir lu et compris cette politique de confidentialité et acceptez ses conditions.    
    `,
  },
  en: {
    TITLE: 'Privacy Policy',
    PRIVACY_POLICY: `
Your privacy is important to us at ${env.WEBSITE_NAME}. This Privacy Policy outlines how we collect, use, and protect your information when you use our website and services. By accessing our services, you consent to the practices described in this policy.


1. Information We Collect

We collect information from you when you register on our site, place an order, or interact with our services. The information we may collect includes:

Name
Email address
Phone number
Payment information
Rental preferences
You may visit our site anonymously, but certain functionalities may be limited.


2. How We Use Your Information

Your information may be used in the following ways:

To process your reservations and payments
To improve customer service
To send periodic emails regarding your order or other products and services
To respond to inquiries and support requests


3. How We Protect Your Information

We implement a variety of security measures to maintain the safety of your personal information. All sensitive information is transmitted via secure servers and is only accessible by authorized personnel. We do not store your credit card information on our servers.


4. Sharing Your Information

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except to trusted partners who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential. We may also release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect our rights or others' rights, property, or safety.


5. Children's Privacy

We comply with the Children's Online Privacy Protection Act (COPPA). Our services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.


6. Changes to Our Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.


7. Your Rights

You have the right to request access to the personal information we hold about you, to request correction of any inaccuracies, and to request deletion of your personal information, subject to certain exceptions. To exercise these rights, please contact us using the information provided below.


8. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at ${env.CONTACT_EMAIL}. We are committed to addressing your concerns and protecting your privacy.


9. Acknowledgment

By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
    `,
  },
  ar: {
    TITLE: 'سياسة الخصوصية',
    PRIVACY_POLICY: `
خصوصيتك مهمة بالنسبة لنا في ${env.WEBSITE_NAME}. توضّح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونحميها عند استخدامك لموقعنا وخدماتنا. بالوصول إلى خدماتنا، فإنك توافق على الممارسات الموضحة في هذه السياسة.


1. المعلومات التي نجمعها

نجمع معلومات منك عند التسجيل في موقعنا أو تقديم طلب أو التفاعل مع خدماتنا. قد تشمل المعلومات التي نجمعها:

الاسم
عنوان البريد الإلكتروني
رقم الهاتف
معلومات الدفع
تفضيلات التأجير
يمكنك زيارة موقعنا بشكل مجهول، لكن قد تكون بعض الوظائف محدودة.


2. كيف نستخدم معلوماتك

قد تُستخدم معلوماتك بالطرق التالية:

لمعالجة حجوزاتك ومدفوعاتك
لتحسين خدمة العملاء
لإرسال رسائل بريد إلكتروني دورية بخصوص طلبك أو منتجات وخدمات أخرى
للرد على الاستفسارات وطلبات الدعم


3. كيف نحمي معلوماتك

نطبّق مجموعة من التدابير الأمنية للحفاظ على سلامة معلوماتك الشخصية. تُنقل جميع المعلومات الحساسة عبر خوادم آمنة ولا يمكن الوصول إليها إلا من قبل الموظفين المصرح لهم. نحن لا نخزّن معلومات بطاقتك الائتمانية على خوادمنا.


4. مشاركة معلوماتك

نحن لا نبيع أو نتاجر أو ننقل معلوماتك الشخصية القابلة للتحديد إلى أطراف خارجية، باستثناء الشركاء الموثوقين الذين يساعدوننا في تشغيل موقعنا أو إدارة أعمالنا أو خدمتك، طالما توافق هذه الأطراف على الحفاظ على سرية هذه المعلومات. قد نفصح أيضًا عن معلوماتك عندما نعتقد أن الإفصاح مناسب للامتثال للقانون أو إنفاذ سياسات موقعنا أو حماية حقوقنا أو حقوق الآخرين أو ممتلكاتهم أو سلامتهم.


5. خصوصية الأطفال

نلتزم بقانون حماية خصوصية الأطفال على الإنترنت (COPPA). خدماتنا غير موجّهة للأطفال دون سن 13 عامًا، ولا نجمع عن قصد معلومات شخصية من أطفال دون هذا السن. إذا علمنا أننا جمعنا معلومات شخصية من طفل دون سن 13، سنتخذ خطوات لحذف هذه المعلومات.


6. التغييرات على سياسة الخصوصية

قد نحدّث سياسة الخصوصية هذه من وقت لآخر. سنُعلمك بأي تغييرات بنشر سياسة الخصوصية الجديدة على هذه الصفحة. يُنصح بمراجعة هذه السياسة بشكل دوري للاطلاع على أي تغييرات.


7. حقوقك

لديك الحق في طلب الوصول إلى المعلومات الشخصية التي نحتفظ بها عنك، وطلب تصحيح أي عدم دقة، وطلب حذف معلوماتك الشخصية، مع مراعاة بعض الاستثناءات. لممارسة هذه الحقوق، يرجى التواصل معنا باستخدام المعلومات الواردة أدناه.


8. اتصل بنا

إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارساتنا المتعلقة بالبيانات، يرجى التواصل معنا على ${env.CONTACT_EMAIL}. نحن ملتزمون بمعالجة مخاوفك وحماية خصوصيتك.


9. الإقرار

باستخدامك لخدماتنا، فإنك تقر بأنك قد قرأت وفهمت سياسة الخصوصية هذه وتوافق على شروطها.
    `,
  },
  es: {
    TITLE: 'Política de privacidad',
    PRIVACY_POLICY: `
Su privacidad es importante para nosotros en ${env.WEBSITE_NAME}. Esta Política de privacidad describe cómo recopilamos, utilizamos y protegemos su información cuando utiliza nuestro sitio web y nuestros servicios. Al acceder a nuestros servicios, usted consiente las prácticas descritas en esta política.


1. Información que recopilamos

Recopilamos información suya cuando se registra en nuestro sitio, realiza un pedido o interactúa con nuestros servicios. La información que podemos recopilar incluye:

Nombre
Dirección de correo electrónico
Número de teléfono
Información de pago
Preferencias de alquiler
Puede visitar nuestro sitio de forma anónima, pero algunas funcionalidades pueden estar limitadas.


2. Cómo utilizamos su información

Su información puede ser utilizada de las siguientes maneras:

Para procesar sus reservas y pagos
Para mejorar el servicio al cliente
Para enviar correos electrónicos periódicos sobre su pedido u otros productos y servicios
Para responder a consultas y solicitudes de soporte


3. Cómo protegemos su información

Implementamos diversas medidas de seguridad para mantener la protección de su información personal. Toda la información sensible se transmite a través de servidores seguros y solo es accesible por personal autorizado. No almacenamos la información de su tarjeta de crédito en nuestros servidores.


4. Compartir su información

No vendemos, intercambiamos ni transferimos de ningún otro modo su información personal identificable a terceros, excepto a socios de confianza que nos asisten en la operación de nuestro sitio web, la gestión de nuestro negocio o la prestación de servicios, siempre que dichas partes acepten mantener esta información confidencial. También podemos divulgar su información cuando consideremos que es apropiado para cumplir con la ley, hacer cumplir las políticas de nuestro sitio o proteger nuestros derechos o los de terceros, su propiedad o seguridad.


5. Privacidad de los menores

Cumplimos con la Ley de Protección de la Privacidad Infantil en Internet (COPPA). Nuestros servicios no están dirigidos a menores de 13 años y no recopilamos conscientemente información personal de menores de 13 años. Si nos enteramos de que hemos recopilado información personal de un menor de 13 años, tomaremos medidas para eliminar dicha información.


6. Cambios en nuestra Política de privacidad

Podemos actualizar esta Política de privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de privacidad en esta página. Se le recomienda revisar esta Política de privacidad periódicamente para estar al tanto de los cambios.


7. Sus derechos

Usted tiene derecho a solicitar acceso a la información personal que tenemos sobre usted, a solicitar la corrección de cualquier inexactitud y a solicitar la eliminación de su información personal, sujeto a ciertas excepciones. Para ejercer estos derechos, póngase en contacto con nosotros utilizando la información que se proporciona a continuación.


8. Contáctenos

Si tiene alguna pregunta sobre esta Política de privacidad o nuestras prácticas de datos, póngase en contacto con nosotros en ${env.CONTACT_EMAIL}. Nos comprometemos a atender sus inquietudes y a proteger su privacidad.


9. Reconocimiento

Al utilizar nuestros servicios, usted reconoce que ha leído y comprendido esta Política de privacidad y acepta sus condiciones.
    `,
  },
  it: {
    TITLE: 'Informativa sulla privacy',
    PRIVACY_POLICY: `
La tua privacy è importante per noi di ${env.WEBSITE_NAME}. Questa Informativa sulla privacy descrive come raccogliamo, utilizziamo e proteggiamo le tue informazioni quando utilizzi il nostro sito web e i nostri servizi. Accedendo ai nostri servizi, acconsenti alle pratiche descritte in questa informativa.


1. Informazioni che raccogliamo

Raccogliamo informazioni da te quando ti registri sul nostro sito, effettui un ordine o interagisci con i nostri servizi. Le informazioni che possiamo raccogliere includono:

Nome
Indirizzo email
Numero di telefono
Informazioni di pagamento
Preferenze di noleggio
Puoi visitare il nostro sito in forma anonima, ma alcune funzionalità potrebbero essere limitate.


2. Come utilizziamo le tue informazioni

Le tue informazioni possono essere utilizzate nei seguenti modi:

Per elaborare le tue prenotazioni e i pagamenti
Per migliorare il servizio clienti
Per inviare email periodiche riguardanti il tuo ordine o altri prodotti e servizi
Per rispondere a richieste e domande di supporto


3. Come proteggiamo le tue informazioni

Implementiamo diverse misure di sicurezza per mantenere al sicuro le tue informazioni personali. Tutte le informazioni sensibili vengono trasmesse tramite server sicuri e sono accessibili solo al personale autorizzato. Non memorizziamo i dati della tua carta di credito sui nostri server.


4. Condivisione delle tue informazioni

Non vendiamo, scambiamo né trasferiamo in altro modo le tue informazioni personali identificabili a terzi, tranne che a partner di fiducia che ci assistono nella gestione del nostro sito web, nella conduzione della nostra attività o nella fornitura di servizi, a condizione che tali parti accettino di mantenere riservate queste informazioni. Potremmo inoltre divulgare le tue informazioni quando riteniamo che la divulgazione sia appropriata per conformarci alla legge, applicare le politiche del nostro sito o proteggere i nostri diritti o quelli di terzi, la loro proprietà o sicurezza.


5. Privacy dei minori

Ci conformiamo alla Legge sulla protezione della privacy online dei minori (COPPA). I nostri servizi non sono destinati a minori di 13 anni e non raccogliamo consapevolmente informazioni personali da minori di 13 anni. Se veniamo a conoscenza di aver raccolto informazioni personali da un minore di 13 anni, adotteremo le misure necessarie per eliminare tali informazioni.


6. Modifiche alla nostra Informativa sulla privacy

Potremmo aggiornare questa Informativa sulla privacy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova Informativa sulla privacy su questa pagina. Ti consigliamo di consultare periodicamente questa informativa per eventuali modifiche.


7. I tuoi diritti

Hai il diritto di richiedere l'accesso alle informazioni personali che deteniamo su di te, di richiedere la correzione di eventuali inesattezze e di richiedere la cancellazione delle tue informazioni personali, fatto salvo alcune eccezioni. Per esercitare questi diritti, ti preghiamo di contattarci utilizzando le informazioni fornite di seguito.


8. Contattaci

Per qualsiasi domanda su questa Informativa sulla privacy o sulle nostre pratiche relative ai dati, ti preghiamo di contattarci all'indirizzo ${env.CONTACT_EMAIL}. Ci impegniamo a rispondere alle tue preoccupazioni e a proteggere la tua privacy.


9. Riconoscimento

Utilizzando i nostri servizi, riconosci di aver letto e compreso questa Informativa sulla privacy e di accettarne le condizioni.
    `,
  },
  de: {
    TITLE: 'Datenschutzrichtlinie',
    PRIVACY_POLICY: `
Ihre Privatsphäre ist uns bei ${env.WEBSITE_NAME} wichtig. Diese Datenschutzrichtlinie beschreibt, wie wir Ihre Informationen erfassen, verwenden und schützen, wenn Sie unsere Website und Dienste nutzen. Durch den Zugriff auf unsere Dienste stimmen Sie den in dieser Richtlinie beschriebenen Praktiken zu.


1. Informationen, die wir erfassen

Wir erfassen Informationen von Ihnen, wenn Sie sich auf unserer Website registrieren, eine Bestellung aufgeben oder mit unseren Diensten interagieren. Zu den Informationen, die wir erfassen können, gehören:

Name
E-Mail-Adresse
Telefonnummer
Zahlungsinformationen
Mietpräferenzen
Sie können unsere Website anonym besuchen, bestimmte Funktionen können jedoch eingeschränkt sein.


2. Wie wir Ihre Informationen verwenden

Ihre Informationen können auf folgende Weise verwendet werden:

Zur Bearbeitung Ihrer Reservierungen und Zahlungen
Zur Verbesserung des Kundenservice
Zum Versand regelmäßiger E-Mails zu Ihrer Bestellung oder anderen Produkten und Dienstleistungen
Zur Beantwortung von Anfragen und Support-Anforderungen


3. Wie wir Ihre Informationen schützen

Wir setzen verschiedene Sicherheitsmaßnahmen ein, um die Sicherheit Ihrer persönlichen Daten zu gewährleisten. Alle sensiblen Informationen werden über sichere Server übertragen und sind nur autorisiertem Personal zugänglich. Wir speichern Ihre Kreditkartendaten nicht auf unseren Servern.


4. Weitergabe Ihrer Informationen

Wir verkaufen, tauschen oder übertragen Ihre personenbezogenen Daten nicht an Dritte, außer an vertrauenswürdige Partner, die uns beim Betrieb unserer Website, bei der Geschäftsführung oder bei der Betreuung unterstützen, sofern diese Parteien zustimmen, diese Informationen vertraulich zu behandeln. Wir können Ihre Daten auch offenlegen, wenn wir der Meinung sind, dass dies zur Einhaltung von Gesetzen, zur Durchsetzung unserer Website-Richtlinien oder zum Schutz unserer Rechte oder der Rechte Dritter, deren Eigentum oder Sicherheit angemessen ist.


5. Datenschutz für Kinder

Wir halten uns an das Kinderschutzgesetz zum Online-Datenschutz (COPPA). Unsere Dienste richten sich nicht an Kinder unter 13 Jahren, und wir erfassen nicht wissentlich personenbezogene Daten von Kindern unter 13 Jahren. Wenn wir erfahren, dass wir personenbezogene Daten eines Kindes unter 13 Jahren erfasst haben, werden wir Maßnahmen ergreifen, um diese Daten zu löschen.


6. Änderungen unserer Datenschutzrichtlinie

Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wir werden Sie über Änderungen informieren, indem wir die neue Datenschutzrichtlinie auf dieser Seite veröffentlichen. Es wird empfohlen, diese Datenschutzrichtlinie regelmäßig auf Änderungen zu überprüfen.


7. Ihre Rechte

Sie haben das Recht, Zugang zu den personenbezogenen Daten zu verlangen, die wir über Sie gespeichert haben, die Berichtigung von Ungenauigkeiten zu verlangen und die Löschung Ihrer personenbezogenen Daten zu verlangen, vorbehaltlich bestimmter Ausnahmen. Um diese Rechte auszuüben, kontaktieren Sie uns bitte unter den unten angegebenen Informationen.


8. Kontaktieren Sie uns

Wenn Sie Fragen zu dieser Datenschutzrichtlinie oder unseren Datenpraktiken haben, kontaktieren Sie uns bitte unter ${env.CONTACT_EMAIL}. Wir sind bestrebt, Ihre Anliegen zu berücksichtigen und Ihre Privatsphäre zu schützen.


9. Bestätigung

Durch die Nutzung unserer Dienste bestätigen Sie, dass Sie diese Datenschutzrichtlinie gelesen und verstanden haben und ihren Bedingungen zustimmen.
    `,
  },
})

langHelper.setLanguage(strings)
export { strings }
