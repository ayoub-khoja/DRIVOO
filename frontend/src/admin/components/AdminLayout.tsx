import React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  HowToRegOutlined,
  LogoutOutlined,
  StorefrontOutlined,
  PeopleOutline,
  CardMembershipOutlined,
} from '@mui/icons-material'
import { Button, CircularProgress } from '@mui/material'
import env from '@/config/env.config'
import { strings } from '@/admin/lang/admin'
import { useAdminContext } from '@/admin/context/AdminContext'
import * as AdminAuthService from '@/admin/services/AdminAuthService'
import adminAxiosInstance from '@/admin/services/adminAxios'
import FirebaseMessagingBridge from '@/components/FirebaseMessagingBridge'
import MessengerWidget from '@/components/messenger/MessengerWidget'
import logo from '@/assets/img/logoWhite.png'

import '@/admin/assets/css/admin.css'

const AdminShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, adminLoaded } = useAdminContext()
  const isSignIn = location.pathname.endsWith('/sign-in')

  React.useEffect(() => {
    if (!adminLoaded || isSignIn) {
      return
    }
    if (!admin) {
      navigate('/admin/sign-in', { replace: true })
    }
  }, [admin, adminLoaded, isSignIn, navigate])

  if (!adminLoaded && !isSignIn) {
    return (
      <div className="admin-loading">
        <CircularProgress color="inherit" />
      </div>
    )
  }

  if (isSignIn) {
    return <Outlet />
  }

  if (!admin) {
    return null
  }

  const onSignOut = async () => {
    await AdminAuthService.signout(true)
  }

  return (
    <div className="admin-app">
      <FirebaseMessagingBridge enabled axiosInstance={adminAxiosInstance} />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={logo} alt={env.WEBSITE_NAME} />
          <span>{strings.BRAND}</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <DashboardOutlined />
            <span>{strings.DASHBOARD}</span>
          </NavLink>
          <NavLink to="/admin/account-requests" className={({ isActive }) => (isActive ? 'active' : '')}>
            <HowToRegOutlined />
            <span>{strings.ACCOUNT_REQUESTS}</span>
          </NavLink>
          <NavLink to="/admin/agencies" className={({ isActive }) => (isActive ? 'active' : '')}>
            <StorefrontOutlined />
            <span>{strings.AGENCIES}</span>
          </NavLink>
          <NavLink to="/admin/clients" className={({ isActive }) => (isActive ? 'active' : '')}>
            <PeopleOutline />
            <span>{strings.USERS}</span>
          </NavLink>
          <NavLink to="/admin/subscription" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CardMembershipOutlined />
            <span>{strings.SUBSCRIPTION}</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <Button className="admin-signout" startIcon={<LogoutOutlined />} onClick={onSignOut}>
            {strings.SIGN_OUT}
          </Button>
          <a className="admin-back-site" href="/">{strings.BACK_SITE}</a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar-label">{strings.WELCOME}</p>
            <h1>{admin.fullName}</h1>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <MessengerWidget axiosInstance={adminAxiosInstance} currentUser={admin} mode="admin" theme="dark" />
      </div>
    </div>
  )
}

const AdminLayout = () => <AdminShell />

export default AdminLayout
