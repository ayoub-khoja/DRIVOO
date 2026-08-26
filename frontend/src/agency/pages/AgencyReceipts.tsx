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
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { printReceiptElement } from '@/agency/utils/printReceipt'

const PAGE_SIZE = 8

const EMPTY_STATS: AgencyReceiptStats = { count: 0, monthTotal: 0, lastNumber: null }

const AgencyReceipts = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AgencyReceipt[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [preview, setPreview] = useState<AgencyReceipt | null>(null)
  const [printReceipt, setPrintReceipt] = useState<AgencyReceipt | null>(null)
  const [stats, setStats] = useState<AgencyReceiptStats>(EMPTY_STATS)

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

  const handlePrint = () => {
    if (!preview) {
      return
    }
    printReceiptElement('agency-receipt-print', preview.number)
  }

  // Print from table icon: render off-screen, then print (no modal)
  useEffect(() => {
    if (!printReceipt) {
      return undefined
    }
    const timer = window.setTimeout(() => {
      printReceiptElement('agency-receipt-print-silent', printReceipt.number)
      setPrintReceipt(null)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [printReceipt])

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
          <p>{strings.RECEIPTS_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
        >
          {strings.RECEIPT_ADD}
        </Button>
      </div>

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
                        <Tooltip title={strings.RECEIPT_PRINT}>
                          <IconButton
                            size="small"
                            onClick={() => setPrintReceipt(row)}
                          >
                            <PrintOutlined fontSize="small" />
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
        onClose={() => setPreview(null)}
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
              <Button startIcon={<PrintOutlined />} onClick={handlePrint} variant="contained" className="btn-primary">
                {strings.RECEIPT_PRINT}
              </Button>
              <Button onClick={() => setPreview(null)}>{strings.CANCEL}</Button>
            </div>
          </div>
          {preview && (
            <AgencyReceiptPreview receipt={preview} agency={agency} language={language} />
          )}
        </DialogContent>
      </Dialog>

      {/* Off-screen receipt used only for direct print from the table */}
      {printReceipt && (
        <div className="agency-receipt-print-host" aria-hidden>
          <AgencyReceiptPreview
            receipt={printReceipt}
            agency={agency}
            language={language}
            elementId="agency-receipt-print-silent"
          />
        </div>
      )}
    </div>
  )
}

export default AgencyReceipts
