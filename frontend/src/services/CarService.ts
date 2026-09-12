import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get cars.
 *
 * @param {bookcarsTypes.GetCarsPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Car>>}
 */
export const getCars = (data: bookcarsTypes.GetCarsPayload, page: number, size: number): Promise<bookcarsTypes.Result<bookcarsTypes.Car>> =>
  axiosInstance
    .post(
      `/api/frontend-cars/${page}/${size}`,
      data
    ).then((res) => res.data)

/**
 * Get a Car by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.Car>}
 */
export const getCar = (id: string): Promise<bookcarsTypes.Car> =>
  axiosInstance
    .get(
      `/api/car/${encodeURIComponent(id)}/${UserService.getLanguage()}`
    )
    .then((res) => res.data)

export type ShowcaseCar = {
  _id: string
  name: string
  brand?: string
  model?: string
  image?: string
  range?: string
}

/**
 * Random available cars for the home about collage / fleet cards.
 * Pass an agency profile slug to pin the selection to one supplier.
 * Pass byRange to get one car for mini / midi / maxi.
 */
export const getShowcaseCars = (limit = 3, agencySlug = '', byRange = false): Promise<ShowcaseCar[]> => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (agencySlug) {
    params.set('agency', agencySlug)
  }
  if (byRange) {
    params.set('byRange', '1')
  }
  return axiosInstance
    .get(`/api/showcase-cars?${params.toString()}`)
    .then((res) => res.data)
}

/**
 * Get cars by agency and location.
 *
 * @param {string} keyword
 * @param {bookcarsTypes.GetBookingCarsPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Car[]>}
 */
export const getBookingCars = (keyword: string, data: bookcarsTypes.GetBookingCarsPayload, page: number, size: number): Promise<bookcarsTypes.Car[]> =>
  axiosInstance
    .post(
      `/api/booking-cars/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)
