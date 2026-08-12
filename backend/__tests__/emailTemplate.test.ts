import { describe, expect, it } from '@jest/globals'
import {
  escapeHtml,
  renderContactEmail,
  renderEmail,
  renderLinkEmail,
  textToHtml,
  withBanner,
} from '../src/utils/emailTemplate.js'

describe('emailTemplate', () => {
  it('escapes HTML in user content', () => {
    expect(escapeHtml('<script>"\'&</script>')).toBe('&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;')
  })

  it('renders branded layout with CTA and fallback link', () => {
    const html = renderEmail({
      hello: 'Hello ',
      greeting: 'John',
      paragraphs: ['Welcome to DRIVOO.'],
      cta: { text: 'Activate', url: 'https://drivoo.net/activate' },
      fallbackLink: { url: 'https://drivoo.net/activate' },
      regardsHtml: 'Kind regards,<br>DRIVOO team',
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Welcome to DRIVOO.')
    expect(html).toContain('cid:drivoo-email-banner')
    expect(html).toContain('href="https://drivoo.net/activate"')
    expect(html).toContain('<strong>John</strong>')
  })

  it('renders agency banner when audience is agency', () => {
    const html = renderEmail({
      greeting: 'Agency',
      audience: 'agency',
      paragraphs: ['Welcome partner.'],
    })

    expect(html).toContain('cid:drivoo-email-banner')
  })

  it('attaches inline banner from backend/media for webmail delivery', () => {
    const mailOptions = withBanner('agency', {
      from: 'test@test.com',
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    })

    expect(mailOptions.attachments).toHaveLength(1)
    expect(mailOptions.attachments?.[0]).toMatchObject({
      filename: 'agency-hero-banner.png',
      cid: 'drivoo-email-banner',
    })
    expect(String(mailOptions.attachments?.[0]?.path || '')).toMatch(/media[/\\]agency-hero-banner\.png$/)
  })

  it('renders link email without CTA when ctaText omitted', () => {
    const html = renderLinkEmail({
      hello: 'Hello ',
      greeting: 'Jane',
      introHtml: 'Please activate your account.',
      link: 'https://drivoo.net/activate',
      regardsHtml: 'Regards',
    })

    expect(html).toContain('Please activate your account.')
    expect(html).toContain('https://drivoo.net/activate')
  })

  it('renders contact email with escaped message', () => {
    const html = renderContactEmail({
      from: 'user@test.com',
      subject: 'Help <test>',
      message: 'Line1\nLine2',
      fromLabel: 'From',
      subjectLabel: 'Subject',
      messageLabel: 'Message',
    })

    expect(html).toContain('user@test.com')
    expect(html).toContain('Help &lt;test&gt;')
    expect(html).toContain('Line1<br>Line2')
  })

  it('converts plain text to html safely', () => {
    expect(textToHtml('a & b\nc')).toBe('a &amp; b<br>c')
  })
})
