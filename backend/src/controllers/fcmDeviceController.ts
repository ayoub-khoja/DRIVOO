import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import FirebaseDevice from '../models/FirebaseDevice'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'

const PLATFORMS = new Set<string>(Object.values(bookcarsTypes.FcmDevicePlatform))

const clip = (value: unknown, max: number): string => String(value ?? '').trim().slice(0, max)

const toClientDevice = (device: env.FirebaseDevice) => ({
  _id: device._id.toString(),
  user: device.user.toString(),
  token: device.token,
  platform: device.platform,
  browser: device.browser,
  deviceName: device.deviceName,
  isActive: device.isActive,
  environment: device.environment,
  lastSeenAt: device.lastSeenAt,
  createdAt: device.createdAt,
  updatedAt: device.updatedAt,
})

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      res.status(401).send({ message: 'Unauthorized!' })
      return
    }

    const token = clip(req.body?.token, 4096)
    const platform = clip(req.body?.platform, 32)
    const browser = clip(req.body?.browser, 64) || undefined
    const deviceName = clip(req.body?.deviceName, 120) || undefined
    const environment = clip(req.body?.environment, 32) || env.FIREBASE_ENVIRONMENT

    if (!token || !PLATFORMS.has(platform)) {
      res.status(400).send({ message: 'Invalid FCM device payload' })
      return
    }

    const now = new Date()
    const device = await FirebaseDevice.findOneAndUpdate(
      { token },
      {
        $set: {
          user: userId,
          token,
          platform,
          browser,
          deviceName,
          environment,
          isActive: true,
          lastSeenAt: now,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
        returnDocument: 'after',
      },
    )

    if (!device) {
      res.status(400).send({ message: 'Unable to register FCM device' })
      return
    }

    res.status(200).json(toClientDevice(device))
  } catch (err) {
    logger.error(`[fcmDevice.registerDevice] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const listDevices = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      res.status(401).send({ message: 'Unauthorized!' })
      return
    }

    const devices = await FirebaseDevice.find({ user: userId }).sort({ updatedAt: -1 })
    res.status(200).json(devices.map((device) => toClientDevice(device)))
  } catch (err) {
    logger.error(`[fcmDevice.listDevices] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const unregisterDevice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      res.status(401).send({ message: 'Unauthorized!' })
      return
    }

    const token = clip(req.body?.token, 4096)
    if (!token) {
      res.status(400).send({ message: 'Invalid FCM device payload' })
      return
    }

    const device = await FirebaseDevice.findOneAndUpdate(
      { token, user: userId },
      { $set: { isActive: false, lastSeenAt: new Date() } },
      { returnDocument: 'after' },
    )

    if (!device) {
      res.sendStatus(204)
      return
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[fcmDevice.unregisterDevice] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
