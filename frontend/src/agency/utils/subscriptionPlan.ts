import * as bookcarsTypes from ':bookcars-types'

export type LangCode = keyof bookcarsTypes.LocalizedText

export const PLAN_TVA_RATE = 0.19
export const PLAN_STAMP_DUTY = 1

export const SERVICE_CATALOG: { key: string, label: bookcarsTypes.LocalizedText }[] = [
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

export const pickLabel = (text: bookcarsTypes.LocalizedText | undefined, lang: string) => {
  if (!text) {
    return ''
  }
  const key = (['fr', 'en', 'ar', 'es', 'it', 'de'].includes(lang) ? lang : 'fr') as LangCode
  return text[key] || text.fr || text.en || text.ar || text.es || text.it || text.de || ''
}

export const computePlanTotalTtc = (priceHt: number) => {
  const ht = Number.isFinite(priceHt) && priceHt > 0 ? priceHt : 0
  if (!ht) {
    return 0
  }
  return Number((ht + (ht * PLAN_TVA_RATE) + PLAN_STAMP_DUTY).toFixed(3))
}

export const formatPlanPrice = (plan: bookcarsTypes.SubscriptionPlan, lang: string) => {
  if (plan.freePlan) {
    return lang === 'ar' ? 'مجاني' : lang === 'en' ? 'Free' : 'Gratuit'
  }
  const ht = Number.isFinite(plan.priceHt) && plan.priceHt > 0 ? plan.priceHt : 0
  if (ht > 0) {
    return `${ht.toFixed(2)} DT`
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
