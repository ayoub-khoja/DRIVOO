import type * as bookcarsTypes from ':bookcars-types'

export type ReminderModule = bookcarsTypes.AgencyReminderModule
export type ReminderSeverity = bookcarsTypes.AgencyReminderSeverity
export type AgencyReminder = bookcarsTypes.AgencyReminder
export type ReminderStats = bookcarsTypes.AgencyReminderStats
export type AgencyReminderResult = bookcarsTypes.AgencyReminderResult
export type CreateAgencyReminderPayload = bookcarsTypes.CreateAgencyReminderPayload

export interface ReminderModuleMeta {
  key: ReminderModule
  count: number
  critical: number
  warning: number
}
