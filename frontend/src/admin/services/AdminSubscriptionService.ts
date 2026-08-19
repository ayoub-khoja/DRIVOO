import * as bookcarsTypes from ':bookcars-types'
import adminAxiosInstance from '../services/adminAxios'

export const getPlans = (): Promise<bookcarsTypes.SubscriptionPlan[]> =>
  adminAxiosInstance.get('/api/admin/subscription-plans').then((res) => res.data)

export const createPlan = (
  data: bookcarsTypes.UpsertSubscriptionPlanPayload,
): Promise<bookcarsTypes.SubscriptionPlan> =>
  adminAxiosInstance.post('/api/admin/subscription-plans', data).then((res) => res.data)

export const updatePlan = (
  id: string,
  data: bookcarsTypes.UpsertSubscriptionPlanPayload,
): Promise<bookcarsTypes.SubscriptionPlan> =>
  adminAxiosInstance.put(`/api/admin/subscription-plans/${encodeURIComponent(id)}`, data).then((res) => res.data)

export const deletePlan = (id: string): Promise<number> =>
  adminAxiosInstance.delete(`/api/admin/subscription-plans/${encodeURIComponent(id)}`).then((res) => res.status)

export const getDiscounts = (): Promise<bookcarsTypes.SubscriptionDiscount[]> =>
  adminAxiosInstance.get('/api/admin/subscription-discounts').then((res) => res.data)

export const createDiscount = (
  data: bookcarsTypes.UpsertSubscriptionDiscountPayload,
): Promise<bookcarsTypes.SubscriptionDiscount> =>
  adminAxiosInstance.post('/api/admin/subscription-discounts', data).then((res) => res.data)

export const updateDiscount = (
  id: string,
  data: bookcarsTypes.UpsertSubscriptionDiscountPayload,
): Promise<bookcarsTypes.SubscriptionDiscount> =>
  adminAxiosInstance.put(`/api/admin/subscription-discounts/${encodeURIComponent(id)}`, data).then((res) => res.data)

export const deleteDiscount = (id: string): Promise<number> =>
  adminAxiosInstance.delete(`/api/admin/subscription-discounts/${encodeURIComponent(id)}`).then((res) => res.status)
