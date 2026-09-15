import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import {
  Search as SearchIcon,
  ArrowBackIosNew as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import * as AdminApiService from '@/admin/services/AdminApiService'
import * as UserService from '@/services/UserService'

const PAGE_SIZE = 10

const paymentLabel = (status?: bookcarsTypes.AgencyPaymentStatus) => {
  switch (status) {
    case bookcarsTypes.AgencyPaymentStatus.Paid:
      return strings.PAYMENT_PAID
    case bookcarsTypes.AgencyPaymentStatus.Partial:
      return strings.PAYMENT_PARTIAL
    case bookcarsTypes.AgencyPaymentStatus.Overdue:
      return strings.PAYMENT_OVERDUE
    default:
      return strings.PAYMENT_UNPAID
  }
}

const planName = (row: bookcarsTypes.AgencyPaymentRow) => {
  const lang = (UserService.getLanguage() || 'fr') as 'fr' | 'en' | 'ar'
  const name = row.subscriptionPlan?.name
  if (!name) {
    return '—'
  }
  return name[lang] || name.fr || name.en || '—'
}

const formatDate = (value?: string) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString()
}

type PaymentForm = {
  subscriptionPaymentStatus: bookcarsTypes.AgencyPaymentStatus
  subscriptionPaymentAmount: string
  subscriptionPaymentDate: string
  subscriptionPaymentNote: string
}

const AdminAgencyPayments = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<bookcarsTypes.AgencyPaymentRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [editing, setEditing] = useState<bookcarsTypes.AgencyPaymentRow | null>(null)
  const [form, setForm] = useState<PaymentForm>({
    subscriptionPaymentStatus: bookcarsTypes.AgencyPaymentStatus.Unpaid,
    subscriptionPaymentAmount: '0',
    subscriptionPaymentDate: '',
    subscriptionPaymentNote: '',
  })
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const data = await AdminApiService.getAgencyPayments(nextPage, PAGE_SIZE, search)
      const result = data[0]
      setRows(result?.resultData || [])
      setTotalRecords(result?.pageInfo?.[0]?.totalRecords || 0)
      setPage(nextPage)
    } catch (err) {
      console.error(err)
      setRows([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))

  const openEdit = (row: bookcarsTypes.AgencyPaymentRow) => {
    setEditing(row)
    const date = row.subscriptionPaymentDate ? new Date(row.subscriptionPaymentDate) : null
    setForm({
      subscriptionPaymentStatus: row.subscriptionPaymentStatus || bookcarsTypes.AgencyPaymentStatus.Unpaid,
      subscriptionPaymentAmount: String(row.subscriptionPaymentAmount ?? 0),
      subscriptionPaymentDate: date && !Number.isNaN(date.getTime())
        ? date.toISOString().slice(0, 10)
        : '',
      subscriptionPaymentNote: row.subscriptionPaymentNote || '',
    })
  }

  const savePayment = async () => {
    if (!editing?._id) {
      return
    }
    setBusyId(editing._id)
    try {
      const { status, data } = await AdminApiService.updateAgencyPayment(editing._id, {
        subscriptionPaymentStatus: form.subscriptionPaymentStatus,
        subscriptionPaymentAmount: Number(form.subscriptionPaymentAmount) || 0,
        subscriptionPaymentDate: form.subscriptionPaymentDate || null,
        subscriptionPaymentNote: form.subscriptionPaymentNote.trim(),
      })
      if (status !== 200) {
        throw new Error('update failed')
      }
      setRows((prev) => prev.map((row) => (row._id === data._id ? { ...row, ...data } : row)))
      setEditing(null)
      toast(strings.PAYMENT_UPDATED, { type: 'success' })
    } catch (err) {
      console.error(err)
      toast(strings.ERROR, { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h2>{strings.AGENCY_PAYMENTS_TITLE}</h2>
          <p>{strings.AGENCY_PAYMENTS_SUBTITLE}</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <OutlinedInput
          className="admin-search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              load(keyword, 1)
            }
          }}
          placeholder={strings.AGENCIES_SEARCH}
          endAdornment={(
            <InputAdornment position="end">
              <IconButton onClick={() => load(keyword, 1)} edge="end" aria-label={strings.SEARCH}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )}
        />
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty"><CircularProgress size={28} /></div>
        ) : rows.length === 0 ? (
          <div className="admin-empty">{strings.AGENCY_PAYMENTS_EMPTY}</div>
        ) : (
          <Table className="admin-table">
            <TableHead>
              <TableRow>
                <TableCell>{strings.COL_AGENCY}</TableCell>
                <TableCell>{strings.COL_PLAN}</TableCell>
                <TableCell>{strings.COL_AMOUNT}</TableCell>
                <TableCell>{strings.COL_PAYMENT_DATE}</TableCell>
                <TableCell>{strings.COL_PAYMENT_STATUS}</TableCell>
                <TableCell>{strings.COL_NOTE}</TableCell>
                <TableCell align="right">{strings.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div>{row.fullName}</div>
                    <div className="admin-muted">{row.email || '—'}</div>
                  </TableCell>
                  <TableCell>{planName(row)}</TableCell>
                  <TableCell>{Number(row.subscriptionPaymentAmount || 0).toFixed(3)}</TableCell>
                  <TableCell>{formatDate(row.subscriptionPaymentDate)}</TableCell>
                    <TableCell>
                      <span className={`admin-status-pill status-${row.subscriptionPaymentStatus || 'unpaid'}`}>
                        {paymentLabel(row.subscriptionPaymentStatus)}
                      </span>
                    </TableCell>
                    <TableCell>{row.subscriptionPaymentNote || '—'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openEdit(row)}>
                        {strings.EDIT}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && totalRecords > 0 && (
        <div className="admin-pager">
          <span>{`${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalRecords)} / ${totalRecords}`}</span>
          <div className="admin-pager-actions">
            <IconButton disabled={page <= 1} onClick={() => load(keyword, page - 1)} aria-label="previous">
              <PrevIcon fontSize="small" />
            </IconButton>
            <span className="admin-pager-page">{page} / {totalPages}</span>
            <IconButton disabled={page >= totalPages} onClick={() => load(keyword, page + 1)} aria-label="next">
              <NextIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogContent>
          <h3>{strings.EDIT_PAYMENT}</h3>
          <p className="admin-muted">{editing?.fullName}</p>
          <TextField
            select
            fullWidth
            margin="dense"
            label={strings.COL_PAYMENT_STATUS}
            value={form.subscriptionPaymentStatus}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              subscriptionPaymentStatus: e.target.value as bookcarsTypes.AgencyPaymentStatus,
            }))}
          >
            <MenuItem value={bookcarsTypes.AgencyPaymentStatus.Unpaid}>{strings.PAYMENT_UNPAID}</MenuItem>
            <MenuItem value={bookcarsTypes.AgencyPaymentStatus.Paid}>{strings.PAYMENT_PAID}</MenuItem>
            <MenuItem value={bookcarsTypes.AgencyPaymentStatus.Partial}>{strings.PAYMENT_PARTIAL}</MenuItem>
            <MenuItem value={bookcarsTypes.AgencyPaymentStatus.Overdue}>{strings.PAYMENT_OVERDUE}</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            type="number"
            label={strings.COL_AMOUNT}
            value={form.subscriptionPaymentAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, subscriptionPaymentAmount: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="dense"
            type="date"
            label={strings.COL_PAYMENT_DATE}
            InputLabelProps={{ shrink: true }}
            value={form.subscriptionPaymentDate}
            onChange={(e) => setForm((prev) => ({ ...prev, subscriptionPaymentDate: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="dense"
            multiline
            minRows={2}
            label={strings.COL_NOTE}
            value={form.subscriptionPaymentNote}
            onChange={(e) => setForm((prev) => ({ ...prev, subscriptionPaymentNote: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{strings.CANCEL}</Button>
          <Button variant="contained" disabled={!!busyId} onClick={savePayment}>
            {busyId ? <CircularProgress size={18} color="inherit" /> : strings.SAVE}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AdminAgencyPayments
