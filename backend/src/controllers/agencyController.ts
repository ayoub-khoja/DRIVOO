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
import AgencyInvoice from '../models/AgencyInvoice'
import { computeInvoiceTotals, round3 } from '../utils/invoiceHelper'
import { buildInvoicePdf } from '../utils/invoicePdf'
import SubscriptionPlan from '../models/SubscriptionPlan'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import * as firebaseMessaging from '../services/firebase/messaging'
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

const APPROVED_STATUS = { status: bookcarsTypes.AgencyReviewStatus.Approved }

const toPublicReviewDto = (review: { _id: unknown, name: string, rating: number, comment: string, createdAt?: Date }) => ({
  _id: String(review._id),
  name: review.name,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
})

const toAgencyReviewDto = (review: {
  _id: unknown
  name: string
  email?: string
  rating: number
  comment: string
  status?: bookcarsTypes.AgencyReviewStatus
  createdAt?: Date
}) => ({
  _id: String(review._id),
  name: review.name,
  email: review.email,
  rating: review.rating,
  comment: review.comment,
  status: review.status || bookcarsTypes.AgencyReviewStatus.Pending,
  createdAt: review.createdAt,
})

/**
 * Notify the agency when a client submits a new review.
 */
const notifyAgencyNewReview = async (
  agency: {
    _id: mongoose.Types.ObjectId
    fullName?: string
    email?: string
    language?: string
    enableEmailNotifications?: boolean
  },
  reviewerName: string,
  rating: number,
) => {
  i18n.locale = agency.language || 'fr'
  const message = `${reviewerName} ${i18n.t('AGENCY_REVIEW_NOTIFICATION', { rating })}`
  const reviewsUrl = helper.joinURL(env.FRONTEND_HOST, 'agency/reviews')

  const notification = new Notification({
    user: agency._id,
    message,
  })
  await notification.save()

  let counter = await NotificationCounter.findOne({ user: agency._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: agency._id, count: 1 })
    await counter.save()
  }

  void firebaseMessaging.sendNotificationToUser(agency._id.toString(), {
    title: i18n.t('HELLO') + (agency.fullName || ''),
    body: message,
    type: 'agency-review',
    url: reviewsUrl,
    data: { review: '1' },
  }).catch((error) => {
    logger.warn(`[agency.notifyAgencyNewReview] push skipped: ${error}`)
  })

  if (agency.enableEmailNotifications && agency.email) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: agency.email,
      subject: message,
      html: emailTemplate.renderNotificationEmail({
        hello: i18n.t('HELLO'),
        greeting: agency.fullName || '',
        messageHtml: message,
        actionUrl: reviewsUrl,
        regardsHtml: i18n.t('REGARDS'),
        audience: 'agency',
      }),
    }
    await mailHelper.sendMail(emailTemplate.withBanner('agency', mailOptions))
  }
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

const clampNumber = (value: unknown, min: number, max: number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return undefined
  }
  return Math.min(Math.max(n, min), max)
}

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
  phone2: user.phone2,
  phone3: user.phone3,
  whatsapp: user.whatsapp,
  website: user.website,
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
  invoicePrefix: user.invoicePrefix,
  invoiceVatRate: user.invoiceVatRate,
  invoiceStampDuty: user.invoiceStampDuty,
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
    const phone2 = optionalPhone(clip(body.phone2, 32))
    const phone3 = optionalPhone(clip(body.phone3, 32))
    const whatsapp = optionalPhone(clip(body.whatsapp, 32))
    if (phone === null || phone2 === null || phone3 === null || whatsapp === null) {
      res.status(400).send('Invalid phone')
      return
    }

    sessionUser.fullName = fullName
    sessionUser.phone = phone || undefined
    sessionUser.phone2 = phone2 || undefined
    sessionUser.phone3 = phone3 || undefined
    sessionUser.whatsapp = whatsapp || undefined
    sessionUser.website = clip(body.website, 160) || undefined
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
    sessionUser.invoicePrefix = clip(body.invoicePrefix, 8).toUpperCase() || undefined
    sessionUser.invoiceVatRate = clampNumber(body.invoiceVatRate, 0, 100)
    sessionUser.invoiceStampDuty = clampNumber(body.invoiceStampDuty, 0, 1000)

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
      AgencyReview.find({ agency: agency._id, ...APPROVED_STATUS })
        .select({ name: 1, rating: 1, comment: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
      AgencyReview.aggregate<{ count: number, average: number }>([
        { $match: { agency: agency._id, ...APPROVED_STATUS } },
        { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
      ]),
    ])

    const count = stats[0]?.count || 0
    const average = count ? Math.round((stats[0]?.average || 0) * 10) / 10 : 0

    res.status(200).json({
      average,
      count,
      reviews: reviews.map(toPublicReviewDto),
    })
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
      status: bookcarsTypes.AgencyReviewStatus.Pending,
    })

    try {
      await notifyAgencyNewReview(agency, name, rating)
    } catch (notifyErr) {
      logger.warn(`[agency.createPublicReview] notification failed for ${agency._id}`, notifyErr)
    }

    res.status(201).json({
      ...toPublicReviewDto(review),
      status: review.status,
    })
  } catch (err) {
    logger.error(`[agency.createPublicReview] ${i18n.t('ERROR')} ${slug}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * List reviews of the authenticated agency for moderation.
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    const agencyId = sessionUser._id
    const [reviews, groups] = await Promise.all([
      AgencyReview.find({ agency: agencyId })
        .select({ name: 1, email: 1, rating: 1, comment: 1, status: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      AgencyReview.aggregate<{ _id: string | null, count: number, average: number }>([
        { $match: { agency: agencyId } },
        { $group: { _id: '$status', count: { $sum: 1 }, average: { $avg: '$rating' } } },
      ]),
    ])

    const countByStatus = (status: bookcarsTypes.AgencyReviewStatus) =>
      groups.filter((group) => group._id === status).reduce((sum, group) => sum + group.count, 0)

    const approved = groups.find((group) => group._id === bookcarsTypes.AgencyReviewStatus.Approved)
    const count = approved?.count || 0
    const average = count ? Math.round((approved?.average || 0) * 10) / 10 : 0

    res.status(200).json({
      average,
      count,
      pendingCount: countByStatus(bookcarsTypes.AgencyReviewStatus.Pending),
      rejectedCount: countByStatus(bookcarsTypes.AgencyReviewStatus.Rejected),
      reviews: reviews.map(toAgencyReviewDto),
    })
  } catch (err) {
    logger.error(`[agency.getReviews] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Approve or reject a client review belonging to the authenticated agency.
 */
export const moderateReview = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: bookcarsTypes.ModerateAgencyReviewPayload } = req

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (!helper.isValidObjectId(id)) {
      res.status(400).send('Invalid review')
      return
    }

    const status = body.status
    if (status !== bookcarsTypes.AgencyReviewStatus.Approved && status !== bookcarsTypes.AgencyReviewStatus.Rejected) {
      res.status(400).send('Invalid status')
      return
    }

    const review = await AgencyReview.findOne({ _id: id, agency: sessionUser._id })
    if (!review) {
      res.sendStatus(404)
      return
    }

    review.status = status
    await review.save()
    res.status(200).json(toAgencyReviewDto(review))
  } catch (err) {
    logger.error(`[agency.moderateReview] ${i18n.t('ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Assign a catalog subscription plan to the current main agency.
 */
export const selectSubscriptionPlan = async (req: Request, res: Response) => {
  const { body }: { body: { planId?: string } } = req
  try {
    const sessionUser = await getSessionAgency(req.user?._id?.toString())
    const gate = assertMainAgency(sessionUser)
    if (gate === 'forbidden' || !sessionUser) {
      res.sendStatus(403)
      return
    }

    const planId = String(body.planId || '')
    if (!helper.isValidObjectId(planId)) {
      res.status(400).send('Invalid plan')
      return
    }

    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      active: true,
      visible: true,
    }).select('_id').lean()

    if (!plan) {
      res.status(404).send('Plan not found')
      return
    }

    sessionUser.subscriptionPlan = plan._id
    await sessionUser.save()

    res.status(200).json({ subscriptionPlan: String(plan._id) })
  } catch (err) {
    logger.error(`[agency.selectSubscriptionPlan] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

const INVOICE_MAX_LINES = 40

const toInvoiceDto = (invoice: env.AgencyInvoice): bookcarsTypes.AgencyInvoice => ({
  _id: String(invoice._id),
  number: invoice.number,
  issueCity: invoice.issueCity || '',
  issueDate: new Date(invoice.issueDate).toISOString(),
  clientCode: invoice.clientCode,
  clientName: invoice.clientName,
  clientIdNumber: invoice.clientIdNumber,
  clientPhone: invoice.clientPhone,
  clientAddress: invoice.clientAddress,
  object: invoice.object || '',
  lines: invoice.lines,
  discount: invoice.discount,
  vatRate: invoice.vatRate,
  stampDuty: invoice.stampDuty,
  payments: invoice.payments,
  currency: invoice.currency,
  notes: invoice.notes,
  totalGross: invoice.totalGross,
  totalHT: invoice.totalHT,
  totalVAT: invoice.totalVAT,
  totalTTC: invoice.totalTTC,
  totalPaid: invoice.totalPaid,
  balanceDue: invoice.balanceDue,
  createdAt: invoice.createdAt,
})

/**
 * Aggregate stats shown above the invoice list: issued count, TTC billed this
 * month and the last allocated number.
 */
const getInvoiceStats = async (agencyId: mongoose.Types.ObjectId): Promise<bookcarsTypes.AgencyInvoiceStats> => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [count, monthGroup, last] = await Promise.all([
    AgencyInvoice.countDocuments({ agency: agencyId }),
    AgencyInvoice.aggregate<{ total: number }>([
      { $match: { agency: agencyId, issueDate: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalTTC' } } },
    ]),
    AgencyInvoice.findOne({ agency: agencyId }).sort({ createdAt: -1 }).select('number').lean(),
  ])

  return {
    count,
    monthTotal: round3(monthGroup[0]?.total || 0),
    lastNumber: last?.number || null,
  }
}

/**
 * List the authenticated agency invoices, paginated and optionally filtered by keyword.
 */
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    const agencyId = sessionUser._id
    const page = Math.max(1, Number.parseInt(req.params.page, 10) || 1)
    const size = Math.min(100, Math.max(1, Number.parseInt(req.params.size, 10) || 10))
    const keyword = String(req.query.s || '').trim()

    // const filter: mongoose.FilterQuery<env.AgencyInvoice> = { agency: agencyId }
    // if (keyword) {
    //   const rx = new RegExp(escapeStringRegexp(keyword), 'i')
    //   filter.$or = [{ number: rx }, { clientName: rx }, { object: rx }, { clientCode: rx }]
    // }
    const filter = { agency: agencyId }

    const [rows, totalRecords, stats] = await Promise.all([
      AgencyInvoice.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
      AgencyInvoice.countDocuments(filter),
      getInvoiceStats(agencyId),
    ])

    const result: bookcarsTypes.AgencyInvoiceResult = {
      rows: rows.map(toInvoiceDto),
      totalRecords,
      page,
      pageSize: size,
      stats,
    }
    res.status(200).json(result)
  } catch (err) {
    logger.error(`[agency.getInvoices] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Retrieve a single invoice belonging to the authenticated agency.
 */
export const getInvoice = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).send('Invalid invoice id')
      return
    }

    const invoice = await AgencyInvoice.findOne({ _id: id, agency: sessionUser._id })
    if (!invoice) {
      res.status(404).send('Invoice not found')
      return
    }

    res.status(200).json(toInvoiceDto(invoice))
  } catch (err) {
    logger.error(`[agency.getInvoice] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Allocate the next sequential invoice number for an agency and a given year,
 * e.g. FA0003-2025. The unique { agency, number } index makes the caller retry
 * loop race-safe without a separate counter collection.
 */
const nextInvoiceNumber = async (
  agencyId: mongoose.Types.ObjectId,
  prefix: string,
  year: number,
) => {
  const suffix = `-${year}`
  const rx = new RegExp(`^${escapeStringRegexp(prefix)}\\d+${escapeStringRegexp(suffix)}$`)
  const last = await AgencyInvoice.findOne({ agency: agencyId, number: rx })
    .sort({ number: -1 })
    .select('number')
    .lean()

  const lastSeq = last
    ? Number.parseInt(last.number.slice(prefix.length, last.number.length - suffix.length), 10) || 0
    : 0

  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}${suffix}`
}

/**
 * Create an invoice for the authenticated agency. Every total is recomputed
 * server-side — the client payload is only trusted for the raw inputs.
 */
export const createInvoice = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.CreateAgencyInvoicePayload } = req

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    const clientName = clip(body.clientName, 120)
    if (clientName.length < 2) {
      res.status(400).send('Invalid client name')
      return
    }

    const rawLines = Array.isArray(body.lines) ? body.lines.slice(0, INVOICE_MAX_LINES) : []
    const lines = rawLines
      .filter((line) => clip(line?.designation, 240).length > 0)
      .map((line) => ({
        designation: clip(line.designation, 240),
        contractNumber: clip(line.contractNumber, 40) || undefined,
        vehicleLabel: clip(line.vehicleLabel, 160) || undefined,
        periodFrom: clip(line.periodFrom, 32) || undefined,
        periodTo: clip(line.periodTo, 32) || undefined,
        quantity: Math.max(0, Number(line.quantity) || 0),
        unitPrice: Math.max(0, Number(line.unitPrice) || 0),
        total: 0,
      }))

    if (lines.length === 0) {
      res.status(400).send('At least one invoice line is required')
      return
    }

    const issueDate = body.issueDate ? new Date(body.issueDate) : new Date()
    if (Number.isNaN(issueDate.getTime())) {
      res.status(400).send('Invalid issue date')
      return
    }

    const payments = {
      cash: Math.max(0, Number(body.payments?.cash) || 0),
      cheque: Math.max(0, Number(body.payments?.cheque) || 0),
      draft: Math.max(0, Number(body.payments?.draft) || 0),
      card: Math.max(0, Number(body.payments?.card) || 0),
      transfer: Math.max(0, Number(body.payments?.transfer) || 0),
    }

    const discount = Math.max(0, Number(body.discount) || 0)
    const vatRate = Math.min(100, Math.max(0, Number(body.vatRate ?? sessionUser.invoiceVatRate ?? 19) || 0))
    const stampDuty = Math.max(0, Number(body.stampDuty ?? sessionUser.invoiceStampDuty ?? 1) || 0)

    const totals = computeInvoiceTotals({ lines, discount, vatRate, stampDuty, payments })
    lines.forEach((line, index) => {
      line.total = totals.lineTotals[index]
    })

    const prefix = (sessionUser.invoicePrefix || 'FA').toUpperCase()
    const year = issueDate.getFullYear()

    // Retry on duplicate key: a concurrent request may have taken the same number in between.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const number = await nextInvoiceNumber(sessionUser._id, prefix, year)
        const invoice = new AgencyInvoice({
          agency: sessionUser._id,
          number,
          issueCity: clip(body.issueCity, 80) || sessionUser.city || '',
          issueDate,
          clientCode: clip(body.clientCode, 40) || undefined,
          clientName,
          clientIdNumber: clip(body.clientIdNumber, 40) || undefined,
          clientPhone: clip(body.clientPhone, 32) || undefined,
          clientAddress: clip(body.clientAddress, 240) || undefined,
          object: clip(body.object, 300),
          lines,
          discount,
          vatRate,
          stampDuty,
          payments,
          currency: clip(body.currency, 8) || 'TND',
          notes: clip(body.notes, 500) || undefined,
          totalGross: totals.totalGross,
          totalHT: totals.totalHT,
          totalVAT: totals.totalVAT,
          totalTTC: totals.totalTTC,
          totalPaid: totals.totalPaid,
          balanceDue: totals.balanceDue,
        })

        // eslint-disable-next-line no-await-in-loop
        await invoice.save()
        res.status(200).json(toInvoiceDto(invoice))
        return
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) {
          throw err
        }
      }
    }

    res.status(409).send('Could not allocate an invoice number, please retry')
  } catch (err) {
    logger.error(`[agency.createInvoice] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Delete an invoice belonging to the authenticated agency.
 */
export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).send('Invalid invoice id')
      return
    }

    const result = await AgencyInvoice.deleteOne({ _id: id, agency: sessionUser._id })
    if (result.deletedCount === 0) {
      res.status(404).send('Invoice not found')
      return
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[agency.deleteInvoice] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Stream the invoice as a PDF, rendered server side from the agency letterhead
 * (logo, fiscal identifiers, contact footer) and the stored invoice totals.
 */
export const getInvoicePdf = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const sessionUser = await requireSessionSupplier(req)
    if (!sessionUser) {
      res.status(403).send('Forbidden')
      return
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).send('Invalid invoice id')
      return
    }

    const invoice = await AgencyInvoice.findOne({ _id: id, agency: sessionUser._id })
    if (!invoice) {
      res.status(404).send('Invoice not found')
      return
    }

    const pdf = await buildInvoicePdf(
      {
        number: invoice.number,
        issueCity: invoice.issueCity || '',
        issueDate: invoice.issueDate,
        clientCode: invoice.clientCode,
        clientName: invoice.clientName,
        clientIdNumber: invoice.clientIdNumber,
        clientPhone: invoice.clientPhone,
        clientAddress: invoice.clientAddress,
        object: invoice.object || '',
        lines: invoice.lines,
        discount: invoice.discount,
        vatRate: invoice.vatRate,
        stampDuty: invoice.stampDuty,
        payments: invoice.payments,
        currency: invoice.currency,
        notes: invoice.notes,
        totalGross: invoice.totalGross,
        totalHT: invoice.totalHT,
        totalVAT: invoice.totalVAT,
        totalTTC: invoice.totalTTC,
        totalPaid: invoice.totalPaid,
        balanceDue: invoice.balanceDue,
      },
      {
        fullName: sessionUser.fullName,
        email: sessionUser.email,
        avatar: sessionUser.avatar,
        address: sessionUser.address,
        city: sessionUser.city,
        governorate: sessionUser.governorate,
        postalCode: sessionUser.postalCode,
        phone: sessionUser.phone,
        phone2: sessionUser.phone2,
        phone3: sessionUser.phone3,
        website: sessionUser.website,
        taxId: sessionUser.taxId,
        iban: sessionUser.iban,
      },
    )

    // `inline` lets the browser preview it in a tab; the client adds ?download=1 to force a save.
    const disposition = req.query.download ? 'attachment' : 'inline'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', pdf.length)
    res.setHeader('Content-Disposition', `${disposition}; filename="Facture-${invoice.number}.pdf"`)
    res.status(200).end(pdf)
  } catch (err) {
    logger.error(`[agency.getInvoicePdf] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
