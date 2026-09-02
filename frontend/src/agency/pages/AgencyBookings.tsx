import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
} from '@mui/material'
import { EventNoteOutlined, Search as SearchIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS, arTN } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import BookingStatus from '@/components/BookingStatus'
import * as PaymentService from '@/services/PaymentService'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 10

const AgencyBookings = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'
  const locale = language === 'fr' ? fr : language === 'ar' ? arTN : enUS

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<bookcarsTypes.Booking[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (search = '', nextPage = 1) => {
    if (!agency?._id) {
      setRows([])
      setTotalRecords(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await AgencyBookingService.getBookings({
        suppliers: [agency._id],
        statuses: AgencyBookingService.ACTIVE_BOOKING_STATUSES,
        filter: search ? { keyword: search } : undefined,
      }, nextPage, PAGE_SIZE, language)

      const chunk = data?.[0]
      const result = chunk?.resultData || []
      const converted = await Promise.all(result.map(async (booking) => ({
        ...booking,
        price: await PaymentService.convertPrice(booking.price || 0),
      })))

      setRows(converted)
      const pageInfo = chunk?.pageInfo as unknown as { totalRecords?: number }[] | { totalRecords?: number } | undefined
      setTotalRecords((Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0)
      setPage(nextPage)
    } catch {
      setError(strings.BOOKING_LOAD_ERROR)
      setRows([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [agency?._id, language])

  useEffect(() => {
    if (agencyLoaded) {
      void load(query, 1)
    }
  }, [agencyLoaded, load, query])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  const stats = useMemo(() => {
    const now = new Date()
    const active = rows.filter((booking) => {
      const end = booking.to ? new Date(booking.to) : null
      return end && end >= now
    }).length
    return {
      total: totalRecords,
      active,
    }
  }, [rows, totalRecords])

  const formatDateTime = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    return format(new Date(value), language === 'fr' ? 'dd/MM/yyyy HH:mm' : 'Pp', { locale })
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
    <div className="agency-page agency-bookings-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.BOOKINGS}</h2>
          <p>{strings.BOOKINGS_SUBTITLE}</p>
        </div>
      </div>

      <div className="agency-receipt-stats">
        <article>
          <span>{strings.BOOKING_STAT_TOTAL}</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="is-live">
          <span>{strings.BOOKING_STAT_ACTIVE}</span>
          <strong>{stats.active}</strong>
        </article>
      </div>

      <OutlinedInput
        size="small"
        className="agency-search"
        placeholder={strings.BOOKING_SEARCH}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(keyword)
          }
        }}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.BOOKING_SEARCH}>
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
          <Button onClick={() => void load(query, page)}>{strings.RETRY}</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <EventNoteOutlined className="agency-empty-icon" />
          <p>{query ? strings.BOOKING_EMPTY_SEARCH : strings.BOOKING_EMPTY}</p>
        </div>
      ) : (
        <>
          <div className="agency-bookings-table-wrap">
            <table className="agency-bookings-table">
              <thead>
                <tr>
                  <th>{strings.BOOKING_CAR}</th>
                  <th>{strings.BOOKING_CLIENT}</th>
                  <th>{strings.BOOKING_DATES}</th>
                  <th>{strings.BOOKING_PRICE}</th>
                  <th>{strings.BOOKING_STATUS}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => {
                  const car = booking.car as bookcarsTypes.Car
                  const driver = booking.driver as bookcarsTypes.User | undefined

                  return (
                  <tr key={booking._id}>
                    <td>
                      <strong>{car?.name || '—'}</strong>
                      {car?.licensePlate && (
                        <span className="agency-bookings-meta">{car.licensePlate}</span>
                      )}
                    </td>
                    <td>
                      <strong>{driver?.fullName || '—'}</strong>
                      {driver?.email && (
                        <span className="agency-bookings-meta">{driver.email}</span>
                      )}
                    </td>
                    <td>
                      <span>{formatDateTime(booking.from)}</span>
                      <span className="agency-bookings-meta">{formatDateTime(booking.to)}</span>
                    </td>
                    <td>
                      <strong>
                        {bookcarsHelper.formatPrice(
                          Number(booking.price) || 0,
                          PaymentService.getCurrency(),
                          language,
                        )}
                      </strong>
                    </td>
                    <td>
                      <BookingStatus value={booking.status} showIcon />
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalRecords > PAGE_SIZE && (
            <div className="agency-pager">
              <span>{`${from}–${to} / ${totalRecords}`}</span>
              <div className="agency-pager-actions">
                <Button size="small" disabled={page <= 1 || loading} onClick={() => void load(query, page - 1)}>
                  {strings.BACK}
                </Button>
                <span>{page} / {totalPages}</span>
                <Button size="small" disabled={page >= totalPages || loading} onClick={() => void load(query, page + 1)}>
                  {strings.NEXT}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AgencyBookings
