import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, CircularProgress, Rating } from '@mui/material'
import {
  CheckRounded,
  CloseRounded,
  RateReviewOutlined,
  StarOutline,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as langHelper from '@/utils/langHelper'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyReviewService from '@/agency/services/AgencyReviewService'

type ReviewFilter = 'all' | bookcarsTypes.AgencyReviewStatus

const nameInitial = (value: string) => value.trim().charAt(0).toUpperCase() || 'A'

const formatReviewDate = (value?: Date | string) => {
  if (!value) {
    return ''
  }
  const language = langHelper.getLanguage()
  const locale = language === 'en' ? 'en-GB' : language === 'ar' ? 'ar-TN' : 'fr-FR'
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const AgencyReviews = () => {
  const { agency } = useAgencyContext()
  const [data, setData] = useState<bookcarsTypes.AgencyReviewList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [actingId, setActingId] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    if (!agency?._id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await AgencyReviewService.getReviews()
      setData(result)
    } catch {
      setError(strings.REVIEWS_LOAD_ERROR)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [agency?._id])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const pendingCount = data?.pendingCount || 0
  const approvedCount = data?.count || 0
  const rejectedCount = data?.rejectedCount || 0
  const average = data?.average || 0
  const total = data?.reviews.length || 0

  const reviews = useMemo(() => {
    const list = [...(data?.reviews || [])]
    list.sort((a, b) => {
      const pendingA = a.status === bookcarsTypes.AgencyReviewStatus.Pending ? 0 : 1
      const pendingB = b.status === bookcarsTypes.AgencyReviewStatus.Pending ? 0 : 1
      if (pendingA !== pendingB) {
        return pendingA - pendingB
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
    if (filter === 'all') {
      return list
    }
    return list.filter((review) => review.status === filter)
  }, [data?.reviews, filter])

  const moderate = async (id: string, status: bookcarsTypes.AgencyReviewStatus.Approved | bookcarsTypes.AgencyReviewStatus.Rejected) => {
    setActingId(id)
    try {
      const updated = await AgencyReviewService.moderateReview(id, { status })
      setData((prev) => {
        if (!prev) {
          return prev
        }
        const nextReviews = prev.reviews.map((review) => (review._id === id ? { ...review, ...updated } : review))
        const nextApproved = nextReviews.filter((review) => review.status === bookcarsTypes.AgencyReviewStatus.Approved)
        const count = nextApproved.length
        const nextAverage = count
          ? Math.round((nextApproved.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10
          : 0
        return {
          ...prev,
          average: nextAverage,
          count,
          pendingCount: nextReviews.filter((review) => review.status === bookcarsTypes.AgencyReviewStatus.Pending).length,
          rejectedCount: nextReviews.filter((review) => review.status === bookcarsTypes.AgencyReviewStatus.Rejected).length,
          reviews: nextReviews,
        }
      })
    } catch {
      setError(strings.REVIEWS_ACTION_ERROR)
    } finally {
      setActingId(null)
    }
  }

  const statusLabel = (status?: bookcarsTypes.AgencyReviewStatus) => {
    if (status === bookcarsTypes.AgencyReviewStatus.Approved) {
      return strings.REVIEW_APPROVED
    }
    if (status === bookcarsTypes.AgencyReviewStatus.Rejected) {
      return strings.REVIEW_REJECTED
    }
    return strings.REVIEW_PENDING
  }

  const statusClass = (status?: bookcarsTypes.AgencyReviewStatus) => {
    if (status === bookcarsTypes.AgencyReviewStatus.Approved) {
      return 'is-approved'
    }
    if (status === bookcarsTypes.AgencyReviewStatus.Rejected) {
      return 'is-rejected'
    }
    return 'is-pending'
  }

  const filters: { id: ReviewFilter, label: string, count: number }[] = [
    { id: 'all', label: strings.REVIEW_FILTER_ALL, count: total },
    { id: bookcarsTypes.AgencyReviewStatus.Pending, label: strings.REVIEW_PENDING, count: pendingCount },
    { id: bookcarsTypes.AgencyReviewStatus.Approved, label: strings.REVIEW_APPROVED, count: approvedCount },
    { id: bookcarsTypes.AgencyReviewStatus.Rejected, label: strings.REVIEW_REJECTED, count: rejectedCount },
  ]

  return (
    <div className="agency-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.REVIEWS}</h2>
          <p>{strings.REVIEWS_SUBTITLE}</p>
        </div>
      </div>

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error && !data ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void loadReviews()}>{strings.RETRY}</Button>
        </div>
      ) : (
        <>
          <div className="agency-review-stats">
            <article className="agency-stat">
              <StarOutline />
              <div>
                <span>{strings.STAT_RATING}</span>
                <strong>{approvedCount ? average.toFixed(1) : '—'}</strong>
              </div>
            </article>
            <article className="agency-stat">
              <RateReviewOutlined />
              <div>
                <span>{strings.REVIEW_PENDING}</span>
                <strong>{pendingCount}</strong>
              </div>
            </article>
            <article className="agency-stat">
              <CheckRounded />
              <div>
                <span>{strings.REVIEW_APPROVED}</span>
                <strong>{approvedCount}</strong>
              </div>
            </article>
            <article className="agency-stat">
              <CloseRounded />
              <div>
                <span>{strings.REVIEW_REJECTED}</span>
                <strong>{rejectedCount}</strong>
              </div>
            </article>
          </div>

          {error && <p className="agency-review-inline-error">{error}</p>}

          <div className="agency-review-filters" role="tablist" aria-label={strings.REVIEWS}>
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'is-active' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
                <em>{item.count}</em>
              </button>
            ))}
          </div>

          {total === 0 ? (
            <div className="agency-empty-stage">
              <div className="agency-empty-ring" aria-hidden />
              <StarOutline className="agency-empty-icon" />
              <p>{strings.REVIEWS_EMPTY}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="agency-empty-stage">
              <p>{strings.REVIEWS_EMPTY_FILTER}</p>
            </div>
          ) : (
            <ul className="agency-review-list">
              {reviews.map((review) => (
                <li key={review._id} className={`agency-review-card ${statusClass(review.status)}`}>
                  <span className="agency-review-avatar">{nameInitial(review.name)}</span>
                  <div className="agency-review-body">
                    <div className="agency-review-meta">
                      <div>
                        <strong>{review.name}</strong>
                        <time>{formatReviewDate(review.createdAt)}</time>
                      </div>
                      <span className={`agency-review-chip ${statusClass(review.status)}`}>
                        {statusLabel(review.status)}
                      </span>
                    </div>
                    <Rating value={review.rating} readOnly size="small" sx={{ color: '#f5a623' }} />
                    <p>{review.comment}</p>
                    <div className="agency-review-actions">
                      {review.status !== bookcarsTypes.AgencyReviewStatus.Approved && (
                        <Button
                          variant="contained"
                          className="btn-primary"
                          startIcon={<CheckRounded />}
                          disabled={actingId === review._id}
                          onClick={() => void moderate(review._id, bookcarsTypes.AgencyReviewStatus.Approved)}
                        >
                          {strings.REVIEW_APPROVE}
                        </Button>
                      )}
                      {review.status !== bookcarsTypes.AgencyReviewStatus.Rejected && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          startIcon={<CloseRounded />}
                          disabled={actingId === review._id}
                          onClick={() => void moderate(review._id, bookcarsTypes.AgencyReviewStatus.Rejected)}
                        >
                          {strings.REVIEW_REJECT}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default AgencyReviews
