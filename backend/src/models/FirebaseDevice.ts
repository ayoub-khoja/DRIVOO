import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

const firebaseDeviceSchema = new Schema<env.FirebaseDevice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    token: {
      type: String,
      required: [true, "can't be blank"],
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: Object.values(bookcarsTypes.FcmDevicePlatform),
      required: [true, "can't be blank"],
      index: true,
    },
    browser: {
      type: String,
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    environment: {
      type: String,
      required: [true, "can't be blank"],
      default: env.FIREBASE_ENVIRONMENT,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'FirebaseDevice',
  },
)

firebaseDeviceSchema.index({ user: 1, isActive: 1, environment: 1 })

const FirebaseDevice = model<env.FirebaseDevice>('FirebaseDevice', firebaseDeviceSchema)

export default FirebaseDevice
