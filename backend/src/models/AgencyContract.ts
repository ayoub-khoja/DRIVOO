import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

/** Driver / co-driver identity block, as printed on the rental contract. */
const partySchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    birthDate: { type: String, trim: true, maxlength: 32 },
    idNumber: { type: String, trim: true, maxlength: 40 },
    nationality: { type: String, trim: true, maxlength: 60 },
    licenseNumber: { type: String, trim: true, maxlength: 40 },
    licenseIssuedAt: { type: String, trim: true, maxlength: 32 },
    address: { type: String, trim: true, maxlength: 240 },
    phone: { type: String, trim: true, maxlength: 32 },
  },
  { _id: false },
)

const supplementSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 160 },
    priceHT: { type: Number, required: true, min: 0 },
    vatRate: { type: Number, default: 19, min: 0, max: 100 },
    priceTTC: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const paymentSchema = new Schema(
  {
    date: { type: String, trim: true, maxlength: 32 },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true, maxlength: 40 },
    status: { type: String, trim: true, maxlength: 40 },
    balance: { type: Number, min: 0 },
  },
  { _id: false },
)

const checkSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 40 },
    ok: { type: Boolean, default: true },
  },
  { _id: false },
)

const agencyContractSchema = new Schema<env.AgencyContract>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    issueCity: { type: String, trim: true, maxlength: 80, default: '' },
    issueDate: { type: Date, required: true },

    // Vehicle
    vehicleModel: { type: String, required: true, trim: true, maxlength: 120 },
    vehiclePlate: { type: String, required: true, trim: true, maxlength: 40 },
    vehicleCategory: { type: String, trim: true, maxlength: 60 },
    vehicleFuel: { type: String, trim: true, maxlength: 40 },

    // Parties
    driver: { type: partySchema, required: true },
    secondDriver: { type: partySchema },

    // Rental window
    departureDate: { type: Date, required: true },
    departurePlace: { type: String, trim: true, maxlength: 160, default: '' },
    departureKm: { type: Number, default: 0, min: 0 },
    departureFuel: { type: String, trim: true, maxlength: 40 },
    returnDate: { type: Date, required: true },
    returnPlace: { type: String, trim: true, maxlength: 160, default: '' },
    returnKm: { type: Number, min: 0 },
    returnFuel: { type: String, trim: true, maxlength: 40 },

    // Mileage and excess pricing
    kmLimitPerDay: { type: Number, min: 0 },
    extraKmPrice: { type: Number, min: 0 },
    extraHourPrice: { type: Number, min: 0 },
    extraDayPrice: { type: Number, min: 0 },

    // Money
    deposit: { type: Number, default: 0, min: 0 },
    depositReason: { type: String, trim: true, maxlength: 240 },
    vatRate: { type: Number, default: 19, min: 0, max: 100 },
    supplements: { type: [supplementSchema], default: [] },
    payments: { type: [paymentSchema], default: [] },
    checklist: { type: [checkSchema], default: [] },
    currency: { type: String, trim: true, maxlength: 8, default: 'TND' },
    notes: { type: String, trim: true, maxlength: 500 },

    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AgencyContract',
  },
)

agencyContractSchema.index({ agency: 1, createdAt: -1 })
// Same guarantee as invoices: sequential, duplicate-free numbering per agency.
agencyContractSchema.index({ agency: 1, number: 1 }, { name: 'agency_contract_number_unique', unique: true })

const AgencyContract = model<env.AgencyContract>('AgencyContract', agencyContractSchema)

export default AgencyContract
