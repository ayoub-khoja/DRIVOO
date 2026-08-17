import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const getReviews = (): Promise<bookcarsTypes.AgencyReviewList> =>
  agencyAxiosInstance
    .get('/api/agency/reviews')
    .then((res) => res.data)

export const moderateReview = (
  id: string,
  payload: bookcarsTypes.ModerateAgencyReviewPayload,
): Promise<bookcarsTypes.AgencyReview> =>
  agencyAxiosInstance
    .put(`/api/agency/reviews/${id}`, payload)
    .then((res) => res.data)
