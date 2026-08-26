import type {
  AgencyReminder,
  AgencyReminderResult,
  CreateAgencyReminderPayload,
  ReminderModule,
  ReminderStats,
} from '@/agency/types/reminder'
import agencyAxiosInstance from './agencyAxios'

/**
 * Reminders are scoped server side by the session token — no agency id is sent.
 * Fleet deadlines + mileage thresholds are computed on the backend from Car docs.
 */
export const listReminders = (): Promise<AgencyReminderResult> =>
  agencyAxiosInstance
    .get('/api/agency/reminders')
    .then((res) => res.data)

export const createReminder = (data: CreateAgencyReminderPayload): Promise<AgencyReminder> =>
  agencyAxiosInstance
    .post('/api/agency/reminders', data)
    .then((res) => res.data)

export const dismissReminder = (id: string): Promise<number> =>
  agencyAxiosInstance
    .delete(`/api/agency/reminder/${encodeURIComponent(id)}`)
    .then((res) => res.status)

export const updateCarOdometer = (carId: string, odometerKm: number): Promise<{ _id: string, odometerKm: number }> =>
  agencyAxiosInstance
    .put(`/api/agency/car/${encodeURIComponent(carId)}/odometer`, { odometerKm })
    .then((res) => res.data)

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
