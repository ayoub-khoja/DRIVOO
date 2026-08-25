import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Tooltip,
} from '@mui/material'
import {
  AddRounded,
  DeleteOutlineRounded,
  DownloadRounded,
  PrintOutlined,
  ReceiptLongOutlined,
  Search as SearchIcon,
  VisibilityOutlined,
} from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import AgencyAddInvoiceDialog from '@/agency/pages/AgencyAddInvoiceDialog'
import AgencyInvoicePreview from '@/agency/components/AgencyInvoicePreview'
import * as AgencyInvoiceService from '@/agency/services/AgencyInvoiceService'
import type { AgencyInvoice, AgencyInvoiceStats } from '@/agency/types/invoice'
import { formatInvoiceDate } from '@/agency/utils/invoiceFormat'
import { formatMoney } from '@/agency/utils/invoiceMath'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 8

const EMPTY_STATS: AgencyInvoiceStats = { count: 0, monthTotal: 0, lastNumber: null }

const AgencyInvoices = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AgencyInvoice[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [preview, setPreview] = useState<AgencyInvoice | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<AgencyInvoiceStats>(EMPTY_STATS)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const result = await AgencyInvoiceService.listInvoices(search, nextPage, PAGE_SIZE)
      setRows(result.rows)
      setTotalRecords(result.totalRecords)
      setStats(result.stats || EMPTY_STATS)
      setPage(nextPage)
    } catch {
      helper.error(undefined, strings.INVOICE_LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (agencyLoaded && agency?._id) {
      void load(query, 1)
    }
  }, [agencyLoaded, agency?._id, load, query])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  const monthTotalLabel = useMemo(
    () => bookcarsHelper.formatPrice(stats.monthTotal, env.BASE_CURRENCY || 'TND', language),
    [stats.monthTotal, language],
  )

  const handleDownload = async (invoice: AgencyInvoice) => {
    try {
      await AgencyInvoiceService.downloadInvoicePdf(invoice._id, invoice.number)
    } catch {
      helper.error(undefined, strings.INVOICE_PDF_ERROR)
    }
  }

  /** Print the embedded PDF; falls back to a tab when the browser blocks iframe printing. */
  const handlePrint = () => {
    const frame = document.getElementById('agency-invoice-pdf-frame') as HTMLIFrameElement | null
    try {
      if (frame?.contentWindow) {
        frame.contentWindow.focus()
        frame.contentWindow.print()
        return
      }
    } catch {
      // ignored — handled by the fallback below
    }
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener')
    }
  }

  const handleDelete = async (invoice: AgencyInvoice) => {
    if (!window.confirm(strings.INVOICE_DELETE_CONFIRM)) {
      return
    }
    try {
      await AgencyInvoiceService.deleteInvoice(invoice._id)
      helper.info(strings.INVOICE_DELETED)
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page
      void load(query, nextPage)
    } catch {
      helper.error()
    }
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
    <div className="agency-page agency-receipts-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.INVOICES}</h2>
          <p>{strings.INVOICES_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
        >
          {strings.INVOICE_ADD}
        </Button>
      </div>

      <div className="agency-receipt-stats">
        <article>
          <span>{strings.INVOICE_STAT_COUNT}</span>
          <strong>{stats.count}</strong>
        </article>
        <article>
          <span>{strings.INVOICE_STAT_MONTH}</span>
          <strong>{monthTotalLabel}</strong>
        </article>
        <article>
          <span>{strings.INVOICE_STAT_LAST}</span>
          <strong>{stats.lastNumber || '—'}</strong>
        </article>
      </div>

      <OutlinedInput
        size="small"
        className="agency-search"
        placeholder={strings.INVOICE_SEARCH}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(keyword)
          }
        }}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.INVOICE_SEARCH}>
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
      ) : rows.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <ReceiptLongOutlined className="agency-empty-icon" />
          <p>{query ? strings.INVOICE_EMPTY_SEARCH : strings.INVOICE_EMPTY}</p>
          {!query && (
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddRounded />}
              onClick={() => setOpenForm(true)}
            >
              {strings.INVOICE_ADD}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="agency-receipt-table-wrap">
            <table className="agency-receipt-table">
              <thead>
                <tr>
                  <th>{strings.INVOICE_NUMBER}</th>
                  <th>{strings.INVOICE_DATE}</th>
                  <th>{strings.INVOICE_CLIENT}</th>
                  <th>{strings.INVOICE_OBJECT}</th>
                  <th>{strings.INVOICE_TOTAL_TTC}</th>
                  <th>{strings.INVOICE_BALANCE_DUE}</th>
                  <th aria-label={strings.INVOICE_ACTIONS} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <span className="agency-receipt-number">{row.number}</span>
                    </td>
                    <td>{formatInvoiceDate(row.issueDate)}</td>
                    <td>
                      <div className="agency-receipt-client-cell">
                        <strong>{row.clientName}</strong>
                        {row.clientCode && <span>{row.clientCode}</span>}
                      </div>
                    </td>
                    <td className="agency-invoice-object-cell">{row.object || '—'}</td>
                    <td className="agency-receipt-amount-cell">
                      {`${formatMoney(row.totalTTC)} ${row.currency}`}
                    </td>
                    <td className="agency-receipt-amount-cell">
                      <span className={row.balanceDue > 0 ? 'agency-invoice-due' : 'agency-invoice-paid'}>
                        {formatMoney(row.balanceDue)}
                      </span>
                    </td>
                    <td>
                      <div className="agency-receipt-row-actions">
                        <Tooltip title={strings.INVOICE_VIEW}>
                          <IconButton size="small" onClick={() => setPreview(row)}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={strings.INVOICE_PDF}>
                          <IconButton size="small" onClick={() => void handleDownload(row)}>
                            <DownloadRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={strings.INVOICE_DELETE}>
                          <IconButton size="small" onClick={() => void handleDelete(row)}>
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalRecords > PAGE_SIZE && (
            <div className="agency-pager">
              <span>{`${from}–${to} / ${totalRecords}`}</span>
              <div className="agency-pager-actions">
                <Button size="small" disabled={page <= 1} onClick={() => void load(query, page - 1)}>
                  {strings.BACK}
                </Button>
                <span>{page} / {totalPages}</span>
                <Button size="small" disabled={page >= totalPages} onClick={() => void load(query, page + 1)}>
                  {strings.NEXT}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AgencyAddInvoiceDialog
        open={openForm}
        agency={agency}
        onClose={() => setOpenForm(false)}
        onCreated={(invoice) => {
          setOpenForm(false)
          setQuery('')
          setKeyword('')
          void load('', 1)
          helper.info(strings.INVOICE_CREATED)
          setPreview(invoice)
        }}
      />

      <Dialog
        open={!!preview}
        onClose={() => {
          setPreview(null)
          setPreviewUrl(null)
        }}
        fullWidth
        maxWidth="md"
        className="agency-receipt-preview-dialog"
      >
        <DialogContent className="agency-receipt-preview-content">
          <div className="agency-receipt-preview-toolbar no-print">
            <div>
              <h3>{strings.INVOICE_DOC_TITLE}</h3>
              <p>{preview?.number}</p>
            </div>
            <div className="agency-receipt-preview-actions">
              <Button startIcon={<PrintOutlined />} onClick={handlePrint} variant="contained" className="btn-primary">
                {strings.INVOICE_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => preview && void handleDownload(preview)}
              >
                {strings.INVOICE_PDF}
              </Button>
              <Button
                onClick={() => {
                  setPreview(null)
                  setPreviewUrl(null)
                }}
              >
                {strings.CANCEL}
              </Button>
            </div>
          </div>
          {preview && (
            <AgencyInvoicePreview invoiceId={preview._id} onReady={setPreviewUrl} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgencyInvoices
