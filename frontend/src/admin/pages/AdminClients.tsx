import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  Search as SearchIcon,
  PersonOutline as PersonOutlineIcon,
  Close as CloseIcon,
  ArrowBackIosNew as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import * as AdminApiService from '@/admin/services/AdminApiService'

const PAGE_SIZE = 10

type ClientRow = bookcarsTypes.User & { createdAt?: string }

const DetailItem = ({ label, value }: { label: string, value?: React.ReactNode }) => (
  <div className="admin-detail-item">
    <span className="admin-detail-label">{label}</span>
    <span className="admin-detail-value">{value || '—'}</span>
  </div>
)

const AdminClients = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selected, setSelected] = useState<ClientRow | null>(null)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const data = await AdminApiService.getUsers(
        nextPage,
        PAGE_SIZE,
        [bookcarsTypes.UserType.User],
        search,
      )
      const result = data[0]
      setRows((result?.resultData || []) as ClientRow[])
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

  const formatDate = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    try {
      return new Date(value).toLocaleString()
    } catch {
      return String(value)
    }
  }

  const formatDateOnly = (value?: Date | string) => {
    if (!value) {
      return '—'
    }
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return String(value)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>{strings.CLIENTS_TITLE}</h2>
        <p>{strings.CLIENTS_SUBTITLE}</p>
      </div>

      <div className="admin-toolbar">
        <OutlinedInput
          size="small"
          className="admin-search"
          placeholder={strings.CLIENTS_SEARCH}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              load(keyword, 1)
            }
          }}
          endAdornment={(
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => load(keyword, 1)} aria-label={strings.CLIENTS_SEARCH}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )}
        />
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-inline-loading">
            <CircularProgress size={28} />
            <span>{strings.LOADING}</span>
          </div>
        ) : rows.length === 0 ? (
          <p className="admin-empty">{strings.CLIENTS_EMPTY}</p>
        ) : (
          <Table className="admin-table">
            <TableHead>
              <TableRow>
                <TableCell>{strings.COL_NAME}</TableCell>
                <TableCell>{strings.COL_EMAIL}</TableCell>
                <TableCell>{strings.COL_PHONE}</TableCell>
                <TableCell>{strings.COL_VERIFIED}</TableCell>
                <TableCell>{strings.COL_DATE}</TableCell>
                <TableCell align="right">{strings.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone || '—'}</TableCell>
                  <TableCell>
                    <span className={`admin-status-pill ${row.verified ? 'is-active' : 'is-inactive'}`}>
                      {row.verified ? strings.YES : strings.NO}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell align="right">
                    <div className="admin-row-actions">
                      <Button size="small" variant="outlined" color="primary" onClick={() => setSelected(row)}>
                        {strings.DETAILS}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && totalRecords > 0 && (
        <div className="admin-pager">
          <span>{`${from}-${to} / ${totalRecords}`}</span>
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

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        className="admin-request-dialog"
        PaperProps={{ className: 'admin-request-paper' }}
      >
        {selected && (
          <>
            <div className="admin-request-header">
              <div>
                <span className="admin-request-badge">{strings.DETAILS}</span>
                <h2>{selected.fullName}</h2>
                <p>
                  <span className={`admin-status-pill ${selected.active !== false ? 'is-active' : 'is-inactive'}`}>
                    {selected.active !== false ? strings.STATUS_ACTIVE : strings.STATUS_INACTIVE}
                  </span>
                </p>
              </div>
              <IconButton aria-label={strings.CLOSE} onClick={() => setSelected(null)} className="admin-request-close">
                <CloseIcon />
              </IconButton>
            </div>

            <DialogContent className="admin-request-content">
              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <PersonOutlineIcon />
                  <h3>{strings.SECTION_CLIENT}</h3>
                </div>
                <div className="admin-detail-grid">
                  <DetailItem label={strings.COL_NAME} value={selected.fullName} />
                  <DetailItem label={strings.COL_EMAIL} value={selected.email} />
                  <DetailItem label={strings.COL_PHONE} value={selected.phone} />
                  <DetailItem label={strings.COL_BIRTH_DATE} value={formatDateOnly(selected.birthDate)} />
                  <DetailItem label={strings.COL_VERIFIED} value={selected.verified ? strings.YES : strings.NO} />
                  <DetailItem label={strings.COL_STATUS} value={selected.active !== false ? strings.STATUS_ACTIVE : strings.STATUS_INACTIVE} />
                  <DetailItem label={strings.COL_DATE} value={formatDate(selected.createdAt)} />
                </div>
              </section>
            </DialogContent>

            <DialogActions className="admin-request-actions">
              <Button variant="outlined" color="primary" onClick={() => setSelected(null)}>
                {strings.CLOSE}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  )
}

export default AdminClients
