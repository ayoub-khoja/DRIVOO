import axiosInstance from './axiosInstance'
import * as UserService from '@/services/UserService'

/**
 * Order item name max length 200 characters
 * https://developer.paypal.com/docs/api/invoicing/v2/#invoices_create!ct=application/json&path=items/name&t=request
 *
 * @type {200}
 */
export const ORDER_NAME_MAX_LENGTH = 200

/**
 * Order item description max length 1000 characters
 * https://developer.paypal.com/docs/api/invoicing/v2/#invoices_create!ct=application/json&path=items/description&t=request
 *
 * @type {1000}
 */
export const ORDER_DESCRIPTION_MAX_LENGTH = 1000

/**
 * Returns PayPal locale.
 *
 * @returns {string}
 */
export const getLocale = () => {
  const lang = UserService.getLanguage()

  switch (lang) {
    case 'fr':
      return 'fr_FR'
    case 'ar':
      return 'ar_EG'
    case 'es':
      return 'es_ES'
    case 'it':
      return 'it_IT'
    case 'de':
      return 'de_DE'
    default:
      return 'en_US'
  }
}

/**
 * Create PayPal order.
 *
 * @param {string} sessionId
 * @returns {Promise<number>}
 */
export const createOrder = (bookingId: string, amount: number, currency: string, name: string, description: string): Promise<string> =>
  axiosInstance
    .post(
      '/api/create-paypal-order/',
      {
        bookingId,
        amount,
        currency,
        name,
        description,
      }
    )
    .then((res) => res.data)

/**
 * Check PayPal order.
 *
 * @param {string} sessionId
 * @returns {Promise<number>}
 */
export const checkOrder = (bookingId: string, orderId: string): Promise<number> =>
  axiosInstance
    .post(
      `/api/check-paypal-order/${bookingId}/${orderId}`,
      null
    )
    .then((res) => res.status)
