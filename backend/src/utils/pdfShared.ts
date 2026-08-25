import path from 'node:path'
import fs from 'node:fs/promises'
import * as env from '../config/env.config'

/**
 * Layout tokens and formatting helpers shared by the agency PDF documents
 * (invoice, rental contract).
 */

export const NAVY = '#12233a'
export const NAVY_DARK = '#0b1626'
export const ORANGE = '#f5a623'
export const MUTED = '#5b6b80'
export const BORDER = '#d8e0ea'
export const BAND = '#f2f5f9'
export const DANGER = '#c2410c'
export const WHITE = '#ffffff'

export const PAGE_MARGIN = 40
export const A4_WIDTH = 595.28
export const A4_HEIGHT = 841.89
export const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2
export const FOOTER_HEIGHT = 54

/** Identity block of the issuing agency, printed in the header and the footer. */
export interface PdfAgencyInfo {
  fullName: string
  email?: string
  avatar?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  phone?: string
  phone2?: string
  phone3?: string
  website?: string
  taxId?: string
  rneNumber?: string
  iban?: string
}

/** Amounts always print with 3 decimals (378.150), the millime being the legal unit. */
export const money = (value: number): string => (Number.isFinite(value) ? value : 0).toFixed(3)

/** "30/08/2025" */
export const formatDate = (value?: Date | string | null): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

/** "23/12/2024 16:00" */
export const formatDateTime = (value?: Date | string | null): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(date)} ${hours}:${minutes}`
}

/** "23-12-2024 à 16:00" — the period format used inside an invoice designation cell. */
export const formatStamp = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()} à ${hours}:${minutes}`
}

/**
 * A Tunisian RIB is the IBAN without its country code and 2 check digits:
 * TN5903211121011500454538 -> 03211121011500454538.
 */
export const ribFromIban = (iban?: string | null): string => {
  const clean = (iban || '').replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}/.test(clean)) {
    return ''
  }
  return clean.slice(4)
}

export const joinParts = (parts: (string | undefined | null)[], separator = ' | '): string =>
  parts.map((part) => (part || '').trim()).filter(Boolean).join(separator)

/**
 * Read the agency logo from the local CDN folder. Returns null when the agency has no
 * logo or the file cannot be read — headers then fall back to the name alone.
 */
export const readLogo = async (avatar?: string): Promise<Buffer | null> => {
  if (!avatar) {
    return null
  }
  const filename = path.basename(avatar)
  if (!filename || filename.includes('..') || filename.includes('\0')) {
    return null
  }
  // PDFKit can only embed JPEG and PNG
  if (!['.png', '.jpg', '.jpeg'].includes(path.extname(filename).toLowerCase())) {
    return null
  }
  try {
    return await fs.readFile(path.join(env.CDN_USERS, filename))
  } catch {
    return null
  }
}

/** The two contact lines printed at the bottom of every page. */
export const footerLines = (agency: PdfAgencyInfo): { contactLine: string, webLine: string } => {
  const addressLine = joinParts([agency.address, agency.postalCode, agency.city, agency.governorate], ', ')
  const phoneLine = joinParts([agency.phone, agency.phone2, agency.phone3], ' | ')
  return {
    contactLine: joinParts([
      addressLine ? `Adresse : ${addressLine}` : '',
      phoneLine ? `Tel : ${phoneLine}` : '',
    ]),
    webLine: joinParts([
      agency.email ? `Email : ${agency.email}` : '',
      agency.website ? `Site Web : ${agency.website}` : '',
    ]),
  }
}
