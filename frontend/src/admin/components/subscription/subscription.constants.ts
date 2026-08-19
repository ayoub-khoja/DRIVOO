import * as bookcarsTypes from ':bookcars-types'

export type LangCode = keyof bookcarsTypes.LocalizedText

export const LANGS: { code: LangCode, label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
]

export const PLAN_DURATIONS = [3, 6, 12] as const

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

export const emptyLocalized = (): bookcarsTypes.LocalizedText => ({ fr: '', en: '', ar: '' })

export const emptyPricing = (): bookcarsTypes.SubscriptionPlanPricing[] =>
  PLAN_DURATIONS.map((months) => ({
    months,
    monthlyPrice: 0,
    totalPrice: 0,
    discountPercent: 0,
  }))

export const emptyPlanForm = (): bookcarsTypes.UpsertSubscriptionPlanPayload => ({
  visible: true,
  name: emptyLocalized(),
  subtitle: emptyLocalized(),
  tokens: 0,
  freeTokens: 0,
  trialMonths: 0,
  pricing: emptyPricing(),
  freePlan: false,
  mostPopular: false,
  firstTrialFree: false,
  active: true,
  visibleVerified: true,
  visibleUnverified: true,
  showPaymentButton: true,
  unlimitedDuration: false,
  requiresApproval: false,
  discountId: null,
  features: [],
  services: [],
})

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
  return `${monthly.toFixed(2)} DT /mois`
}
