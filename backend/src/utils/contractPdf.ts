import PDFDocument from 'pdfkit'
import * as logger from './logger'
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
  formatDateTime,
  money,
  readLogo,
  type PdfAgencyInfo,
} from './pdfShared'
import {
  CONTRACT_CHECKLIST,
  CONTRACT_TERMS_AR,
  CONTRACT_TERMS_FR,
  CONTRACT_TERMS_IMPORTANT_FR,
  CONTRACT_TERMS_INTRO_AR,
  CONTRACT_TERMS_INTRO_FR,
  CONTRACT_TERMS_TITLE_AR,
  CONTRACT_TERMS_TITLE_FR,
  withAgencyName,
} from './contractTerms'
import { ARABIC_FONT, ARABIC_FONT_BOLD, loadArabicFonts } from './arabicText'

/**
 * Server side rendering of a rental contract, laid out after the agency's paper form:
 * page 1 carries the vehicle, the drivers, the rental window, the money and the
 * walk-around checklist; page 2 carries the general terms and conditions.
 */

export type ContractAgencyInfo = PdfAgencyInfo

export interface ContractPartyInfo {
  fullName: string
  birthDate?: string
  idNumber?: string
  nationality?: string
  licenseNumber?: string
  licenseIssuedAt?: string
  address?: string
  phone?: string
}

export interface ContractInfo {
  number: string
  issueCity: string
  issueDate: Date | string
  vehicleModel: string
  vehiclePlate: string
  vehicleCategory?: string
  vehicleFuel?: string
  driver: ContractPartyInfo
  secondDriver?: ContractPartyInfo
  departureDate: Date | string
  departurePlace: string
  departureKm: number
  departureFuel?: string
  returnDate: Date | string
  returnPlace: string
  returnKm?: number
  returnFuel?: string
  kmLimitPerDay?: number
  extraKmPrice?: number
  extraHourPrice?: number
  extraDayPrice?: number
  deposit: number
  depositReason?: string
  vatRate: number
  supplements: { label: string, priceHT: number, vatRate: number, priceTTC: number }[]
  payments: { date?: string, amount: number, method: string, status?: string, balance?: number }[]
  checklist: { key: string, ok: boolean }[]
  currency: string
  notes?: string
  totalHT: number
  totalVAT: number
  totalTTC: number
  totalPaid: number
  balanceDue: number
}

const dash = (value?: string | number | null): string => {
  if (value === 0) {
    return '0'
  }
  const text = String(value ?? '').trim()
  return text || '-----'
}

/**
 * Generate the rental contract PDF and resolve with the complete document buffer.
 *
 * @param {ContractInfo} contract
 * @param {ContractAgencyInfo} agency
 * @returns {Promise<Buffer>}
 */
export const buildContractPdf = async (
  contract: ContractInfo,
  agency: ContractAgencyInfo,
): Promise<Buffer> => {
  const logo = await readLogo(agency.avatar)

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Contrat ${contract.number}`,
      Author: agency.fullName,
      Subject: 'Contrat de location',
    },
  })

  // Arabic needs an embedded font; without it the document stays French-only.
  const arabicFonts = loadArabicFonts()
  const arabicEnabled = !!arabicFonts
  if (arabicFonts) {
    for (const [name, buffer] of Object.entries(arabicFonts)) {
      doc.registerFont(name, buffer)
    }
  }

  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const left = PAGE_MARGIN
  const right = PAGE_MARGIN + CONTENT_WIDTH
  const maxY = A4_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT
  const currency = contract.currency || 'TND'

  let y = PAGE_MARGIN

  /** Move to a new page when `height` no longer fits above the footer. */
  const ensure = (height: number) => {
    if (y + height > maxY) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  /** Small section heading with an orange tick. */
  const sectionTitle = (label: string) => {
    ensure(24)
    doc.rect(left, y + 2, 3, 10).fill(ORANGE)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY_DARK)
    doc.text(label.toUpperCase(), left + 10, y + 1, { width: CONTENT_WIDTH })
    y = doc.y + 6
  }

  /** One "Label : value" row inside a boxed column. */
  const fieldRow = (
    boxLeft: number,
    boxWidth: number,
    top: number,
    label: string,
    value: string,
  ): number => {
    const labelW = 92
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    doc.text(`${label} :`, boxLeft + 8, top, { width: labelW })
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
    doc.text(value, boxLeft + 8 + labelW, top, { width: boxWidth - labelW - 16 })
    return Math.max(doc.y, top + 10) + 1
  }

  //
  // Header — agency identity on the left, document title on the right
  //
  if (logo) {
    try {
      doc.image(logo, left, y, { fit: [130, 48] })
    } catch (err) {
      logger.info(`[contractPdf] logo could not be embedded for ${contract.number}`, err)
    }
  }

  const identityTop = logo ? y + 54 : y
  doc.font('Helvetica-Bold').fontSize(logo ? 12 : 15).fillColor(NAVY_DARK)
  doc.text(agency.fullName || '', left, identityTop, { width: 280 })

  let identityY = doc.y + 2
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  for (const line of [
    agency.taxId ? `M.F : ${agency.taxId}` : '',
    agency.rneNumber ? `R.N.E : ${agency.rneNumber}` : '',
  ].filter(Boolean)) {
    doc.text(line, left, identityY, { width: 280 })
    identityY = doc.y + 1
  }

  doc.font('Helvetica-Bold').fontSize(18).fillColor(NAVY)
  doc.text('CONTRAT DE LOCATION', right - 240, y, { width: 240, align: 'right' })
  doc.font('Helvetica-Bold').fontSize(12).fillColor(ORANGE)
  doc.text(`N° ${contract.number}`, right - 240, doc.y + 2, { width: 240, align: 'right' })
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
  const issueLine = contract.issueCity
    ? `${contract.issueCity.toUpperCase()} le ${formatDateTime(contract.issueDate)}`
    : `Le ${formatDateTime(contract.issueDate)}`
  doc.text(issueLine, right - 240, doc.y + 3, { width: 240, align: 'right' })

  y = Math.max(identityY, doc.y) + 10
  doc.moveTo(left, y).lineTo(right, y).lineWidth(1.5).strokeColor(ORANGE).stroke()
  y += 10

  //
  // Vehicle band
  //
  const vehicleH = 24
  doc.rect(left, y, CONTENT_WIDTH, vehicleH).fill(NAVY)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
  doc.text('VÉHICULE', left + 10, y + 9, { width: 70 })
  doc.font('Helvetica').fontSize(9).fillColor(WHITE)
  doc.text(
    [
      contract.vehicleModel,
      `Imm. ${contract.vehiclePlate}`,
      contract.vehicleCategory ? `Catégorie : ${contract.vehicleCategory}` : '',
      contract.vehicleFuel ? `Carburant : ${contract.vehicleFuel}` : '',
    ].filter(Boolean).join('   ·   '),
    left + 80,
    y + 9,
    { width: CONTENT_WIDTH - 90 },
  )
  y += vehicleH + 10

  //
  // Rental window (left) and drivers (right)
  //
  const gap = 16
  const colW = (CONTENT_WIDTH - gap) / 2
  const rightLeft = left + colW + gap
  const blockTop = y

  // -- left column: rental details
  let ly = blockTop + 22
  doc.rect(left, blockTop, colW, 18).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
  doc.text('RENSEIGNEMENTS SUR LA LOCATION', left + 8, blockTop + 5, { width: colW - 16 })

  ly = fieldRow(left, colW, ly, 'Date départ', formatDateTime(contract.departureDate))
  ly = fieldRow(left, colW, ly, 'Date retour', formatDateTime(contract.returnDate))
  ly = fieldRow(left, colW, ly, 'Lieu départ', dash(contract.departurePlace))
  ly = fieldRow(left, colW, ly, 'Lieu retour', dash(contract.returnPlace))
  ly = fieldRow(left, colW, ly, 'Kilométrage (D)', `${dash(contract.departureKm)} Km`)
  ly = fieldRow(left, colW, ly, 'Kilométrage (R)', contract.returnKm != null ? `${contract.returnKm} Km` : '----- Km')
  ly = fieldRow(left, colW, ly, 'Carburant (D)', dash(contract.departureFuel))
  ly = fieldRow(left, colW, ly, 'Carburant (R)', dash(contract.returnFuel))
  ly = fieldRow(left, colW, ly, 'Km/jour inclus', contract.kmLimitPerDay ? `${contract.kmLimitPerDay} Km/j` : '-----')
  ly = fieldRow(left, colW, ly, 'Excès km', contract.extraKmPrice ? `${contract.extraKmPrice} millimes/Km` : '-----')
  ly = fieldRow(left, colW, ly, 'Excès heure', contract.extraHourPrice ? `${money(contract.extraHourPrice)} ${currency}/h` : '-----')
  ly = fieldRow(left, colW, ly, 'Excès jour', contract.extraDayPrice ? `${money(contract.extraDayPrice)} ${currency}/j` : '-----')
  ly = fieldRow(left, colW, ly, 'Caution', `${money(contract.deposit)} ${currency}${contract.depositReason ? ` — ${contract.depositReason}` : ''}`)

  // -- right column: main driver then optional second driver
  let ry = blockTop + 22
  doc.rect(rightLeft, blockTop, colW, 18).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
  doc.text('CONDUCTEUR PRINCIPAL', rightLeft + 8, blockTop + 5, { width: colW - 16 })

  const partyRows = (party: ContractPartyInfo): [string, string][] => ([
    ['Nom & Prénom', party.fullName],
    ['Date de naissance', dash(party.birthDate)],
    ['CIN / Passeport', dash(party.idNumber)],
    ['Nationalité', dash(party.nationality)],
    ['N° Permis', dash(party.licenseNumber)],
    ['Délivré(e) le', dash(party.licenseIssuedAt)],
    ['Adresse', dash(party.address)],
    ['Tel', dash(party.phone)],
  ])

  for (const [label, value] of partyRows(contract.driver)) {
    ry = fieldRow(rightLeft, colW, ry, label, value)
  }

  if (contract.secondDriver?.fullName) {
    ry += 6
    doc.rect(rightLeft, ry, colW, 18).fill(BAND)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
    doc.text('2ÈME CONDUCTEUR', rightLeft + 8, ry + 5, { width: colW - 16 })
    ry += 22
    for (const [label, value] of partyRows(contract.secondDriver)) {
      ry = fieldRow(rightLeft, colW, ry, label, value)
    }
  }

  const blockH = Math.max(ly, ry) - blockTop + 6
  doc.rect(left, blockTop, colW, blockH).lineWidth(0.8).strokeColor(BORDER).stroke()
  doc.rect(rightLeft, blockTop, colW, blockH).lineWidth(0.8).strokeColor(BORDER).stroke()
  y = blockTop + blockH + 14

  //
  // Supplements
  //
  sectionTitle('Suppléments')
  const supCols = [CONTENT_WIDTH - 300, 100, 80, 120]
  const supX = [left, left + supCols[0], left + supCols[0] + supCols[1], left + supCols[0] + supCols[1] + supCols[2]]

  ensure(20)
  doc.rect(left, y, CONTENT_WIDTH, 16).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
  doc.text('SUPPLÉMENT', supX[0] + 8, y + 5, { width: supCols[0] - 16 })
  doc.text('TARIF HT', supX[1], y + 5, { width: supCols[1] - 8, align: 'right' })
  doc.text('TVA', supX[2], y + 5, { width: supCols[2] - 8, align: 'right' })
  doc.text('TARIF TTC', supX[3], y + 5, { width: supCols[3] - 8, align: 'right' })
  y += 16

  if (contract.supplements.length === 0) {
    ensure(18)
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
    doc.text('Aucun supplément', supX[0] + 8, y + 4, { width: CONTENT_WIDTH - 16 })
    doc.rect(left, y, CONTENT_WIDTH, 17).lineWidth(0.5).strokeColor(BORDER).stroke()
    y += 17
  } else {
    for (const sup of contract.supplements) {
      ensure(18)
      doc.font('Helvetica').fontSize(8.5).fillColor(NAVY_DARK)
      doc.text(sup.label, supX[0] + 8, y + 4, { width: supCols[0] - 16 })
      doc.text(money(sup.priceHT), supX[1], y + 4, { width: supCols[1] - 8, align: 'right' })
      doc.text(`${sup.vatRate}%`, supX[2], y + 4, { width: supCols[2] - 8, align: 'right' })
      doc.font('Helvetica-Bold')
      doc.text(money(sup.priceTTC), supX[3], y + 4, { width: supCols[3] - 8, align: 'right' })
      doc.rect(left, y, CONTENT_WIDTH, 17).lineWidth(0.5).strokeColor(BORDER).stroke()
      y += 17
    }
  }
  y += 10

  //
  // Payments
  //
  sectionTitle('Paiement')
  const payCols = [110, CONTENT_WIDTH - 470, 120, 100, 140]
  const payX: number[] = []
  payCols.reduce((acc, w, i) => {
    payX[i] = acc
    return acc + w
  }, left)

  ensure(20)
  doc.rect(left, y, CONTENT_WIDTH, 16).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
  doc.text('DATE', payX[0] + 8, y + 5, { width: payCols[0] - 8 })
  doc.text('MONTANT', payX[1], y + 5, { width: payCols[1] - 8, align: 'right' })
  doc.text('NATURE', payX[2] + 10, y + 5, { width: payCols[2] - 10 })
  doc.text('ÉTAT', payX[3], y + 5, { width: payCols[3] - 8 })
  doc.text('RAP', payX[4], y + 5, { width: payCols[4] - 8, align: 'right' })
  y += 16

  if (contract.payments.length === 0) {
    ensure(18)
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
    doc.text('Aucun règlement enregistré', payX[0] + 8, y + 4, { width: CONTENT_WIDTH - 16 })
    doc.rect(left, y, CONTENT_WIDTH, 17).lineWidth(0.5).strokeColor(BORDER).stroke()
    y += 17
  } else {
    for (const pay of contract.payments) {
      ensure(18)
      doc.font('Helvetica').fontSize(8.5).fillColor(NAVY_DARK)
      doc.text(formatDate(pay.date) || dash(pay.date), payX[0] + 8, y + 4, { width: payCols[0] - 8 })
      doc.font('Helvetica-Bold')
      doc.text(money(pay.amount), payX[1], y + 4, { width: payCols[1] - 8, align: 'right' })
      doc.font('Helvetica')
      doc.text(pay.method, payX[2] + 10, y + 4, { width: payCols[2] - 10 })
      doc.text(dash(pay.status), payX[3], y + 4, { width: payCols[3] - 8 })
      doc.text(money(pay.balance || 0), payX[4], y + 4, { width: payCols[4] - 8, align: 'right' })
      doc.rect(left, y, CONTENT_WIDTH, 17).lineWidth(0.5).strokeColor(BORDER).stroke()
      y += 17
    }
  }
  y += 10

  //
  // Totals strip
  //
  ensure(34)
  doc.rect(left, y, CONTENT_WIDTH, 30).fill(BAND)
  doc.rect(left, y, CONTENT_WIDTH, 30).lineWidth(0.5).strokeColor(BORDER).stroke()
  const totalCells: [string, string][] = [
    ['TOTAL H.TVA', `${money(contract.totalHT)} ${currency}`],
    [`TVA ${contract.vatRate}%`, `${money(contract.totalVAT)} ${currency}`],
    ['TOTAL LOCATION TTC', `${money(contract.totalTTC)} ${currency}`],
    ['RESTE À PAYER', `${money(contract.balanceDue)} ${currency}`],
  ]
  const cellW = CONTENT_WIDTH / totalCells.length
  totalCells.forEach(([label, value], index) => {
    const cx = left + index * cellW
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    doc.text(label, cx + 8, y + 6, { width: cellW - 16 })
    const strong = index === totalCells.length - 1 && contract.balanceDue > 0
    doc.font('Helvetica-Bold').fontSize(10).fillColor(strong ? DANGER : NAVY_DARK)
    doc.text(value, cx + 8, y + 16, { width: cellW - 16 })
  })
  y += 34

  //
  // Walk-around checklist
  //
  sectionTitle('État des lieux — si non coché : mauvais état')
  const checked = new Map(contract.checklist.map((item) => [item.key, item.ok]))
  const perRow = 5
  const itemW = CONTENT_WIDTH / perRow
  const rowsCount = Math.ceil(CONTRACT_CHECKLIST.length / perRow)

  ensure(rowsCount * 14 + 6)
  CONTRACT_CHECKLIST.forEach((item, index) => {
    const cx = left + (index % perRow) * itemW
    const cy = y + Math.floor(index / perRow) * 14
    const ok = checked.get(item.key) !== false

    doc.rect(cx + 4, cy + 1, 8, 8).lineWidth(0.7).strokeColor(ok ? NAVY : DANGER).stroke()
    if (ok) {
      doc.moveTo(cx + 5.5, cy + 5).lineTo(cx + 7.5, cy + 7.5).lineTo(cx + 10.5, cy + 2.5)
        .lineWidth(1).strokeColor(NAVY).stroke()
    }
    doc.font('Helvetica').fontSize(7.5).fillColor(ok ? NAVY_DARK : DANGER)
    doc.text(item.label, cx + 17, cy + 1.5, { width: itemW - 22 })
  })
  y += rowsCount * 14 + 8

  if (contract.notes) {
    ensure(30)
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    doc.text(`Observations : ${contract.notes}`, left, y, { width: CONTENT_WIDTH })
    y = doc.y + 10
  }

  //
  // Declarations and signatures
  //
  ensure(96)
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
  doc.text(
    "Je reconnais avoir accepté les Conditions Générales de Location spécifiées au verso de ce contrat, avoir reçu et accepté l'état des lieux du véhicule indiqué, et je m'engage à restituer le véhicule à la date et au lieu prévus.",
    left,
    y,
    { width: CONTENT_WIDTH },
  )
  y = doc.y + 4
  doc.font('Helvetica-Bold').fontSize(7).fillColor(DANGER)
  doc.text('PASSÉE LA DATE DE RETOUR PRÉVUE, LE CONTRAT N\'EST PLUS VALABLE POUR LOCATION.', left, y, { width: CONTENT_WIDTH })
  y = doc.y + 10

  const signW = (CONTENT_WIDTH - 20) / 2
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
  doc.text('CACHET ET SIGNATURE SOCIÉTÉ', left, y, { width: signW, align: 'center' })
  doc.text('SIGNATURE DU CLIENT', left + signW + 20, y, { width: signW, align: 'center' })
  doc.rect(left, y + 12, signW, 36).lineWidth(0.8).strokeColor(BORDER).dash(3, { space: 3 }).stroke()
  doc.rect(left + signW + 20, y + 12, signW, 36).lineWidth(0.8).strokeColor(BORDER).stroke()
  doc.undash()

  //
  // Page 2 — bilingual general terms: French on the left, Arabic on the right,
  // laid out on a single page like the agency's printed form.
  //
  doc.addPage()
  y = PAGE_MARGIN

  const termGap = 20
  const termColW = (CONTENT_WIDTH - termGap) / 2
  const frenchX = left
  const arabicX = left + termColW + termGap

  /**
   * Height a column needs at a given size, measured without drawing.
   * `heightOfString` accounts for the Arabic shaping too, since it goes through the
   * same fontkit layout as the actual rendering.
   */
  const columnHeight = (
    articles: typeof CONTRACT_TERMS_FR,
    intro: string,
    size: number,
    arabic: boolean,
  ): number => {
    const regular = arabic ? ARABIC_FONT : 'Helvetica'
    const bold = arabic ? ARABIC_FONT_BOLD : 'Helvetica-Bold'
    const options = { width: termColW, align: (arabic ? 'right' : 'justify') as 'right' | 'justify' }

    doc.font(regular).fontSize(size)
    let h = doc.heightOfString(withAgencyName(intro, agency.fullName), options) + 6

    for (const article of articles) {
      doc.font(bold).fontSize(size)
      h += doc.heightOfString(withAgencyName(article.title, agency.fullName), options) + 2
      doc.font(regular).fontSize(size)
      for (const paragraph of article.paragraphs) {
        h += doc.heightOfString(withAgencyName(paragraph, agency.fullName), options) + 2
      }
      h += 4
    }
    return h
  }

  /** Render one language column and return the y it ended at. */
  const drawColumn = (
    articles: typeof CONTRACT_TERMS_FR,
    intro: string,
    top: number,
    size: number,
    arabic: boolean,
  ): number => {
    const x = arabic ? arabicX : frenchX
    const regular = arabic ? ARABIC_FONT : 'Helvetica'
    const bold = arabic ? ARABIC_FONT_BOLD : 'Helvetica-Bold'
    const options = { width: termColW, align: (arabic ? 'right' : 'justify') as 'right' | 'justify' }
    let cy = top

    doc.font(regular).fontSize(size).fillColor(MUTED)
    doc.text(withAgencyName(intro, agency.fullName), x, cy, options)
    cy = doc.y + 6

    for (const article of articles) {
      doc.font(bold).fontSize(size).fillColor(NAVY)
      doc.text(withAgencyName(article.title, agency.fullName), x, cy, options)
      cy = doc.y + 2

      doc.font(regular).fontSize(size).fillColor(NAVY_DARK)
      for (const paragraph of article.paragraphs) {
        doc.text(withAgencyName(paragraph, agency.fullName), x, cy, options)
        cy = doc.y + 2
      }
      cy += 4
    }
    return cy
  }

  // Title band: French title on the left, Arabic title on the right
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY)
  doc.text(CONTRACT_TERMS_TITLE_FR, frenchX, y, { width: termColW })
  const titleBottom = doc.y
  if (arabicEnabled) {
    doc.font(ARABIC_FONT_BOLD).fontSize(14).fillColor(NAVY)
    doc.text(CONTRACT_TERMS_TITLE_AR, arabicX, y - 2, { width: termColW, align: 'right' })
  }
  y = Math.max(titleBottom, doc.y) + 4

  doc.moveTo(left, y).lineTo(right, y).lineWidth(1.2).strokeColor(ORANGE).stroke()
  y += 8

  // Boxed warning, as on the paper form
  doc.font('Helvetica-Bold').fontSize(7).fillColor(DANGER)
  const warnH = doc.heightOfString(CONTRACT_TERMS_IMPORTANT_FR, { width: CONTENT_WIDTH - 20 }) + 10
  doc.rect(left, y, CONTENT_WIDTH, warnH).lineWidth(0.8).strokeColor(DANGER).dash(3, { space: 2 }).stroke()
  doc.undash()
  doc.text(CONTRACT_TERMS_IMPORTANT_FR, left + 10, y + 5, { width: CONTENT_WIDTH - 20 })
  y += warnH + 8

  // Auto-fit: largest size at which both columns still fit on this page
  const available = A4_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT - y
  let termSize = 6.5
  for (const candidate of [6.5, 6, 5.5, 5, 4.5, 4]) {
    termSize = candidate
    const needed = Math.max(
      columnHeight(CONTRACT_TERMS_FR, CONTRACT_TERMS_INTRO_FR, candidate, false),
      arabicEnabled ? columnHeight(CONTRACT_TERMS_AR, CONTRACT_TERMS_INTRO_AR, candidate, true) : 0,
    )
    if (needed <= available) {
      break
    }
  }

  drawColumn(CONTRACT_TERMS_FR, CONTRACT_TERMS_INTRO_FR, y, termSize, false)
  if (arabicEnabled) {
    drawColumn(CONTRACT_TERMS_AR, CONTRACT_TERMS_INTRO_AR, y, termSize, true)
  }

  // Separator between the two language columns
  doc.moveTo(arabicX - termGap / 2, y).lineTo(arabicX - termGap / 2, A4_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT)
    .lineWidth(0.5).strokeColor(BORDER).stroke()

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
