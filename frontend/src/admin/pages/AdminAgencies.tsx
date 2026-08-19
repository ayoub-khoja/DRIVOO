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
  TextField,
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
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import * as AdminApiService from '@/admin/services/AdminApiService'
import env from '@/config/env.config'

const PAGE_SIZE = 10

type AgencyRow = bookcarsTypes.User & { createdAt?: string }

type AgencyEditForm = {
  fullName: string
  taxId: string
  rneNumber: string
  address: string
  city: string
  governorate: string
  postalCode: string
  iban: string
  legalRepFirstName: string
  legalRepLastName: string
  legalRepTitle: string
  legalRepCin: string
  phone: string
  whatsapp: string
}

const emptyForm = (): AgencyEditForm => ({
  fullName: '',
  taxId: '',
  rneNumber: '',
  address: '',
  city: '',
  governorate: '',
  postalCode: '',
  iban: '',
  legalRepFirstName: '',
  legalRepLastName: '',
  legalRepTitle: '',
  legalRepCin: '',
  phone: '',
  whatsapp: '',
})

const formFromRow = (row: AgencyRow): AgencyEditForm => ({
  fullName: row.fullName || '',
  taxId: row.taxId || '',
  rneNumber: row.rneNumber || '',
  address: row.address || row.location || '',
  city: row.city || '',
  governorate: row.governorate || '',
  postalCode: row.postalCode || '',
  iban: row.iban || '',
  legalRepFirstName: row.legalRepFirstName || '',
  legalRepLastName: row.legalRepLastName || '',
  legalRepTitle: row.legalRepTitle || '',
  legalRepCin: row.legalRepCin || '',
  phone: row.phone || '',
  whatsapp: row.whatsapp || '',
})

const DetailItem = ({ label, value }: { label: string, value?: React.ReactNode }) => (
  <div className="admin-detail-item">
    <span className="admin-detail-label">{label}</span>
    <span className="admin-detail-value">{value || '—'}</span>
  </div>
)

const EditField = ({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) => (
  <TextField
    size="small"
    className="admin-edit-field"
    label={label}
    value={value}
    required={required}
    onChange={(e) => onChange(e.target.value)}
    fullWidth
  />
)

const AdminAgencies = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<AgencyRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selected, setSelected] = useState<AgencyRow | null>(null)
  const [editing, setEditing] = useState<AgencyRow | null>(null)
  const [form, setForm] = useState<AgencyEditForm>(emptyForm)
  const [deleting, setDeleting] = useState<AgencyRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const data = await AdminApiService.getUsers(
        nextPage,
        PAGE_SIZE,
        [bookcarsTypes.UserType.Supplier],
        search,
        true,
        true,
      )
      const result = data[0]
      setRows((result?.resultData || []) as AgencyRow[])
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

  const setField = (key: keyof AgencyEditForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const openEdit = (row: AgencyRow) => {
    setSelected(null)
    setEditing(row)
    setForm(formFromRow(row))
  }

  const openDelete = (row: AgencyRow) => {
    setSelected(null)
    setDeleting(row)
  }

  const onSave = async () => {
    if (!editing?._id) {
      return
    }
    const fullName = form.fullName.trim()
    if (fullName.length < 2) {
      toast.error(strings.INVALID_NAME)
      return
    }

    setBusyId(editing._id)
    try {
      const payload: bookcarsTypes.UpdateAgencyProfilePayload = {
        fullName,
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        governorate: form.governorate.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        rneNumber: form.rneNumber.trim() || undefined,
        iban: form.iban.trim() || undefined,
        legalRepFirstName: form.legalRepFirstName.trim() || undefined,
        legalRepLastName: form.legalRepLastName.trim() || undefined,
        legalRepTitle: form.legalRepTitle.trim() || undefined,
        legalRepCin: form.legalRepCin.trim() || undefined,
      }
      const res = await AdminApiService.updateAgency(editing._id, payload)
      if (res.status === 200) {
        toast.success(strings.UPDATED)
        setEditing(null)
        await load(keyword, page)
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

  const onDelete = async () => {
    if (!deleting?._id) {
      return
    }
    setBusyId(deleting._id)
    try {
      const status = await AdminApiService.deleteAgency(deleting._id)
      if (status === 200 || status === 204) {
        toast.info(strings.DELETED)
        setDeleting(null)
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
        <h2>{strings.AGENCIES_TITLE}</h2>
        <p>{strings.AGENCIES_SUBTITLE}</p>
      </div>

      <div className="admin-toolbar">
        <OutlinedInput
          size="small"
          className="admin-search"
          placeholder={strings.AGENCIES_SEARCH}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              load(keyword, 1)
            }
          }}
          endAdornment={(
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => load(keyword, 1)} aria-label={strings.AGENCIES_SEARCH}>
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
          <p className="admin-empty">{strings.AGENCIES_EMPTY}</p>
        ) : (
          <Table className="admin-table">
            <TableHead>
              <TableRow>
                <TableCell>{strings.COL_AGENCY}</TableCell>
                <TableCell>{strings.COL_EMAIL}</TableCell>
                <TableCell>{strings.COL_PHONE}</TableCell>
                <TableCell>{strings.COL_STATUS}</TableCell>
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
                    <span className="admin-status-pill is-active">{strings.STATUS_ACTIVE}</span>
                  </TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell align="right">
                    <div className="admin-row-actions">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        disabled={busyId === row._id}
                        onClick={() => openEdit(row)}
                      >
                        {strings.EDIT}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={busyId === row._id}
                        onClick={() => openDelete(row)}
                      >
                        {strings.DELETE}
                      </Button>
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
                <p>
                  <span className="admin-status-pill is-active">{strings.STATUS_ACTIVE}</span>
                </p>
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
                  <DetailItem label={strings.ADDRESS} value={selected.address || selected.location} />
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
                  <DetailItem label={strings.COL_DATE} value={formatDate(selected.createdAt)} />
                </div>
              </section>
            </DialogContent>

            <DialogActions className="admin-request-actions">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  if (selected) {
                    openEdit(selected)
                  }
                }}
              >
                {strings.EDIT}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  if (selected) {
                    openDelete(selected)
                  }
                }}
              >
                {strings.DELETE}
              </Button>
              <Button variant="outlined" color="primary" onClick={() => setSelected(null)}>
                {strings.CLOSE}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={!!editing}
        onClose={() => !busyId && setEditing(null)}
        fullWidth
        maxWidth="md"
        className="admin-request-dialog"
        PaperProps={{ className: 'admin-request-paper' }}
      >
        {editing && (
          <>
            <div className="admin-request-header">
              <div>
                <span className="admin-request-badge">{strings.EDIT}</span>
                <h2>{editing.fullName}</h2>
                <p>{editing.email}</p>
              </div>
              <IconButton
                aria-label={strings.CLOSE}
                onClick={() => setEditing(null)}
                className="admin-request-close"
                disabled={!!busyId}
              >
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
                  <EditField label={strings.COL_AGENCY} value={form.fullName} onChange={setField('fullName')} required />
                  <EditField label={strings.TAX_ID} value={form.taxId} onChange={setField('taxId')} />
                  <EditField label={strings.RNE} value={form.rneNumber} onChange={setField('rneNumber')} />
                </div>
              </section>

              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <AccountBalanceOutlinedIcon />
                  <h3>{strings.SECTION_ADDRESS_BANK}</h3>
                </div>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item-wide">
                    <EditField label={strings.ADDRESS} value={form.address} onChange={setField('address')} />
                  </div>
                  <EditField label={strings.CITY} value={form.city} onChange={setField('city')} />
                  <EditField label={strings.GOVERNORATE} value={form.governorate} onChange={setField('governorate')} />
                  <EditField label={strings.POSTAL_CODE} value={form.postalCode} onChange={setField('postalCode')} />
                  <EditField label={strings.IBAN} value={form.iban} onChange={setField('iban')} />
                </div>
              </section>

              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <PersonOutlineIcon />
                  <h3>{strings.SECTION_CONTACT}</h3>
                </div>
                <div className="admin-detail-grid">
                  <EditField label={strings.LEGAL_FIRST} value={form.legalRepFirstName} onChange={setField('legalRepFirstName')} />
                  <EditField label={strings.LEGAL_LAST} value={form.legalRepLastName} onChange={setField('legalRepLastName')} />
                  <EditField label={strings.LEGAL_TITLE} value={form.legalRepTitle} onChange={setField('legalRepTitle')} />
                  <EditField label={strings.LEGAL_CIN} value={form.legalRepCin} onChange={setField('legalRepCin')} />
                  <EditField label={strings.COL_PHONE} value={form.phone} onChange={setField('phone')} />
                  <EditField label={strings.WHATSAPP} value={form.whatsapp} onChange={setField('whatsapp')} />
                </div>
              </section>
            </DialogContent>

            <DialogActions className="admin-request-actions">
              <Button variant="outlined" color="primary" onClick={() => setEditing(null)} disabled={!!busyId}>
                {strings.CANCEL}
              </Button>
              <Button
                variant="contained"
                className="btn-primary"
                onClick={onSave}
                disabled={busyId === editing._id}
              >
                {strings.SAVE}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={!!deleting}
        onClose={() => !busyId && setDeleting(null)}
        fullWidth
        maxWidth="xs"
        className="admin-request-dialog"
        PaperProps={{ className: 'admin-request-paper' }}
      >
        {deleting && (
          <>
            <div className="admin-request-header">
              <div>
                <span className="admin-request-badge">{strings.DELETE}</span>
                <h2>{strings.CONFIRM_DELETE}</h2>
                <p>{deleting.fullName}</p>
              </div>
              <IconButton
                aria-label={strings.CLOSE}
                onClick={() => setDeleting(null)}
                className="admin-request-close"
                disabled={!!busyId}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <DialogContent className="admin-request-content">
              <p className="admin-delete-warning">{strings.CONFIRM_DELETE_TEXT}</p>
            </DialogContent>
            <DialogActions className="admin-request-actions">
              <Button variant="outlined" color="primary" onClick={() => setDeleting(null)} disabled={!!busyId}>
                {strings.CANCEL}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={onDelete}
                disabled={busyId === deleting._id}
              >
                {strings.DELETE}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  )
}

export default AdminAgencies
