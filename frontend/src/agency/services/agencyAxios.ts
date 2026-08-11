import axios from 'axios'
import env from '@/config/env.config'

const agencyAxiosInstance = axios.create({
  baseURL: env.API_HOST,
  withCredentials: true,
  headers: {
    'x-bc-app': 'agency',
  },
})

export default agencyAxiosInstance
