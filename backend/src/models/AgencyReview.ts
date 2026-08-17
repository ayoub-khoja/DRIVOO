import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const agencyReviewSchema = new Schema<env.AgencyReview>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyReview',
  },
)

agencyReviewSchema.index({ agency: 1, createdAt: -1 })
agencyReviewSchema.index(
  { agency: 1, email: 1 },
  {
    name: 'agency_email_unique',
    unique: true,
    partialFilterExpression: { email: { $exists: true, $gt: '' } },
  },
)

const AgencyReview = model<env.AgencyReview>('AgencyReview', agencyReviewSchema)

export default AgencyReview
