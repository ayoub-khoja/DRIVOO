import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const subscriptionDiscountSchema = new Schema<env.SubscriptionDiscount>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'SubscriptionDiscount',
  },
)

subscriptionDiscountSchema.index({ active: 1, name: 1 })

const SubscriptionDiscount = model<env.SubscriptionDiscount>('SubscriptionDiscount', subscriptionDiscountSchema)

export default SubscriptionDiscount
