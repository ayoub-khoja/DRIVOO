import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Popover,
} from '@mui/material'
import { NotificationsOutlined } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS, arTN, es, it, de } from 'date-fns/locale'
import { toast } from 'react-toastify'
import { CircleFlag } from 'react-circle-flags'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { strings as commonStrings } from '@/lang/common'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import { resolveLogoUrl } from '@/agency/services/AgencyProfileService'
import * as NotificationService from '@/services/NotificationService'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import * as langHelper from '@/utils/langHelper'

const FLAG_SIZE = 22
const PREVIEW_LIMIT = 6

const dateLocaleMap = {
  fr,
  en: enUS,
  ar: arTN,
  es,
  it,
  de,
} as const

const AgencyTopbar = () => {
  const navigate = useNavigate()
  const { agency } = useAgencyContext()
  const [lang, setLang] = useState(helper.getLanguage(langHelper.getLanguage()))
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<bookcarsTypes.Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)

  const logoUrl = resolveLogoUrl(agency?.avatar)
  const initial = (agency?.fullName || 'A').trim().charAt(0).toUpperCase()
  const language = langHelper.getLanguage()
  const dateLocale = dateLocaleMap[language as keyof typeof dateLocaleMap] || fr

  useEffect(() => {
    setLang(helper.getLanguage(language))
    langHelper.setLanguage(strings, language)
  }, [language])

  useEffect(() => {
    const userId = agency?._id
    if (!userId) {
      return
    }

    const loadCounter = () => {
      NotificationService.getNotificationCounter(userId)
        .then((counter) => setNotificationCount(counter.count || 0))
        .catch(() => setNotificationCount(0))
    }

    loadCounter()
    const onFocus = () => loadCounter()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [agency?._id])

  const loadNotifications = useCallback(async () => {
    if (!agency?._id) {
      return
    }
    try {
      setNotifLoading(true)
      const data = await NotificationService.getNotifications(agency._id, 1)
      const page = data && data.length > 0 ? data[0] : null
      const rows = page?.resultData || []
      setNotifications(rows.slice(0, PREVIEW_LIMIT))
    } catch {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }, [agency?._id])

  const openNotifications = async (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget)
    await loadNotifications()
  }

  const closeNotifications = () => setNotifAnchorEl(null)

  const handleViewAll = () => {
    closeNotifications()
    navigate('/agency/notifications')
  }

  const handleNotificationClick = async (notification: bookcarsTypes.Notification) => {
    if (!agency?._id) {
      return
    }

    try {
      if (!notification.isRead) {
        const status = await NotificationService.markAsRead(agency._id, [notification._id])
        if (status === 200) {
          setNotifications((prev) => prev.map((item) => (
            item._id === notification._id ? { ...item, isRead: true } : item
          )))
          setNotificationCount((prev) => Math.max(0, prev - 1))
        }
      }

      closeNotifications()

      if (notification.booking) {
        navigate('/agency/bookings')
        return
      }

      navigate('/agency/notifications')
    } catch (err) {
      helper.error(err)
    }
  }

  const onLanguageSelect = async (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(null)
    const { code } = event.currentTarget.dataset
    if (!code || !agency?._id) {
      return
    }

    const currentLang = UserService.getLanguage()
    setLang(helper.getLanguage(code))

    try {
      const status = await AgencyAuthService.updateLanguage({
        id: agency._id,
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

  if (!agency) {
    return null
  }

  const notifOpen = Boolean(notifAnchorEl)

  return (
    <header className="agency-topbar">
      <div className="agency-topbar-identity">
        <div className="agency-topbar-logo" aria-hidden={!logoUrl}>
          {logoUrl ? (
            <img src={logoUrl} alt={agency.fullName} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="agency-topbar-copy">
          <p className="agency-kicker">{strings.WELCOME}</p>
          <div className="agency-topbar-name-row">
            <h1>{agency.fullName}</h1>
            <span className={`agency-status-chip ${agency.agencyApproved === false ? 'is-pending' : 'is-live'}`}>
              {agency.agencyApproved === false ? strings.STATUS_PENDING : strings.STATUS_LIVE}
            </span>
          </div>
        </div>
      </div>

      <div className="agency-topbar-actions">
        <Button
          variant="contained"
          onClick={(event) => setLangAnchorEl(event.currentTarget)}
          disableElevation
          className="agency-lang-btn"
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
        <IconButton
          className="agency-notif-btn"
          aria-label={strings.NOTIFICATIONS}
          aria-haspopup="true"
          aria-expanded={notifOpen}
          onClick={openNotifications}
        >
          <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
      </div>

      <Popover
        open={notifOpen}
        anchorEl={notifAnchorEl}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { className: 'agency-notif-popover' },
        }}
      >
        <div className="agency-notif-popover-header">
          <h3>{strings.NOTIFICATIONS}</h3>
          {notificationCount > 0 && (
            <span className="agency-notif-popover-count">{notificationCount}</span>
          )}
        </div>

        <div className="agency-notif-popover-list">
          {notifLoading && (
            <div className="agency-notif-popover-state">
              <CircularProgress size={22} />
            </div>
          )}

          {!notifLoading && notifications.length === 0 && (
            <div className="agency-notif-popover-state agency-notif-popover-empty">
              {strings.NOTIFICATIONS_EMPTY}
            </div>
          )}

          {!notifLoading && notifications.map((notification) => {
            const unread = !notification.isRead
            const createdAt = notification.createdAt
              ? formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: dateLocale,
              })
              : ''

            return (
              <button
                key={notification._id}
                type="button"
                className={`agency-notif-item${unread ? ' is-unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="agency-notif-item-dot" aria-hidden />
                <span className="agency-notif-item-body">
                  <span className="agency-notif-item-message">{notification.message}</span>
                  <span className="agency-notif-item-meta">
                    <span className={`agency-notif-status ${unread ? 'is-unread' : 'is-read'}`}>
                      {unread ? strings.NOTIFICATIONS_UNREAD : strings.NOTIFICATIONS_READ}
                    </span>
                    {createdAt && <span className="agency-notif-item-date">{createdAt}</span>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="agency-notif-popover-footer">
          <Button fullWidth disableElevation onClick={handleViewAll}>
            {strings.NOTIFICATIONS_VIEW_ALL}
          </Button>
        </div>
      </Popover>

      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        className="menu agency-lang-menu"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { className: 'agency-lang-menu-paper' },
        }}
      >
        {env._LANGUAGES.map((languageOption) => (
          <MenuItem onClick={onLanguageSelect} data-code={languageOption.code} key={languageOption.code}>
            <div className="language">
              <CircleFlag countryCode={languageOption.countryCode} height={FLAG_SIZE} className="flag" title={languageOption.label} />
              <span>{languageOption.label}</span>
            </div>
          </MenuItem>
        ))}
      </Menu>
    </header>
  )
}

export default AgencyTopbar
