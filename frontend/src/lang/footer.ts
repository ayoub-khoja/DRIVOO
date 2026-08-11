import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const COPYRIGHT_PART1 = `Copyright © ${new Date().getFullYear()} ${env.WEBSITE_NAME}`

const strings = new LocalizedStrings({
  fr: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. Tous droits réservés.',
    CORPORATE: 'À Propos',
    ABOUT: 'À propos de Nous',
    TOS: "Conditions d'utilisation",
    RENT: 'Louer une Voiture',
    SUPPLIERS: 'Fournisseurs',
    LOCATIONS: 'Lieux',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `Paiement 100% sécurisé avec ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Politique de Confidentialité',
    FAQ: 'FAQ',
    COOKIE_POLICY: 'Politique de cookies',
  },
  en: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. All rights reserved.',
    CORPORATE: 'Corporate',
    ABOUT: 'About Us',
    TOS: 'Terms of Service',
    RENT: 'Rent a Car',
    SUPPLIERS: 'Suppliers',
    LOCATIONS: 'Locations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `100% secure payment with ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Privacy Policy',
    FAQ: 'FAQ',
    COOKIE_POLICY: 'Cookie Policy',
  },
  ar: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. جميع الحقوق محفوظة.',
    CORPORATE: 'الشركة',
    ABOUT: 'من نحن',
    TOS: 'شروط الاستخدام',
    RENT: 'استأجر سيارة',
    SUPPLIERS: 'الموردون',
    LOCATIONS: 'الأماكن',
    SUPPORT: 'الدعم',
    CONTACT: 'اتصل بنا',
    SECURE_PAYMENT: `دفع آمن بنسبة 100٪ مع ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'سياسة الخصوصية',
    FAQ: 'الأسئلة الشائعة',
    COOKIE_POLICY: 'سياسة ملفات تعريف الارتباط',
  },
})

langHelper.setLanguage(strings)
export { strings }
