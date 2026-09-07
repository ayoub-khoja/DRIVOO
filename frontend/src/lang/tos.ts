import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE: "Conditions d'utilisation",
    TOS: `
Bienvenue chez ${env.WEBSITE_NAME} ! En accédant à notre site Web et en utilisant nos services, vous acceptez de vous conformer et d'être lié par les conditions d'utilisation suivantes. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

1. Acceptation des conditions

En accédant ou en utilisant nos services, vous confirmez avoir lu, compris et accepté ces conditions d'utilisation et notre politique de confidentialité.

2. Utilisation de nos services

Vous acceptez d'utiliser nos services uniquement à des fins légales et d'une manière qui ne porte pas atteinte aux droits, ne restreint ni n'empêche quiconque d'utiliser nos services. Cela inclut le respect de toutes les lois et réglementations applicables.

3. Réservations et paiements

Lorsque vous effectuez une réservation avec ${env.WEBSITE_NAME}, vous acceptez de fournir des informations exactes et complètes. Tous les paiements doivent être effectués via notre système de paiement sécurisé. Une fois le paiement effectué, vous recevrez une confirmation de votre réservation.

4. Politique d'annulation

Les annulations effectuées 24 heures avant la date de location peuvent donner droit à un remboursement complet. Les annulations effectuées moins de 24 heures avant la date de location peuvent entraîner des frais d'annulation. Veuillez vous référer à notre politique d'annulation pour des informations détaillées.

5. Conditions de location

Toutes les locations sont soumises à nos conditions de location, qui incluent, sans s'y limiter, les restrictions d'âge, les exigences en matière de permis de conduire et les obligations d'assurance. Vous êtes responsable de vous assurer que vous remplissez toutes les conditions avant d'effectuer une réservation.

6. Limitation de responsabilité

${env.WEBSITE_NAME} ne sera pas responsable des dommages indirects, accessoires ou consécutifs découlant de votre utilisation de nos services. En aucun cas, notre responsabilité totale ne dépassera le montant que vous avez payé pour les services.

7. Modifications des conditions

Nous nous réservons le droit de modifier ces conditions de service à tout moment. Toute modification entrera en vigueur immédiatement après sa publication sur notre site Web. Votre utilisation continue de nos services après toute modification constitue votre acceptation des nouvelles conditions.

8. Loi applicable

Ces conditions de service seront régies et interprétées conformément aux lois. Tout litige découlant de ces conditions sera résolu devant les tribunaux.

9. Coordonnées

Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse ${env.CONTACT_EMAIL}. Nous sommes là pour vous aider pour toute demande relative à nos services.

10. Reconnaissance

En utilisant nos services, vous reconnaissez avoir lu et compris ces conditions d'utilisation et acceptez d'être lié par elles.    
    `,
  },
  en: {
    TITLE: 'Terms of Service',
    TOS: `
Welcome to ${env.WEBSITE_NAME}! By accessing our website and using our services, you agree to comply with and be bound by the following Terms of Service. If you do not agree to these terms, please do not use our services.


1. Acceptance of Terms

By accessing or using our services, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.


2. Use of Our Services

You agree to use our services only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use of our services. This includes compliance with all applicable laws and regulations.


3. Reservations and Payments

When you make a reservation with ${env.WEBSITE_NAME}, you agree to provide accurate and complete information. All payments must be made through our secure payment system. Once payment is completed, you will receive a confirmation of your reservation.


4. Cancellation Policy

Cancellations made 24 hours before the rental date may be eligible for a full refund. Cancellations made less than 24 hours prior to the rental date may incur a cancellation fee. Please refer to our cancellation policy for detailed information.


5. Rental Conditions

All rentals are subject to our rental conditions, which include but are not limited to age restrictions, driver's license requirements, and insurance obligations. You are responsible for ensuring that you meet all requirements before making a reservation.


6. Limitation of Liability

${env.WEBSITE_NAME} shall not be liable for any indirect, incidental, or consequential damages arising out of your use of our services. In no event shall our total liability exceed the amount paid by you for the services.


7. Modifications to Terms

We reserve the right to modify these Terms of Service at any time. Any changes will be effective immediately upon posting on our website. Your continued use of our services following any changes constitutes your acceptance of the new terms.


8. Governing Law

These Terms of Service shall be governed by and construed in accordance with the laws. Any disputes arising out of these terms shall be resolved in the courts.


9. Contact Information

If you have any questions regarding these Terms of Service, please contact us at ${env.CONTACT_EMAIL}. We are here to help you with any inquiries related to our services.


10. Acknowledgment

By using our services, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
    `,
  },
  ar: {
    TITLE: 'شروط الاستخدام',
    TOS: `
مرحبًا بك في ${env.WEBSITE_NAME}! بالوصول إلى موقعنا واستخدام خدماتنا، فإنك توافق على الالتزام بشروط الاستخدام التالية. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.


1. قبول الشروط

بالوصول إلى خدماتنا أو استخدامها، فإنك تؤكد أنك قد قرأت وفهمت ووافقت على شروط الاستخدام هذه وسياسة الخصوصية الخاصة بنا.


2. استخدام خدماتنا

توافق على استخدام خدماتنا لأغراض قانونية فقط وبطريقة لا تنتهك حقوق الآخرين أو تقيّد أو تمنع استخدامهم لخدماتنا. يشمل ذلك الامتثال لجميع القوانين واللوائح المعمول بها.


3. الحجوزات والمدفوعات

عند إجراء حجز مع ${env.WEBSITE_NAME}، توافق على تقديم معلومات دقيقة وكاملة. يجب إجراء جميع المدفوعات عبر نظام الدفع الآمن لدينا. بمجرد إتمام الدفع، ستتلقى تأكيدًا لحجزك.


4. سياسة الإلغاء

قد تكون عمليات الإلغاء التي تتم قبل 24 ساعة من تاريخ التأجير مؤهلة لاسترداد كامل. قد تترتب على عمليات الإلغاء التي تتم قبل أقل من 24 ساعة من تاريخ التأجير رسوم إلغاء. يرجى الرجوع إلى سياسة الإلغاء للحصول على معلومات مفصلة.


5. شروط التأجير

تخضع جميع عمليات التأجير لشروط التأجير الخاصة بنا، والتي تشمل على سبيل المثال لا الحصر قيود العمر ومتطلبات رخصة القيادة والتزامات التأمين. أنت مسؤول عن التأكد من استيفاء جميع المتطلبات قبل إجراء الحجز.


6. تحديد المسؤولية

لن تكون ${env.WEBSITE_NAME} مسؤولة عن أي أضرار غير مباشرة أو عرضية أو تبعية ناشئة عن استخدامك لخدماتنا. وفي جميع الأحوال، لن تتجاوز مسؤوليتنا الإجمالية المبلغ الذي دفعته مقابل الخدمات.


7. تعديل الشروط

نحتفظ بالحق في تعديل شروط الاستخدام هذه في أي وقت. يصبح أي تغيير ساريًا فور نشره على موقعنا. استمرارك في استخدام خدماتنا بعد أي تغيير يُعد قبولًا منك للشروط الجديدة.


8. القانون المعمول به

تُفسر شروط الاستخدام هذه وتُحكم وفقًا للقوانين. تُحل أي نزاعات ناشئة عن هذه الشروط أمام المحاكم.


9. معلومات الاتصال

إذا كانت لديك أي أسئلة بخصوص شروط الاستخدام هذه، يرجى التواصل معنا على ${env.CONTACT_EMAIL}. نحن هنا لمساعدتك في أي استفسارات تتعلق بخدماتنا.


10. الإقرار

باستخدامك لخدماتنا، فإنك تقر بأنك قد قرأت وفهمت شروط الاستخدام هذه وتوافق على الالتزام بها.
    `,
  },
  es: {
    TITLE: 'Condiciones de uso',
    TOS: `
¡Bienvenido a ${env.WEBSITE_NAME}! Al acceder a nuestro sitio web y utilizar nuestros servicios, usted acepta cumplir y quedar obligado por las siguientes Condiciones de uso. Si no acepta estas condiciones, le rogamos que no utilice nuestros servicios.


1. Aceptación de las condiciones

Al acceder o utilizar nuestros servicios, usted confirma que ha leído, comprendido y acepta estas Condiciones de uso y nuestra Política de privacidad.


2. Uso de nuestros servicios

Usted se compromete a utilizar nuestros servicios únicamente con fines lícitos y de un modo que no infrinja los derechos de terceros ni restrinja o impida el uso de nuestros servicios por parte de otros. Esto incluye el cumplimiento de todas las leyes y normativas aplicables.


3. Reservas y pagos

Al realizar una reserva con ${env.WEBSITE_NAME}, usted se compromete a proporcionar información precisa y completa. Todos los pagos deben realizarse a través de nuestro sistema de pago seguro. Una vez completado el pago, recibirá una confirmación de su reserva.


4. Política de cancelación

Las cancelaciones realizadas 24 horas antes de la fecha de alquiler pueden optar a un reembolso completo. Las cancelaciones realizadas con menos de 24 horas de antelación pueden conllevar una tarifa de cancelación. Consulte nuestra política de cancelación para obtener información detallada.


5. Condiciones de alquiler

Todos los alquileres están sujetos a nuestras condiciones de alquiler, que incluyen, entre otras, restricciones de edad, requisitos de permiso de conducir y obligaciones de seguro. Usted es responsable de asegurarse de que cumple todos los requisitos antes de realizar una reserva.


6. Limitación de responsabilidad

${env.WEBSITE_NAME} no será responsable de ningún daño indirecto, incidental o consecuente derivado del uso de nuestros servicios. En ningún caso nuestra responsabilidad total superará el importe que usted haya abonado por los servicios.


7. Modificación de las condiciones

Nos reservamos el derecho de modificar estas Condiciones de uso en cualquier momento. Cualquier cambio entrará en vigor inmediatamente tras su publicación en nuestro sitio web. El uso continuado de nuestros servicios tras cualquier cambio constituye su aceptación de las nuevas condiciones.


8. Legislación aplicable

Estas Condiciones de uso se regirán e interpretarán de conformidad con la legislación vigente. Cualquier controversia derivada de estas condiciones se resolverá ante los tribunales competentes.


9. Información de contacto

Si tiene alguna pregunta sobre estas Condiciones de uso, póngase en contacto con nosotros en ${env.CONTACT_EMAIL}. Estamos a su disposición para cualquier consulta relacionada con nuestros servicios.


10. Reconocimiento

Al utilizar nuestros servicios, usted reconoce que ha leído y comprendido estas Condiciones de uso y acepta quedar obligado por ellas.
    `,
  },
  it: {
    TITLE: 'Condizioni di utilizzo',
    TOS: `
Benvenuto su ${env.WEBSITE_NAME}! Accedendo al nostro sito web e utilizzando i nostri servizi, accetti di rispettare e di essere vincolato dalle seguenti Condizioni di utilizzo. Se non accetti queste condizioni, ti preghiamo di non utilizzare i nostri servizi.


1. Accettazione delle condizioni

Accedendo o utilizzando i nostri servizi, confermi di aver letto, compreso e accettato queste Condizioni di utilizzo e la nostra Informativa sulla privacy.


2. Utilizzo dei nostri servizi

Ti impegni a utilizzare i nostri servizi solo per scopi leciti e in un modo che non violi i diritti di terzi né limiti o impedisca l'utilizzo dei nostri servizi da parte di altri. Ciò include il rispetto di tutte le leggi e normative applicabili.


3. Prenotazioni e pagamenti

Quando effettui una prenotazione con ${env.WEBSITE_NAME}, accetti di fornire informazioni accurate e complete. Tutti i pagamenti devono essere effettuati tramite il nostro sistema di pagamento sicuro. Una volta completato il pagamento, riceverai una conferma della tua prenotazione.


4. Politica di cancellazione

Le cancellazioni effettuate 24 ore prima della data di noleggio possono dare diritto a un rimborso completo. Le cancellazioni effettuate meno di 24 ore prima della data di noleggio possono comportare una penale di cancellazione. Si prega di consultare la nostra politica di cancellazione per informazioni dettagliate.


5. Condizioni di noleggio

Tutti i noleggi sono soggetti alle nostre condizioni di noleggio, che includono, a titolo esemplificativo, restrizioni di età, requisiti della patente di guida e obblighi assicurativi. Sei responsabile di assicurarti di soddisfare tutti i requisiti prima di effettuare una prenotazione.


6. Limitazione di responsabilità

${env.WEBSITE_NAME} non sarà responsabile per eventuali danni indiretti, incidentali o consequenziali derivanti dall'utilizzo dei nostri servizi. In nessun caso la nostra responsabilità totale supererà l'importo da te pagato per i servizi.


7. Modifiche alle condizioni

Ci riserviamo il diritto di modificare queste Condizioni di utilizzo in qualsiasi momento. Qualsiasi modifica entrerà in vigore immediatamente dopo la pubblicazione sul nostro sito web. L'uso continuato dei nostri servizi dopo eventuali modifiche costituisce la tua accettazione delle nuove condizioni.


8. Legge applicabile

Queste Condizioni di utilizzo saranno regolate e interpretate in conformità con le leggi vigenti. Qualsiasi controversia derivante da queste condizioni sarà risolta presso i tribunali competenti.


9. Informazioni di contatto

Per qualsiasi domanda riguardante queste Condizioni di utilizzo, ti preghiamo di contattarci all'indirizzo ${env.CONTACT_EMAIL}. Siamo a tua disposizione per qualsiasi richiesta relativa ai nostri servizi.


10. Riconoscimento

Utilizzando i nostri servizi, riconosci di aver letto e compreso queste Condizioni di utilizzo e accetti di esserne vincolato.
    `,
  },
  de: {
    TITLE: 'Nutzungsbedingungen',
    TOS: `
Willkommen bei ${env.WEBSITE_NAME}! Durch den Zugriff auf unsere Website und die Nutzung unserer Dienste erklären Sie sich mit den folgenden Nutzungsbedingungen einverstanden. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie bitte unsere Dienste nicht.


1. Annahme der Bedingungen

Durch den Zugriff auf oder die Nutzung unserer Dienste bestätigen Sie, dass Sie diese Nutzungsbedingungen und unsere Datenschutzrichtlinie gelesen und verstanden haben und ihnen zustimmen.


2. Nutzung unserer Dienste

Sie verpflichten sich, unsere Dienste nur für rechtmäßige Zwecke und in einer Weise zu nutzen, die die Rechte Dritter nicht verletzt und die Nutzung unserer Dienste durch andere nicht einschränkt oder verhindert. Dies umfasst die Einhaltung aller geltenden Gesetze und Vorschriften.


3. Reservierungen und Zahlungen

Wenn Sie eine Reservierung bei ${env.WEBSITE_NAME} vornehmen, verpflichten Sie sich, genaue und vollständige Angaben zu machen. Alle Zahlungen müssen über unser sicheres Zahlungssystem erfolgen. Nach Abschluss der Zahlung erhalten Sie eine Bestätigung Ihrer Reservierung.


4. Stornierungsbedingungen

Stornierungen, die 24 Stunden vor dem Mietdatum erfolgen, können zu einer vollständigen Rückerstattung berechtigen. Bei Stornierungen weniger als 24 Stunden vor dem Mietdatum kann eine Stornogebühr anfallen. Bitte lesen Sie unsere Stornierungsrichtlinie für detaillierte Informationen.


5. Mietbedingungen

Alle Anmietungen unterliegen unseren Mietbedingungen, die unter anderem Altersbeschränkungen, Führerscheinanforderungen und Versicherungspflichten umfassen. Sie sind dafür verantwortlich, sicherzustellen, dass Sie alle Anforderungen erfüllen, bevor Sie eine Reservierung vornehmen.


6. Haftungsbeschränkung

${env.WEBSITE_NAME} haftet nicht für indirekte, beiläufige oder Folgeschäden, die sich aus der Nutzung unserer Dienste ergeben. In keinem Fall übersteigt unsere Gesamthaftung den Betrag, den Sie für die Dienste gezahlt haben.


7. Änderungen der Bedingungen

Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Alle Änderungen werden sofort nach Veröffentlichung auf unserer Website wirksam. Die fortgesetzte Nutzung unserer Dienste nach Änderungen gilt als Ihre Zustimmung zu den neuen Bedingungen.


8. Anwendbares Recht

Diese Nutzungsbedingungen unterliegen dem geltenden Recht und sind entsprechend auszulegen. Streitigkeiten aus diesen Bedingungen werden vor den zuständigen Gerichten beigelegt.


9. Kontaktinformationen

Wenn Sie Fragen zu diesen Nutzungsbedingungen haben, kontaktieren Sie uns bitte unter ${env.CONTACT_EMAIL}. Wir helfen Ihnen gerne bei allen Anfragen zu unseren Diensten.


10. Bestätigung

Durch die Nutzung unserer Dienste bestätigen Sie, dass Sie diese Nutzungsbedingungen gelesen und verstanden haben und sich an sie gebunden fühlen.
    `,
  },
})

langHelper.setLanguage(strings)
export { strings }
