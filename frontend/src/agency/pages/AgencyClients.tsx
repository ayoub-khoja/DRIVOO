import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
} from '@mui/material'
import {
  AddRounded,
  BadgeOutlined,
  CalendarMonthOutlined,
  CakeOutlined,
  MailOutline,
  PeopleOutline,
  PhoneOutlined,
  Search as SearchIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/locale'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import * as AgencyClientService from '@/agency/services/AgencyClientService'
import AgencyAddClientDialog from '@/agency/pages/AgencyAddClientDialog'
import * as helper from '@/utils/helper'

interface AgencyClientRow {
  id: string
  fullName: string
  email: string
  phone: string
  cin: string
  birthDate?: Date | string
  bookingsCount: number
  lastBookingAt?: Date | string
  createdAt?: Date | string
}

const PAGE_SIZE = 9

const ALL_STATUSES: bookcarsTypes.BookingStatus[] = [
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Cancelled,
]

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const AgencyClients = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'
  const locale = getDateFnsLocale(language)

  const [keyword, setKeyword] = useState('')
  const [clients, setClients] = useState<AgencyClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    if (!agency?._id) {
      setClients([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [bookingsData, usersData] = await Promise.all([
        AgencyBookingService.getBookings({
          suppliers: [agency._id],
          statuses: ALL_STATUSES,
        }, 1, 200, language),
        AgencyClientService.getClients(1, 500),
      ])

      const byId = new Map<string, AgencyClientRow>()

      const users = usersData?.[0]?.resultData || []
      users.forEach((user) => {
        if (!user._id) {
          return
        }
        byId.set(user._id, {
          id: user._id,
          fullName: user.fullName || '—',
          email: user.email || '',
          phone: user.phone || '',
          cin: user.cin || '',
          birthDate: user.birthDate,
          bookingsCount: 0,
          createdAt: (user as bookcarsTypes.User & { createdAt?: Date | string }).createdAt,
        })
      })

      const bookings = bookingsData?.[0]?.resultData || []
      bookings.forEach((booking) => {
        const driver = typeof booking.driver === 'object' && booking.driver ? booking.driver : null
        if (!driver?._id) {
          return
        }

        const existing = byId.get(driver._id)
        const createdAt = booking.from
        if (existing) {
          existing.bookingsCount += 1
          if (createdAt && (!existing.lastBookingAt || new Date(createdAt) > new Date(existing.lastBookingAt))) {
            existing.lastBookingAt = createdAt
          }
          if (!existing.email && driver.email) {
            existing.email = driver.email
          }
          if (!existing.phone && driver.phone) {
            existing.phone = driver.phone
          }
          if (!existing.cin && driver.cin) {
            existing.cin = driver.cin
          }
          if (!existing.birthDate && driver.birthDate) {
            existing.birthDate = driver.birthDate
          }
          return
        }

        byId.set(driver._id, {
          id: driver._id,
          fullName: driver.fullName || '—',
          email: driver.email || '',
          phone: driver.phone || '',
          cin: driver.cin || '',
          birthDate: driver.birthDate,
          bookingsCount: 1,
          lastBookingAt: createdAt,
        })
      })

      const rows = Array.from(byId.values()).sort((a, b) => {
        const aTime = a.lastBookingAt
          ? new Date(a.lastBookingAt).getTime()
          : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const bTime = b.lastBookingAt
          ? new Date(b.lastBookingAt).getTime()
          : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return bTime - aTime
      })
      setClients(rows)
      setPage(1)
    } catch {
      setError(strings.CLIENTS_LOAD_ERROR)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [agency?._id, language])

  useEffect(() => {
    if (agencyLoaded) {
      void load()
    }
  }, [agencyLoaded, load])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) {
      return clients
    }
    return clients.filter((client) => (
      client.fullName.toLowerCase().includes(q)
      || client.email.toLowerCase().includes(q)
      || client.phone.toLowerCase().includes(q)
      || client.cin.toLowerCase().includes(q)
    ))
  }, [clients, keyword])

  useEffect(() => {
    setPage(1)
  }, [keyword])

  const totalRecords = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, totalRecords)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const recentCount = useMemo(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    return clients.filter((client) => (
      client.lastBookingAt && new Date(client.lastBookingAt) >= monthStart
    )).length
  }, [clients])

  const formatDate = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    return format(new Date(value), language === 'fr' ? 'dd MMM yyyy' : 'PP', { locale })
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
    <div className="agency-page agency-clients-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.CLIENTS}</h2>
          <p>{strings.CLIENTS_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setAddOpen(true)}
        >
          {strings.CLIENTS_ADD}
        </Button>
      </div>

      <div className="agency-clients-stats">
        <article>
          <div className="agency-clients-stat-icon" aria-hidden>
            <PeopleOutline />
          </div>
          <div>
            <span>{strings.CLIENTS_STAT_TOTAL}</span>
            <strong>{clients.length}</strong>
          </div>
        </article>
        <article className="is-accent">
          <div className="agency-clients-stat-icon" aria-hidden>
            <CalendarMonthOutlined />
          </div>
          <div>
            <span>{strings.CLIENTS_STAT_RECENT}</span>
            <strong>{recentCount}</strong>
          </div>
        </article>
      </div>

      <OutlinedInput
        className="agency-fleet-search agency-clients-search"
        value={keyword}
        placeholder={strings.CLIENTS_SEARCH}
        onChange={(e) => setKeyword(e.target.value)}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" aria-label={strings.CLIENTS_SEARCH}>
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        )}
      />

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void load()}>{strings.RETRY}</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <PeopleOutline className="agency-empty-icon" />
          <p>{keyword.trim() ? strings.CLIENTS_EMPTY_SEARCH : strings.CLIENTS_EMPTY}</p>
          {!keyword.trim() && (
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddRounded />}
              onClick={() => setAddOpen(true)}
            >
              {strings.CLIENTS_ADD}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="agency-clients-grid">
            {pageRows.map((client) => (
              <article key={client.id} className="agency-client-card">
                <div className="agency-client-card-top">
                  <div className="agency-client-avatar" aria-hidden>
                    {initialsOf(client.fullName)}
                  </div>
                  <div className="agency-client-identity">
                    <h3>{client.fullName}</h3>
                    <span className="agency-client-bookings-chip">
                      {client.bookingsCount}
                      {' '}
                      {strings.CLIENTS_BOOKINGS.toLowerCase()}
                    </span>
                  </div>
                </div>

                <ul className="agency-client-meta">
                  <li>
                    <MailOutline fontSize="small" />
                    <span>{client.email || '—'}</span>
                  </li>
                  <li>
                    <PhoneOutlined fontSize="small" />
                    <span>{client.phone || '—'}</span>
                  </li>
                  <li>
                    <BadgeOutlined fontSize="small" />
                    <span>
                      {strings.CLIENTS_CIN}
                      {' : '}
                      {client.cin || '—'}
                    </span>
                  </li>
                  <li>
                    <CakeOutlined fontSize="small" />
                    <span>
                      {strings.CLIENTS_BIRTH_DATE}
                      {' : '}
                      {formatDate(client.birthDate)}
                    </span>
                  </li>
                  <li>
                    <CalendarMonthOutlined fontSize="small" />
                    <span>
                      {strings.CLIENTS_LAST_BOOKING}
                      {' : '}
                      {formatDate(client.lastBookingAt)}
                    </span>
                  </li>
                </ul>
              </article>
            ))}
          </div>

          {totalRecords > PAGE_SIZE && (
            <div className="agency-pager">
              <span>{`${from}–${to} / ${totalRecords}`}</span>
              <div className="agency-pager-actions">
                <Button size="small" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                  {strings.BACK}
                </Button>
                <span>
                  {safePage}
                  {' / '}
                  {totalPages}
                </span>
                <Button size="small" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                  {strings.NEXT}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AgencyAddClientDialog
        open={addOpen}
        agency={agency}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          void load()
          helper.info(strings.CLIENTS_CREATED)
        }}
      />
    </div>
  )
}

export default AgencyClients
