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
  readLogo,
  type PdfAgencyInfo,
} from './pdfShared'

export type PeriodTableColumn = {
  label: string
  width: number
  align?: 'left' | 'right'
}

export type PeriodTablePdfInput = {
  title: string
  subject: string
  from: Date | string
  to: Date | string
  itemLabel: string
  columns: PeriodTableColumn[]
  rows: string[][]
  totalsTitle: string
  totalsLine: string
}

const LANDSCAPE_WIDTH = A4_HEIGHT
const LANDSCAPE_HEIGHT = A4_WIDTH
const CONTENT_W = LANDSCAPE_WIDTH - PAGE_MARGIN * 2
const FOOTER_ZONE = 44
const CONTENT_BOTTOM = LANDSCAPE_HEIGHT - FOOTER_ZONE
const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 }

/**
 * Landscape period summary table PDF (same layout used for contracts / invoices / receipts).
 * Zero page margins keep footers from spawning empty overflow pages.
 */
export const buildPeriodTablePdf = async (
  input: PeriodTablePdfInput,
  agency: PdfAgencyInfo,
): Promise<Buffer> => {
  const logo = await readLogo(agency.avatar)
  const colCount = input.columns.length
  const widths = input.columns.map((column) => column.width)

  const doc = new PDFDocument({
    size: [LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT],
    margin: 0,
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: `${input.title} ${formatDate(input.from)} - ${formatDate(input.to)}`,
      Author: agency.fullName,
      Subject: input.subject,
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
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(12)
    doc.text(input.title, PAGE_MARGIN, y, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    })
    y += 42
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    doc.text(
      `Periode : ${formatDate(input.from)} → ${formatDate(input.to)}  ·  ${input.rows.length} ${input.itemLabel}`,
      PAGE_MARGIN,
      y,
      { width: CONTENT_W, lineBreak: false },
    )
    y += 18
    doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_W, y).strokeColor(ORANGE).lineWidth(2).stroke()
    return y + 12
  }

  const drawTableHeader = (y: number): number => {
    doc.rect(PAGE_MARGIN, y, CONTENT_W, 22).fill(NAVY)
    let x = PAGE_MARGIN + 4
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8)
    input.columns.forEach((column, i) => {
      doc.text(column.label, x, y + 7, {
        width: widths[i] - 6,
        align: column.align === 'right' ? 'right' : 'left',
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

  input.rows.forEach((cells, index) => {
    ensureSpace(28)
    if (index % 2 === 0) {
      doc.rect(PAGE_MARGIN, y, CONTENT_W, 26).fill(BAND)
    }
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.moveTo(PAGE_MARGIN, y + 26).lineTo(PAGE_MARGIN + CONTENT_W, y + 26).stroke()

    let x = PAGE_MARGIN + 4
    doc.fillColor(NAVY_DARK).font('Helvetica').fontSize(8)
    for (let i = 0; i < colCount; i += 1) {
      const align = input.columns[i]?.align === 'right' ? 'right' : 'left'
      doc.text(String(cells[i] ?? '—'), x, y + 8, {
        width: widths[i] - 6,
        align,
        lineBreak: false,
        ellipsis: true,
      })
      x += widths[i]
    }
    y += 26
  })

  ensureSpace(70)
  y += 10
  doc.rect(PAGE_MARGIN, y, CONTENT_W, 48).fill(NAVY_DARK)
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
  doc.text(input.totalsTitle, PAGE_MARGIN + 12, y + 10, { lineBreak: false })
  doc.font('Helvetica').fontSize(9)
  doc.text(input.totalsLine, PAGE_MARGIN + 12, y + 28, {
    width: CONTENT_W - 24,
    lineBreak: false,
  })

  const pages = doc.bufferedPageRange()
  const { contactLine, webLine } = footerLines(agency)

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
    doc.text([webLine, `Page ${i + 1}/${pages.count}`].filter(Boolean).join('  ·  '), PAGE_MARGIN + CONTENT_W * 0.62, footerY, {
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
