import path from 'node:path'
import asyncFs from 'node:fs/promises'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as env from '../config/env.config'
import * as helper from './helper'
import * as logger from './logger'

const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
}

let client: S3Client | null = null

const getClient = () => {
  if (!env.S3_ENABLED) {
    return null
  }

  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      ...(env.S3_ENDPOINT
        ? {
          endpoint: env.S3_ENDPOINT,
          forcePathStyle: env.S3_FORCE_PATH_STYLE,
        }
        : {}),
    })
  }

  return client
}

const objectKey = (filename: string) => {
  const prefix = env.S3_KEY_PREFIX.replace(/^\/+|\/+$/g, '')
  const safeName = path.basename(filename)
  return prefix ? `${prefix}/${safeName}` : safeName
}

const localFilename = (avatar: string) => {
  if (/^https?:\/\//i.test(avatar)) {
    try {
      return path.basename(new URL(avatar).pathname)
    } catch {
      return path.basename(avatar)
    }
  }
  return path.basename(avatar)
}

export const mimeFromFilename = (filename: string) => (
  IMAGE_MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream'
)

/**
 * Persist a user/agency image. Writes to S3 when configured, and always to CDN_USERS
 * so existing VITE_BC_CDN_USERS URLs keep working locally and in production.
 */
export const saveUserImage = async (filename: string, body: Buffer, contentType?: string) => {
  const mime = contentType || mimeFromFilename(filename)
  const s3 = getClient()

  if (s3) {
    await s3.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey(filename),
      Body: body,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }))
  }

  await helper.mkdir(env.CDN_USERS)
  await asyncFs.writeFile(path.join(env.CDN_USERS, filename), body)
}

export const deleteUserImage = async (avatar?: string | null) => {
  if (!avatar) {
    return
  }

  const filename = localFilename(avatar)
  if (!filename || filename.includes('\0') || filename.includes('..')) {
    return
  }

  const s3 = getClient()
  if (s3) {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: objectKey(filename),
      }))
    } catch (err) {
      logger.error(`[s3Storage.deleteUserImage] S3 ${filename}`, err)
    }
  }

  const filepath = path.join(env.CDN_USERS, filename)
  if (await helper.pathExists(filepath)) {
    await asyncFs.unlink(filepath)
  }
}
