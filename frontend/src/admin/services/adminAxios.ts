import axios from 'axios'
import env from '@/config/env.config'

/**
 * Axios instance for the admin panel.
 * Sends X-BC-App so the backend uses the admin auth cookie
 * (required when admin and frontend share the same origin).
 */
const adminAxiosInstance = axios.create({
  baseURL: env.API_HOST,
  withCredentials: true,
  headers: {
    'x-bc-app': 'admin',
  },
})

export default adminAxiosInstance
