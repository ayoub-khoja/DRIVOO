import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  HowToRegOutlined,
  LogoutOutlined,
  StorefrontOutlined,
  PeopleOutline,
  CardMembershipOutlined,
  PaymentsOutlined,
  VpnKeyOutlined,
} from '@mui/icons-material'
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material'
import { toast } from 'react-toastify'
import { CircleFlag } from 'react-circle-flags'
import env from '@/config/env.config'
import { strings } from '@/admin/lang/admin'
import { strings as commonStrings } from '@/lang/common'
import { useAdminContext } from '@/admin/context/AdminContext'
import * as AdminAuthService from '@/admin/services/AdminAuthService'
import adminAxiosInstance from '@/admin/services/adminAxios'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import * as langHelper from '@/utils/langHelper'
import FirebaseMessagingBridge from '@/components/FirebaseMessagingBridge'
import MessengerWidget from '@/components/messenger/MessengerWidget'
import logo from '@/assets/img/logoWhite.png'

import '@/admin/assets/css/admin.css'

const FLAG_SIZE = 22

const AdminShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, adminLoaded } = useAdminContext()
  const isSignIn = location.pathname.endsWith('/sign-in')
  const [lang, setLang] = useState(helper.getLanguage(langHelper.getLanguage()))
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!adminLoaded || isSignIn) {
      return
    }
    if (!admin) {
      navigate('/admin/sign-in', { replace: true })
    }
  }, [admin, adminLoaded, isSignIn, navigate])

  useEffect(() => {
    if (!admin) {
      return
    }
    const language = admin.language || langHelper.getLanguage()
    if (admin.language) {
      UserService.setLanguage(admin.language)
    }
    langHelper.setLanguage(strings, language)
    langHelper.setLanguage(commonStrings, language)
    setLang(helper.getLanguage(language))
  }, [admin])

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

  const onLanguageSelect = async (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(null)
    const { code } = event.currentTarget.dataset
    if (!code || !admin._id) {
      return
    }

    const currentLang = UserService.getLanguage()
    setLang(helper.getLanguage(code))

    try {
      const status = await AdminAuthService.updateLanguage({
        id: admin._id,
        language: code,
      })
      if (status !== 200) {
        toast(commonStrings.CHANGE_LANGUAGE_ERROR, { type: 'error' })
        return
      }
      UserService.setLanguage(code)
      if (code !== currentLang) {
        navigate(0)
      }
    } catch {
      toast(commonStrings.CHANGE_LANGUAGE_ERROR, { type: 'error' })
    }
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
          <NavLink to="/admin/agency-payments" className={({ isActive }) => (isActive ? 'active' : '')}>
            <PaymentsOutlined />
            <span>{strings.AGENCY_PAYMENTS}</span>
          </NavLink>
          <NavLink to="/admin/agency-logins" className={({ isActive }) => (isActive ? 'active' : '')}>
            <VpnKeyOutlined />
            <span>{strings.AGENCY_LOGINS}</span>
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
          <div className="admin-topbar-actions">
            <Button
              variant="contained"
              onClick={(event) => setLangAnchorEl(event.currentTarget)}
              disableElevation
              className="admin-lang-btn"
              aria-label={strings.LANGUAGE}
            >
              <span className="language">
                <CircleFlag
                  countryCode={(lang?.countryCode || 'fr')}
                  height={FLAG_SIZE}
                  className="flag"
                  title={lang?.label}
                />
              </span>
            </Button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <MessengerWidget axiosInstance={adminAxiosInstance} currentUser={admin} mode="admin" theme="dark" />
      </div>

      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        className="menu admin-lang-menu"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { className: 'admin-lang-menu-paper' },
        }}
      >
        {env._LANGUAGES.map((language) => (
          <MenuItem onClick={onLanguageSelect} data-code={language.code} key={language.code}>
            <div className="language">
              <CircleFlag countryCode={language.countryCode} height={FLAG_SIZE} className="flag" title={language.label} />
              <span>{language.label}</span>
            </div>
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

const AdminLayout = () => <AdminShell />

export default AdminLayout
