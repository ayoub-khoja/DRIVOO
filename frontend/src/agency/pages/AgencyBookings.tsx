import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@mui/material'
import {
  AddRounded,
  CheckRounded,
  ClearRounded,
  CloseRounded,
  EventNoteOutlined,
  FilterListRounded,
  Search as SearchIcon,
  SouthRounded,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { strings as commonStrings } from '@/lang/common'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import AgencyAddBookingDialog from '@/agency/pages/AgencyAddBookingDialog'
import BookingStatus from '@/components/BookingStatus'
import * as PaymentService from '@/services/PaymentService'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 10

type StatusFilter = 'all' | bookcarsTypes.BookingStatus

const ALL_LISTABLE_STATUSES: bookcarsTypes.BookingStatus[] = [
  ...AgencyBookingService.ACTIVE_BOOKING_STATUSES,
  bookcarsTypes.BookingStatus.Cancelled,
]

const STATUS_FILTER_OPTIONS: StatusFilter[] = [
  'all',
  bookcarsTypes.BookingStatus.Pending,
  bookcarsTypes.BookingStatus.Reserved,
  bookcarsTypes.BookingStatus.Deposit,
  bookcarsTypes.BookingStatus.Paid,
  bookcarsTypes.BookingStatus.PaidInFull,
  bookcarsTypes.BookingStatus.Cancelled,
]

const toDayStart = (value: string): Date | undefined => {
  if (!value) {
    return undefined
  }
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const toDayEnd = (value: string): Date | undefined => {
  if (!value) {
    return undefined
  }
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const AgencyBookings = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'
  const locale = getDateFnsLocale(language)

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<bookcarsTypes.Booking[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refuseTarget, setRefuseTarget] = useState<bookcarsTypes.Booking | null>(null)

  const selectedStatuses = useMemo(
    () => (statusFilter === 'all' ? ALL_LISTABLE_STATUSES : [statusFilter]),
    [statusFilter],
  )

  const hasActiveFilters = Boolean(
    query
    || statusFilter !== 'all'
    || appliedFrom
    || appliedTo,
  )

  const load = useCallback(async (nextPage = 1) => {
    if (!agency?._id) {
      setRows([])
      setTotalRecords(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const filter: bookcarsTypes.Filter = {}
      if (query) {
        filter.keyword = query
      }
      const fromDate = toDayStart(appliedFrom)
      const toDate = toDayEnd(appliedTo)
      if (fromDate) {
        filter.from = fromDate
      }
      if (toDate) {
        filter.to = toDate
      }

      const [data, activeTotal] = await Promise.all([
        AgencyBookingService.getBookings({
          suppliers: [agency._id],
          statuses: selectedStatuses,
          filter: Object.keys(filter).length ? filter : undefined,
        }, nextPage, PAGE_SIZE, language),
        AgencyBookingService.getBookingsCount(agency._id, language),
      ])

      const chunk = data?.[0]
      const result = chunk?.resultData || []
      const converted = await Promise.all(result.map(async (booking) => ({
        ...booking,
        price: await PaymentService.convertPrice(booking.price || 0),
      })))

      setRows(converted)
      const pageInfo = chunk?.pageInfo as unknown as { totalRecords?: number }[] | { totalRecords?: number } | undefined
      setTotalRecords((Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0)
      setActiveCount(activeTotal)
      setPage(nextPage)
    } catch {
      setError(strings.BOOKING_LOAD_ERROR)
      setRows([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [agency?._id, appliedFrom, appliedTo, language, query, selectedStatuses])

  useEffect(() => {
    if (agencyLoaded) {
      void load(1)
    }
  }, [agencyLoaded, load])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  const formatDate = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    return format(new Date(value), language === 'fr' ? 'dd/MM/yyyy' : 'P', { locale })
  }

  const formatTime = (value?: Date | string) => {
    if (!value) {
      return ''
    }
    return format(new Date(value), language === 'fr' ? 'HH:mm' : 'p', { locale })
  }

  const statusLabel = (value: StatusFilter) => {
    if (value === 'all') {
      return strings.BOOKING_FILTER_STATUS_ALL
    }
    return helper.getBookingStatus(value)
  }

  const applySearch = () => {
    setQuery(keyword.trim())
    setAppliedFrom(dateFrom)
    setAppliedTo(dateTo)
  }

  const clearFilters = () => {
    setKeyword('')
    setQuery('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setAppliedFrom('')
    setAppliedTo('')
  }

  const updateBookingStatus = async (
    booking: bookcarsTypes.Booking,
    status: bookcarsTypes.BookingStatus,
    successMessage: string,
  ) => {
    if (!booking._id) {
      return
    }
    setBusyId(booking._id)
    try {
      const code = await AgencyBookingService.updateStatus([booking._id], status)
      if (code === 200) {
        setRows((prev) => prev.map((row) => (
          row._id === booking._id ? { ...row, status } : row
        )))
        toast.success(successMessage)
        void load(page)
      } else {
        toast.error(strings.BOOKING_STATUS_ERROR)
      }
    } catch {
      toast.error(strings.BOOKING_STATUS_ERROR)
    } finally {
      setBusyId(null)
      setRefuseTarget(null)
    }
  }

  const onAccept = (booking: bookcarsTypes.Booking) => {
    void updateBookingStatus(booking, bookcarsTypes.BookingStatus.Reserved, strings.BOOKING_ACCEPT_OK)
  }

  const onConfirmRefuse = () => {
    if (!refuseTarget) {
      return
    }
    void updateBookingStatus(refuseTarget, bookcarsTypes.BookingStatus.Cancelled, strings.BOOKING_REFUSE_OK)
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
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
        >
          {strings.BOOKING_ADD}
        </Button>
      </div>

      <div className="agency-receipt-stats">
        <article>
          <span>{strings.BOOKING_STAT_TOTAL}</span>
          <strong>{totalRecords}</strong>
        </article>
        <article className="is-live">
          <span>{strings.BOOKING_STAT_ACTIVE}</span>
          <strong>{activeCount}</strong>
        </article>
      </div>

      <section className="agency-bookings-filters" aria-label={strings.BOOKING_FILTERS}>
        <div className="agency-bookings-filters-head">
          <FilterListRounded fontSize="small" />
          <span>{strings.BOOKING_FILTERS}</span>
        </div>

        <div className="agency-bookings-filters-grid">
          <OutlinedInput
            size="small"
            className="agency-bookings-search"
            placeholder={strings.BOOKING_SEARCH}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applySearch()
              }
            }}
            startAdornment={(
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )}
          />

          <FormControl size="small" className="agency-bookings-status">
            <InputLabel id="agency-booking-status-label">{strings.BOOKING_STATUS}</InputLabel>
            <Select
              labelId="agency-booking-status-label"
              label={strings.BOOKING_STATUS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {statusLabel(option)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label={strings.BOOKING_FILTER_FROM}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dateTo || undefined }}
          />

          <TextField
            size="small"
            type="date"
            label={strings.BOOKING_FILTER_TO}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: dateFrom || undefined }}
          />

          <div className="agency-bookings-filters-actions">
            <Button variant="contained" className="btn-primary" onClick={applySearch}>
              {strings.BOOKING_FILTER_APPLY}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearRounded />}
                onClick={clearFilters}
              >
                {strings.BOOKING_FILTER_CLEAR}
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="agency-bookings-active-chips">
            {query ? (
              <Chip
                size="small"
                label={`${commonStrings.SEARCH}: ${query}`}
                onDelete={() => {
                  setKeyword('')
                  setQuery('')
                }}
              />
            ) : null}
            {statusFilter !== 'all' ? (
              <Chip
                size="small"
                label={`${strings.BOOKING_STATUS}: ${statusLabel(statusFilter)}`}
                onDelete={() => setStatusFilter('all')}
              />
            ) : null}
            {appliedFrom ? (
              <Chip
                size="small"
                label={`${strings.BOOKING_FILTER_FROM}: ${appliedFrom.split('-').reverse().join('/')}`}
                onDelete={() => {
                  setDateFrom('')
                  setAppliedFrom('')
                }}
              />
            ) : null}
            {appliedTo ? (
              <Chip
                size="small"
                label={`${strings.BOOKING_FILTER_TO}: ${appliedTo.split('-').reverse().join('/')}`}
                onDelete={() => {
                  setDateTo('')
                  setAppliedTo('')
                }}
              />
            ) : null}
          </div>
        )}
      </section>

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void load(page)}>{strings.RETRY}</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <EventNoteOutlined className="agency-empty-icon" />
          <p>{hasActiveFilters ? strings.BOOKING_EMPTY_SEARCH : strings.BOOKING_EMPTY}</p>
          {hasActiveFilters ? (
            <Button variant="outlined" startIcon={<ClearRounded />} onClick={clearFilters}>
              {strings.BOOKING_FILTER_CLEAR}
            </Button>
          ) : (
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddRounded />}
              onClick={() => setOpenForm(true)}
            >
              {strings.BOOKING_ADD}
            </Button>
          )}
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
                  <th>{strings.BOOKING_ACTIONS}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => {
                  const car = booking.car as bookcarsTypes.Car
                  const driver = booking.driver as bookcarsTypes.User | undefined
                  const awaiting = AgencyBookingService.isAwaitingDecision(booking.status)
                  const accepted = AgencyBookingService.isAccepted(booking.status)
                  const refused = booking.status === bookcarsTypes.BookingStatus.Cancelled
                  const rowBusy = busyId === booking._id

                  return (
                    <tr key={booking._id} className={awaiting ? 'is-awaiting' : undefined}>
                      <td>
                        <div className="agency-bookings-cell">
                          <strong className="agency-bookings-primary" title={car?.name || undefined}>
                            {car?.name || '—'}
                          </strong>
                          {car?.licensePlate ? (
                            <span className="agency-bookings-plate">{car.licensePlate}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="agency-bookings-cell">
                          <strong className="agency-bookings-primary" title={driver?.fullName || undefined}>
                            {driver?.fullName || '—'}
                          </strong>
                          {driver?.email ? (
                            <span className="agency-bookings-meta" title={driver.email}>{driver.email}</span>
                          ) : null}
                          {driver?.phone ? (
                            <span className="agency-bookings-meta">{driver.phone}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="agency-bookings-dates">
                          <div className="agency-bookings-date-block">
                            <span className="agency-bookings-date-label">{strings.BOOKING_DATE_FROM}</span>
                            <strong>{formatDate(booking.from)}</strong>
                            <span className="agency-bookings-time">{formatTime(booking.from)}</span>
                          </div>
                          <SouthRounded className="agency-bookings-date-arrow" fontSize="small" />
                          <div className="agency-bookings-date-block">
                            <span className="agency-bookings-date-label">{strings.BOOKING_DATE_TO}</span>
                            <strong>{formatDate(booking.to)}</strong>
                            <span className="agency-bookings-time">{formatTime(booking.to)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="agency-bookings-price">
                          {bookcarsHelper.formatPrice(
                            Number(booking.price) || 0,
                            PaymentService.getCurrency(),
                            language,
                          )}
                        </strong>
                      </td>
                      <td>
                        <div className="agency-bookings-status-stack">
                          <BookingStatus value={booking.status} />
                          {awaiting ? (
                            <span className="agency-bookings-decision is-awaiting">{strings.BOOKING_AWAITING}</span>
                          ) : null}
                          {accepted && booking.isDeposit ? (
                            <span className="agency-bookings-decision is-auto" title={strings.BOOKING_AUTO_ACCEPTED}>
                              {strings.BOOKING_PAYMENT_BADGE}
                            </span>
                          ) : null}
                          {accepted && !booking.isDeposit ? (
                            <span className="agency-bookings-decision is-accepted">{strings.BOOKING_ACCEPTED}</span>
                          ) : null}
                          {refused ? (
                            <span className="agency-bookings-decision is-refused">{strings.BOOKING_REFUSED}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {awaiting ? (
                          <div className="agency-bookings-actions">
                            <Button
                              size="small"
                              variant="contained"
                              className="agency-bookings-accept"
                              startIcon={rowBusy ? <CircularProgress size={14} color="inherit" /> : <CheckRounded />}
                              disabled={!!busyId}
                              onClick={() => onAccept(booking)}
                            >
                              {strings.BOOKING_ACCEPT}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              className="agency-bookings-refuse"
                              startIcon={<CloseRounded />}
                              disabled={!!busyId}
                              onClick={() => setRefuseTarget(booking)}
                            >
                              {strings.BOOKING_REFUSE}
                            </Button>
                          </div>
                        ) : (
                          <span className="agency-bookings-actions-empty">—</span>
                        )}
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
                <Button size="small" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>
                  {strings.BACK}
                </Button>
                <span>{page} / {totalPages}</span>
                <Button size="small" disabled={page >= totalPages || loading} onClick={() => void load(page + 1)}>
                  {strings.NEXT}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AgencyAddBookingDialog
        open={openForm}
        agency={agency}
        onClose={() => setOpenForm(false)}
        onCreated={() => {
          setOpenForm(false)
          void load(1)
        }}
      />

      <Dialog open={!!refuseTarget} onClose={() => !busyId && setRefuseTarget(null)}>
        <DialogTitle>{strings.BOOKING_REFUSE}</DialogTitle>
        <DialogContent>
          <DialogContentText>{strings.BOOKING_REFUSE_CONFIRM}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={!!busyId} onClick={() => setRefuseTarget(null)}>{commonStrings.CANCEL}</Button>
          <Button color="error" variant="contained" disabled={!!busyId} onClick={onConfirmRefuse}>
            {strings.BOOKING_REFUSE}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AgencyBookings
