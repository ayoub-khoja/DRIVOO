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
    <div className="agency-page">
      <section className="agency-hero">
        <div className="agency-hero-copy">
          <p className="agency-kicker">{strings.NOTIFICATIONS}</p>
          <h2>{strings.NOTIFICATIONS}</h2>
        </div>
      </section>
      <NotificationContext.Provider value={value}>
        <NotificationList user={agency || undefined} />
      </NotificationContext.Provider>
    </div>
  )
}

export default AgencyNotifications
