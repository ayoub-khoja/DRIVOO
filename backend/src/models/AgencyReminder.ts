import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const MODULES = ['maintenance', 'documents', 'mileage', 'contracts'] as const
const SEVERITIES = ['critical', 'warning', 'info', 'ok'] as const

const agencyReminderSchema = new Schema<env.AgencyReminderDoc>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    module: {
      type: String,
      required: true,
      enum: MODULES,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      default: 'custom',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    detail: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    vehicleLabel: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
    },
    dueDate: {
      type: Date,
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: 'info',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyReminder',
  },
)

agencyReminderSchema.index({ agency: 1, createdAt: -1 })

const AgencyReminder = model<env.AgencyReminderDoc>('AgencyReminder', agencyReminderSchema)

export default AgencyReminder
