import path from 'node:path'
import nodemailer from 'nodemailer'
import * as env from '../config/env.config'
import * as helper from './helper'
import i18n from '../lang/i18n'

/** Content-ID for inline banner attachment in emails. */
export const EMAIL_BANNER_CID = 'drivoo-email-banner'

/** DRIVOO brand colors (inline styles for email client compatibility). */
const COLORS = {
  accent: '#f5a623',
  accentHot: '#ff6b1a',
  text: '#243853',
  textMuted: '#4a5b73',
  textLight: '#6b7c93',
  border: '#e6eaf0',
  background: '#f4f6f9',
  card: '#ffffff',
  footerBg: '#eef1f6',
  ctaText: '#101820',
} as const

export interface EmailCta {
  text: string
  url: string
}

export interface EmailLink {
  url: string
  label?: string
}

/** Email header banner: client (renters) or agency (suppliers). */
export type EmailAudience = 'client' | 'agency'

export interface EmailTemplateOptions {
  /** Short preview text shown in some email clients. */
  preheader?: string
  /** i18n hello prefix, e.g. "Hello " */
  hello?: string
  /** Recipient name after hello prefix. */
  greeting?: string
  /** Optional bold headline below greeting. */
  title?: string
  /** Plain or i18n HTML paragraphs (trusted content). */
  paragraphs?: string[]
  /** Full body HTML when paragraphs are not enough (e.g. booking details). */
  bodyHtml?: string
  /** Primary call-to-action button. */
  cta?: EmailCta
  /** Fallback URL displayed below the CTA. */
  fallbackLink?: EmailLink
  /** Closing line (defaults to i18n REGARDS passed by caller). */
  regardsHtml?: string
  /** Hide header banner (e.g. contact form). */
  hideBanner?: boolean
  /** Which hero banner to show. Default: client. */
  audience?: EmailAudience
}

const bannerFilenameFor = (audience: EmailAudience = 'client'): string => (
  audience === 'agency' ? 'agency-hero-banner.png' : 'client-hero-banner.png'
)

/** Nodemailer inline attachment for the email hero banner. */
export const getBannerAttachment = (audience: EmailAudience = 'client'): NonNullable<nodemailer.SendMailOptions['attachments']>[number] => ({
  filename: bannerFilenameFor(audience),
  path: path.join(env.CDN_ROOT, 'bookcars', 'email', bannerFilenameFor(audience)),
  cid: EMAIL_BANNER_CID,
})

/** Attach inline banner to mail options (works in webmail; no public URL required). */
export const withBanner = (
  audience: EmailAudience | undefined,
  mailOptions: nodemailer.SendMailOptions,
): nodemailer.SendMailOptions => {
  if (!audience) {
    return mailOptions
  }

  return {
    ...mailOptions,
    attachments: [...(mailOptions.attachments || []), getBannerAttachment(audience)],
  }
}

const assetUrl = (filename: string): string => (
  `${helper.trimEnd(env.BACKEND_HOST, '/')}/cdn/bookcars/email/${filename}`
)

const socialLinks = (): { url: string; icon: string; label: string }[] => {
  const items: { url: string; envUrl: string; icon: string; label: string }[] = [
    { url: '', envUrl: env.EMAIL_FACEBOOK_URL, icon: 'facebook.png', label: 'Facebook' },
    { url: '', envUrl: env.EMAIL_INSTAGRAM_URL, icon: 'instagram.png', label: 'Instagram' },
    { url: '', envUrl: env.EMAIL_LINKEDIN_URL, icon: 'linkedin.png', label: 'LinkedIn' },
    { url: '', envUrl: env.EMAIL_YOUTUBE_URL, icon: 'youtube.png', label: 'YouTube' },
  ]

  return items
    .filter((item) => item.envUrl.trim())
    .map((item) => ({ url: item.envUrl.trim(), icon: item.icon, label: item.label }))
}

/**
 * Escape user-provided text for safe HTML insertion.
 */
export const escapeHtml = (value: string): string => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
)

/**
 * Convert plain-text newlines to <br> after HTML escaping.
 */
export const textToHtml = (value: string): string => (
  escapeHtml(value).replace(/(?:\r\n|\r|\n)/g, '<br>')
)

const renderSocialBlock = (): string => {
  const links = socialLinks()
  if (links.length === 0) {
    return ''
  }

  const icons = links.map((link) => (
    `<td style="padding:0 6px;">
      <a href="${escapeHtml(link.url)}" target="_blank" style="text-decoration:none;">
        <img src="${escapeHtml(assetUrl(link.icon))}" alt="${escapeHtml(link.label)}" width="36" height="36" style="display:block;border:0;border-radius:50%;">
      </a>
    </td>`
  )).join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:20px auto 8px;">
    <tr>${icons}</tr>
  </table>`
}

const renderFooterBlock = (): string => {
  const supportEmail = env.EMAIL_SUPPORT
  const address = env.EMAIL_ADDRESS.trim()
  const websiteUrl = helper.trimEnd(env.FRONTEND_HOST, '/')
  const year = new Date().getFullYear()

  const addressBlock = address
    ? `<p style="font-size:13px;line-height:1.6;color:${COLORS.textMuted};margin:0 0 16px;text-align:center;">
        <strong>${i18n.t('EMAIL_ADDRESS_LABEL')}</strong> ${escapeHtml(address)}
      </p>`
    : ''

  return `<tr>
    <td style="background:${COLORS.footerBg};padding:28px 32px;border-top:1px solid ${COLORS.border};">
      <p style="font-size:12px;line-height:1.6;color:${COLORS.textLight};margin:0 0 16px;text-align:center;">
        ${i18n.t('EMAIL_AUTO_MESSAGE')}
      </p>
      ${renderSocialBlock()}
      <p style="font-size:15px;font-weight:700;color:${COLORS.text};margin:16px 0 8px;text-align:center;">
        ${i18n.t('EMAIL_NEED_HELP')}
      </p>
      <p style="font-size:13px;line-height:1.7;color:${COLORS.textMuted};margin:0 0 12px;text-align:center;">
        ${i18n.t('EMAIL_CONTACT_PROMPT')}
        <a href="mailto:${escapeHtml(supportEmail)}" style="color:${COLORS.accentHot};text-decoration:none;font-weight:600;">${escapeHtml(supportEmail)}</a>
      </p>
      ${addressBlock}
      <p style="font-size:12px;line-height:1.6;color:${COLORS.textLight};margin:0;text-align:center;">
        &copy; ${year} <a href="${escapeHtml(websiteUrl)}" style="color:${COLORS.textLight};text-decoration:none;font-weight:700;">${escapeHtml(env.WEBSITE_NAME)}</a>.
        ${i18n.t('EMAIL_ALL_RIGHTS')}
      </p>
    </td>
  </tr>`
}

/**
 * Render a branded DRIVOO transactional email.
 */
export const renderEmail = (options: EmailTemplateOptions): string => {
  const {
    preheader,
    hello = '',
    greeting,
    title,
    paragraphs = [],
    bodyHtml,
    cta,
    fallbackLink,
    regardsHtml,
    hideBanner = false,
    audience = 'client',
  } = options

  const greetingBlock = greeting
    ? `<p style="font-size:16px;line-height:1.6;color:${COLORS.text};margin:0 0 14px;">${hello}<strong>${escapeHtml(greeting)}</strong>,</p>`
    : ''

  const titleBlock = title
    ? `<p style="font-size:20px;line-height:1.4;font-weight:700;color:${COLORS.text};margin:0 0 18px;">${title}</p>`
    : ''

  const paragraphBlocks = paragraphs
    .map((p) => (
      `<p style="font-size:15px;line-height:1.75;color:${COLORS.textMuted};margin:0 0 14px;">${p}</p>`
    ))
    .join('')

  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
        <tr>
          <td style="border-radius:10px;background:${COLORS.accent};">
            <a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${COLORS.ctaText};text-decoration:none;border-radius:10px;">
              ${escapeHtml(cta.text)}
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const fallbackBlock = fallbackLink
    ? `<p style="font-size:13px;line-height:1.6;color:${COLORS.textLight};margin:0 0 18px;word-break:break-all;">
        ${fallbackLink.label ? `${escapeHtml(fallbackLink.label)}<br>` : ''}
        <a href="${escapeHtml(fallbackLink.url)}" target="_blank" style="color:${COLORS.textLight};">${escapeHtml(fallbackLink.url)}</a>
      </p>`
    : ''

  const regardsBlock = regardsHtml
    ? `<p style="font-size:14px;line-height:1.7;color:${COLORS.text};margin:18px 0 0;">${regardsHtml}</p>`
    : ''

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
    : ''

  const bannerBlock = hideBanner
    ? `<tr><td style="padding:24px 32px 0;background:${COLORS.card};">
        <p style="font-size:22px;font-weight:800;color:${COLORS.text};margin:0 0 8px;letter-spacing:0.02em;">${escapeHtml(env.WEBSITE_NAME)}</p>
      </td></tr>`
    : `<tr>
        <td style="padding:0;line-height:0;background:${COLORS.card};">
          <img src="cid:${EMAIL_BANNER_CID}" alt="${escapeHtml(env.WEBSITE_NAME)}" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;">
        </td>
      </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(env.WEBSITE_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Arial,Helvetica,sans-serif;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.background};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
          ${bannerBlock}
          <tr>
            <td style="padding:32px;">
              ${greetingBlock}
              ${titleBlock}
              ${paragraphBlocks}
              ${bodyHtml || ''}
              ${ctaBlock}
              ${fallbackBlock}
              ${regardsBlock}
            </td>
          </tr>
          ${renderFooterBlock()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Email with intro text and an activation / reset link.
 */
export const renderLinkEmail = (options: {
  hello: string
  greeting: string
  introHtml: string
  link: string
  regardsHtml: string
  ctaText?: string
  preheader?: string
  title?: string
  audience?: EmailAudience
}): string => {
  if (options.ctaText) {
    return renderEmail({
      preheader: options.preheader,
      hello: options.hello,
      greeting: options.greeting,
      title: options.title,
      paragraphs: [options.introHtml],
      cta: { text: options.ctaText, url: options.link },
      fallbackLink: { url: options.link },
      regardsHtml: options.regardsHtml,
      audience: options.audience,
    })
  }

  return renderEmail({
    preheader: options.preheader,
    hello: options.hello,
    greeting: options.greeting,
    title: options.title,
    paragraphs: [
      options.introHtml,
      `<a href="${escapeHtml(options.link)}" target="_blank" style="color:${COLORS.accentHot};word-break:break-all;">${escapeHtml(options.link)}</a>`,
    ],
    regardsHtml: options.regardsHtml,
    audience: options.audience,
  })
}

/**
 * Simple notification email with optional action link.
 */
export const renderNotificationEmail = (options: {
  hello: string
  greeting: string
  messageHtml: string
  actionUrl?: string
  actionLabel?: string
  regardsHtml: string
  title?: string
  audience?: EmailAudience
}): string => renderEmail({
  hello: options.hello,
  greeting: options.greeting,
  title: options.title,
  paragraphs: [options.messageHtml],
  cta: options.actionUrl && options.actionLabel
    ? { text: options.actionLabel, url: options.actionUrl }
    : undefined,
  fallbackLink: options.actionUrl && options.actionLabel
    ? { url: options.actionUrl }
    : options.actionUrl
      ? { url: options.actionUrl }
      : undefined,
  regardsHtml: options.regardsHtml,
  audience: options.audience,
})

/**
 * Contact form email forwarded to admin.
 */
export const renderContactEmail = (options: {
  from: string
  subject?: string
  message?: string
  fromLabel: string
  subjectLabel: string
  messageLabel: string
}): string => {
  const paragraphs = [
    `<strong>${escapeHtml(options.fromLabel)}:</strong> ${escapeHtml(options.from)}`,
  ]

  if (options.subject) {
    paragraphs.push(`<strong>${escapeHtml(options.subjectLabel)}:</strong> ${escapeHtml(options.subject)}`)
  }

  if (options.message) {
    paragraphs.push(
      `<strong>${escapeHtml(options.messageLabel)}:</strong><br>${textToHtml(options.message)}`,
    )
  }

  return renderEmail({ paragraphs, hideBanner: true })
}
