import * as bookcarsTypes from ':bookcars-types'

const DAYS_CRITICAL = 0
const DAYS_WARNING = 14

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const daysUntil = (due: Date, now = new Date()) => {
  const ms = startOfDay(due).getTime() - startOfDay(now).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export const severityFromDays = (days: number): bookcarsTypes.AgencyReminderSeverity => {
  if (days < DAYS_CRITICAL) {
    return 'critical'
  }
  if (days <= DAYS_WARNING) {
    return 'warning'
  }
  return 'info'
}

const vehicleLabel = (car: { name?: string, licensePlate?: string }) => {
  const plate = car.licensePlate ? ` · ${car.licensePlate}` : ''
  return `${car.name || 'Véhicule'}${plate}`
}

const toDate = (value?: Date | string | null) => {
  if (!value) {
    return null
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

type FleetCar = {
  _id: { toString: () => string }
  name?: string
  licensePlate?: string
  insuranceExpiry?: Date | string | null
  technicalVisitExpiry?: Date | string | null
  nextOilChange?: Date | string | null
  odometerKm?: number | null
}

export const buildFleetReminders = (cars: FleetCar[]): bookcarsTypes.AgencyReminder[] => {
  const now = new Date()
  const rows: bookcarsTypes.AgencyReminder[] = []

  for (const car of cars) {
    const label = vehicleLabel(car)
    const carId = String(car._id)

    const pushDate = (
      module: bookcarsTypes.AgencyReminderModule,
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
        _id: `fleet-${carId}-${category}`,
        module,
        category,
        title,
        detail: days < 0
          ? `En retard de ${Math.abs(days)} j`
          : days === 0
            ? 'Échéance aujourd’hui'
            : `Dans ${days} j`,
        vehicleLabel: label,
        vehicleId: carId,
        dueDate: due.toISOString().slice(0, 10),
        severity: severityFromDays(days),
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }

    pushDate('documents', 'insurance', 'Assurance', car.insuranceExpiry)
    pushDate('documents', 'technical', 'Visite technique', car.technicalVisitExpiry)
    pushDate('maintenance', 'oil', 'Vidange / huile', car.nextOilChange)

    if (!car.nextOilChange) {
      rows.push({
        _id: `fleet-${carId}-oil-missing`,
        module: 'maintenance',
        category: 'oil',
        title: 'Planifier la vidange',
        detail: 'Aucune date de prochaine vidange renseignée',
        vehicleLabel: label,
        vehicleId: carId,
        severity: 'info',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
    if (!car.insuranceExpiry) {
      rows.push({
        _id: `fleet-${carId}-ins-missing`,
        module: 'documents',
        category: 'insurance',
        title: 'Renseigner l’assurance',
        detail: 'Date d’expiration absente sur la fiche véhicule',
        vehicleLabel: label,
        vehicleId: carId,
        severity: 'warning',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
    if (!car.technicalVisitExpiry) {
      rows.push({
        _id: `fleet-${carId}-tech-missing`,
        module: 'documents',
        category: 'technical',
        title: 'Renseigner la visite technique',
        detail: 'Date d’expiration absente sur la fiche véhicule',
        vehicleLabel: label,
        vehicleId: carId,
        severity: 'warning',
        source: 'fleet',
        createdAt: now.toISOString(),
      })
    }
  }

  return rows
}

export const buildMileageReminders = (cars: FleetCar[]): bookcarsTypes.AgencyReminder[] => {
  const now = new Date().toISOString()
  const thresholds = [
    { km: 10000, title: 'Changement d’huile', category: 'oil-km' },
    { km: 20000, title: 'Entretien périodique', category: 'service-km' },
    { km: 50000, title: 'Contrôle / remplacement pneus', category: 'tires-km' },
  ]

  return cars.flatMap((car) => {
    const carId = String(car._id)
    const label = vehicleLabel(car)
    const current = car.odometerKm

    if (!Number.isFinite(current)) {
      return [{
        _id: `mileage-${carId}-setup`,
        module: 'mileage' as const,
        category: 'odometer',
        title: 'Saisir le kilométrage',
        detail: 'Ajoutez le compteur pour activer les rappels km',
        vehicleLabel: label,
        vehicleId: carId,
        severity: 'info' as bookcarsTypes.AgencyReminderSeverity,
        source: 'fleet' as const,
        createdAt: now,
      }]
    }

    const km = Number(current)
    return thresholds.map((t) => {
      const mod = km % t.km
      const remaining = mod === 0 ? 0 : t.km - mod
      const overdue = remaining === 0 && km > 0
      const dueSoon = remaining > 0 && remaining <= 1500
      return {
        _id: `mileage-${carId}-${t.category}`,
        module: 'mileage' as const,
        category: t.category,
        title: t.title,
        detail: overdue
          ? `Seuil ${t.km.toLocaleString('fr-FR')} km atteint (${km.toLocaleString('fr-FR')} km)`
          : `${km.toLocaleString('fr-FR')} km · encore ~${remaining.toLocaleString('fr-FR')} km (seuil ${t.km.toLocaleString('fr-FR')})`,
        vehicleLabel: label,
        vehicleId: carId,
        dueKm: t.km,
        currentKm: km,
        severity: (overdue ? 'critical' : dueSoon ? 'warning' : 'info') as bookcarsTypes.AgencyReminderSeverity,
        source: 'fleet' as const,
        createdAt: now,
      }
    })
  })
}

export const reminderStats = (rows: bookcarsTypes.AgencyReminder[]): bookcarsTypes.AgencyReminderStats => ({
  total: rows.length,
  critical: rows.filter((r) => r.severity === 'critical').length,
  warning: rows.filter((r) => r.severity === 'warning').length,
  upcoming: rows.filter((r) => r.severity === 'info').length,
})

export const sortReminders = (rows: bookcarsTypes.AgencyReminder[]) => {
  const rank: Record<bookcarsTypes.AgencyReminderSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    ok: 3,
  }
  return [...rows].sort((a, b) => {
    const s = rank[a.severity] - rank[b.severity]
    if (s !== 0) {
      return s
    }
    return (a.dueDate || '').localeCompare(b.dueDate || '')
  })
}
