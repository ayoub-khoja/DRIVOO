import { customAlphabet } from 'nanoid'
import User from '../models/User'
import * as helper from './helper'
import * as env from '../config/env.config'

const token = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

const slugifyName = (fullName: string) => (
  fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'agence'
)

export const isValidProfileSlug = (slug?: string) => (
  !!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 56
)

export const buildProfileUrl = (slug: string) => (
  helper.joinURL(env.FRONTEND_HOST, `agence/${slug}`)
)

export const createProfileSlug = (fullName: string) => `${slugifyName(fullName)}-${token()}`

export const ensureProfileSlug = async (user: env.User) => {
  if (user.profileSlug && isValidProfileSlug(user.profileSlug)) {
    return user.profileSlug
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = createProfileSlug(user.fullName)
    const taken = await User.exists({ profileSlug: slug, _id: { $ne: user._id } })
    if (!taken) {
      user.profileSlug = slug
      await user.save()
      return slug
    }
  }

  throw new Error('Unable to allocate a unique profile slug')
}
