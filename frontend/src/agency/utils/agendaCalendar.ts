import type { AgencyAgendaEvent, AgencyAgendaEventType, AgendaViewMode } from '@/agency/types/agenda'

export const toDayKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const parseDayKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

export const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

export const startOfWeek = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay()) // Sunday start, matches reference calendar
  return d
}

export const endOfWeek = (date: Date) => {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

export const addDays = (date: Date, days: number) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()

export const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

/** Inclusive range needed to paint the current calendar view. */
export const viewRange = (anchor: Date, mode: AgendaViewMode) => {
  if (mode === 'day') {
    return { from: toDayKey(anchor), to: toDayKey(anchor) }
  }
  if (mode === 'week') {
    return { from: toDayKey(startOfWeek(anchor)), to: toDayKey(endOfWeek(anchor)) }
  }
  // Month grid includes leading/trailing days from adjacent months
  const first = startOfMonth(anchor)
  const last = endOfMonth(anchor)
  return {
    from: toDayKey(startOfWeek(first)),
    to: toDayKey(endOfWeek(last)),
  }
}

export const buildMonthCells = (anchor: Date) => {
  const first = startOfMonth(anchor)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export const buildWeekCells = (anchor: Date) => {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const groupEventsByDay = (events: AgencyAgendaEvent[]) => {
  const map = new Map<string, AgencyAgendaEvent[]>()
  for (const event of events) {
    const list = map.get(event.date)
    if (list) {
      list.push(event)
    } else {
      map.set(event.date, [event])
    }
  }
  return map
}

export const eventTone = (type: AgencyAgendaEventType) => {
  switch (type) {
    case 'departure':
      return 'depart'
    case 'return':
      return 'retour'
    case 'reservation_departure':
      return 'resa-dep'
    case 'reservation_return':
      return 'resa-ret'
    case 'circulation':
    default:
      return 'circ'
  }
}

export const formatMonthTitle = (date: Date, language: string) => {
  const label = date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const formatDayTitle = (date: Date, language: string) =>
  date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const weekdayLabels = (language: string) => {
  const base = startOfWeek(new Date())
  const locale = language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR'
  return Array.from({ length: 7 }, (_, i) =>
    addDays(base, i).toLocaleDateString(locale, { weekday: 'long' }).toLowerCase())
}
