import PDFDocument from 'pdfkit'
import {
  A4_HEIGHT,
  A4_WIDTH,
  BAND,
  BORDER,
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

export type ContractRecapRow = {
  number: string
  issueDate: Date | string
  driverName: string
  vehicleModel: string
  vehiclePlate: string
  departureDate: Date | string
  returnDate: Date | string
  totalTTC: number
  totalPaid: number
  balanceDue: number
}

export type ContractRecapInfo = {
  from: Date | string
  to: Date | string
  currency: string
  rows: ContractRecapRow[]
}

const LANDSCAPE_WIDTH = A4_HEIGHT
const LANDSCAPE_HEIGHT = A4_WIDTH
const CONTENT_W = LANDSCAPE_WIDTH - PAGE_MARGIN * 2
/** Space reserved at the bottom so footers never trigger an automatic page break. */
const FOOTER_ZONE = 44
const CONTENT_BOTTOM = LANDSCAPE_HEIGHT - FOOTER_ZONE
const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 }

/**
 * Period recap PDF for agency rental contracts (landscape table + totals).
 * Margins are zeroed so footers can sit in the bottom band without PDFKit
 * spawning empty overflow pages.
 */
export const buildContractRecapPdf = async (
  recap: ContractRecapInfo,
  agency: PdfAgencyInfo,
): Promise<Buffer> => {
  const logo = await readLogo(agency.avatar)
  const totalTTC = recap.rows.reduce((sum, row) => sum + (Number(row.totalTTC) || 0), 0)
  const totalPaid = recap.rows.reduce((sum, row) => sum + (Number(row.totalPaid) || 0), 0)
  const totalBalance = recap.rows.reduce((sum, row) => sum + (Number(row.balanceDue) || 0), 0)
  const currency = recap.currency || 'TND'

  const doc = new PDFDocument({
    size: [LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT],
    margin: 0,
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: `Recap contrats ${formatDate(recap.from)} - ${formatDate(recap.to)}`,
      Author: agency.fullName,
      Subject: 'Récapitulatif des contrats de location',
    },
  })
  doc.page.margins = { ...ZERO_MARGINS }

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  const addLandscapePage = () => {
    doc.addPage({ size: [LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT], margin: 0 })
    doc.page.margins = { ...ZERO_MARGINS }
  }

  const drawHeader = (yStart: number): number => {
    let y = yStart
    if (logo) {
      try {
        doc.image(logo, PAGE_MARGIN, y, { height: 36, fit: [120, 36] })
      } catch {
        // ignore logo errors
      }
    }
    doc.fillColor(NAVY_DARK).font('Helvetica-Bold').fontSize(16)
    doc.text(agency.fullName || 'Agence', PAGE_MARGIN + 130, y, {
      width: CONTENT_W - 280,
      lineBreak: false,
    })
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(13)
    doc.text('RÉCAPITULATIF DES CONTRATS', PAGE_MARGIN, y, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    })
    y += 42
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    doc.text(
      `Période : ${formatDate(recap.from)} → ${formatDate(recap.to)}  ·  ${recap.rows.length} contrat(s)`,
      PAGE_MARGIN,
      y,
      { width: CONTENT_W, lineBreak: false },
    )
    y += 18
    doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_W, y).strokeColor(ORANGE).lineWidth(2).stroke()
    return y + 12
  }

  const widths = [70, 58, 110, 120, 110, 70, 70, 70]
  const headers = ['N°', 'Date', 'Conducteur', 'Véhicule', 'Période', 'Total TTC', 'Payé', 'Solde']

  const drawTableHeader = (y: number): number => {
    doc.rect(PAGE_MARGIN, y, CONTENT_W, 22).fill(NAVY)
    let x = PAGE_MARGIN + 4
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8)
    headers.forEach((label, i) => {
      doc.text(label, x, y + 7, {
        width: widths[i] - 6,
        align: i >= 5 ? 'right' : 'left',
        lineBreak: false,
      })
      x += widths[i]
    })
    return y + 22
  }

  let y = drawHeader(PAGE_MARGIN)
  y = drawTableHeader(y)

  const ensureSpace = (needed: number) => {
    if (y + needed <= CONTENT_BOTTOM) {
      return
    }
    addLandscapePage()
    y = drawHeader(PAGE_MARGIN)
    y = drawTableHeader(y)
  }

  recap.rows.forEach((row, index) => {
    ensureSpace(28)
    if (index % 2 === 0) {
      doc.rect(PAGE_MARGIN, y, CONTENT_W, 26).fill(BAND)
    }
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.moveTo(PAGE_MARGIN, y + 26).lineTo(PAGE_MARGIN + CONTENT_W, y + 26).stroke()

    const cells = [
      row.number,
      formatDate(row.issueDate),
      row.driverName || '—',
      [row.vehicleModel || '—', row.vehiclePlate].filter(Boolean).join(' · '),
      `${formatDate(row.departureDate)} → ${formatDate(row.returnDate)}`,
      `${money(row.totalTTC)} ${currency}`,
      `${money(row.totalPaid)} ${currency}`,
      `${money(row.balanceDue)} ${currency}`,
    ]

    let x = PAGE_MARGIN + 4
    doc.fillColor(NAVY_DARK).font('Helvetica').fontSize(8)
    cells.forEach((value, i) => {
      doc.text(String(value), x, y + 8, {
        width: widths[i] - 6,
        align: i >= 5 ? 'right' : 'left',
        lineBreak: false,
        ellipsis: true,
      })
      x += widths[i]
    })
    y += 26
  })

  ensureSpace(70)
  y += 10
  doc.rect(PAGE_MARGIN, y, CONTENT_W, 48).fill(NAVY_DARK)
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
  doc.text('TOTAUX DE LA PÉRIODE', PAGE_MARGIN + 12, y + 10, { lineBreak: false })
  doc.font('Helvetica').fontSize(9)
  doc.text(
    `Contrats : ${recap.rows.length}    ·    Total TTC : ${money(totalTTC)} ${currency}    ·    Payé : ${money(totalPaid)} ${currency}    ·    Solde : ${money(totalBalance)} ${currency}`,
    PAGE_MARGIN + 12,
    y + 28,
    { width: CONTENT_W - 24, lineBreak: false },
  )

  const pages = doc.bufferedPageRange()
  const { contactLine, webLine } = footerLines(agency)
  const pageLabel = (index: number) => `Page ${index + 1}/${pages.count}`

  for (let i = 0; i < pages.count; i += 1) {
    doc.switchToPage(i)
    doc.page.margins = { ...ZERO_MARGINS }
    const footerY = LANDSCAPE_HEIGHT - 30
    doc.fillColor(MUTED).font('Helvetica').fontSize(7)
    doc.text(contactLine, PAGE_MARGIN, footerY, {
      width: CONTENT_W * 0.62,
      lineBreak: false,
      ellipsis: true,
    })
    doc.text([webLine, pageLabel(i)].filter(Boolean).join('  ·  '), PAGE_MARGIN + CONTENT_W * 0.62, footerY, {
      width: CONTENT_W * 0.38,
      align: 'right',
      lineBreak: false,
      ellipsis: true,
    })
  }

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}
