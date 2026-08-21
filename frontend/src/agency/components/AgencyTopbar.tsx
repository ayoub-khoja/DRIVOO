import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import { NotificationsOutlined } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { CircleFlag } from 'react-circle-flags'
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

const AgencyTopbar = () => {
  const navigate = useNavigate()
  const { agency } = useAgencyContext()
  const [lang, setLang] = useState(helper.getLanguage(langHelper.getLanguage()))
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  const logoUrl = resolveLogoUrl(agency?.avatar)
  const initial = (agency?.fullName || 'A').trim().charAt(0).toUpperCase()

  useEffect(() => {
    const language = langHelper.getLanguage()
    setLang(helper.getLanguage(language))
    langHelper.setLanguage(strings, language)
  }, [])

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
          onClick={() => navigate('/agency/notifications')}
        >
          <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
      </div>

      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        className="menu"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
    </header>
  )
}

export default AgencyTopbar
