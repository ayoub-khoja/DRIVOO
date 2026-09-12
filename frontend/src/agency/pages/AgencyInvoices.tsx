import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  OutlinedInput,
  TextField,
  Tooltip,
} from '@mui/material'
import {
  AddRounded,
  CodeRounded,
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
import { defaultRecapPeriod, periodPresetRange } from '@/agency/utils/periodRecap'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 8

const EMPTY_STATS: AgencyInvoiceStats = { count: 0, monthTotal: 0, lastNumber: null }

type InvoicesView = 'list' | 'recap'

const AgencyInvoices = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [view, setView] = useState<InvoicesView>('list')
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

  const initialPeriod = useMemo(() => defaultRecapPeriod(), [])
  const [recapFrom, setRecapFrom] = useState(initialPeriod.from)
  const [recapTo, setRecapTo] = useState(initialPeriod.to)
  const [appliedFrom, setAppliedFrom] = useState(initialPeriod.from)
  const [appliedTo, setAppliedTo] = useState(initialPeriod.to)
  const [recapRows, setRecapRows] = useState<AgencyInvoice[]>([])
  const [recapCount, setRecapCount] = useState(0)
  const [recapTotalTTC, setRecapTotalTTC] = useState(0)
  const [recapTotalPaid, setRecapTotalPaid] = useState(0)
  const [recapBalanceDue, setRecapBalanceDue] = useState(0)
  const [recapCurrency, setRecapCurrency] = useState(env.BASE_CURRENCY || 'TND')
  const [recapLoading, setRecapLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [periodPdfOpen, setPeriodPdfOpen] = useState(false)
  const [periodPdfUrl, setPeriodPdfUrl] = useState<string | null>(null)

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

  const loadRecap = useCallback(async (from: string, to: string) => {
    setRecapLoading(true)
    try {
      const result = await AgencyInvoiceService.getInvoicesRecap(from, to)
      setRecapRows(result.rows)
      setRecapCount(result.count)
      setRecapTotalTTC(result.totalTTC)
      setRecapTotalPaid(result.totalPaid)
      setRecapBalanceDue(result.balanceDue)
      setRecapCurrency(result.currency || env.BASE_CURRENCY || 'TND')
    } catch {
      helper.error(undefined, strings.INVOICE_LOAD_ERROR)
    } finally {
      setRecapLoading(false)
    }
  }, [])

  const applyRecapPeriod = () => {
    if (!recapFrom || !recapTo || recapFrom > recapTo) {
      helper.error(undefined, strings.CONTRACT_RECAP_INVALID)
      return
    }
    setAppliedFrom(recapFrom)
    setAppliedTo(recapTo)
  }

  useEffect(() => {
    if (agencyLoaded && agency?._id && view === 'list') {
      void load(query, 1)
    }
  }, [agencyLoaded, agency?._id, load, query, view])

  useEffect(() => {
    if (agencyLoaded && agency?._id && view === 'recap') {
      void loadRecap(appliedFrom, appliedTo)
    }
  }, [agencyLoaded, agency?._id, view, loadRecap, appliedFrom, appliedTo])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  const monthTotalLabel = useMemo(
    () => bookcarsHelper.formatPrice(stats.monthTotal, env.BASE_CURRENCY || 'TND', language),
    [stats.monthTotal, language],
  )

  const formatPrice = (amount: number, currency = recapCurrency) =>
    bookcarsHelper.formatPrice(amount, currency, language)

  const handleDownload = async (invoice: AgencyInvoice) => {
    try {
      await AgencyInvoiceService.downloadInvoicePdf(invoice._id, invoice.number)
    } catch {
      helper.error(undefined, strings.INVOICE_PDF_ERROR)
    }
  }

  const handleDownloadXml = async (invoice: AgencyInvoice) => {
    try {
      await AgencyInvoiceService.downloadInvoiceXml(invoice._id, invoice.number)
    } catch {
      helper.error(undefined, strings.INVOICE_XML_ERROR)
    }
  }

  const handleExportRecapPdf = async () => {
    if (!appliedFrom || !appliedTo || appliedFrom > appliedTo) {
      helper.error(undefined, strings.CONTRACT_RECAP_INVALID)
      return
    }
    setExportingPdf(true)
    try {
      await AgencyInvoiceService.downloadInvoicesRecapPdf(appliedFrom, appliedTo)
      helper.info(strings.CONTRACT_RECAP_DOWNLOAD_OK)
    } catch {
      helper.error(undefined, strings.INVOICE_PDF_ERROR)
    } finally {
      setExportingPdf(false)
    }
  }

  const handlePreviewPeriodPdf = async () => {
    if (!appliedFrom || !appliedTo || appliedFrom > appliedTo) {
      helper.error(undefined, strings.CONTRACT_RECAP_INVALID)
      return
    }
    setExportingPdf(true)
    try {
      const blob = await AgencyInvoiceService.getInvoicesRecapPdf(appliedFrom, appliedTo)
      if (periodPdfUrl) {
        URL.revokeObjectURL(periodPdfUrl)
      }
      const url = URL.createObjectURL(blob)
      setPeriodPdfUrl(url)
      setPeriodPdfOpen(true)
    } catch {
      helper.error(undefined, strings.INVOICE_PDF_ERROR)
    } finally {
      setExportingPdf(false)
    }
  }

  const setPeriodPreset = (monthsBack: number) => {
    const { from, to } = periodPresetRange(monthsBack)
    setRecapFrom(from)
    setRecapTo(to)
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const closePeriodPdf = () => {
    setPeriodPdfOpen(false)
    if (periodPdfUrl) {
      URL.revokeObjectURL(periodPdfUrl)
      setPeriodPdfUrl(null)
    }
  }

  /** Print the embedded PDF; falls back to a tab when the browser blocks iframe printing. */
  const handlePrint = (frameId: string, fallbackUrl: string | null) => {
    const frame = document.getElementById(frameId) as HTMLIFrameElement | null
    try {
      if (frame?.contentWindow) {
        frame.contentWindow.focus()
        frame.contentWindow.print()
        return
      }
    } catch {
      // ignored — handled by the fallback below
    }
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener')
    }
  }

  const handleDownloadPeriodPdf = async () => {
    try {
      await AgencyInvoiceService.downloadInvoicesRecapPdf(appliedFrom, appliedTo)
      helper.info(strings.CONTRACT_RECAP_DOWNLOAD_OK)
    } catch {
      helper.error(undefined, strings.INVOICE_PDF_ERROR)
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

  const closePreview = () => {
    setPreview(null)
    setPreviewUrl(null)
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
          <p>{view === 'list' ? strings.INVOICES_SUBTITLE : strings.INVOICE_RECAP_SUBTITLE}</p>
        </div>
        {view === 'list' ? (
          <Button
            variant="contained"
            className="btn-primary"
            startIcon={<AddRounded />}
            onClick={() => setOpenForm(true)}
          >
            {strings.INVOICE_ADD}
          </Button>
        ) : (
          <div className="agency-contracts-recap-actions">
            <Button
              variant="outlined"
              startIcon={<VisibilityOutlined />}
              disabled={exportingPdf || recapLoading || recapCount === 0}
              onClick={() => void handlePreviewPeriodPdf()}
            >
              {strings.CONTRACT_RECAP_PREVIEW}
            </Button>
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
              disabled={exportingPdf || recapLoading || recapCount === 0}
              onClick={() => void handleExportRecapPdf()}
            >
              {strings.INVOICE_RECAP_EXPORT_PDF}
            </Button>
          </div>
        )}
      </div>

      <div className="agency-contracts-view-switch" role="tablist" aria-label={strings.CONTRACT_VIEW_MODE}>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'list'}
          className={`agency-contracts-view-btn${view === 'list' ? ' is-active' : ''}`}
          onClick={() => setView('list')}
        >
          {strings.INVOICE_VIEW_LIST}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'recap'}
          className={`agency-contracts-view-btn${view === 'recap' ? ' is-active' : ''}`}
          onClick={() => setView('recap')}
        >
          {strings.INVOICE_VIEW_RECAP}
        </button>
      </div>

      {view === 'list' ? (
        <>
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
                            <Tooltip title={strings.INVOICE_XML}>
                              <IconButton size="small" onClick={() => void handleDownloadXml(row)}>
                                <CodeRounded fontSize="small" />
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
        </>
      ) : (
        <>
          <section className="agency-contracts-recap-bar" aria-label={strings.INVOICE_VIEW_RECAP}>
            <div className="agency-contracts-period-presets" role="group" aria-label={strings.CONTRACT_RECAP_PRESETS}>
              <button type="button" className="agency-contracts-preset-btn" onClick={() => setPeriodPreset(1)}>
                {strings.CONTRACT_RECAP_PRESET_1M}
              </button>
              <button type="button" className="agency-contracts-preset-btn" onClick={() => setPeriodPreset(2)}>
                {strings.CONTRACT_RECAP_PRESET_2M}
              </button>
              <button type="button" className="agency-contracts-preset-btn" onClick={() => setPeriodPreset(3)}>
                {strings.CONTRACT_RECAP_PRESET_3M}
              </button>
            </div>
            <div className="agency-bookings-date-range" role="group" aria-label={strings.INVOICE_DATE}>
              <TextField
                size="small"
                type="date"
                label={strings.CONTRACT_RECAP_FROM}
                value={recapFrom}
                onChange={(e) => setRecapFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: recapTo || undefined }}
              />
              <span className="agency-bookings-date-sep" aria-hidden>→</span>
              <TextField
                size="small"
                type="date"
                label={strings.CONTRACT_RECAP_TO}
                value={recapTo}
                onChange={(e) => setRecapTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: recapFrom || undefined }}
              />
            </div>
            <Button
              variant="contained"
              className="btn-primary agency-bookings-apply"
              onClick={applyRecapPeriod}
              disabled={recapLoading}
            >
              {strings.CONTRACT_RECAP_APPLY}
            </Button>
          </section>

          <div className="agency-receipt-stats">
            <article>
              <span>{strings.INVOICE_RECAP_STAT_COUNT}</span>
              <strong>{recapCount}</strong>
            </article>
            <article>
              <span>{strings.INVOICE_RECAP_STAT_TTC}</span>
              <strong>{formatPrice(recapTotalTTC)}</strong>
            </article>
            <article>
              <span>{strings.INVOICE_RECAP_STAT_PAID}</span>
              <strong>{formatPrice(recapTotalPaid)}</strong>
            </article>
            <article>
              <span>{strings.INVOICE_RECAP_STAT_BALANCE}</span>
              <strong>{formatPrice(recapBalanceDue)}</strong>
            </article>
          </div>

          {recapLoading ? (
            <div className="agency-inline-loading">
              <CircularProgress size={28} />
              <span>{strings.LOADING}</span>
            </div>
          ) : recapRows.length === 0 ? (
            <div className="agency-empty-stage">
              <div className="agency-empty-ring" aria-hidden />
              <ReceiptLongOutlined className="agency-empty-icon" />
              <p>{strings.INVOICE_RECAP_EMPTY}</p>
            </div>
          ) : (
            <div className="agency-receipt-table-wrap">
              <table className="agency-receipt-table">
                <thead>
                  <tr>
                    <th>{strings.INVOICE_NUMBER}</th>
                    <th>{strings.INVOICE_DATE}</th>
                    <th>{strings.INVOICE_CLIENT}</th>
                    <th>{strings.INVOICE_OBJECT}</th>
                    <th>{strings.INVOICE_TOTAL_TTC}</th>
                    <th>{strings.INVOICE_PAID}</th>
                    <th>{strings.INVOICE_BALANCE_DUE}</th>
                    <th aria-label={strings.INVOICE_ACTIONS} />
                  </tr>
                </thead>
                <tbody>
                  {recapRows.map((row) => (
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
                        {`${formatMoney(row.totalPaid)} ${row.currency}`}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="agency-contracts-recap-total">
                    <td colSpan={4}>{strings.INVOICE_RECAP_TOTALS}</td>
                    <td className="agency-receipt-amount-cell">{formatPrice(recapTotalTTC)}</td>
                    <td className="agency-receipt-amount-cell">{formatPrice(recapTotalPaid)}</td>
                    <td className="agency-receipt-amount-cell">{formatPrice(recapBalanceDue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
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
        onClose={closePreview}
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
              <Button
                startIcon={<PrintOutlined />}
                onClick={() => handlePrint('agency-invoice-pdf-frame', previewUrl)}
                variant="contained"
                className="btn-primary"
              >
                {strings.INVOICE_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => preview && void handleDownload(preview)}
              >
                {strings.INVOICE_PDF}
              </Button>
              <Button
                startIcon={<CodeRounded />}
                onClick={() => preview && void handleDownloadXml(preview)}
              >
                {strings.INVOICE_XML}
              </Button>
              <Button onClick={closePreview}>{strings.CANCEL}</Button>
            </div>
          </div>
          {preview && (
            <AgencyInvoicePreview invoiceId={preview._id} onReady={setPreviewUrl} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={periodPdfOpen}
        onClose={closePeriodPdf}
        fullWidth
        maxWidth="lg"
        className="agency-receipt-preview-dialog"
      >
        <DialogContent className="agency-receipt-preview-content">
          <div className="agency-receipt-preview-toolbar no-print">
            <div>
              <h3>{strings.INVOICE_RECAP_PDF_TITLE}</h3>
              <p>{`${formatInvoiceDate(appliedFrom)} → ${formatInvoiceDate(appliedTo)} · ${recapCount} ${strings.INVOICE_RECAP_PDF_COUNT}`}</p>
            </div>
            <div className="agency-receipt-preview-actions">
              <Button
                startIcon={<PrintOutlined />}
                onClick={() => handlePrint('agency-period-pdf-frame', periodPdfUrl)}
                variant="contained"
                className="btn-primary"
                disabled={!periodPdfUrl}
              >
                {strings.INVOICE_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => void handleDownloadPeriodPdf()}
                disabled={!periodPdfUrl}
              >
                {strings.INVOICE_PDF}
              </Button>
              <Button onClick={closePeriodPdf}>{strings.CANCEL}</Button>
            </div>
          </div>
          {periodPdfUrl ? (
            <iframe
              id="agency-period-pdf-frame"
              title={strings.INVOICE_RECAP_PDF_TITLE}
              src={`${periodPdfUrl}#toolbar=0&navpanes=0`}
              className="agency-invoice-pdf-frame"
            />
          ) : (
            <div className="agency-inline-loading">
              <CircularProgress size={28} />
              <span>{strings.LOADING}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgencyInvoices
