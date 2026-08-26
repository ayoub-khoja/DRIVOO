import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'cheque'] as const

const agencyReceiptSchema = new Schema<env.AgencyReceipt>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    clientEmail: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    clientPhone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    vehicleLabel: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      maxlength: 8,
      default: 'TND',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: PAYMENT_METHODS,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyReceipt',
  },
)

agencyReceiptSchema.index({ agency: 1, createdAt: -1 })
// Same guarantee as invoices/contracts: sequential, duplicate-free numbering per agency.
agencyReceiptSchema.index({ agency: 1, number: 1 }, { name: 'agency_receipt_number_unique', unique: true })

const AgencyReceipt = model<env.AgencyReceipt>('AgencyReceipt', agencyReceiptSchema)

export default AgencyReceipt
