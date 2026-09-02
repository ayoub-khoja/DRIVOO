import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'

const isKnownCurrency = (code: string) =>
  env.CURRENCIES.some((c) => c.code === code) || bookcarsHelper.checkCurrency(code)

/**
* Set currency.
*
* @param {string} currency
*/
export const setCurrency = (currency: string) => {
  const code = currency?.toUpperCase()
  if (code && isKnownCurrency(code)) {
    localStorage.setItem('bc-fe-currency', code)
  }
}

/**
 * Get currency.
 *
 * @returns {string}
 */
export const getCurrency = () => {
  const currency = localStorage.getItem('bc-fe-currency')
  if (currency) {
    const code = currency.toUpperCase()
    if (isKnownCurrency(code)) {
      return code
    }
  }
  return env.BASE_CURRENCY
}

/**
 * Return currency symbol.
 *
 * @param {string} code
 * @returns {string|undefined}
 */
export const getCurrencySymbol = () => env.CURRENCIES.find((c) => c.code === getCurrency())?.symbol || '$'

/**
 * Convert a price to a given currency.
 *
 * @async
 * @param {number} amount
 * @returns {Promise<number>}
 */
export const convertPrice = async (amount: number) => {
  const to = getCurrency()

  if (to !== env.BASE_CURRENCY) {
    const res = await bookcarsHelper.convertPrice(amount, env.BASE_CURRENCY, to)
    return res
  }

  return amount
}

/**
 * Convert a displayed price back to the base currency (for checkout payloads).
 * Skips FX conversion when the UI currency is already the base currency (e.g. TND).
 */
export const toBaseCurrency = async (amount: number) => {
  const from = getCurrency()
  if (from === env.BASE_CURRENCY) {
    return amount
  }
  return bookcarsHelper.convertPrice(amount, from, env.BASE_CURRENCY)
}

/**
 * Check if currency is written from right to left.
 *
 * @returns {*}
 */
export const currencyRTL = () => {
  const currencySymbol = getCurrencySymbol()
  const isRTL = bookcarsHelper.currencyRTL(currencySymbol)
  return isRTL
}
