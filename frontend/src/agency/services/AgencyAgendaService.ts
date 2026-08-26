import type { AgencyAgendaResult } from '@/agency/types/agenda'
import agencyAxiosInstance from './agencyAxios'

/**
 * Load calendar events for the authenticated agency over [from, to].
 * Dates are YYYY-MM-DD (local day keys).
 */
export const getAgenda = (from: string, to: string): Promise<AgencyAgendaResult> =>
  agencyAxiosInstance
    .get(`/api/agency/agenda?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    .then((res) => res.data)
