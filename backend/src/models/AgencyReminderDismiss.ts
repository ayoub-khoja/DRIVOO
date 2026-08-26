import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

/**
 * Soft-dismissed synthetic fleet reminder keys (insurance, oil, mileage…).
 * Manual reminders are deleted from AgencyReminder instead.
 */
const agencyReminderDismissSchema = new Schema<env.AgencyReminderDismiss>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyReminderDismiss',
  },
)

agencyReminderDismissSchema.index(
  { agency: 1, key: 1 },
  { name: 'agency_reminder_dismiss_unique', unique: true },
)

const AgencyReminderDismiss = model<env.AgencyReminderDismiss>(
  'AgencyReminderDismiss',
  agencyReminderDismissSchema,
)

export default AgencyReminderDismiss
