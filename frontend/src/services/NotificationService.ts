import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import agencyAxiosInstance from '@/agency/services/agencyAxios'
import env from '@/config/env.config'

const notificationClient = () => (
  window.location.pathname.startsWith('/agency') ? agencyAxiosInstance : axiosInstance
)

/**
 * Get NotificationCounter by UserID.
 *
 * @param {string} userId
 * @returns {Promise<bookcarsTypes.NotificationCounter>}
 */
export const getNotificationCounter = (userId: string): Promise<bookcarsTypes.NotificationCounter> => (
  notificationClient()
    .get(
      `/api/notification-counter/${encodeURIComponent(userId)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
)

/**
 * Mark Notifications as read.
 *
 * @param {string} userId
 * @param {string[]} ids
 * @returns {Promise<number>}
 */
export const markAsRead = (userId: string, ids: string[]): Promise<number> => (
  notificationClient()
    .post(
      `/api/mark-Notifications-as-read/${encodeURIComponent(userId)}`,
      { ids },
      { withCredentials: true }
    )
    .then((res) => res.status)
)

/**
 * Mark Notifications as unread.
 *
 * @param {string} userId
 * @param {string[]} ids
 * @returns {Promise<number>}
 */
export const markAsUnread = (userId: string, ids: string[]): Promise<number> => (
  notificationClient()
    .post(
`/api/mark-Notifications-as-unread/${encodeURIComponent(userId)}`,
      { ids },
      { withCredentials: true }
    )
    .then((res) => res.status)
)

/**
 * Delete Notifications.
 *
 * @param {string} userId
 * @param {string[]} ids
 * @returns {Promise<number>}
 */
export const deleteNotifications = (userId: string, ids: string[]): Promise<number> => (
  notificationClient()
    .post(
      `/api/delete-Notifications/${encodeURIComponent(userId)}`,
      { ids },
      { withCredentials: true }
)
    .then((res) => res.status)
)

/**
 * Get Notifications.
 *
 * @param {string} userId
 * @param {number} page
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Notification>>}
 */
export const getNotifications = (userId: string, page: number): Promise<bookcarsTypes.Result<bookcarsTypes.Notification>> => (
  notificationClient()
    .get(
      `/api/Notifications/${encodeURIComponent(userId)}/${page}/${env.PAGE_SIZE}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
)
