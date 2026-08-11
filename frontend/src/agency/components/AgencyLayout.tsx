import React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  DirectionsCarOutlined,
  EventNoteOutlined,
  LogoutOutlined,
  PersonOutline,
} from '@mui/icons-material'
import { Button, CircularProgress } from '@mui/material'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import logo from '@/assets/img/logoWhite.png'

import '@/agency/assets/css/agency.css'

const AgencyShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { agency, agencyLoaded } = useAgencyContext()
  const isSignIn = location.pathname.endsWith('/sign-in')

  React.useEffect(() => {
    if (!agencyLoaded || isSignIn) {
      return
    }
    if (!agency) {
      navigate('/agency/sign-in', { replace: true })
    }
  }, [agency, agencyLoaded, isSignIn, navigate])

  const onSignOut = async () => {
    await AgencyAuthService.signout(true)
  }

  if (!agencyLoaded && !isSignIn) {
    return (
      <div className="agency-loading">
        <CircularProgress size={32} />
        <span>{strings.LOADING}</span>
      </div>
    )
  }

  if (isSignIn) {
    return <Outlet />
  }

  if (!agency) {
    return null
  }

  return (
    <div className="agency-app">
      <aside className="agency-sidebar">
        <div className="agency-brand">
          <img src={logo} alt={env.WEBSITE_NAME} />
          <span>{strings.BRAND}</span>
        </div>

        <nav className="agency-nav">
          <NavLink to="/agency/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <DashboardOutlined />
            <span>{strings.DASHBOARD}</span>
          </NavLink>
          <NavLink to="/agency/fleet" className={({ isActive }) => (isActive ? 'active' : '')}>
            <DirectionsCarOutlined />
            <span>{strings.FLEET}</span>
          </NavLink>
          <NavLink to="/agency/bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
            <EventNoteOutlined />
            <span>{strings.BOOKINGS}</span>
          </NavLink>
          <NavLink to="/agency/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
            <PersonOutline />
            <span>{strings.PROFILE}</span>
          </NavLink>
        </nav>

        <div className="agency-sidebar-footer">
          <Button className="agency-signout" startIcon={<LogoutOutlined />} onClick={onSignOut}>
            {strings.SIGN_OUT}
          </Button>
          <a className="agency-back-site" href="/">{strings.BACK_SITE}</a>
        </div>
      </aside>

      <main className="agency-main">
        <header className="agency-topbar">
          <div className="agency-topbar-copy">
            <p className="agency-kicker">{strings.WELCOME}</p>
            <h1>{agency.fullName}</h1>
          </div>
          <div className={`agency-status-chip ${agency.agencyApproved === false ? 'is-pending' : 'is-live'}`}>
            {agency.agencyApproved === false ? 'Pending' : 'Live'}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

const AgencyLayout = () => <AgencyShell />

export default AgencyLayout
