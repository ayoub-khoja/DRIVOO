import type * as bookcarsTypes from ':bookcars-types'

export type AgencyAgendaEventType = bookcarsTypes.AgencyAgendaEventType
export type AgencyAgendaEvent = bookcarsTypes.AgencyAgendaEvent
export type AgencyAgendaVehicle = bookcarsTypes.AgencyAgendaVehicle
export type AgencyAgendaFleetStats = bookcarsTypes.AgencyAgendaFleetStats
export type AgencyAgendaResult = bookcarsTypes.AgencyAgendaResult

export type AgendaViewMode = 'month' | 'week' | 'day'
export type AgendaPanel = 'agenda' | 'table'
export type AgendaFocus =
  | 'all'
  | 'departure'
  | 'return'
  | 'circulation'
  | 'reservation'

export const ALL_EVENT_TYPES: AgencyAgendaEventType[] = [
  'departure',
  'return',
  'reservation_departure',
  'reservation_return',
  'circulation',
]
