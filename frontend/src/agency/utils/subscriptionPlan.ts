import * as bookcarsTypes from ':bookcars-types'

export type LangCode = keyof bookcarsTypes.LocalizedText

export const SERVICE_CATALOG: { key: string, label: bookcarsTypes.LocalizedText }[] = [
  { key: 'fleet', label: { fr: 'Accès au parc auto', en: 'Fleet access', ar: 'الوصول إلى الأسطول' } },
  { key: 'bookings', label: { fr: 'Accès aux réservations', en: 'Bookings access', ar: 'الوصول إلى الحجوزات' } },
  { key: 'reviews', label: { fr: 'Accès aux avis clients', en: 'Reviews access', ar: 'الوصول إلى آراء العملاء' } },
  { key: 'branches', label: { fr: 'Accès aux sous-agences', en: 'Sub-agencies access', ar: 'الوصول إلى الوكالات الفرعية' } },
  { key: 'invoices', label: { fr: 'Accès aux factures', en: 'Invoices access', ar: 'الوصول إلى الفواتير' } },
  { key: 'receipts', label: { fr: 'Accès aux reçus', en: 'Receipts access', ar: 'الوصول إلى الإيصالات' } },
  { key: 'contact', label: { fr: 'Accès au contact', en: 'Contact access', ar: 'الوصول إلى الاتصال' } },
  { key: 'maintenance', label: { fr: 'Accès aux rappels et entretien', en: 'Reminders & maintenance', ar: 'الوصول إلى التذكير والصيانة' } },
  { key: 'public_profile', label: { fr: 'Profil public de l’agence', en: 'Public agency profile', ar: 'الملف العام للوكالة' } },
  { key: 'analytics', label: { fr: 'Tableau de bord analytique', en: 'Analytics dashboard', ar: 'لوحة التحليلات' } },
  { key: 'settings_billing', label: { fr: 'Accès aux paramètres — Facturation', en: 'Settings — Billing', ar: 'الإعدادات — الفوترة' } },
  { key: 'settings_tickets', label: { fr: 'Accès aux paramètres — Tickets', en: 'Settings — Tickets', ar: 'الإعدادات — التذاكر' } },
  { key: 'priority_support', label: { fr: 'Support prioritaire', en: 'Priority support', ar: 'دعم ذو أولوية' } },
]

export const pickLabel = (text: bookcarsTypes.LocalizedText | undefined, lang: string) => {
  if (!text) {
    return ''
  }
  const key = (['fr', 'en', 'ar'].includes(lang) ? lang : 'fr') as LangCode
  return text[key] || text.fr || text.en || text.ar || ''
}

export const formatPlanPrice = (plan: bookcarsTypes.SubscriptionPlan, lang: string) => {
  if (plan.freePlan) {
    return lang === 'ar' ? 'مجاني' : lang === 'en' ? 'Free' : 'Gratuit'
  }
  const monthly = plan.pricing.find((row) => row.months === 12)?.monthlyPrice
    ?? plan.pricing.find((row) => row.monthlyPrice > 0)?.monthlyPrice
    ?? 0
  if (!monthly) {
    return lang === 'ar' ? 'مجاني' : lang === 'en' ? 'Free' : 'Gratuit'
  }
  return `${monthly.toFixed(2)} DT`
}

export const needsAgencyPlan = (agency: bookcarsTypes.User | null | undefined) =>
  !!agency
  && agency.type === bookcarsTypes.UserType.Supplier
  && !agency.parentAgency
  && !agency.subscriptionPlan
