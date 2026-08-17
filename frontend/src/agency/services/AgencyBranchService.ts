import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const getSubAgencies = (
  keyword: string,
  page: number,
  size: number,
): Promise<bookcarsTypes.Result<bookcarsTypes.SubAgency>> =>
  agencyAxiosInstance
    .get(`/api/agency/sub-agencies/${page}/${size}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const createSubAgency = (
  data: bookcarsTypes.CreateSubAgencyPayload,
): Promise<bookcarsTypes.SubAgency> =>
  agencyAxiosInstance
    .post('/api/agency/sub-agency', data)
    .then((res) => res.data)
