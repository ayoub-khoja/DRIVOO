import * as bookcarsTypes from ':bookcars-types'

export type LangCode = keyof bookcarsTypes.LocalizedText

export const LANGS: { code: LangCode, label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
  { code: 'de', label: 'DE' },
]

export const PLAN_DURATIONS = [3, 6, 12] as const

/** Tunisia VAT rate applied on subscription plans. */
export const PLAN_TVA_RATE = 0.19

/** Fiscal stamp (timbre fiscale) in DT. */
export const PLAN_STAMP_DUTY = 1

/**
 * Fixed agency workspace access points (mirrors AgencyLayout sidebar).
 * These are always included and shown read-only on the plan form.
 */
export const AGENCY_ACCESS_POINTS: { key: string, label: bookcarsTypes.LocalizedText }[] = [
  {
    key: 'dashboard',
    label: {
      fr: 'Tableau de bord', en: 'Dashboard', ar: 'لوحة القيادة',
      es: 'Panel', it: 'Dashboard', de: 'Dashboard',
    },
  },
  {
    key: 'fleet',
    label: {
      fr: 'Parc auto', en: 'Fleet', ar: 'الأسطول',
      es: 'Flota', it: 'Flotta', de: 'Flotte',
    },
  },
  {
    key: 'bookings',
    label: {
      fr: 'Réservations', en: 'Bookings', ar: 'الحجوزات',
      es: 'Reservas', it: 'Prenotazioni', de: 'Buchungen',
    },
  },
  {
    key: 'agenda',
    label: {
      fr: 'Agenda', en: 'Agenda', ar: 'الأجندة',
      es: 'Agenda', it: 'Agenda', de: 'Agenda',
    },
  },
  {
    key: 'reviews',
    label: {
      fr: 'Avis clients', en: 'Guest reviews', ar: 'آراء العملاء',
      es: 'Opiniones', it: 'Recensioni', de: 'Bewertungen',
    },
  },
  {
    key: 'clients',
    label: {
      fr: 'Mes clients', en: 'My clients', ar: 'عملائي',
      es: 'Mis clientes', it: 'I miei clienti', de: 'Meine Kunden',
    },
  },
  {
    key: 'branches',
    label: {
      fr: 'Mes agences', en: 'My agencies', ar: 'وكالاتي',
      es: 'Mis agencias', it: 'Le mie agenzie', de: 'Meine Agenturen',
    },
  },
  {
    key: 'invoices',
    label: {
      fr: 'Facture numérique', en: 'Digital invoice', ar: 'فاتورة رقمية',
      es: 'Factura digital', it: 'Fattura digitale', de: 'Digitale Rechnung',
    },
  },
  {
    key: 'receipts',
    label: {
      fr: 'Reçu numérique', en: 'Digital receipt', ar: 'إيصال رقمي',
      es: 'Recibo digital', it: 'Ricevuta digitale', de: 'Digitaler Beleg',
    },
  },
  {
    key: 'contracts',
    label: {
      fr: 'Contrat numérique', en: 'Digital contract', ar: 'عقد رقمي',
      es: 'Contrato digital', it: 'Contratto digitale', de: 'Digitaler Vertrag',
    },
  },
  {
    key: 'subscription',
    label: {
      fr: 'Abonnement', en: 'Subscription', ar: 'الاشتراك',
      es: 'Suscripción', it: 'Abbonamento', de: 'Abonnement',
    },
  },
  {
    key: 'maintenance',
    label: {
      fr: 'Rappel et entretien', en: 'Reminders & maintenance', ar: 'التذكير والصيانة',
      es: 'Recordatorios y mantenimiento', it: 'Promemoria e manutenzione', de: 'Erinnerungen & Wartung',
    },
  },
  {
    key: 'profile',
    label: {
      fr: 'Profil', en: 'Profile', ar: 'الملف الشخصي',
      es: 'Perfil', it: 'Profilo', de: 'Profil',
    },
  },
]

/** @deprecated Prefer AGENCY_ACCESS_POINTS — kept for existing plan cards. */
export const SERVICE_CATALOG = AGENCY_ACCESS_POINTS

/** Display order for the 10 access points shown on plan cards (admin + agency). */
export const PRIORITY_ACCESS_KEYS = [
  'dashboard',
  'fleet',
  'bookings',
  'agenda',
  'invoices',
  'receipts',
  'contracts',
  'clients',
  'branches',
  'reviews',
] as const

/** Resolve access points for plan cards — same list/order as agency subscription UI. */
export const getPlanAccessItems = (_plan?: bookcarsTypes.SubscriptionPlan | null) => {
  const byKey = new Map(AGENCY_ACCESS_POINTS.map((item) => [item.key, item]))
  return PRIORITY_ACCESS_KEYS
    .map((key) => byKey.get(key))
    .filter((item): item is (typeof AGENCY_ACCESS_POINTS)[number] => !!item)
}

export const emptyLocalized = (): bookcarsTypes.LocalizedText => ({
  fr: '',
  en: '',
  ar: '',
  es: '',
  it: '',
  de: '',
})

export const emptyPricing = (): bookcarsTypes.SubscriptionPlanPricing[] =>
  PLAN_DURATIONS.map((months) => ({
    months,
    monthlyPrice: 0,
    totalPrice: 0,
    discountPercent: 0,
  }))

export const computePlanTaxBreakdown = (priceHt: number) => {
  const ht = Number.isFinite(priceHt) && priceHt > 0 ? priceHt : 0
  const tva = Number((ht * PLAN_TVA_RATE).toFixed(3))
  const stamp = ht > 0 ? PLAN_STAMP_DUTY : 0
  const totalTtc = Number((ht + tva + stamp).toFixed(3))
  return { priceHt: ht, tva, stamp, totalTtc }
}

export const buildAccessFeatures = (): bookcarsTypes.SubscriptionPlanFeature[] =>
  AGENCY_ACCESS_POINTS.map((item) => ({
    id: item.key,
    label: { ...item.label },
    included: true,
  }))

export const buildAccessServices = (): string[] =>
  AGENCY_ACCESS_POINTS.map((item) => item.key)

export const pricingFromHt = (priceHt: number): bookcarsTypes.SubscriptionPlanPricing[] => {
  const { totalTtc } = computePlanTaxBreakdown(priceHt)
  return PLAN_DURATIONS.map((months) => ({
    months,
    monthlyPrice: totalTtc,
    totalPrice: Number((totalTtc * months).toFixed(3)),
    discountPercent: 0,
  }))
}

export const emptyPlanForm = (): bookcarsTypes.UpsertSubscriptionPlanPayload => ({
  visible: true,
  name: emptyLocalized(),
  subtitle: emptyLocalized(),
  tokens: 0,
  freeTokens: 0,
  trialDays: 0,
  carLimitMin: 0,
  carLimitMax: 0,
  priceHt: 0,
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
  features: buildAccessFeatures(),
  services: buildAccessServices(),
})

export const pickLabel = (text: bookcarsTypes.LocalizedText | undefined, lang: string) => {
  if (!text) {
    return ''
  }
  const key = (LANGS.some((item) => item.code === lang) ? lang : 'fr') as LangCode
  return text[key] || text.fr || text.en || text.ar || text.es || text.it || text.de || ''
}

export const formatPlanPrice = (plan: bookcarsTypes.SubscriptionPlan, lang: string) => {
  if (plan.freePlan) {
    return lang === 'ar' ? 'مجاني' : lang === 'en' ? 'Free' : 'Gratuit'
  }
  const { totalTtc } = computePlanTaxBreakdown(plan.priceHt || 0)
  if (totalTtc > 0) {
    return `${totalTtc.toFixed(2)} DT /an`
  }
  const monthly = plan.pricing.find((row) => row.months === 12)?.monthlyPrice
    ?? plan.pricing.find((row) => row.monthlyPrice > 0)?.monthlyPrice
    ?? 0
  if (!monthly) {
    return lang === 'ar' ? 'مجاني' : lang === 'en' ? 'Free' : 'Gratuit'
  }
  return `${monthly.toFixed(2)} DT /an`
}
