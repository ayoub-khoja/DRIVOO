import React, { useCallback, useEffect, useState } from 'react'
import {
  DirectionsCarOutlined,
  EventNoteOutlined,
  InsightsOutlined,
  StarOutline,
  ArrowForward,
} from '@mui/icons-material'
import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyBookingService from '@/agency/services/AgencyBookingService'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import * as AgencyInvoiceService from '@/agency/services/AgencyInvoiceService'
import * as AgencyReviewService from '@/agency/services/AgencyReviewService'
import env from '@/config/env.config'

const readTotalRecords = (result: unknown): number => {
  const chunk = Array.isArray(result) ? result[0] : undefined
  const pageInfo = chunk?.pageInfo as { totalRecords?: number }[] | { totalRecords?: number } | undefined
  return (Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0
}

const AgencyDashboard = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const approved = agency?.agencyApproved !== false
  const language = agency?.language || 'fr'
  const currency = env.BASE_CURRENCY || 'TND'

  const [carsCount, setCarsCount] = useState(0)
  const [bookingsCount, setBookingsCount] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [rating, setRating] = useState<string>('—')
  const [pendingCount, setPendingCount] = useState(0)

  const loadStats = useCallback(async () => {
    if (!agency?._id) {
      setCarsCount(0)
      setBookingsCount(0)
      setMonthRevenue(0)
      setRating('—')
      setPendingCount(0)
      return
    }

    try {
      const [carsResult, bookingsTotal, invoicesResult, reviews] = await Promise.all([
        AgencyCarService.getCars('', { suppliers: [agency._id] }, 1, 1),
        AgencyBookingService.getBookingsCount(agency._id, language),
        AgencyInvoiceService.listInvoices('', 1, 1),
        AgencyReviewService.getReviews(),
      ])

      setCarsCount(readTotalRecords(carsResult))
      setBookingsCount(bookingsTotal)
      setMonthRevenue(invoicesResult.stats?.monthTotal || 0)
      setRating(reviews.count ? reviews.average.toFixed(1) : '—')
      setPendingCount(reviews.pendingCount || 0)
    } catch {
      setCarsCount(0)
      setBookingsCount(0)
      setMonthRevenue(0)
      setRating('—')
      setPendingCount(0)
    }
  }, [agency?._id, language])

  useEffect(() => {
    if (agencyLoaded) {
      void loadStats()
    }
  }, [agencyLoaded, loadStats])

  const revenueLabel = bookcarsHelper.formatPrice(monthRevenue, currency, language)

  return (
    <div className="agency-page">
      <section className="agency-hero">
        <div className="agency-hero-copy">
          <p className="agency-kicker">{strings.WELCOME}</p>
          <h2>{strings.OVERVIEW}</h2>
          <p>{strings.OVERVIEW_TEXT}</p>
        </div>
        <div className="agency-hero-orb" aria-hidden />
      </section>

      {!approved && (
        <div className="agency-pending">
          <div className="agency-pending-pulse" aria-hidden />
          <div>
            <h3>{strings.PENDING_TITLE}</h3>
            <p>{strings.PENDING_TEXT}</p>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="agency-pending">
          <div className="agency-pending-pulse" aria-hidden />
          <div>
            <h3>{strings.REVIEWS}</h3>
            <p>{strings.REVIEWS_PENDING_HINT.replace('{0}', String(pendingCount))}</p>
            <div className="agency-actions">
              <Button component={Link} to="/agency/reviews" variant="contained" className="btn-primary">
                {strings.ACTION_REVIEWS}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="agency-stats">
        <Link to="/agency/fleet" className="agency-stat agency-stat-link" style={{ animationDelay: '0.05s' }}>
          <DirectionsCarOutlined />
          <div>
            <span>{strings.STAT_CARS}</span>
            <strong>{carsCount}</strong>
          </div>
        </Link>
        <Link to="/agency/bookings" className="agency-stat agency-stat-link" style={{ animationDelay: '0.12s' }}>
          <EventNoteOutlined />
          <div>
            <span>{strings.STAT_BOOKINGS}</span>
            <strong>{bookingsCount}</strong>
          </div>
        </Link>
        <Link to="/agency/invoices" className="agency-stat agency-stat-link" style={{ animationDelay: '0.19s' }}>
          <InsightsOutlined />
          <div>
            <span>{strings.STAT_REVENUE}</span>
            <strong>{revenueLabel}</strong>
          </div>
        </Link>
        <Link to="/agency/reviews" className="agency-stat agency-stat-link" style={{ animationDelay: '0.26s' }}>
          <StarOutline />
          <div>
            <span>{strings.STAT_RATING}</span>
            <strong>{rating}</strong>
          </div>
        </Link>
      </div>

      <div className="agency-grid">
        <section className="agency-panel agency-panel-accent">
          <h3>{strings.TIP_TITLE}</h3>
          <p>{strings.TIP_TEXT}</p>
          <div className="agency-actions">
            <Button
              component={Link}
              to="/agency/fleet"
              variant="contained"
              className="btn-primary"
              endIcon={<ArrowForward />}
              disabled={!approved}
            >
              {strings.ACTION_ADD_CAR}
            </Button>
            <Button component={Link} to="/agency/bookings" variant="outlined" color="inherit">
              {strings.ACTION_BOOKINGS}
            </Button>
          </div>
        </section>

        <section className="agency-panel">
          <h3>{strings.PROFILE}</h3>
          <p>{agency?.email}</p>
          <p>{agency?.phone || '—'}</p>
          <Button component={Link} to="/agency/profile" variant="outlined" color="inherit">
            {strings.ACTION_PROFILE}
          </Button>
        </section>
      </div>
    </div>
  )
}

export default AgencyDashboard
