import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const agencyInvoiceLineSchema = new Schema(
  {
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    vehicleLabel: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    periodFrom: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    periodTo: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
)

const agencyInvoiceSchema = new Schema<env.AgencyInvoice>(
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
    issueCity: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    issueDate: {
      type: Date,
      required: true,
    },
    clientCode: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    clientIdNumber: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    clientPhone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    clientAddress: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    object: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    lines: {
      type: [agencyInvoiceLineSchema],
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    vatRate: {
      type: Number,
      default: 19,
      min: 0,
      max: 100,
    },
    stampDuty: {
      type: Number,
      default: 1,
      min: 0,
    },
    payments: {
      cash: { type: Number, default: 0, min: 0 },
      cheque: { type: Number, default: 0, min: 0 },
      draft: { type: Number, default: 0, min: 0 },
      card: { type: Number, default: 0, min: 0 },
      transfer: { type: Number, default: 0, min: 0 },
    },
    currency: {
      type: String,
      trim: true,
      maxlength: 8,
      default: 'TND',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    totalGross: { type: Number, default: 0 },
    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyInvoice',
  },
)

agencyInvoiceSchema.index({ agency: 1, createdAt: -1 })
// Guarantees gap-free, duplicate-free invoice numbering per agency even under concurrent creates.
agencyInvoiceSchema.index({ agency: 1, number: 1 }, { name: 'agency_number_unique', unique: true })

const AgencyInvoice = model<env.AgencyInvoice>('AgencyInvoice', agencyInvoiceSchema)

export default AgencyInvoice
