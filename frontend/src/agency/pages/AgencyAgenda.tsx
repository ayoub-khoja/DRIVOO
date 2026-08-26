import React, { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react'
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  IconButton,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Tooltip,
} from '@mui/material'
import {
  CalendarMonthOutlined,
  ChevronLeft,
  ChevronRight,
  DirectionsCarFilledOutlined,
  LocalShippingOutlined,
  PrintOutlined,
  TableRowsOutlined,
  TodayOutlined,
} from '@mui/icons-material'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAgendaService from '@/agency/services/AgencyAgendaService'
import type {
  AgencyAgendaEvent,
  AgencyAgendaEventType,
  AgencyAgendaFleetStats,
  AgencyAgendaVehicle,
  AgendaFocus,
  AgendaPanel,
  AgendaViewMode,
} from '@/agency/types/agenda'
import { ALL_EVENT_TYPES } from '@/agency/types/agenda'
import {
  addDays,
  addMonths,
  buildMonthCells,
  buildWeekCells,
  endOfWeek,
  eventTone,
  formatDayTitle,
  formatMonthTitle,
  groupEventsByDay,
  isSameDay,
  isSameMonth,
  startOfWeek,
  toDayKey,
  viewRange,
  weekdayLabels,
} from '@/agency/utils/agendaCalendar'
import * as helper from '@/utils/helper'

const EMPTY_FLEET: AgencyAgendaFleetStats = { total: 0, inCirculation: 0, available: 0 }

const FOCUS_TYPES: Record<AgendaFocus, AgencyAgendaEventType[] | null> = {
  all: null,
  departure: ['departure', 'reservation_departure'],
  return: ['return', 'reservation_return'],
  circulation: ['circulation'],
  reservation: ['reservation_departure', 'reservation_return'],
}

const typeLabel = (type: AgencyAgendaEventType) => {
  switch (type) {
    case 'departure':
      return strings.AGENDA_TYPE_DEPARTURE
    case 'return':
      return strings.AGENDA_TYPE_RETURN
    case 'reservation_departure':
      return strings.AGENDA_TYPE_RES_DEPARTURE
    case 'reservation_return':
      return strings.AGENDA_TYPE_RES_RETURN
    case 'circulation':
    default:
      return strings.AGENDA_TYPE_CIRCULATION
  }
}

const AgencyAgenda = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<AgendaViewMode>('month')
  const [panel, setPanel] = useState<AgendaPanel>('agenda')
  const [focus, setFocus] = useState<AgendaFocus>('all')
  const [selectedTypes, setSelectedTypes] = useState<AgencyAgendaEventType[]>([
    'departure',
    'return',
    'reservation_departure',
    'reservation_return',
  ])
  const [vehicleId, setVehicleId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<AgencyAgendaEvent[]>([])
  const [vehicles, setVehicles] = useState<AgencyAgendaVehicle[]>([])
  const [fleet, setFleet] = useState<AgencyAgendaFleetStats>(EMPTY_FLEET)
  const [isPending, startTransition] = useTransition()

  const range = useMemo(() => viewRange(anchor, view), [anchor, view])
  const deferredRange = useDeferredValue(range)

  useEffect(() => {
    if (!agencyLoaded || !agency?._id) {
      return
    }

    let cancelled = false
    setLoading(true)

    AgencyAgendaService.getAgenda(deferredRange.from, deferredRange.to)
      .then((result) => {
        if (cancelled) {
          return
        }
        setEvents(result.events || [])
        setVehicles(result.vehicles || [])
        setFleet(result.fleet || EMPTY_FLEET)
      })
      .catch(() => {
        if (!cancelled) {
          helper.error(undefined, strings.AGENDA_LOAD_ERROR)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [agencyLoaded, agency?._id, deferredRange.from, deferredRange.to])

  const filteredEvents = useMemo(() => {
    const focusTypes = FOCUS_TYPES[focus]
    return events.filter((event) => {
      if (focusTypes && !focusTypes.includes(event.type)) {
        return false
      }
      if (!selectedTypes.includes(event.type)) {
        return false
      }
      if (vehicleId === 'all') {
        return true
      }
      if (event.vehicleId && event.vehicleId === vehicleId) {
        return true
      }
      const vehicle = vehicles.find((row) => row.id === vehicleId)
      if (vehicle?.plate && event.vehiclePlate) {
        return vehicle.plate.toUpperCase() === event.vehiclePlate.toUpperCase()
      }
      return event.vehicleLabel === vehicle?.label
    })
  }, [events, focus, selectedTypes, vehicleId, vehicles])

  const byDay = useMemo(() => groupEventsByDay(filteredEvents), [filteredEvents])
  const weekdays = useMemo(() => weekdayLabels(language), [language])
  const today = useMemo(() => new Date(), [])

  const title = view === 'day'
    ? formatDayTitle(anchor, language)
    : view === 'week'
      ? `${formatDayTitle(startOfWeek(anchor), language)} → ${formatDayTitle(endOfWeek(anchor), language)}`
      : formatMonthTitle(anchor, language)

  const goPrev = () => {
    startTransition(() => {
      if (view === 'day') {
        setAnchor((d) => addDays(d, -1))
      } else if (view === 'week') {
        setAnchor((d) => addDays(d, -7))
      } else {
        setAnchor((d) => addMonths(d, -1))
      }
    })
  }

  const goNext = () => {
    startTransition(() => {
      if (view === 'day') {
        setAnchor((d) => addDays(d, 1))
      } else if (view === 'week') {
        setAnchor((d) => addDays(d, 7))
      } else {
        setAnchor((d) => addMonths(d, 1))
      }
    })
  }

  const goToday = () => {
    startTransition(() => setAnchor(new Date()))
  }

  const handlePrint = () => {
    window.print()
  }

  const renderEventChip = (event: AgencyAgendaEvent) => (
    <button
      key={event._id}
      type="button"
      className={`agency-agenda-chip is-${eventTone(event.type)}`}
      title={`${typeLabel(event.type)} · ${event.vehicleLabel} · ${event.clientName}`}
    >
      <span className="agency-agenda-chip-dot" aria-hidden />
      <span className="agency-agenda-chip-plate">
        {event.vehiclePlate || event.vehicleLabel}
      </span>
      <span className="agency-agenda-chip-client">{event.clientName}</span>
    </button>
  )

  const renderDayCell = (day: Date, compact = false) => {
    const key = toDayKey(day)
    const dayEvents = byDay.get(key) || []
    const maxVisible = compact ? 4 : 8
    const overflow = Math.max(0, dayEvents.length - maxVisible)
    const outside = view === 'month' && !isSameMonth(day, anchor)

    return (
      <div
        key={key}
        className={[
          'agency-agenda-cell',
          outside ? 'is-outside' : '',
          isSameDay(day, today) ? 'is-today' : '',
          isSameDay(day, anchor) ? 'is-selected' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          startTransition(() => {
            setAnchor(day)
            if (view === 'month') {
              setView('day')
            }
          })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            startTransition(() => {
              setAnchor(day)
              setView('day')
            })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="agency-agenda-cell-head">
          <span className="agency-agenda-cell-day">{day.getDate()}</span>
          {dayEvents.length > 0 && (
            <span className="agency-agenda-cell-count">{dayEvents.length}</span>
          )}
        </div>
        <div className="agency-agenda-cell-events">
          {dayEvents.slice(0, maxVisible).map(renderEventChip)}
          {overflow > 0 && (
            <span className="agency-agenda-cell-more">+{overflow}</span>
          )}
        </div>
      </div>
    )
  }

  if (!agencyLoaded || !agency) {
    return (
      <div className="agency-inline-loading">
        <CircularProgress size={28} />
        <span>{strings.LOADING}</span>
      </div>
    )
  }

  return (
    <div className={`agency-page agency-agenda-page${isPending ? ' is-pending' : ''}`}>
      <div className="agency-page-head agency-fleet-head agency-agenda-head">
        <div>
          <h2>{strings.AGENDA}</h2>
          <p>{strings.AGENDA_SUBTITLE}</p>
        </div>
        <div className="agency-agenda-fleet-pills">
          <span className="agency-agenda-pill is-busy">
            <LocalShippingOutlined fontSize="small" />
            {fleet.inCirculation} {strings.AGENDA_IN_CIRCULATION}
          </span>
          <span className="agency-agenda-pill is-free">
            <DirectionsCarFilledOutlined fontSize="small" />
            {fleet.available} {strings.AGENDA_AVAILABLE}
          </span>
        </div>
      </div>

      <div className="agency-agenda-focus-tabs" role="tablist">
        {([
          ['all', strings.AGENDA_FOCUS_ALL],
          ['departure', strings.AGENDA_FOCUS_DEPARTURE],
          ['return', strings.AGENDA_FOCUS_RETURN],
          ['circulation', strings.AGENDA_FOCUS_CIRCULATION],
          ['reservation', strings.AGENDA_FOCUS_RESERVATION],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={focus === key}
            className={`agency-agenda-focus-tab is-${key}${focus === key ? ' is-active' : ''}`}
            onClick={() => setFocus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="agency-agenda-shell">
        <div className="agency-agenda-panel-tabs">
          <button
            type="button"
            className={panel === 'agenda' ? 'is-active' : ''}
            onClick={() => setPanel('agenda')}
          >
            <CalendarMonthOutlined fontSize="small" />
            {strings.AGENDA_TAB_CALENDAR}
          </button>
          <button
            type="button"
            className={panel === 'table' ? 'is-active' : ''}
            onClick={() => setPanel('table')}
          >
            <TableRowsOutlined fontSize="small" />
            {strings.AGENDA_TAB_TABLE}
          </button>
        </div>

        <div className="agency-agenda-toolbar">
          <div className="agency-agenda-nav">
            <Button size="small" startIcon={<ChevronLeft />} onClick={goPrev}>
              {strings.AGENDA_PREV}
            </Button>
            <Button
              size="small"
              startIcon={<TodayOutlined />}
              onClick={goToday}
              disabled={isSameDay(anchor, today) && view === 'day'}
            >
              {strings.AGENDA_TODAY}
            </Button>
            <Button size="small" endIcon={<ChevronRight />} onClick={goNext}>
              {strings.AGENDA_NEXT}
            </Button>
          </div>

          <h3 className="agency-agenda-title">{title}</h3>

          <div className="agency-agenda-view-switch">
            {([
              ['month', strings.AGENDA_VIEW_MONTH],
              ['week', strings.AGENDA_VIEW_WEEK],
              ['day', strings.AGENDA_VIEW_DAY],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={view === key ? 'is-active' : ''}
                onClick={() => startTransition(() => setView(key))}
              >
                {label}
              </button>
            ))}
            <Tooltip title={strings.AGENDA_PRINT}>
              <IconButton size="small" className="agency-agenda-print" onClick={handlePrint}>
                <PrintOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className="agency-agenda-filters">
          <FormControl size="small" className="agency-agenda-filter">
            <Select
              multiple
              displayEmpty
              value={selectedTypes}
              onChange={(e) => {
                const value = e.target.value
                setSelectedTypes(typeof value === 'string' ? value.split(',') as AgencyAgendaEventType[] : value)
              }}
              input={<OutlinedInput />}
              renderValue={(selected) =>
                selected.length === 0
                  ? strings.AGENDA_FILTER_TYPES
                  : selected.map((t) => typeLabel(t)).join(', ')}
            >
              {ALL_EVENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={selectedTypes.includes(type)} size="small" />
                  <ListItemText primary={typeLabel(type)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="agency-agenda-filter">
            <Select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              input={<OutlinedInput />}
            >
              <MenuItem value="all">{strings.AGENDA_ALL_VEHICLES}</MenuItem>
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {loading ? (
          <div className="agency-inline-loading">
            <CircularProgress size={28} />
            <span>{strings.LOADING}</span>
          </div>
        ) : panel === 'table' ? (
          <div className="agency-agenda-table-wrap">
            {filteredEvents.length === 0 ? (
              <div className="agency-empty-stage">
                <div className="agency-empty-ring" aria-hidden />
                <CalendarMonthOutlined className="agency-empty-icon" />
                <p>{strings.AGENDA_EMPTY}</p>
              </div>
            ) : (
              <table className="agency-receipt-table agency-agenda-table">
                <thead>
                  <tr>
                    <th>{strings.AGENDA_COL_DATE}</th>
                    <th>{strings.AGENDA_COL_TYPE}</th>
                    <th>{strings.AGENDA_COL_VEHICLE}</th>
                    <th>{strings.AGENDA_COL_CLIENT}</th>
                    <th>{strings.AGENDA_COL_REF}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event._id}>
                      <td>{event.date}</td>
                      <td>
                        <span className={`agency-agenda-type-chip is-${eventTone(event.type)}`}>
                          {typeLabel(event.type)}
                        </span>
                      </td>
                      <td>{event.vehicleLabel}</td>
                      <td>{event.clientName}</td>
                      <td>{event.number || event.sourceId.slice(-6).toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : view === 'day' ? (
          <div className="agency-agenda-day-view">
            <div className="agency-agenda-day-list">
              {(byDay.get(toDayKey(anchor)) || []).length === 0 ? (
                <div className="agency-empty-stage">
                  <div className="agency-empty-ring" aria-hidden />
                  <CalendarMonthOutlined className="agency-empty-icon" />
                  <p>{strings.AGENDA_EMPTY_DAY}</p>
                </div>
              ) : (
                (byDay.get(toDayKey(anchor)) || []).map((event) => (
                  <article key={event._id} className={`agency-agenda-day-card is-${eventTone(event.type)}`}>
                    <span className="agency-agenda-day-card-type">{typeLabel(event.type)}</span>
                    <strong>{event.vehicleLabel}</strong>
                    <p>{event.clientName}</p>
                    {event.number && <span className="agency-agenda-day-card-ref">{event.number}</span>}
                  </article>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className={`agency-agenda-grid is-${view}`}>
            <div className="agency-agenda-weekdays">
              {weekdays.map((label) => (
                <div key={label} className="agency-agenda-weekday">{label}</div>
              ))}
            </div>
            <div className="agency-agenda-cells">
              {(view === 'week' ? buildWeekCells(anchor) : buildMonthCells(anchor)).map((day) =>
                renderDayCell(day, view === 'month'))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgencyAgenda
