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
  BusinessOutlined as BusinessOutlinedIcon,
  AccountBalanceOutlined as AccountBalanceOutlinedIcon,
  PersonOutline as PersonOutlineIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  ArrowBackIosNew as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { strings } from '@/admin/lang/admin'
import * as AdminApiService from '@/admin/services/AdminApiService'
import type { AccountRequest } from '@/admin/services/AdminApiService'
import env from '@/config/env.config'

const PAGE_SIZE = 10

const DetailItem = ({ label, value }: { label: string, value?: React.ReactNode }) => (
  <div className="admin-detail-item">
    <span className="admin-detail-label">{label}</span>
    <span className="admin-detail-value">{value || '—'}</span>
  </div>
)

const AccountRequests = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AccountRequest[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<AccountRequest | null>(null)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const data = await AdminApiService.getAccountRequests(nextPage, PAGE_SIZE, search)
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

  const onApprove = async (id: string) => {
    setBusyId(id)
    try {
      const status = await AdminApiService.approveAccountRequest(id)
      if (status === 200) {
        toast.success(strings.APPROVED)
        setSelected(null)
        const nextPage = rows.length === 1 && page > 1 ? page - 1 : page
        await load(keyword, nextPage)
      } else {
        toast.error(strings.ERROR)
      }
    } catch (err) {
      console.error(err)
      toast.error(strings.ERROR)
    } finally {
      setBusyId(null)
    }
  }

  const onReject = async (id: string) => {
    if (!window.confirm(strings.CONFIRM_REJECT)) {
      return
    }
    setBusyId(id)
    try {
      const status = await AdminApiService.rejectAccountRequest(id)
      if (status === 200) {
        toast.info(strings.REJECTED)
        setSelected(null)
        const nextPage = rows.length === 1 && page > 1 ? page - 1 : page
        await load(keyword, nextPage)
      } else {
        toast.error(strings.ERROR)
      }
    } catch (err) {
      console.error(err)
      toast.error(strings.ERROR)
    } finally {
      setBusyId(null)
    }
  }

  const formatDate = (value?: string) => {
    if (!value) {
      return '—'
    }
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  const docUrl = selected?.rneDocument && env.CDN_SUPPLIER_DOCS
    ? `${env.CDN_SUPPLIER_DOCS}/${selected.rneDocument}`
    : null

  const legalName = selected
    ? [selected.legalRepFirstName, selected.legalRepLastName].filter(Boolean).join(' ')
    : ''

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>{strings.REQUESTS_TITLE}</h2>
        <p>{strings.REQUESTS_SUBTITLE}</p>
      </div>

      <div className="admin-toolbar">
        <OutlinedInput
          size="small"
          className="admin-search"
          placeholder={strings.SEARCH}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              load(keyword, 1)
            }
          }}
          endAdornment={(
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => load(keyword, 1)} aria-label={strings.SEARCH}>
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
          <p className="admin-empty">{strings.EMPTY}</p>
        ) : (
          <Table className="admin-table">
            <TableHead>
              <TableRow>
                <TableCell>{strings.COL_AGENCY}</TableCell>
                <TableCell>{strings.COL_EMAIL}</TableCell>
                <TableCell>{strings.COL_PHONE}</TableCell>
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
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell align="right">
                    <div className="admin-row-actions">
                      <Button size="small" variant="outlined" color="primary" onClick={() => setSelected(row)}>
                        {strings.DETAILS}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        className="btn-primary"
                        disabled={busyId === row._id}
                        onClick={() => onApprove(row._id)}
                      >
                        {strings.APPROVE}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={busyId === row._id}
                        onClick={() => onReject(row._id)}
                      >
                        {strings.REJECT}
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
        maxWidth="md"
        className="admin-request-dialog"
        PaperProps={{ className: 'admin-request-paper' }}
      >
        {selected && (
          <>
            <div className="admin-request-header">
              <div>
                <span className="admin-request-badge">{strings.DETAILS}</span>
                <h2>{selected.fullName}</h2>
                <p>{formatDate(selected.createdAt)}</p>
              </div>
              <IconButton aria-label={strings.CLOSE} onClick={() => setSelected(null)} className="admin-request-close">
                <CloseIcon />
              </IconButton>
            </div>

            <DialogContent className="admin-request-content">
              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <BusinessOutlinedIcon />
                  <h3>{strings.SECTION_COMPANY}</h3>
                </div>
                <div className="admin-detail-grid">
                  <DetailItem label={strings.COL_AGENCY} value={selected.fullName} />
                  <DetailItem label={strings.TAX_ID} value={selected.taxId} />
                  <DetailItem label={strings.RNE} value={selected.rneNumber} />
                  <div className="admin-detail-item admin-detail-item-wide">
                    <span className="admin-detail-label">{strings.RNE_DOC}</span>
                    {docUrl ? (
                      <a className="admin-doc-link" href={docUrl} target="_blank" rel="noreferrer">
                        <DescriptionOutlinedIcon />
                        <span>{strings.OPEN_DOC}</span>
                        <OpenInNewIcon className="admin-doc-ext" />
                      </a>
                    ) : (
                      <span className="admin-detail-value">—</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <AccountBalanceOutlinedIcon />
                  <h3>{strings.SECTION_ADDRESS_BANK}</h3>
                </div>
                <div className="admin-detail-grid">
                  <DetailItem label={strings.ADDRESS} value={selected.address} />
                  <DetailItem label={strings.CITY} value={selected.city} />
                  <DetailItem label={strings.GOVERNORATE} value={selected.governorate} />
                  <DetailItem label={strings.POSTAL_CODE} value={selected.postalCode} />
                  <DetailItem label={strings.IBAN} value={selected.iban} />
                </div>
              </section>

              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <PersonOutlineIcon />
                  <h3>{strings.SECTION_CONTACT}</h3>
                </div>
                <div className="admin-detail-grid">
                  <DetailItem label={strings.LEGAL_REP} value={legalName || '—'} />
                  <DetailItem label={strings.LEGAL_TITLE} value={selected.legalRepTitle} />
                  <DetailItem label={strings.LEGAL_CIN} value={selected.legalRepCin} />
                  <DetailItem label={strings.COL_EMAIL} value={selected.email} />
                  <DetailItem label={strings.COL_PHONE} value={selected.phone} />
                  <DetailItem label={strings.WHATSAPP} value={selected.whatsapp} />
                  <DetailItem label={strings.REQUEST_DATE} value={formatDate(selected.createdAt)} />
                </div>
              </section>
            </DialogContent>

            <DialogActions className="admin-request-actions">
              <Button variant="outlined" color="primary" onClick={() => setSelected(null)}>
                {strings.CLOSE}
              </Button>
              <Button
                color="error"
                variant="outlined"
                disabled={busyId === selected._id}
                onClick={() => onReject(selected._id)}
              >
                {strings.REJECT}
              </Button>
              <Button
                variant="contained"
                className="btn-primary"
                disabled={busyId === selected._id}
                onClick={() => onApprove(selected._id)}
              >
                {strings.APPROVE}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  )
}

export default AccountRequests
