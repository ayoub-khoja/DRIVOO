import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const localizedTextSchema = new Schema<env.LocalizedText>(
  {
    fr: { type: String, default: '', trim: true, maxlength: 120 },
    en: { type: String, default: '', trim: true, maxlength: 120 },
    ar: { type: String, default: '', trim: true, maxlength: 120 },
  },
  { _id: false },
)

const pricingSchema = new Schema<env.SubscriptionPlanPricing>(
  {
    months: { type: Number, required: true, enum: [3, 6, 12] },
    monthlyPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
)

const featureSchema = new Schema<env.SubscriptionPlanFeature>(
  {
    id: { type: String, required: true },
    label: { type: localizedTextSchema, required: true },
    included: { type: Boolean, default: true },
  },
  { _id: false },
)

const subscriptionPlanSchema = new Schema<env.SubscriptionPlan>(
  {
    visible: { type: Boolean, default: true },
    name: { type: localizedTextSchema, required: true },
    subtitle: { type: localizedTextSchema, default: () => ({ fr: '', en: '', ar: '' }) },
    tokens: { type: Number, default: 0, min: 0 },
    freeTokens: { type: Number, default: 0, min: 0 },
    trialMonths: { type: Number, default: 0, min: 0, max: 36 },
    pricing: { type: [pricingSchema], default: [] },
    freePlan: { type: Boolean, default: false },
    mostPopular: { type: Boolean, default: false },
    firstTrialFree: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    visibleVerified: { type: Boolean, default: true },
    visibleUnverified: { type: Boolean, default: true },
    showPaymentButton: { type: Boolean, default: true },
    unlimitedDuration: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    discountId: { type: Schema.Types.ObjectId, ref: 'SubscriptionDiscount', default: null },
    features: { type: [featureSchema], default: [] },
    services: { type: [String], default: [] },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'SubscriptionPlan',
  },
)

subscriptionPlanSchema.index({ active: 1, createdAt: -1 })

const SubscriptionPlan = model<env.SubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema)

export default SubscriptionPlan
