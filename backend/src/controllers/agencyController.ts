import path from 'node:path'
import validator from 'validator'
import escapeStringRegexp from 'escape-string-regexp'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import * as env from '../config/env.config'
import User from '../models/User'
import Token from '../models/Token'
import Car from '../models/Car'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as mailHelper from '../utils/mailHelper'
import * as emailTemplate from '../utils/emailTemplate'
import * as s3Storage from '../utils/s3Storage'
import * as profileSlug from '../utils/profileSlug'
import AgencyReview from '../models/AgencyReview'
import { findTunisiaPoint } from '../fixtures/geo'

const MAX_LOGO_BYTES = 5 * 1024 * 1024

const SUB_AGENCY_PROJECTION = {
  fullName: 1,
  email: 1,
  phone: 1,
  city: 1,
  address: 1,
  governorate: 1,
  avatar: 1,
  active: 1,
  agencyApproved: 1,
  createdAt: 1,
  carCount: 1,
}

const getSessionAgency = async (sessionUserId?: string) => {
  if (!sessionUserId || !helper.isValidObjectId(sessionUserId)) {
    return null
  }
  return User.findById(sessionUserId)
}

const assertMainAgency = (sessionUser: env.User | null) => {
  if (!sessionUser || sessionUser.type !== bookcarsTypes.UserType.Supplier) {
    return 'forbidden'
  }
  if (sessionUser.parentAgency) {
    return 'forbidden'
  }
  if (sessionUser.agencyApproved === false) {
    return 'pending'
  }
  return null
}

const findPublicAgency = async (slug?: string) => {
  if (!profileSlug.isValidProfileSlug(slug)) {
    return null
  }

  return User.findOne({
    profileSlug: slug,
    type: bookcarsTypes.UserType.Supplier,
    blacklisted: { $ne: true },
    expireAt: null,
    agencyApproved: { $ne: false },
  })
}

/**
 * List sub-agencies of the authenticated main agency.
 */
export const getSubAgencies = async (req: Request, res: Response) => {
  try {
    const sessionUser = await getSessionAgency(req.user?._id)
    const access = assertMainAgency(sessionUser)

    if (access === 'forbidden' || !sessionUser) {
      res.status(403).send('Forbidden: Only a main agency can list sub-agencies')
      return
    }

    if (access === 'pending') {
      res.status(403).send('Forbidden: Agency is not approved yet')
      return
    }

    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)

    if (!Number.isFinite(page) || page < 1 || !Number.isFinite(size) || size < 1 || size > 100) {
      res.status(400).send('Invalid page or size')
      return
    }

    const keyword = escapeStringRegexp(String(req.query.s || '').trim())
    const options = 'i'
    const parentId = sessionUser._id

    const $match: mongoose.QueryFilter<env.User> = {
      type: bookcarsTypes.UserType.Supplier,
      parentAgency: parentId,
      expireAt: null,
    }

    if (keyword) {
      $match.$or = [
        { fullName: { $regex: keyword, $options: options } },
        { email: { $regex: keyword, $options: options } },
        { city: { $regex: keyword, $options: options } },
      ]
    }

    const data = await User.aggregate(
      [
        { $match },
        {
          $facet: {
            resultData: [
              { $sort: { fullName: 1, _id: 1 } },
              { $skip: (page - 1) * size },
              { $limit: size },
              {
                $lookup: {
                  from: 'Car',
                  let: { supplierId: '$_id' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$supplier', '$$supplierId'] } } },
                    { $count: 'n' },
                  ],
                  as: 'carStats',
                },
              },
              { $addFields: { carCount: { $ifNull: [{ $arrayElemAt: ['$carStats.n', 0] }, 0] } } },
              { $project: SUB_AGENCY_PROJECTION },
            ],
            pageInfo: [{ $count: 'totalRecords' }],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    res.json(data)
  } catch (err) {
    logger.error(`[agency.getSubAgencies] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Create a sub-agency under the authenticated main agency.
 */
export const createSubAgency = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.CreateSubAgencyPayload } = req

  try {
    const sessionUser = await getSessionAgency(req.user?._id)
    const access = assertMainAgency(sessionUser)

    if (access === 'forbidden' || !sessionUser) {
      res.status(403).send('Forbidden: Only a main agency can create sub-agencies')
      return
    }

    if (access === 'pending') {
      res.status(403).send('Forbidden: Agency is not approved yet')
      return
    }

    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const city = String(body.city || '').trim()
    const address = String(body.address || '').trim()
    const governorate = String(body.governorate || '').trim()

    if (fullName.length < 2) {
      res.status(400).send('Invalid agency name')
      return
    }

    if (!validator.isEmail(email)) {
      res.status(400).send('Invalid email')
      return
    }

    if (phone && !validator.isMobilePhone(phone)) {
      res.status(400).send('Invalid phone')
      return
    }

    const existing = await User.findOne({ email }).select('_id').lean()
    if (existing) {
      res.status(409).send('Email already exists')
      return
    }

    const subAgency = new User({
      fullName,
      email,
      phone: phone || undefined,
      city: city || undefined,
      address: address || undefined,
      governorate: governorate || undefined,
      type: bookcarsTypes.UserType.Supplier,
      parentAgency: sessionUser._id,
      language: sessionUser.language,
      payLater: sessionUser.payLater,
      licenseRequired: sessionUser.licenseRequired,
      agencyApproved: true,
      active: false,
      verified: false,
      blacklisted: false,
    })
    await subAgency.save()

    try {
      await profileSlug.ensureProfileSlug(subAgency)
    } catch (slugErr) {
      logger.error(`[agency.createSubAgency] profile slug ${subAgency._id}`, slugErr)
    }

    await Token.deleteMany({ user: subAgency._id.toString() })
    const token = new Token({ user: subAgency._id, token: helper.generateToken() })
    await token.save()

    i18n.locale = subAgency.language
    const activationLink = `${helper.joinURL(env.FRONTEND_HOST, 'agency/activate')}/?u=${encodeURIComponent(subAgency._id.toString())}&e=${encodeURIComponent(subAgency.email)}&t=${encodeURIComponent(token.token)}`
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: subAgency.email,
      subject: i18n.t('SUB_AGENCY_INVITE_SUBJECT'),
      html: emailTemplate.renderEmail({
        hello: i18n.t('HELLO'),
        greeting: subAgency.fullName,
        audience: 'agency',
        paragraphs: [i18n.t('SUB_AGENCY_INVITE_BODY')],
        cta: { text: i18n.t('SUB_AGENCY_INVITE_CTA'), url: activationLink },
        fallbackLink: { url: activationLink },
        regardsHtml: i18n.t('REGARDS'),
      }),
    }

    try {
      await mailHelper.sendMail(emailTemplate.withBanner('agency', mailOptions))
    } catch (mailErr) {
      logger.error(`[agency.createSubAgency] mail ${subAgency._id}`, mailErr)
    }

    res.status(200).json({
      _id: subAgency._id,
      fullName: subAgency.fullName,
      email: subAgency.email,
      phone: subAgency.phone,
      city: subAgency.city,
      address: subAgency.address,
      governorate: subAgency.governorate,
      active: subAgency.active,
      agencyApproved: subAgency.agencyApproved,
      carCount: 0,
      createdAt: subAgency.createdAt,
    })
  } catch (err) {
    logger.error(`[agency.createSubAgency] ${i18n.t('ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

const clip = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)

const optionalPhone = (value: string) => {
  if (!value) {
    return ''
  }
  const digits = value.replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 15 ? value : null
}

const toProfileDto = (user: env.User) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  whatsapp: user.whatsapp,
  bio: user.bio,
  avatar: user.avatar,
  address: user.address,
  city: user.city,
  governorate: user.governorate,
  postalCode: user.postalCode,
  taxId: user.taxId,
  rneNumber: user.rneNumber,
  rneDocument: user.rneDocument,
  iban: user.iban,
  legalRepFirstName: user.legalRepFirstName,
  legalRepLastName: user.legalRepLastName,
  legalRepTitle: user.legalRepTitle,
  legalRepCin: user.legalRepCin,
  type: user.type,
  language: user.language,
  verified: user.verified,
  active: user.active,
  agencyApproved: user.agencyApproved,
  parentAgency: user.parentAgency,
  profileSlug: user.profileSlug,
})

const requireSessionSupplier = async (req: Request) => {
  const sessionUser = await getSessionAgency(req.user?._id)
  if (!sessionUser || sessionUser.type !== bookcarsTypes.UserType.Supplier) {
    return null
  }
  return sessionUser
}

/**
 * Update the authenticated agency professional profile.
 */
export const updateProfile = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.UpdateAgencyProfilePayload } = req

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    const fullName = clip(body.fullName, 120)
    if (fullName.length < 2) {
      res.status(400).send('Invalid agency name')
      return
    }

    const phone = optionalPhone(clip(body.phone, 32))
    const whatsapp = optionalPhone(clip(body.whatsapp, 32))
    if (phone === null || whatsapp === null) {
      res.status(400).send('Invalid phone')
      return
    }

    sessionUser.fullName = fullName
    sessionUser.phone = phone || undefined
    sessionUser.whatsapp = whatsapp || undefined
    sessionUser.bio = clip(body.bio, 500) || undefined
    sessionUser.address = clip(body.address, 240) || undefined
    sessionUser.city = clip(body.city, 80) || undefined
    sessionUser.governorate = clip(body.governorate, 80) || undefined
    sessionUser.postalCode = clip(body.postalCode, 12) || undefined
    sessionUser.taxId = clip(body.taxId, 64) || undefined
    sessionUser.rneNumber = clip(body.rneNumber, 64) || undefined
    sessionUser.iban = clip(body.iban, 64) || undefined
    sessionUser.legalRepFirstName = clip(body.legalRepFirstName, 80) || undefined
    sessionUser.legalRepLastName = clip(body.legalRepLastName, 80) || undefined
    sessionUser.legalRepTitle = clip(body.legalRepTitle, 80) || undefined
    sessionUser.legalRepCin = clip(body.legalRepCin, 16) || undefined

    await sessionUser.save()
    res.status(200).json(toProfileDto(sessionUser))
  } catch (err) {
    logger.error(`[agency.updateProfile] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Upload the authenticated agency logo to S3 (when configured) and CDN_USERS.
 */
export const updateLogo = async (req: Request, res: Response) => {
  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (!req.file?.buffer) {
      res.status(400).send('Image required')
      return
    }

    if (req.file.size > MAX_LOGO_BYTES) {
      res.status(400).send('Image too large')
      return
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase()
    if (!env.allowedImageExtensions.includes(ext) || !req.file.mimetype.startsWith('image/')) {
      res.status(400).send('Invalid image type')
      return
    }

    const filename = `${sessionUser._id}_${Date.now()}${ext}`
    await s3Storage.saveUserImage(filename, req.file.buffer, req.file.mimetype)

    const previous = sessionUser.avatar
    sessionUser.avatar = filename
    await sessionUser.save()

    if (previous && previous !== filename) {
      await s3Storage.deleteUserImage(previous)
    }

    res.status(200).json({ avatar: filename })
  } catch (err) {
    logger.error(`[agency.updateLogo] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Remove the authenticated agency logo from S3 / CDN.
 */
export const deleteLogo = async (req: Request, res: Response) => {
  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (sessionUser.avatar) {
      await s3Storage.deleteUserImage(sessionUser.avatar)
      sessionUser.avatar = undefined
      await sessionUser.save()
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[agency.deleteLogo] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Ensure a unique share slug and return the public profile URL.
 */
export const getShareLink = async (req: Request, res: Response) => {
  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    const slug = await profileSlug.ensureProfileSlug(sessionUser)
    res.status(200).json({
      slug,
      url: profileSlug.buildProfileUrl(slug),
    })
  } catch (err) {
    logger.error(`[agency.getShareLink] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Public agency profile (no auth). Sensitive fields are never returned.
 */
export const getPublicProfile = async (req: Request, res: Response) => {
  const { slug } = req.params

  try {
    if (!profileSlug.isValidProfileSlug(slug)) {
      res.sendStatus(404)
      return
    }

    const user = await User.findOne({
      profileSlug: slug,
      type: bookcarsTypes.UserType.Supplier,
      blacklisted: { $ne: true },
      expireAt: null,
      agencyApproved: { $ne: false },
    }).select({
      fullName: 1,
      avatar: 1,
      bio: 1,
      email: 1,
      phone: 1,
      whatsapp: 1,
      address: 1,
      city: 1,
      governorate: 1,
      postalCode: 1,
      agencyApproved: 1,
      profileSlug: 1,
    }).lean()

    if (!user) {
      res.sendStatus(404)
      return
    }

    const carCount = await Car.countDocuments({
      supplier: user._id,
      available: true,
    })

    const point = findTunisiaPoint(user.governorate, user.city)

    res.set('Cache-Control', 'public, max-age=60')
    res.status(200).json({
      slug: user.profileSlug,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      email: user.email,
      phone: user.phone,
      whatsapp: user.whatsapp,
      address: user.address,
      city: user.city,
      governorate: user.governorate,
      postalCode: user.postalCode,
      latitude: point?.latitude,
      longitude: point?.longitude,
      agencyApproved: user.agencyApproved,
      carCount,
    })
  } catch (err) {
    logger.error(`[agency.getPublicProfile] ${i18n.t('ERROR')} ${slug}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const getPublicCars = async (req: Request, res: Response) => {
  const { slug } = req.params

  try {
    const agency = await findPublicAgency(slug)
    if (!agency) {
      res.sendStatus(404)
      return
    }

    const cars = await Car.find({
      supplier: agency._id,
      available: true,
    })
      .select({
        name: 1,
        brand: 1,
        model: 1,
        year: 1,
        image: 1,
        dailyPrice: 1,
        seats: 1,
        doors: 1,
        gearbox: 1,
        type: 1,
        available: 1,
      })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(48)
      .lean()

    res.set('Cache-Control', 'public, max-age=60')
    res.status(200).json(cars)
  } catch (err) {
    logger.error(`[agency.getPublicCars] ${i18n.t('ERROR')} ${slug}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const getPublicReviews = async (req: Request, res: Response) => {
  const { slug } = req.params

  try {
    const agency = await findPublicAgency(slug)
    if (!agency) {
      res.sendStatus(404)
      return
    }

    const [reviews, stats] = await Promise.all([
      AgencyReview.find({ agency: agency._id })
        .select({ name: 1, rating: 1, comment: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
      AgencyReview.aggregate<{ count: number, average: number }>([
        { $match: { agency: agency._id } },
        { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
      ]),
    ])

    const count = stats[0]?.count || 0
    const average = count ? Math.round((stats[0]?.average || 0) * 10) / 10 : 0

    res.status(200).json({ average, count, reviews })
  } catch (err) {
    logger.error(`[agency.getPublicReviews] ${i18n.t('ERROR')} ${slug}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

export const createPublicReview = async (req: Request, res: Response) => {
  const { slug } = req.params
  const { body }: { body: bookcarsTypes.CreateAgencyReviewPayload } = req

  try {
    const agency = await findPublicAgency(slug)
    if (!agency) {
      res.sendStatus(404)
      return
    }

    const name = String(body.name || '').trim().slice(0, 80)
    const comment = String(body.comment || '').trim().slice(0, 800)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 120)
    const rating = Number(body.rating)

    if (name.length < 2 || comment.length < 8 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).send('Invalid review')
      return
    }

    if (email && !validator.isEmail(email)) {
      res.status(400).send('Invalid email')
      return
    }

    if (email) {
      const already = await AgencyReview.exists({ agency: agency._id, email })
      if (already) {
        res.status(409).send('Review already submitted')
        return
      }
    }

    const review = await AgencyReview.create({
      agency: agency._id,
      name,
      email: email || undefined,
      rating,
      comment,
    })

    res.status(201).json({
      _id: String(review._id),
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })
  } catch (err) {
    logger.error(`[agency.createPublicReview] ${i18n.t('ERROR')} ${slug}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
