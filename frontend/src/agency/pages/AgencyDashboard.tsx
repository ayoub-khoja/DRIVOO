import React from 'react'
import {
  DirectionsCarOutlined,
  EventNoteOutlined,
  InsightsOutlined,
  StarOutline,
  ArrowForward,
} from '@mui/icons-material'
import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'

const AgencyDashboard = () => {
  const { agency } = useAgencyContext()
  const approved = agency?.agencyApproved !== false

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

      <div className="agency-stats">
        <article className="agency-stat" style={{ animationDelay: '0.05s' }}>
          <DirectionsCarOutlined />
          <div>
            <span>{strings.STAT_CARS}</span>
            <strong>0</strong>
          </div>
        </article>
        <article className="agency-stat" style={{ animationDelay: '0.12s' }}>
          <EventNoteOutlined />
          <div>
            <span>{strings.STAT_BOOKINGS}</span>
            <strong>0</strong>
          </div>
        </article>
        <article className="agency-stat" style={{ animationDelay: '0.19s' }}>
          <InsightsOutlined />
          <div>
            <span>{strings.STAT_REVENUE}</span>
            <strong>0 TND</strong>
          </div>
        </article>
        <article className="agency-stat" style={{ animationDelay: '0.26s' }}>
          <StarOutline />
          <div>
            <span>{strings.STAT_RATING}</span>
            <strong>—</strong>
          </div>
        </article>
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
