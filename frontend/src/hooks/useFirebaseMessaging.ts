import { useCallback, useEffect, useRef, useState } from 'react'
import { AxiosInstance } from 'axios'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import * as FcmDeviceService from '@/services/FcmDeviceService'
import { NotificationPermissionDeniedError } from '@/lib/firebase/errors'
import { logError, logWarn } from '@/lib/firebase/log'

type UseFirebaseMessagingOptions = {
  enabled: boolean
  axiosInstance: AxiosInstance
  onForegroundMessage?: (payload: bookcarsTypes.FirebaseMessagePayload) => void
}

const resolveEnvironment = (): bookcarsTypes.FirebaseEnvironment => {
  const value = String(import.meta.env.VITE_NODE_ENV || (env.isProduction ? 'production' : 'development')).toLowerCase()
  if (value === bookcarsTypes.FirebaseEnvironment.Staging) {
    return bookcarsTypes.FirebaseEnvironment.Staging
  }
  if (value === bookcarsTypes.FirebaseEnvironment.Production) {
    return bookcarsTypes.FirebaseEnvironment.Production
  }
  return bookcarsTypes.FirebaseEnvironment.Development
}

const useFirebaseMessaging = ({ enabled, axiosInstance, onForegroundMessage }: UseFirebaseMessagingOptions) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'default' : Notification.permission,
  )
  const [token, setToken] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const registerCurrentDevice = useCallback(async () => {
    try {
      const messaging = await import('@/lib/firebase/messaging')
      const fcmToken = await messaging.getFCMToken()
      if (!fcmToken) {
        return null
      }

      await FcmDeviceService.registerFcmDevice(axiosInstance, {
        token: fcmToken,
        environment: resolveEnvironment(),
        ...messaging.detectWebDeviceMeta(),
      })
      setToken(fcmToken)
      setPermission('granted')
      return fcmToken
    } catch (error) {
      if (error instanceof NotificationPermissionDeniedError) {
        setPermission('denied')
        return null
      }
      logError('Failed to register FCM device', error)
      return null
    }
  }, [axiosInstance])

  const enablePush = useCallback(async () => {
    try {
      const messaging = await import('@/lib/firebase/messaging')
      const nextPermission = await messaging.requestNotificationPermission()
      setPermission(nextPermission)
      if (nextPermission !== 'granted') {
        return null
      }
      return registerCurrentDevice()
    } catch (error) {
      logWarn('Push permission request failed', error)
      return null
    }
  }, [registerCurrentDevice])

  useEffect(() => {
    let cancelled = false

    const setup = async () => {
      const messaging = await import('@/lib/firebase/messaging')
      const canUseMessaging = await messaging.isMessagingSupported()
      if (cancelled) {
        return
      }
      setSupported(canUseMessaging)
      if (!enabled || !canUseMessaging) {
        return
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await messaging.requestNotificationPermission()
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        await registerCurrentDevice()
      }

      unsubscribeRef.current = await messaging.subscribeToForegroundMessages((payload) => {
        onForegroundMessage?.(payload)
      })
    }

    setup().catch((error) => logError('Failed to initialize Firebase messaging', error))

    return () => {
      cancelled = true
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [enabled, onForegroundMessage, registerCurrentDevice])

  return {
    supported,
    permission,
    token,
    enablePush,
  }
}

export default useFirebaseMessaging
