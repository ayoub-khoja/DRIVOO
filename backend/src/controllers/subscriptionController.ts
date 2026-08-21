import { nanoid } from 'nanoid'
import { Request, Response } from 'express'
import i18n from '../lang/i18n'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import SubscriptionPlan from '../models/SubscriptionPlan'
import SubscriptionDiscount from '../models/SubscriptionDiscount'

type LocalizedText = { fr: string, en: string, ar: string }
type PlanPricing = { months: number, monthlyPrice: number, totalPrice: number, discountPercent: number }
type PlanFeature = { id: string, label: LocalizedText, included: boolean }
type PlanPayload = {
  visible?: boolean
  name?: LocalizedText | Record<string, unknown>
  subtitle?: LocalizedText | Record<string, unknown>
  tokens?: number
  freeTokens?: number
  trialMonths?: number
  pricing?: PlanPricing[]
  freePlan?: boolean
  mostPopular?: boolean
  firstTrialFree?: boolean
  active?: boolean
  visibleVerified?: boolean
  visibleUnverified?: boolean
  showPaymentButton?: boolean
  unlimitedDuration?: boolean
  requiresApproval?: boolean
  discountId?: string | null
  features?: PlanFeature[]
  services?: string[]
}
type DiscountPayload = { name?: string, percent?: number, active?: boolean }

const ALLOWED_MONTHS = [3, 6, 12]
const MAX_FEATURES = 30
const MAX_SERVICES = 40

const clip = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)

const toLocalized = (value: unknown, max = 120): LocalizedText => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    fr: clip(source.fr, max),
    en: clip(source.en, max),
    ar: clip(source.ar, max),
  }
}

const toNumber = (value: unknown, min = 0, max = 1_000_000) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return min
  }
  return Math.min(max, Math.max(min, parsed))
}

const toBool = (value: unknown) => value === true

const sanitizePricing = (value: unknown): PlanPricing[] => {
  const rows = Array.isArray(value) ? value : []
  return ALLOWED_MONTHS.map((months) => {
    const row = rows.find((item) => Number((item as { months?: number })?.months) === months) as Record<string, unknown> | undefined
    return {
      months,
      monthlyPrice: toNumber(row?.monthlyPrice, 0, 1_000_000),
      totalPrice: toNumber(row?.totalPrice, 0, 1_000_000),
      discountPercent: toNumber(row?.discountPercent, 0, 100),
    }
  })
}

const sanitizeFeatures = (value: unknown): PlanFeature[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.slice(0, MAX_FEATURES).map((item) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      id: clip(row.id, 24) || nanoid(10),
      label: toLocalized(row.label, 160),
      included: row.included !== false,
    }
  })
}

const sanitizeServices = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }
  return [...new Set(value.map((item) => clip(item, 64)).filter(Boolean))].slice(0, MAX_SERVICES)
}

const sanitizePlan = (body: PlanPayload) => {
  const name = toLocalized(body.name)
  if (name.fr.length < 2 && name.en.length < 2 && name.ar.length < 2) {
    return null
  }

  const discountId = body.discountId && helper.isValidObjectId(String(body.discountId))
    ? String(body.discountId)
    : null

  return {
    visible: body.visible !== false,
    name,
    subtitle: toLocalized(body.subtitle, 180),
    tokens: toNumber(body.tokens, 0, 1_000_000),
    freeTokens: toNumber(body.freeTokens, 0, 1_000_000),
    trialMonths: toNumber(body.trialMonths, 0, 36),
    pricing: sanitizePricing(body.pricing),
    freePlan: toBool(body.freePlan),
    mostPopular: toBool(body.mostPopular),
    firstTrialFree: toBool(body.firstTrialFree),
    active: body.active !== false,
    visibleVerified: body.visibleVerified !== false,
    visibleUnverified: body.visibleUnverified !== false,
    showPaymentButton: body.showPaymentButton !== false,
    unlimitedDuration: toBool(body.unlimitedDuration),
    requiresApproval: toBool(body.requiresApproval),
    discountId,
    features: sanitizeFeatures(body.features),
    services: sanitizeServices(body.services),
  }
}

export const getPublicPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find(
      { active: true, visible: true },
      {
        name: 1,
        subtitle: 1,
        tokens: 1,
        freeTokens: 1,
        trialMonths: 1,
        pricing: 1,
        freePlan: 1,
        mostPopular: 1,
        firstTrialFree: 1,
        unlimitedDuration: 1,
        features: 1,
        services: 1,
        showPaymentButton: 1,
      },
    )
      .sort({ mostPopular: -1, createdAt: -1 })
      .lean()
    res.json(plans)
  } catch (err) {
    logger.error(`[subscription.getPublicPlans] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const getPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 }).lean()
    res.json(plans)
  } catch (err) {
    logger.error(`[subscription.getPlans] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const createPlan = async (req: Request, res: Response) => {
  const { body }: { body: PlanPayload } = req
  try {
    const payload = sanitizePlan(body)
    if (!payload) {
      res.status(400).send('Invalid plan name')
      return
    }
    const plan = await SubscriptionPlan.create(payload)
    res.status(200).json(plan)
  } catch (err) {
    logger.error(`[subscription.createPlan] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const updatePlan = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: PlanPayload } = req
  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('id is not valid')
    }
    const payload = sanitizePlan(body)
    if (!payload) {
      res.status(400).send('Invalid plan name')
      return
    }
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, payload, { new: true })
    if (!plan) {
      res.sendStatus(204)
      return
    }
    res.status(200).json(plan)
  } catch (err) {
    logger.error(`[subscription.updatePlan] ${i18n.t('ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const deletePlan = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('id is not valid')
    }
    const plan = await SubscriptionPlan.findByIdAndDelete(id)
    res.sendStatus(plan ? 200 : 204)
  } catch (err) {
    logger.error(`[subscription.deletePlan] ${i18n.t('ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const getDiscounts = async (_req: Request, res: Response) => {
  try {
    const discounts = await SubscriptionDiscount.find().sort({ createdAt: -1 }).lean()
    res.json(discounts)
  } catch (err) {
    logger.error(`[subscription.getDiscounts] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const createDiscount = async (req: Request, res: Response) => {
  const { body }: { body: DiscountPayload } = req
  try {
    const name = clip(body.name, 80)
    if (name.length < 2) {
      res.status(400).send('Invalid discount name')
      return
    }
    const discount = await SubscriptionDiscount.create({
      name,
      percent: toNumber(body.percent, 0, 100),
      active: body.active !== false,
    })
    res.status(200).json(discount)
  } catch (err) {
    logger.error(`[subscription.createDiscount] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const updateDiscount = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: DiscountPayload } = req
  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('id is not valid')
    }
    const name = clip(body.name, 80)
    if (name.length < 2) {
      res.status(400).send('Invalid discount name')
      return
    }
    const discount = await SubscriptionDiscount.findByIdAndUpdate(
      id,
      {
        name,
        percent: toNumber(body.percent, 0, 100),
        active: body.active !== false,
      },
      { new: true },
    )
    if (!discount) {
      res.sendStatus(204)
      return
    }
    res.status(200).json(discount)
  } catch (err) {
    logger.error(`[subscription.updateDiscount] ${i18n.t('ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const deleteDiscount = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('id is not valid')
    }
    await SubscriptionPlan.updateMany({ discountId: id }, { $set: { discountId: null } })
    const discount = await SubscriptionDiscount.findByIdAndDelete(id)
    res.sendStatus(discount ? 200 : 204)
  } catch (err) {
    logger.error(`[subscription.deleteDiscount] ${i18n.t('ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
