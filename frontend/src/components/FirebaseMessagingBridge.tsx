import { AxiosInstance } from 'axios'
import useFirebaseMessaging from '@/hooks/useFirebaseMessaging'

type FirebaseMessagingBridgeProps = {
  enabled: boolean
  axiosInstance: AxiosInstance
}

const FirebaseMessagingBridge = ({ enabled, axiosInstance }: FirebaseMessagingBridgeProps) => {
  useFirebaseMessaging({ enabled, axiosInstance })
  return null
}

export default FirebaseMessagingBridge
