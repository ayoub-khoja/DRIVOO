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
  DeleteOutlineRounded,
  DownloadRounded,
  PrintOutlined,
  RequestQuoteOutlined,
  Search as SearchIcon,
  VisibilityOutlined,
} from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import AgencyAddReceiptDialog from '@/agency/pages/AgencyAddReceiptDialog'
import AgencyReceiptPreview from '@/agency/components/AgencyReceiptPreview'
import * as AgencyReceiptService from '@/agency/services/AgencyReceiptService'
import type { AgencyReceipt, AgencyReceiptStats } from '@/agency/types/receipt'
import { formatReceiptDate, paymentLabel } from '@/agency/utils/receiptFormat'
import { defaultRecapPeriod, periodPresetRange } from '@/agency/utils/periodRecap'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 8

const EMPTY_STATS: AgencyReceiptStats = { count: 0, monthTotal: 0, lastNumber: null }

type ReceiptsView = 'list' | 'recap'

const AgencyReceipts = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [view, setView] = useState<ReceiptsView>('list')
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AgencyReceipt[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [preview, setPreview] = useState<AgencyReceipt | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<AgencyReceiptStats>(EMPTY_STATS)

  const initialPeriod = useMemo(() => defaultRecapPeriod(), [])
  const [recapFrom, setRecapFrom] = useState(initialPeriod.from)
  const [recapTo, setRecapTo] = useState(initialPeriod.to)
  const [appliedFrom, setAppliedFrom] = useState(initialPeriod.from)
  const [appliedTo, setAppliedTo] = useState(initialPeriod.to)
  const [recapRows, setRecapRows] = useState<AgencyReceipt[]>([])
  const [recapCount, setRecapCount] = useState(0)
  const [recapTotalAmount, setRecapTotalAmount] = useState(0)
  const [recapCurrency, setRecapCurrency] = useState(env.BASE_CURRENCY || 'TND')
  const [recapLoading, setRecapLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [periodPdfOpen, setPeriodPdfOpen] = useState(false)
  const [periodPdfUrl, setPeriodPdfUrl] = useState<string | null>(null)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const result = await AgencyReceiptService.listReceipts(search, nextPage, PAGE_SIZE)
      setRows(result.rows)
      setTotalRecords(result.totalRecords)
      setStats(result.stats || EMPTY_STATS)
      setPage(nextPage)
    } catch {
      helper.error(undefined, strings.RECEIPT_LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRecap = useCallback(async (from: string, to: string) => {
    setRecapLoading(true)
    try {
      const result = await AgencyReceiptService.getReceiptsRecap(from, to)
      setRecapRows(result.rows)
      setRecapCount(result.count)
      setRecapTotalAmount(result.totalAmount)
      setRecapCurrency(result.currency || env.BASE_CURRENCY || 'TND')
    } catch {
      helper.error(undefined, strings.RECEIPT_LOAD_ERROR)
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

  const handleDownload = async (receipt: AgencyReceipt) => {
    try {
      await AgencyReceiptService.downloadReceiptPdf(receipt._id, receipt.number)
    } catch {
      helper.error(undefined, strings.RECEIPT_PDF_ERROR)
    }
  }

  const handleExportRecapPdf = async () => {
    if (!appliedFrom || !appliedTo || appliedFrom > appliedTo) {
      helper.error(undefined, strings.CONTRACT_RECAP_INVALID)
      return
    }
    setExportingPdf(true)
    try {
      await AgencyReceiptService.downloadReceiptsRecapPdf(appliedFrom, appliedTo)
      helper.info(strings.CONTRACT_RECAP_DOWNLOAD_OK)
    } catch {
      helper.error(undefined, strings.RECEIPT_PDF_ERROR)
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
      const blob = await AgencyReceiptService.getReceiptsRecapPdf(appliedFrom, appliedTo)
      if (periodPdfUrl) {
        URL.revokeObjectURL(periodPdfUrl)
      }
      const url = URL.createObjectURL(blob)
      setPeriodPdfUrl(url)
      setPeriodPdfOpen(true)
    } catch {
      helper.error(undefined, strings.RECEIPT_PDF_ERROR)
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
      await AgencyReceiptService.downloadReceiptsRecapPdf(appliedFrom, appliedTo)
      helper.info(strings.CONTRACT_RECAP_DOWNLOAD_OK)
    } catch {
      helper.error(undefined, strings.RECEIPT_PDF_ERROR)
    }
  }

  const handleDelete = async (receipt: AgencyReceipt) => {
    if (!window.confirm(strings.RECEIPT_DELETE_CONFIRM)) {
      return
    }
    try {
      await AgencyReceiptService.deleteReceipt(receipt._id)
      helper.info(strings.RECEIPT_DELETED)
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page
      void load(query, nextPage)
    } catch {
      helper.error(undefined, strings.RECEIPT_SAVE_ERROR)
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
          <h2>{strings.RECEIPTS}</h2>
          <p>{view === 'list' ? strings.RECEIPTS_SUBTITLE : strings.RECEIPT_RECAP_SUBTITLE}</p>
        </div>
        {view === 'list' ? (
          <Button
            variant="contained"
            className="btn-primary"
            startIcon={<AddRounded />}
            onClick={() => setOpenForm(true)}
          >
            {strings.RECEIPT_ADD}
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
              {strings.RECEIPT_RECAP_EXPORT_PDF}
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
          {strings.RECEIPT_VIEW_LIST}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'recap'}
          className={`agency-contracts-view-btn${view === 'recap' ? ' is-active' : ''}`}
          onClick={() => setView('recap')}
        >
          {strings.RECEIPT_VIEW_RECAP}
        </button>
      </div>

      {view === 'list' ? (
        <>
          <div className="agency-receipt-stats">
            <article>
              <span>{strings.RECEIPT_STAT_COUNT}</span>
              <strong>{stats.count}</strong>
            </article>
            <article>
              <span>{strings.RECEIPT_STAT_MONTH}</span>
              <strong>{monthTotalLabel}</strong>
            </article>
            <article>
              <span>{strings.RECEIPT_STAT_LAST}</span>
              <strong>{stats.lastNumber || '—'}</strong>
            </article>
          </div>

          <OutlinedInput
            size="small"
            className="agency-search"
            placeholder={strings.RECEIPT_SEARCH}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQuery(keyword)
              }
            }}
            endAdornment={(
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.RECEIPT_SEARCH}>
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
              <RequestQuoteOutlined className="agency-empty-icon" />
              <p>{query ? strings.RECEIPT_EMPTY_SEARCH : strings.RECEIPT_EMPTY}</p>
              {!query && (
                <Button
                  variant="contained"
                  className="btn-primary"
                  startIcon={<AddRounded />}
                  onClick={() => setOpenForm(true)}
                >
                  {strings.RECEIPT_ADD}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="agency-receipt-table-wrap">
                <table className="agency-receipt-table">
                  <thead>
                    <tr>
                      <th>{strings.RECEIPT_NUMBER}</th>
                      <th>{strings.RECEIPT_DATE}</th>
                      <th>{strings.RECEIPT_CLIENT}</th>
                      <th>{strings.RECEIPT_VEHICLE}</th>
                      <th>{strings.RECEIPT_PAYMENT}</th>
                      <th>{strings.RECEIPT_AMOUNT}</th>
                      <th aria-label={strings.RECEIPT_ACTIONS} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <span className="agency-receipt-number">{row.number}</span>
                        </td>
                        <td>{formatReceiptDate(row.paidAt, language)}</td>
                        <td>
                          <div className="agency-receipt-client-cell">
                            <strong>{row.clientName}</strong>
                            {row.clientPhone && <span>{row.clientPhone}</span>}
                          </div>
                        </td>
                        <td>{row.vehicleLabel || '—'}</td>
                        <td>
                          <span className={`agency-receipt-pay-chip is-${row.paymentMethod}`}>
                            {paymentLabel(row.paymentMethod)}
                          </span>
                        </td>
                        <td className="agency-receipt-amount-cell">
                          {bookcarsHelper.formatPrice(row.amount, row.currency, language)}
                        </td>
                        <td>
                          <div className="agency-receipt-row-actions">
                            <Tooltip title={strings.RECEIPT_VIEW}>
                              <IconButton size="small" onClick={() => setPreview(row)}>
                                <VisibilityOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={strings.RECEIPT_PDF}>
                              <IconButton size="small" onClick={() => void handleDownload(row)}>
                                <DownloadRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={strings.RECEIPT_DELETE}>
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
          <section className="agency-contracts-recap-bar" aria-label={strings.RECEIPT_VIEW_RECAP}>
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
            <div className="agency-bookings-date-range" role="group" aria-label={strings.RECEIPT_DATE}>
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
              <span>{strings.RECEIPT_RECAP_STAT_COUNT}</span>
              <strong>{recapCount}</strong>
            </article>
            <article>
              <span>{strings.RECEIPT_RECAP_STAT_AMOUNT}</span>
              <strong>{formatPrice(recapTotalAmount)}</strong>
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
              <RequestQuoteOutlined className="agency-empty-icon" />
              <p>{strings.RECEIPT_RECAP_EMPTY}</p>
            </div>
          ) : (
            <div className="agency-receipt-table-wrap">
              <table className="agency-receipt-table">
                <thead>
                  <tr>
                    <th>{strings.RECEIPT_NUMBER}</th>
                    <th>{strings.RECEIPT_DATE}</th>
                    <th>{strings.RECEIPT_CLIENT}</th>
                    <th>{strings.RECEIPT_VEHICLE}</th>
                    <th>{strings.RECEIPT_PAYMENT}</th>
                    <th>{strings.RECEIPT_AMOUNT}</th>
                    <th aria-label={strings.RECEIPT_ACTIONS} />
                  </tr>
                </thead>
                <tbody>
                  {recapRows.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <span className="agency-receipt-number">{row.number}</span>
                      </td>
                      <td>{formatReceiptDate(row.paidAt, language)}</td>
                      <td>
                        <div className="agency-receipt-client-cell">
                          <strong>{row.clientName}</strong>
                          {row.clientPhone && <span>{row.clientPhone}</span>}
                        </div>
                      </td>
                      <td>{row.vehicleLabel || '—'}</td>
                      <td>
                        <span className={`agency-receipt-pay-chip is-${row.paymentMethod}`}>
                          {paymentLabel(row.paymentMethod)}
                        </span>
                      </td>
                      <td className="agency-receipt-amount-cell">
                        {bookcarsHelper.formatPrice(row.amount, row.currency, language)}
                      </td>
                      <td>
                        <div className="agency-receipt-row-actions">
                          <Tooltip title={strings.RECEIPT_VIEW}>
                            <IconButton size="small" onClick={() => setPreview(row)}>
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={strings.RECEIPT_PDF}>
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
                    <td colSpan={5}>{strings.RECEIPT_RECAP_TOTALS}</td>
                    <td className="agency-receipt-amount-cell">{formatPrice(recapTotalAmount)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      <AgencyAddReceiptDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onCreated={() => {
          setOpenForm(false)
          setQuery('')
          setKeyword('')
          void load('', 1)
          helper.info(strings.RECEIPT_CREATED)
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
              <h3>{strings.RECEIPT_DOC_TITLE}</h3>
              <p>{preview?.number}</p>
            </div>
            <div className="agency-receipt-preview-actions">
              <Button
                startIcon={<PrintOutlined />}
                onClick={() => handlePrint('agency-receipt-pdf-frame', previewUrl)}
                variant="contained"
                className="btn-primary"
              >
                {strings.RECEIPT_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => preview && void handleDownload(preview)}
              >
                {strings.RECEIPT_PDF}
              </Button>
              <Button onClick={closePreview}>{strings.CANCEL}</Button>
            </div>
          </div>
          {preview && (
            <AgencyReceiptPreview receiptId={preview._id} onReady={setPreviewUrl} />
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
              <h3>{strings.RECEIPT_RECAP_PDF_TITLE}</h3>
              <p>{`${formatReceiptDate(appliedFrom, language)} → ${formatReceiptDate(appliedTo, language)} · ${recapCount} ${strings.RECEIPT_RECAP_PDF_COUNT}`}</p>
            </div>
            <div className="agency-receipt-preview-actions">
              <Button
                startIcon={<PrintOutlined />}
                onClick={() => handlePrint('agency-period-pdf-frame', periodPdfUrl)}
                variant="contained"
                className="btn-primary"
                disabled={!periodPdfUrl}
              >
                {strings.RECEIPT_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => void handleDownloadPeriodPdf()}
                disabled={!periodPdfUrl}
              >
                {strings.RECEIPT_PDF}
              </Button>
              <Button onClick={closePeriodPdf}>{strings.CANCEL}</Button>
            </div>
          </div>
          {periodPdfUrl ? (
            <iframe
              id="agency-period-pdf-frame"
              title={strings.RECEIPT_RECAP_PDF_TITLE}
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

export default AgencyReceipts
