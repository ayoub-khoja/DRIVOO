import { useCallback, useState } from 'react'
import { isMessagingSupported, requestNotificationPermission } from '@/lib/firebase/messaging'
import { logWarn } from '@/lib/firebase/log'

const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'default' : Notification.permission,
  )

  const requestPermission = useCallback(async () => {
    const supported = await isMessagingSupported()
    if (!supported) {
      return 'denied' as NotificationPermission
    }

    try {
      const nextPermission = await requestNotificationPermission()
      setPermission(nextPermission)
      return nextPermission
    } catch (error) {
      logWarn('Notification permission request failed', error)
      setPermission('denied')
      return 'denied' as NotificationPermission
    }
  }, [])

  return { permission, requestPermission }
}

export default useNotificationPermission
