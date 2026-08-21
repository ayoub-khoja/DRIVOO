import React, { useMemo, useState } from 'react'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import NotificationList from '@/components/NotificationList'
import { NotificationContext } from '@/context/NotificationContext'

const AgencyNotifications = () => {
  const { agency } = useAgencyContext()
  const [notificationCount, setNotificationCount] = useState(0)
  const value = useMemo(() => ({ notificationCount, setNotificationCount }), [notificationCount])

  return (
    <div className="agency-page agency-notifications-page">
      <div className="agency-page-head">
        <h2>{strings.NOTIFICATIONS}</h2>
        <p>{strings.NOTIFICATIONS_SUBTITLE}</p>
      </div>
      <NotificationContext.Provider value={value}>
        <div className="agency-notifications-panel">
          <NotificationList user={agency || undefined} />
        </div>
      </NotificationContext.Provider>
    </div>
  )
}

export default AgencyNotifications
