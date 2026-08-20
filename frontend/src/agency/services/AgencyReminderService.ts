import * as bookcarsTypes from ':bookcars-types'
import type {
  AgencyReminder,
  ReminderModule,
  ReminderSeverity,
  ReminderStats,
} from '@/agency/types/reminder'

const storageKey = (agencyId: string) => `drivoo.agency.reminders.${agencyId}`
const odometerKey = (agencyId: string) => `drivoo.agency.odometers.${agencyId}`

const DAYS_CRITICAL = 0
const DAYS_WARNING = 14

const toDate = (value?: Date | string | null) => {
  if (!value) {
    return null
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const daysUntil = (due: Date, now = new Date()) => {
  const ms = startOfDay(due).getTime() - startOfDay(now).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export const severityFromDays = (days: number): ReminderSeverity => {
  if (days < DAYS_CRITICAL) {
    return 'critical'
  }
  if (days <= DAYS_WARNING) {
    return 'warning'
  }
  return 'info'
}

const vehicleLabel = (car: bookcarsTypes.Car) => {
  const plate = car.licensePlate ? ` · ${car.licensePlate}` : ''
  return `${car.name}${plate}`
}

const readManual = (agencyId: string): AgencyReminder[] => {
  try {
    const raw = localStorage.getItem(storageKey(agencyId))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as AgencyReminder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeManual = (agencyId: string, rows: AgencyReminder[]) => {
  localStorage.setItem(storageKey(agencyId), JSON.stringify(rows))
}

export const readOdometers = (agencyId: string): Record<string, number> => {
  try {
    const raw = localStorage.getItem(odometerKey(agencyId))
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const setOdometer = (agencyId: string, vehicleId: string, km: number) => {
  const all = readOdometers(agencyId)
  all[vehicleId] = km
  localStorage.setItem(odometerKey(agencyId), JSON.stringify(all))
}

const fleetReminders = (cars: bookcarsTypes.Car[]): AgencyReminder[] => {
  const now = new Date()
  const rows: AgencyReminder[] = []

  cars.forEach((car) => {
    const label = vehicleLabel(car)

    const pushDate = (
      module: ReminderModule,
      category: string,
      title: string,
      value?: Date | string | null,
    ) => {
      const due = toDate(value)
      if (!due) {
        return
      }
      const days = daysUntil(due, now)
      rows.push({
        _id: `fleet-${car._id}-${category}`,
        module,
        category,
        title,
        detail: days < 0
          ? `En retard de ${Math.abs(days)} j`
          : days === 0
            ? 'Échéance aujourd’hui'
            : `Dans ${days} j`,
        vehicleLabel: label,
        vehicleId: car._id,
        dueDate: due.toISOString().slice(0, 10),
        severity: severityFromDays(days),
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }

    pushDate('documents', 'insurance', 'Assurance', car.insuranceExpiry)
    pushDate('documents', 'technical', 'Visite technique', car.technicalVisitExpiry)
    pushDate('maintenance', 'oil', 'Vidange / huile', car.nextOilChange)

    // Suggested maintenance categories when dates missing (info only, once per car)
    if (!car.nextOilChange) {
      rows.push({
        _id: `fleet-${car._id}-oil-missing`,
        module: 'maintenance',
        category: 'oil',
        title: 'Planifier la vidange',
        detail: 'Aucune date de prochaine vidange renseignée',
        vehicleLabel: label,
        vehicleId: car._id,
        severity: 'info',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
    if (!car.insuranceExpiry) {
      rows.push({
        _id: `fleet-${car._id}-ins-missing`,
        module: 'documents',
        category: 'insurance',
        title: 'Renseigner l’assurance',
        detail: 'Date d’expiration absente sur la fiche véhicule',
        vehicleLabel: label,
        vehicleId: car._id,
        severity: 'warning',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
    if (!car.technicalVisitExpiry) {
      rows.push({
        _id: `fleet-${car._id}-tech-missing`,
        module: 'documents',
        category: 'technical',
        title: 'Renseigner la visite technique',
        detail: 'Date d’expiration absente sur la fiche véhicule',
        vehicleLabel: label,
        vehicleId: car._id,
        severity: 'warning',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
  })

  return rows
}

const mileageReminders = (
  agencyId: string,
  cars: bookcarsTypes.Car[],
): AgencyReminder[] => {
  const odometers = readOdometers(agencyId)
  const now = new Date().toISOString()
  const thresholds = [
    { km: 10000, title: 'Changement d’huile', category: 'oil-km' },
    { km: 20000, title: 'Entretien périodique', category: 'service-km' },
    { km: 50000, title: 'Contrôle / remplacement pneus', category: 'tires-km' },
  ]

  return cars.flatMap((car) => {
    const current = odometers[car._id]
    if (!Number.isFinite(current)) {
      return [{
        _id: `mileage-${car._id}-setup`,
        module: 'mileage' as const,
        category: 'odometer',
        title: 'Saisir le kilométrage',
        detail: 'Ajoutez le compteur pour activer les rappels km',
        vehicleLabel: vehicleLabel(car),
        vehicleId: car._id,
        severity: 'info' as ReminderSeverity,
        source: 'fleet' as const,
        createdAt: now,
      }]
    }

    return thresholds.map((t) => {
      const mod = current % t.km
      const remaining = mod === 0 ? 0 : t.km - mod
      const overdue = remaining === 0 && current > 0
      const dueSoon = remaining > 0 && remaining <= 1500
      return {
        _id: `mileage-${car._id}-${t.category}`,
        module: 'mileage' as const,
        category: t.category,
        title: t.title,
        detail: overdue
          ? `Seuil ${t.km.toLocaleString('fr-FR')} km atteint (${current.toLocaleString('fr-FR')} km)`
          : `${current.toLocaleString('fr-FR')} km · encore ~${remaining.toLocaleString('fr-FR')} km (seuil ${t.km.toLocaleString('fr-FR')})`,
        vehicleLabel: vehicleLabel(car),
        vehicleId: car._id,
        dueKm: t.km,
        currentKm: current,
        severity: (overdue ? 'critical' : dueSoon ? 'warning' : 'info') as ReminderSeverity,
        source: 'fleet' as const,
        createdAt: now,
      }
    })
  })
}

/** Seed helpful contract examples once per agency (editable/dismissible via manual store). */
const ensureContractSeeds = (agencyId: string) => {
  const flag = `drivoo.agency.reminder-seeds.${agencyId}`
  if (localStorage.getItem(flag)) {
    return
  }
  const today = new Date()
  const iso = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
  }
  const seeds: AgencyReminder[] = [
    {
      _id: crypto.randomUUID(),
      module: 'contracts',
      category: 'return-today',
      title: 'Retour véhicule aujourd’hui',
      detail: 'Préparez l’état des lieux et le nettoyage',
      vehicleLabel: 'Exemple — à personnaliser',
      dueDate: iso(0),
      severity: 'warning',
      source: 'manual',
      createdAt: today.toISOString(),
    },
    {
      _id: crypto.randomUUID(),
      module: 'contracts',
      category: 'return-late',
      title: 'Retour en retard',
      detail: 'Contacter le client et appliquer les frais éventuels',
      vehicleLabel: 'Exemple — à personnaliser',
      dueDate: iso(-1),
      severity: 'critical',
      source: 'manual',
      createdAt: today.toISOString(),
    },
    {
      _id: crypto.randomUUID(),
      module: 'contracts',
      category: 'extension',
      title: 'Prolongation à confirmer',
      detail: 'Le client a demandé une extension — confirmer dispo & tarif',
      vehicleLabel: 'Exemple — à personnaliser',
      dueDate: iso(2),
      severity: 'info',
      source: 'manual',
      createdAt: today.toISOString(),
    },
  ]
  writeManual(agencyId, [...readManual(agencyId), ...seeds])
  localStorage.setItem(flag, '1')
}

export const buildReminders = (
  agencyId: string,
  cars: bookcarsTypes.Car[],
): AgencyReminder[] => {
  ensureContractSeeds(agencyId)
  const manual = readManual(agencyId).map((row) => {
    if (!row.dueDate) {
      return row
    }
    const due = toDate(row.dueDate)
    if (!due) {
      return row
    }
    const days = daysUntil(due)
    return {
      ...row,
      severity: severityFromDays(days),
      detail: days < 0
        ? `En retard de ${Math.abs(days)} j`
        : days === 0
          ? 'Échéance aujourd’hui'
          : row.detail,
    }
  })

  const all = [
    ...fleetReminders(cars),
    ...mileageReminders(agencyId, cars),
    ...manual,
  ]

  const rank: Record<ReminderSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    ok: 3,
  }

  return all.sort((a, b) => {
    const s = rank[a.severity] - rank[b.severity]
    if (s !== 0) {
      return s
    }
    return (a.dueDate || '').localeCompare(b.dueDate || '')
  })
}

export const getStats = (rows: AgencyReminder[]): ReminderStats => ({
  total: rows.length,
  critical: rows.filter((r) => r.severity === 'critical').length,
  warning: rows.filter((r) => r.severity === 'warning').length,
  upcoming: rows.filter((r) => r.severity === 'info').length,
})

export const filterByModule = (
  rows: AgencyReminder[],
  module: ReminderModule | 'all',
) => (module === 'all' ? rows : rows.filter((r) => r.module === module))

export const addManualReminder = (
  agencyId: string,
  input: Omit<AgencyReminder, '_id' | 'source' | 'createdAt' | 'severity'> & {
    severity?: ReminderSeverity
  },
): AgencyReminder => {
  const due = toDate(input.dueDate)
  const severity = input.severity
    || (due ? severityFromDays(daysUntil(due)) : 'info')
  const row: AgencyReminder = {
    ...input,
    _id: crypto.randomUUID(),
    source: 'manual',
    severity,
    createdAt: new Date().toISOString(),
  }
  writeManual(agencyId, [row, ...readManual(agencyId)])
  return row
}

export const dismissReminder = (agencyId: string, reminderId: string) => {
  writeManual(
    agencyId,
    readManual(agencyId).filter((r) => r._id !== reminderId),
  )
  // Soft-dismiss fleet items
  const dismissedKey = `drivoo.agency.reminders.dismissed.${agencyId}`
  try {
    const raw = localStorage.getItem(dismissedKey)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    if (!list.includes(reminderId)) {
      localStorage.setItem(dismissedKey, JSON.stringify([...list, reminderId]))
    }
  } catch {
    localStorage.setItem(dismissedKey, JSON.stringify([reminderId]))
  }
}

export const isDismissed = (agencyId: string, reminderId: string) => {
  try {
    const raw = localStorage.getItem(`drivoo.agency.reminders.dismissed.${agencyId}`)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return list.includes(reminderId)
  } catch {
    return false
  }
}

export const withoutDismissed = (agencyId: string, rows: AgencyReminder[]) =>
  rows.filter((r) => !isDismissed(agencyId, r._id))
