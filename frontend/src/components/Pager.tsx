import React from 'react'
import { Button, IconButton } from '@mui/material'
import {
  ArrowBackIos as PreviousPageIcon,
  ArrowForwardIos as NextPageIcon
} from '@mui/icons-material'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/pager.css'

interface PagerProps {
  page: number
  pageSize: number
  totalRecords: number
  rowCount: number
  onNext: () => void
  onPrevious: () => void
  onPageChange?: (page: number) => void
}

const getPageNumbers = (current: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, current])
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i > 1 && i < totalPages) {
      pages.add(i)
    }
  }

  return Array.from(pages).sort((a, b) => a - b)
}

const Pager = ({
  page,
  pageSize,
  totalRecords,
  rowCount,
  onNext,
  onPrevious,
  onPageChange,
}: PagerProps) => {
  if (totalRecords <= 0) {
    return null
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const from = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(rowCount, totalRecords)
  const pageNumbers = getPageNumbers(page, totalPages)

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return
    }
    if (onPageChange) {
      onPageChange(nextPage)
      return
    }
    if (nextPage > page) {
      onNext()
    } else {
      onPrevious()
    }
  }

  return (
    <div className="pager-container">
      <div className="pager">
        <div className="row-count">
          {`${from}-${to} ${commonStrings.OF} ${totalRecords}`}
        </div>

        <div className="actions">
          <IconButton onClick={onPrevious} disabled={page <= 1} aria-label="previous page">
            <PreviousPageIcon className="icon" />
          </IconButton>

          <div className="page-numbers">
            {pageNumbers.map((pageNumber, index) => {
              const prev = pageNumbers[index - 1]
              const showEllipsis = typeof prev === 'number' && pageNumber - prev > 1

              return (
                <React.Fragment key={pageNumber}>
                  {showEllipsis && <span className="page-ellipsis">…</span>}
                  <Button
                    className={`page-number${pageNumber === page ? ' active' : ''}`}
                    onClick={() => goToPage(pageNumber)}
                    disabled={pageNumber === page}
                  >
                    {pageNumber}
                  </Button>
                </React.Fragment>
              )
            })}
          </div>

          <IconButton onClick={onNext} disabled={page >= totalPages} aria-label="next page">
            <NextPageIcon className="icon" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

export default Pager
