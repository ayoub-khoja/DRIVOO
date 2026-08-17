import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
} from '@mui/material'
import {
  AddRounded,
  ApartmentOutlined,
  Search as SearchIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyBranchService from '@/agency/services/AgencyBranchService'
import AgencyAddBranchDialog from '@/agency/pages/AgencyAddBranchDialog'

const PAGE_SIZE = 12

const AgencyBranches = () => {
  const navigate = useNavigate()
  const { agency, agencyLoaded } = useAgencyContext()
  const isMainAgency = !!agency && !agency.parentAgency

  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<bookcarsTypes.SubAgency[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openForm, setOpenForm] = useState(false)

  useEffect(() => {
    if (agencyLoaded && agency && !isMainAgency) {
      navigate('/agency/dashboard', { replace: true })
    }
  }, [agency, agencyLoaded, isMainAgency, navigate])

  const load = useCallback(async (search = '', nextPage = 1) => {
    if (!agency?._id) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await AgencyBranchService.getSubAgencies(search, nextPage, PAGE_SIZE)
      const data = result?.[0]
      setRows(data?.resultData || [])
      const pageInfo = data?.pageInfo as unknown as { totalRecords?: number }[] | { totalRecords?: number } | undefined
      setTotalRecords((Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0)
      setPage(nextPage)
    } catch {
      setError(strings.BRANCH_LOAD_ERROR)
      setRows([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [agency?._id])

  useEffect(() => {
    if (isMainAgency) {
      void load(query, 1)
    }
  }, [isMainAgency, load, query])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  if (!isMainAgency) {
    return null
  }

  return (
    <div className="agency-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.BRANCHES}</h2>
          <p>{strings.BRANCHES_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
          disabled={agency.agencyApproved === false}
        >
          {strings.BRANCH_ADD}
        </Button>
      </div>

      <OutlinedInput
        size="small"
        className="agency-search"
        placeholder={strings.BRANCH_SEARCH}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(keyword)
          }
        }}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.BRANCH_SEARCH}>
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
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void load(query, page)}>{strings.RETRY}</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <ApartmentOutlined className="agency-empty-icon" />
          <p>{query ? strings.BRANCH_EMPTY_SEARCH : strings.BRANCH_EMPTY}</p>
          {!query && (
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddRounded />}
              onClick={() => setOpenForm(true)}
              disabled={agency.agencyApproved === false}
            >
              {strings.BRANCH_ADD}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="agency-branch-grid">
            {rows.map((branch) => (
              <article key={branch._id} className="agency-branch-card">
                <div className="agency-branch-card-top">
                  <div className="agency-branch-avatar" aria-hidden>
                    {branch.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3>{branch.fullName}</h3>
                    <p>{branch.city || branch.governorate || strings.BRANCH_NO_CITY}</p>
                  </div>
                </div>
                <div className="agency-branch-card-meta">
                  <span>{branch.email}</span>
                  <span>{branch.phone || '—'}</span>
                </div>
                <div className="agency-fleet-card-meta">
                  <span>{branch.carCount || 0} {strings.STAT_CARS.toLowerCase()}</span>
                  <span className={branch.active ? 'is-live' : 'is-pending'}>
                    {branch.active ? strings.BRANCH_ACTIVE : strings.BRANCH_INVITED}
                  </span>
                </div>
              </article>
            ))}
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

      <AgencyAddBranchDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onCreated={(branch) => {
          setRows((prev) => [branch, ...prev])
          setTotalRecords((prev) => prev + 1)
          setOpenForm(false)
        }}
      />
    </div>
  )
}

export default AgencyBranches
