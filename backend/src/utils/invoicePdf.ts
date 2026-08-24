import PDFDocument from 'pdfkit'
import * as logger from './logger'
import { spellAmount } from './numberToWords'
import {
  A4_HEIGHT,
  BAND,
  BORDER,
  CONTENT_WIDTH,
  DANGER,
  FOOTER_HEIGHT,
  MUTED,
  NAVY,
  NAVY_DARK,
  ORANGE,
  PAGE_MARGIN,
  WHITE,
  footerLines,
  formatDate,
  formatStamp,
  money,
  readLogo,
  ribFromIban,
  type PdfAgencyInfo,
} from './pdfShared'

/**
 * Server side rendering of an agency invoice, laid out after the Tunisian "FACTURE"
 * template: agency header with logo and fiscal identifiers, client block, designation
 * table, split payment / tax totals, amount in words and a contact footer.
 */

/** Column layout of the designation table, in points. */
const COL_DESIGNATION = 275
const COL_UNIT = 60
const COL_PRICE = 90
const COL_TOTAL = CONTENT_WIDTH - COL_DESIGNATION - COL_UNIT - COL_PRICE

export type InvoiceAgencyInfo = PdfAgencyInfo

export interface InvoiceLineInfo {
  designation: string
  contractNumber?: string
  vehicleLabel?: string
  periodFrom?: string
  periodTo?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceInfo {
  number: string
  issueCity: string
  issueDate: Date | string
  clientCode?: string
  clientName: string
  clientIdNumber?: string
  clientPhone?: string
  clientAddress?: string
  object: string
  lines: InvoiceLineInfo[]
  discount: number
  vatRate: number
  stampDuty: number
  payments: { cash: number, cheque: number, draft: number, card: number, transfer: number }
  currency: string
  notes?: string
  totalGross: number
  totalHT: number
  totalVAT: number
  totalTTC: number
  totalPaid: number
  balanceDue: number
}

/**
 * Generate the invoice PDF and resolve with the complete document buffer.
 *
 * @param {InvoiceInfo} invoice
 * @param {InvoiceAgencyInfo} agency
 * @returns {Promise<Buffer>}
 */
export const buildInvoicePdf = async (
  invoice: InvoiceInfo,
  agency: InvoiceAgencyInfo,
): Promise<Buffer> => {
  const logo = await readLogo(agency.avatar)

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Facture ${invoice.number}`,
      Author: agency.fullName,
      Subject: invoice.object || 'Facture',
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
  const maxY = A4_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT
  const currency = invoice.currency || 'TND'

  //
  // Header — agency identity on the left, document title on the right
  //
  let y = PAGE_MARGIN

  if (logo) {
    try {
      doc.image(logo, left, y, { fit: [140, 52] })
    } catch (err) {
      logger.info(`[invoicePdf] logo could not be embedded for ${invoice.number}`, err)
    }
  }

  const identityTop = logo ? y + 58 : y
  doc.font('Helvetica-Bold').fontSize(logo ? 12 : 16).fillColor(NAVY_DARK)
  doc.text(agency.fullName || '', left, identityTop, { width: COL_DESIGNATION })

  let identityY = doc.y + 2
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
  const rib = ribFromIban(agency.iban)
  const identityLines = [
    agency.taxId ? `Code TVA : ${agency.taxId}` : '',
    agency.iban ? `IBAN : ${agency.iban}` : '',
    rib ? `RIB : ${rib}` : '',
  ].filter(Boolean)
  for (const line of identityLines) {
    doc.text(line, left, identityY, { width: 300 })
    identityY = doc.y + 1
  }

  doc.font('Helvetica-Bold').fontSize(22).fillColor(NAVY)
  doc.text('FACTURE', right - 220, y, { width: 220, align: 'right' })
  doc.font('Helvetica-Bold').fontSize(12).fillColor(ORANGE)
  doc.text(`N° ${invoice.number}`, right - 220, doc.y + 2, { width: 220, align: 'right' })

  y = Math.max(identityY, doc.y) + 16

  doc.moveTo(left, y).lineTo(right, y).lineWidth(1.5).strokeColor(ORANGE).stroke()
  y += 14

  //
  // Client block
  //
  const clientRows: [string, string][] = []
  if (invoice.clientCode) {
    clientRows.push(['Code client', invoice.clientCode])
  }
  clientRows.push(['Client', invoice.clientName])
  if (invoice.clientIdNumber) {
    clientRows.push(["N° d'identité", invoice.clientIdNumber])
  }
  if (invoice.clientPhone) {
    clientRows.push(['Téléphone', invoice.clientPhone])
  }
  if (invoice.clientAddress) {
    clientRows.push(['Adresse', invoice.clientAddress])
  }

  const clientBoxW = 300
  const clientBoxTop = y
  let clientY = clientBoxTop + 10

  for (const [label, value] of clientRows) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
    doc.text(`${label} :`, left + 10, clientY, { width: 84 })
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY_DARK)
    doc.text(value, left + 98, clientY, { width: clientBoxW - 108 })
    clientY = Math.max(doc.y, clientY + 12) + 2
  }

  const clientBoxH = clientY - clientBoxTop + 4
  doc.rect(left, clientBoxTop, clientBoxW, clientBoxH)
    .lineWidth(0.8).strokeColor(BORDER).stroke()

  doc.font('Helvetica').fontSize(9.5).fillColor(NAVY_DARK)
  const placeLine = invoice.issueCity
    ? `${invoice.issueCity}, Le ${formatDate(invoice.issueDate)}`
    : `Le ${formatDate(invoice.issueDate)}`
  doc.text(placeLine, right - 220, clientBoxTop + 10, { width: 220, align: 'right' })

  y = clientBoxTop + clientBoxH + 12

  if (invoice.object) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY_DARK)
    doc.text('Objet : ', left, y, { continued: true })
    doc.font('Helvetica').fillColor(MUTED)
    doc.text(invoice.object, { width: CONTENT_WIDTH })
    y = doc.y + 12
  }

  //
  // Designation table
  //
  const colX = [
    left,
    left + COL_DESIGNATION,
    left + COL_DESIGNATION + COL_UNIT,
    left + COL_DESIGNATION + COL_UNIT + COL_PRICE,
  ]
  const colW = [COL_DESIGNATION, COL_UNIT, COL_PRICE, COL_TOTAL]

  const designationTitle = (line: InvoiceLineInfo): string => (
    line.contractNumber
      ? `${line.designation} — Contrat N° ${line.contractNumber}`
      : line.designation
  )

  const periodLabel = (line: InvoiceLineInfo): string => {
    const from = formatStamp(line.periodFrom)
    const to = formatStamp(line.periodTo)
    if (from && to) {
      return `Du ${from} au ${to}`
    }
    return from || to || ''
  }

  const drawTableHeader = (top: number): number => {
    const h = 22
    doc.rect(left, top, CONTENT_WIDTH, h).fill(NAVY)
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE)
    doc.text('DESIGNATION', colX[0] + 8, top + 7, { width: colW[0] - 16 })
    doc.text('UNITE', colX[1], top + 7, { width: colW[1], align: 'center' })
    doc.text('PRIX UNIT.', colX[2], top + 7, { width: colW[2] - 8, align: 'right' })
    doc.text('PRIX TOTAL', colX[3], top + 7, { width: colW[3] - 8, align: 'right' })
    return top + h
  }

  /** Height needed by one row, so we know whether it still fits on the page. */
  const measureRow = (line: InvoiceLineInfo): number => {
    const width = colW[0] - 16
    let h = 8
    doc.font('Helvetica-Bold').fontSize(9)
    h += doc.heightOfString(designationTitle(line), { width })
    doc.font('Helvetica').fontSize(8)
    if (line.vehicleLabel) {
      h += doc.heightOfString(line.vehicleLabel, { width }) + 1
    }
    const period = periodLabel(line)
    if (period) {
      h += doc.heightOfString(period, { width }) + 1
    }
    return Math.max(h + 8, 30)
  }

  y = drawTableHeader(y)

  invoice.lines.forEach((line, index) => {
    const rowH = measureRow(line)

    if (y + rowH > maxY) {
      doc.addPage()
      y = drawTableHeader(PAGE_MARGIN)
    }

    if (index % 2 === 1) {
      doc.rect(left, y, CONTENT_WIDTH, rowH).fill(BAND)
    }

    let textY = y + 6
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY_DARK)
    doc.text(designationTitle(line), colX[0] + 8, textY, { width: colW[0] - 16 })
    textY = doc.y

    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    if (line.vehicleLabel) {
      doc.text(line.vehicleLabel, colX[0] + 8, textY + 1, { width: colW[0] - 16 })
      textY = doc.y
    }
    const period = periodLabel(line)
    if (period) {
      doc.text(period, colX[0] + 8, textY + 1, { width: colW[0] - 16 })
    }

    doc.font('Helvetica').fontSize(9.5).fillColor(NAVY_DARK)
    doc.text(String(line.quantity), colX[1], y + 8, { width: colW[1], align: 'center' })
    doc.text(money(line.unitPrice), colX[2], y + 8, { width: colW[2] - 8, align: 'right' })
    doc.font('Helvetica-Bold')
    doc.text(money(line.total), colX[3], y + 8, { width: colW[3] - 8, align: 'right' })

    doc.rect(left, y, CONTENT_WIDTH, rowH).lineWidth(0.5).strokeColor(BORDER).stroke()
    y += rowH
  })

  // TOTAUX row
  const totauxH = 24
  if (y + totauxH > maxY) {
    doc.addPage()
    y = PAGE_MARGIN
  }
  doc.rect(left, y, CONTENT_WIDTH, totauxH).fill(BAND)
  doc.rect(left, y, CONTENT_WIDTH, totauxH).lineWidth(0.5).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY_DARK)
  doc.text('TOTAUX', colX[0] + 8, y + 8, { width: colW[0] })
  doc.text(money(invoice.totalGross), colX[3], y + 8, { width: colW[3] - 8, align: 'right' })
  y += totauxH + 16

  //
  // Payment breakdown (left) and fiscal totals (right)
  //
  const paymentRows: [string, string][] = [
    ['Espèce', money(invoice.payments.cash)],
    ['Chèque', money(invoice.payments.cheque)],
    ['Traite', money(invoice.payments.draft)],
    ['TPE', money(invoice.payments.card)],
    ['Virement', money(invoice.payments.transfer)],
  ]

  const totalRows: [string, string, boolean][] = [['TOTAL BRUT', money(invoice.totalGross), false]]
  if (invoice.discount > 0) {
    totalRows.push(['REMISE', `- ${money(invoice.discount)}`, false])
  }
  totalRows.push(['TOTAL HT', money(invoice.totalHT), false])
  totalRows.push([`TOTAL TVA ${invoice.vatRate}%`, money(invoice.totalVAT), false])
  totalRows.push(['TIMBRE FISCALE', money(invoice.stampDuty), false])
  totalRows.push(['TOTAL TTC', `${money(invoice.totalTTC)} ${currency}`, true])

  const boxGap = 20
  const boxW = (CONTENT_WIDTH - boxGap) / 2
  const rowH = 17
  const leftBoxH = 30 + paymentRows.length * rowH + 26
  const rightBoxH = 8 + totalRows.length * rowH + 8
  const blockH = Math.max(leftBoxH, rightBoxH)

  if (y + blockH > maxY) {
    doc.addPage()
    y = PAGE_MARGIN
  }

  // Left box — Reglement
  const lbTop = y
  doc.rect(left, lbTop, boxW, leftBoxH).lineWidth(0.8).strokeColor(BORDER).stroke()
  doc.rect(left, lbTop, boxW, 22).fill(NAVY)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
  doc.text('Réglement', left + 10, lbTop + 7, { width: boxW / 2 })
  doc.text(`${money(invoice.totalPaid)} ${currency}`, left + boxW / 2, lbTop + 7, {
    width: boxW / 2 - 10,
    align: 'right',
  })

  let ry = lbTop + 30
  for (const [label, value] of paymentRows) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
    doc.text(label, left + 10, ry, { width: boxW / 2 })
    doc.fillColor(NAVY_DARK)
    doc.text(value, left + boxW / 2, ry, { width: boxW / 2 - 10, align: 'right' })
    ry += rowH
  }

  doc.moveTo(left + 10, ry + 2).lineTo(left + boxW - 10, ry + 2)
    .lineWidth(0.5).strokeColor(BORDER).stroke()
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(invoice.balanceDue > 0 ? DANGER : NAVY_DARK)
  doc.text('Reste à payer', left + 10, ry + 8, { width: boxW / 2 })
  doc.text(`${money(invoice.balanceDue)} ${currency}`, left + boxW / 2, ry + 8, {
    width: boxW / 2 - 10,
    align: 'right',
  })

  // Right box — fiscal totals
  const rbLeft = left + boxW + boxGap
  const rbTop = y
  doc.rect(rbLeft, rbTop, boxW, rightBoxH).lineWidth(0.8).strokeColor(BORDER).stroke()

  let ty = rbTop + 8
  for (const [label, value, strong] of totalRows) {
    if (strong) {
      doc.rect(rbLeft + 1, ty - 3, boxW - 2, rowH + 2).fill(NAVY)
    }
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 10 : 9)
    doc.fillColor(strong ? WHITE : MUTED)
    doc.text(label, rbLeft + 10, ty, { width: boxW / 2 })
    doc.font('Helvetica-Bold').fillColor(strong ? WHITE : NAVY_DARK)
    doc.text(value, rbLeft + boxW / 2 - 10, ty, { width: boxW / 2, align: 'right' })
    ty += rowH
  }

  y += blockH + 16

  //
  // Amount in words, notes and signature
  //
  if (y + 90 > maxY) {
    doc.addPage()
    y = PAGE_MARGIN
  }

  doc.font('Helvetica').fontSize(9).fillColor(NAVY_DARK)
  doc.text('Arrêtée la présente facture à la somme de : ', left, y, { continued: true })
  doc.font('Helvetica-Bold')
  doc.text(`${spellAmount(invoice.totalTTC, currency)}.`, { width: CONTENT_WIDTH })
  y = doc.y + 10

  if (invoice.notes) {
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
    doc.text(invoice.notes, left, y, { width: CONTENT_WIDTH - 220 })
    y = Math.max(doc.y, y) + 8
  }

  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
  doc.text('CACHET ET SIGNATURE', right - 200, y + 6, { width: 200, align: 'center' })
  doc.rect(right - 200, y + 22, 200, 56)
    .lineWidth(0.8).strokeColor(BORDER).dash(3, { space: 3 }).stroke()
  doc.undash()

  //
  // Footer, repeated on every page
  //
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

    if (range.count > 1) {
      doc.fontSize(7).text(`${i - range.start + 1} / ${range.count}`, left, fy + 6, {
        width: CONTENT_WIDTH,
        align: 'right',
      })
    }
  }

  doc.end()
  return done
}
