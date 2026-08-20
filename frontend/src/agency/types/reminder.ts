export type ReminderModule = 'maintenance' | 'documents' | 'mileage' | 'contracts'

export type ReminderSeverity = 'critical' | 'warning' | 'info' | 'ok'

export interface AgencyReminder {
  _id: string
  module: ReminderModule
  category: string
  title: string
  detail: string
  vehicleLabel?: string
  vehicleId?: string
  dueDate?: string
  dueKm?: number
  currentKm?: number
  severity: ReminderSeverity
  source: 'fleet' | 'manual'
  createdAt: string
}

export interface ReminderModuleMeta {
  key: ReminderModule
  count: number
  critical: number
  warning: number
}

export interface ReminderStats {
  total: number
  critical: number
  warning: number
  upcoming: number
}
