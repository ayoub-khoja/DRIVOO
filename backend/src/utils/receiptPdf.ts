import PDFDocument from 'pdfkit'
import * as logger from './logger'
import {
  A4_HEIGHT,
  BAND,
  BORDER,
  CONTENT_WIDTH,
  MUTED,
  NAVY,
  NAVY_DARK,
  ORANGE,
  PAGE_MARGIN,
  WHITE,
  footerLines,
  formatDate,
  money,
  readLogo,
  type PdfAgencyInfo,
} from './pdfShared'
import { DOCUMENT_QR_SIZE, drawDocumentQr, renderDocumentQrPng } from './documentQr'

/**
 * Server-side rendering of a payment receipt — same pipeline as invoice / contract PDFs
 * (PDFKit + unique QR in the header).
 */

export type ReceiptAgencyInfo = PdfAgencyInfo

export interface ReceiptInfo {
  id: string
  number: string
  paidAt: Date | string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  vehicleLabel?: string
  description: string
  amount: number
  currency: string
  paymentMethod: string
  notes?: string
}

const paymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash':
      return 'Espèces'
    case 'card':
      return 'Carte bancaire'
    case 'transfer':
      return 'Virement'
    case 'cheque':
      return 'Chèque'
    default:
      return method
  }
}

/**
 * Generate the receipt PDF and resolve with the complete document buffer.
 */
export const buildReceiptPdf = async (
  receipt: ReceiptInfo,
  agency: ReceiptAgencyInfo,
): Promise<Buffer> => {
  const [logo, qrPng] = await Promise.all([
    readLogo(agency.avatar),
    renderDocumentQrPng('receipt', receipt.id, receipt.number),
  ])

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Reçu ${receipt.number}`,
      Author: agency.fullName,
      Subject: 'Reçu de paiement',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const left = PAGE_MARGIN
  const right = PAGE_MARGIN + CONTENT_WIDTH
  const currency = receipt.currency || 'TND'
  let y = PAGE_MARGIN

  //
  // Header — left agency + center logo + right N°/date/QR (same style as contract)
  //
  const headerTop = y
  const logoMaxW = 78
  const logoMaxH = 46
  const logoX = left + (CONTENT_WIDTH - logoMaxW) / 2
  const qrX = right - DOCUMENT_QR_SIZE
  const titleW = 210
  const titleX = qrX - 12 - titleW
  const leftColW = Math.max(120, logoX - left - 14)
  const qrBottom = drawDocumentQr(doc, qrPng, qrX, headerTop)

  doc.font('Helvetica-Bold').fontSize(12).fillColor(ORANGE)
  doc.text(`N° ${receipt.number}`, titleX, headerTop, { width: titleW, align: 'right' })
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
  doc.text(formatDate(receipt.paidAt), titleX, doc.y + 3, { width: titleW, align: 'right' })
  const metaBottom = doc.y

  let logoBottom = headerTop
  if (logo) {
    try {
      doc.image(logo, logoX, headerTop, { fit: [logoMaxW, logoMaxH], align: 'center' })
      logoBottom = headerTop + logoMaxH
    } catch (err) {
      logger.info(`[receiptPdf] logo could not be embedded for ${receipt.number}`, err)
    }
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY_DARK)
  doc.text(agency.fullName || '', left, headerTop, { width: leftColW })

  let identityY = doc.y + 2
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  for (const line of [
    agency.taxId ? `M.F : ${agency.taxId}` : '',
    agency.rneNumber ? `R.N.E : ${agency.rneNumber}` : '',
    agency.email || '',
    [agency.phone, agency.phone2].filter(Boolean).join(' | '),
  ].filter(Boolean)) {
    doc.text(line, left, identityY, { width: leftColW })
    identityY = doc.y + 1
  }

  y = Math.max(identityY, logoBottom, qrBottom, metaBottom) + 6

  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY)
  doc.text('REÇU DE PAIEMENT', left, y, {
    width: CONTENT_WIDTH,
    align: 'center',
  })
  y = doc.y + 6

  doc.moveTo(left, y).lineTo(right, y).lineWidth(1.5).strokeColor(ORANGE).stroke()
  y += 12

  // Paid stamp
  doc.roundedRect(left, y, 72, 20, 10).fill(ORANGE)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY_DARK)
  doc.text('PAYÉ', left, y + 5, { width: 72, align: 'center' })
  y += 32

  //
  // Client / payment cards
  //
  const gap = 16
  const colW = (CONTENT_WIDTH - gap) / 2
  const boxH = 88
  const drawPartyBox = (boxLeft: number, title: string, rows: [string, string][]) => {
    doc.rect(boxLeft, y, colW, boxH).lineWidth(0.8).strokeColor(BORDER).stroke()
    doc.rect(boxLeft, y, colW, 20).fill(BAND)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
    doc.text(title, boxLeft + 10, y + 6, { width: colW - 20 })
    let rowY = y + 28
    for (const [label, value] of rows) {
      if (!value) {
        continue
      }
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      doc.text(label, boxLeft + 10, rowY, { width: colW - 20 })
      doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY_DARK)
      doc.text(value, boxLeft + 10, rowY + 11, { width: colW - 20 })
      rowY += 26
    }
  }

  drawPartyBox(left, 'CLIENT', [
    ['Nom', receipt.clientName],
    ['E-mail', receipt.clientEmail || ''],
    ['Téléphone', receipt.clientPhone || ''],
  ])
  drawPartyBox(left + colW + gap, 'RÈGLEMENT', [
    ['Mode', paymentMethodLabel(receipt.paymentMethod)],
    ['Véhicule', receipt.vehicleLabel || ''],
  ])
  y += boxH + 18

  //
  // Amount table
  //
  const tableH = 54
  doc.rect(left, y, CONTENT_WIDTH, 22).fill(NAVY)
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE)
  doc.text('DESIGNATION', left + 10, y + 7, { width: CONTENT_WIDTH - 140 })
  doc.text('MONTANT', right - 120, y + 7, { width: 110, align: 'right' })

  doc.rect(left, y + 22, CONTENT_WIDTH, tableH - 22).lineWidth(0.5).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY_DARK)
  doc.text(receipt.description, left + 10, y + 32, { width: CONTENT_WIDTH - 140 })
  doc.font('Helvetica-Bold').fontSize(11)
  doc.text(`${money(receipt.amount)} ${currency}`, right - 120, y + 32, {
    width: 110,
    align: 'right',
  })
  y += tableH + 12

  // Total bar
  doc.rect(left, y, CONTENT_WIDTH, 36).fill('#fff8f0')
  doc.rect(left, y, CONTENT_WIDTH, 36).lineWidth(0.8).strokeColor('#f0e0c8').stroke()
  doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY_DARK)
  doc.text('TOTAL ENCAISSÉ TTC', left + 12, y + 12, { width: 220 })
  doc.font('Helvetica-Bold').fontSize(14)
  doc.text(`${money(receipt.amount)} ${currency}`, right - 160, y + 10, {
    width: 148,
    align: 'right',
  })
  y += 48

  if (receipt.notes) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
    doc.text('NOTES', left, y)
    doc.font('Helvetica').fontSize(9).fillColor(NAVY_DARK)
    doc.text(receipt.notes, left, y + 12, { width: CONTENT_WIDTH })
    y = doc.y + 16
  }

  // Signatures
  const signW = (CONTENT_WIDTH - gap) / 2
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
  doc.text('CACHET / SIGNATURE AGENCE', left, y, { width: signW })
  doc.text('SIGNATURE CLIENT', left + signW + gap, y, { width: signW })
  doc.moveTo(left, y + 48).lineTo(left + signW, y + 48).lineWidth(0.6).strokeColor(BORDER).stroke()
  doc.moveTo(left + signW + gap, y + 48).lineTo(right, y + 48).lineWidth(0.6).strokeColor(BORDER).stroke()
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  doc.text(agency.fullName || '', left, y + 52, { width: signW })
  doc.text(receipt.clientName, left + signW + gap, y + 52, { width: signW })

  // Footer
  const { contactLine, webLine } = footerLines(agency)
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i)
    const fy = A4_HEIGHT - PAGE_MARGIN - 34
    doc.moveTo(left, fy).lineTo(right, fy).lineWidth(0.8).strokeColor(ORANGE).stroke()
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    if (contactLine) {
      doc.text(contactLine, left, fy + 6, { width: CONTENT_WIDTH, align: 'center' })
    }
    if (webLine) {
      doc.text(webLine, left, fy + 16, { width: CONTENT_WIDTH, align: 'center' })
    }
  }

  doc.end()
  return done
}
