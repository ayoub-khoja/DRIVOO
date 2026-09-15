import React, { useCallback, useEffect, useState } from 'react'
import {
  CircularProgress,
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
  ArrowBackIosNew as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import * as AdminApiService from '@/admin/services/AdminApiService'

const PAGE_SIZE = 10

const AdminAgencyLogins = () => {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<bookcarsTypes.AgencyLoginRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const load = useCallback(async (search = '', nextPage = 1) => {
    setLoading(true)
    try {
      const data = await AdminApiService.getAgencyLogins(nextPage, PAGE_SIZE, search)
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

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h2>{strings.AGENCY_LOGINS_TITLE}</h2>
          <p>{strings.AGENCY_LOGINS_SUBTITLE}</p>
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
          <div className="admin-empty">{strings.AGENCY_LOGINS_EMPTY}</div>
        ) : (
          <Table className="admin-table">
            <TableHead>
              <TableRow>
                <TableCell>{strings.COL_AGENCY}</TableCell>
                <TableCell>{strings.COL_EMAIL}</TableCell>
                <TableCell>{strings.COL_PASSWORD}</TableCell>
                <TableCell>{strings.COL_FIRST_LOGIN}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.email || '—'}</TableCell>
                  <TableCell>
                    <span className="admin-mono">{row.adminVisiblePassword || '—'}</span>
                  </TableCell>
                  <TableCell>
                    {row.active ? strings.STATUS_FIRST_LOGIN_DONE : strings.STATUS_FIRST_LOGIN_PENDING}
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
    </div>
  )
}

export default AdminAgencyLogins
