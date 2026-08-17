import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

const publicPath = (slug: string, suffix = '') =>
  `/api/agency/public/${encodeURIComponent(slug)}${suffix}`

export const getPublicProfile = (slug: string): Promise<bookcarsTypes.PublicAgencyProfile> =>
  axiosInstance.get(publicPath(slug)).then((res) => res.data)

export const getPublicCars = (slug: string): Promise<bookcarsTypes.PublicAgencyCar[]> =>
  axiosInstance.get(publicPath(slug, '/cars')).then((res) => res.data)

export const getPublicReviews = (slug: string): Promise<bookcarsTypes.AgencyReviewList> =>
  axiosInstance.get(publicPath(slug, '/reviews')).then((res) => res.data)

export const createPublicReview = (
  slug: string,
  payload: bookcarsTypes.CreateAgencyReviewPayload,
): Promise<bookcarsTypes.AgencyReview> =>
  axiosInstance.post(publicPath(slug, '/reviews'), payload).then((res) => res.data)
