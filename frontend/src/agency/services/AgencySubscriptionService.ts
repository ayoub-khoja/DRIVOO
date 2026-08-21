import * as bookcarsTypes from ':bookcars-types'
import agencyAxiosInstance from './agencyAxios'

export const getPublicPlans = (): Promise<bookcarsTypes.SubscriptionPlan[]> =>
  agencyAxiosInstance
    .get('/api/subscription-plans')
    .then((res) => (Array.isArray(res.data) ? res.data : []))

export const selectPlan = (planId: string): Promise<{ subscriptionPlan: string }> =>
  agencyAxiosInstance
    .put('/api/agency/subscription-plan', { planId })
    .then((res) => res.data)
