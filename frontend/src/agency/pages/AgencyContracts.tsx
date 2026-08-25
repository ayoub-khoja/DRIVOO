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
  DescriptionOutlined,
  DownloadRounded,
  PrintOutlined,
  Search as SearchIcon,
  VisibilityOutlined,
} from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import AgencyAddContractDialog from '@/agency/pages/AgencyAddContractDialog'
import AgencyContractPreview from '@/agency/components/AgencyContractPreview'
import * as AgencyContractService from '@/agency/services/AgencyContractService'
import type { AgencyContract, AgencyContractStats } from '@/agency/types/contract'
import { formatInvoiceDate } from '@/agency/utils/invoiceFormat'
import { formatMoney } from '@/agency/utils/invoiceMath'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 8

const EMPTY_STATS: AgencyContractStats = { count: 0, monthTotal: 0, lastNumber: null }

const AgencyContracts = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AgencyContract[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [preview, setPreview] = useState<AgencyContract | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<AgencyContractStats>(EMPTY_STATS)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const result = await AgencyContractService.listContracts(search, nextPage, PAGE_SIZE)
      setRows(result.rows)
      setTotalRecords(result.totalRecords)
      setStats(result.stats || EMPTY_STATS)
      setPage(nextPage)
    } catch {
      helper.error(undefined, strings.CONTRACT_LOAD_ERROR)
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

  const handleDownload = async (contract: AgencyContract) => {
    try {
      await AgencyContractService.downloadContractPdf(contract._id, contract.number)
    } catch {
      helper.error(undefined, strings.CONTRACT_PDF_ERROR)
    }
  }

  /** Print the embedded PDF; falls back to a tab when the browser blocks iframe printing. */
  const handlePrint = () => {
    const frame = document.getElementById('agency-contract-pdf-frame') as HTMLIFrameElement | null
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

  const handleDelete = async (contract: AgencyContract) => {
    if (!window.confirm(strings.CONTRACT_DELETE_CONFIRM)) {
      return
    }
    try {
      await AgencyContractService.deleteContract(contract._id)
      helper.info(strings.CONTRACT_DELETED)
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
          <h2>{strings.CONTRACTS}</h2>
          <p>{strings.CONTRACTS_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
        >
          {strings.CONTRACT_ADD}
        </Button>
      </div>

      <div className="agency-receipt-stats">
        <article>
          <span>{strings.CONTRACT_STAT_COUNT}</span>
          <strong>{stats.count}</strong>
        </article>
        <article>
          <span>{strings.CONTRACT_STAT_MONTH}</span>
          <strong>{monthTotalLabel}</strong>
        </article>
        <article>
          <span>{strings.CONTRACT_STAT_LAST}</span>
          <strong>{stats.lastNumber || '—'}</strong>
        </article>
      </div>

      <OutlinedInput
        size="small"
        className="agency-search"
        placeholder={strings.CONTRACT_SEARCH}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(keyword)
          }
        }}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.CONTRACT_SEARCH}>
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
          <DescriptionOutlined className="agency-empty-icon" />
          <p>{query ? strings.CONTRACT_EMPTY_SEARCH : strings.CONTRACT_EMPTY}</p>
          {!query && (
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddRounded />}
              onClick={() => setOpenForm(true)}
            >
              {strings.CONTRACT_ADD}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="agency-receipt-table-wrap">
            <table className="agency-receipt-table">
              <thead>
                <tr>
                  <th>{strings.CONTRACT_NUMBER}</th>
                  <th>{strings.CONTRACT_DATE}</th>
                  <th>{strings.CONTRACT_DRIVER}</th>
                  <th>{strings.CONTRACT_VEHICLE}</th>
                  <th>{strings.CONTRACT_PERIOD}</th>
                  <th>{strings.CONTRACT_TOTAL_TTC}</th>
                  <th aria-label={strings.CONTRACT_ACTIONS} />
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
                        <strong>{row.driver.fullName}</strong>
                        {row.secondDriver?.fullName && <span>+ {row.secondDriver.fullName}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="agency-receipt-client-cell">
                        <strong>{row.vehicleModel}</strong>
                        <span>{row.vehiclePlate}</span>
                      </div>
                    </td>
                    <td className="agency-invoice-object-cell">
                      {`${formatInvoiceDate(row.departureDate)} → ${formatInvoiceDate(row.returnDate)}`}
                    </td>
                    <td className="agency-receipt-amount-cell">
                      {`${formatMoney(row.totalTTC)} ${row.currency}`}
                    </td>
                    <td>
                      <div className="agency-receipt-row-actions">
                        <Tooltip title={strings.CONTRACT_VIEW}>
                          <IconButton size="small" onClick={() => setPreview(row)}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={strings.CONTRACT_PDF}>
                          <IconButton size="small" onClick={() => void handleDownload(row)}>
                            <DownloadRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={strings.CONTRACT_DELETE}>
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

      <AgencyAddContractDialog
        open={openForm}
        agency={agency}
        onClose={() => setOpenForm(false)}
        onCreated={(contract) => {
          setOpenForm(false)
          setQuery('')
          setKeyword('')
          void load('', 1)
          helper.info(strings.CONTRACT_CREATED)
          setPreview(contract)
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
              <h3>{strings.CONTRACT_DOC_TITLE}</h3>
              <p>{preview?.number}</p>
            </div>
            <div className="agency-receipt-preview-actions">
              <Button startIcon={<PrintOutlined />} onClick={handlePrint} variant="contained" className="btn-primary">
                {strings.CONTRACT_PRINT}
              </Button>
              <Button
                startIcon={<DownloadRounded />}
                onClick={() => preview && void handleDownload(preview)}
              >
                {strings.CONTRACT_PDF}
              </Button>
              <Button onClick={closePreview}>{strings.CANCEL}</Button>
            </div>
          </div>
          {preview && (
            <AgencyContractPreview contractId={preview._id} onReady={setPreviewUrl} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgencyContracts
