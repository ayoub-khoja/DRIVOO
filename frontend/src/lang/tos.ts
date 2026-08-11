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
})

langHelper.setLanguage(strings)
export { strings }
