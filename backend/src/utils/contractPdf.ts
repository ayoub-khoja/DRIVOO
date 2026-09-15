import PDFDocument from 'pdfkit'
import * as logger from './logger'
import {
  A4_HEIGHT,
  A4_WIDTH,
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
import { DOCUMENT_QR_SIZE, drawDocumentQr, renderDocumentQrPng } from './documentQr'
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
import { ARABIC_FONT, ARABIC_FONT_BOLD, arabicTextOptions, loadArabicFonts, prepareArabicForPdf } from './arabicText'
import { computeContractTotals, CONTRACT_DAILY_LEVY_RATE } from './contractHelper'

/**
 * Server side rendering of a rental contract, laid out after the agency's paper form:
 * page 1 carries the vehicle, the drivers, the rental window, the money, the
 * walk-around checklist and the signatures; page 2 carries the general terms.
 * The layout never inserts an intermediate page (avoids a 3-page orphan).
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
  id: string
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
  dailyLevyRate?: number
  dailyLevyTotal?: number
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
  const [logo, qrPng] = await Promise.all([
    readLogo(agency.avatar),
    renderDocumentQrPng('contract', contract.id, contract.number),
  ])

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

  // Recompute levy / TVA / TTC from stored TOTAL H.TVA + rental window
  const totals = computeContractTotals({
    rentalHT: contract.totalHT,
    supplements: [],
    vatRate: contract.vatRate,
    payments: contract.payments,
    dailyLevyRate: contract.dailyLevyRate ?? CONTRACT_DAILY_LEVY_RATE,
    departureDate: contract.departureDate,
    returnDate: contract.returnDate,
  })
  const totalHT = totals.totalHT
  const dailyLevyRate = totals.dailyLevyRate
  const dailyLevyTotal = totals.dailyLevyTotal
  const totalVAT = totals.totalVAT
  const totalTTC = totals.totalTTC
  const balanceDue = totals.balanceDue

  let y = PAGE_MARGIN
  // Page 1 = contrat opérationnel + signatures ; page 2 = CGV uniquement.
  // Ne jamais créer de page intermédiaire (sinon signatures seules → 3 pages).
  let termsPage = false
  const SIGNATURE_BLOCK_H = 100
  const page1ContentMaxY = maxY - SIGNATURE_BLOCK_H

  /** Move to a new page only on the terms page; page 1 stays single-sheet. */
  const ensure = (height: number) => {
    if (!termsPage) {
      return
    }
    if (y + height > maxY) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  /** Small section heading with an orange tick. */
  const sectionTitle = (label: string) => {
    ensure(22)
    doc.rect(left, y + 1, 3, 10).fill(ORANGE)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY_DARK)
    doc.text(label.toUpperCase(), left + 10, y, { width: CONTENT_WIDTH })
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
    const labelW = 96
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    doc.text(`${label} :`, boxLeft + 8, top, { width: labelW })
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY_DARK)
    doc.text(value, boxLeft + 8 + labelW, top, { width: boxWidth - labelW - 16 })
    return Math.max(doc.y, top + 11) + 2
  }

  //
  // Header — left agency + center logo + right N°/date/QR on one row
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

  // N° + date — right side, aligned with QR
  doc.font('Helvetica-Bold').fontSize(13).fillColor(ORANGE)
  doc.text(`N° ${contract.number}`, titleX, headerTop, { width: titleW, align: 'right' })
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
  const issueLine = contract.issueCity
    ? `${contract.issueCity.toUpperCase()} le ${formatDateTime(contract.issueDate)}`
    : `Le ${formatDateTime(contract.issueDate)}`
  doc.text(issueLine, titleX, doc.y + 3, { width: titleW, align: 'right' })
  const metaBottom = doc.y

  // Logo + agency identity — same top as QR
  let logoBottom = headerTop
  if (logo) {
    try {
      doc.image(logo, logoX, headerTop, { fit: [logoMaxW, logoMaxH], align: 'center' })
      logoBottom = headerTop + logoMaxH
    } catch (err) {
      logger.info(`[contractPdf] logo could not be embedded for ${contract.number}`, err)
    }
  }

  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(NAVY_DARK)
  doc.text(agency.fullName || '', left, headerTop, { width: leftColW })

  let identityY = doc.y + 2
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
  for (const line of [
    agency.taxId ? `M.F : ${agency.taxId}` : '',
    agency.rneNumber ? `R.N.E : ${agency.rneNumber}` : '',
  ].filter(Boolean)) {
    doc.text(line, left, identityY, { width: leftColW })
    identityY = doc.y + 1
  }

  y = Math.max(identityY, logoBottom, qrBottom, metaBottom) + 8

  // Title under the brand / QR row
  doc.font('Helvetica-Bold').fontSize(17).fillColor(NAVY)
  doc.text('CONTRAT DE LOCATION', left, y, {
    width: CONTENT_WIDTH,
    align: 'center',
  })
  y = doc.y + 8

  doc.moveTo(left, y).lineTo(right, y).lineWidth(1.5).strokeColor(ORANGE).stroke()
  y += 10

  //
  // Vehicle band
  //
  const vehicleH = 26
  doc.rect(left, y, CONTENT_WIDTH, vehicleH).fill(NAVY)
  doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
  doc.text('VÉHICULE', left + 10, y + 8, { width: 70 })
  doc.font('Helvetica').fontSize(9).fillColor(WHITE)
  doc.text(
    [
      contract.vehicleModel,
      `Imm. ${contract.vehiclePlate}`,
      contract.vehicleCategory ? `Catégorie : ${contract.vehicleCategory}` : '',
      contract.vehicleFuel ? `Carburant : ${contract.vehicleFuel}` : '',
    ].filter(Boolean).join('   ·   '),
    left + 80,
    y + 8,
    { width: CONTENT_WIDTH - 90 },
  )
  y += vehicleH + 12

  //
  // Rental window (left) and drivers (right)
  //
  const gap = 14
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
    ry += 20
    for (const [label, value] of partyRows(contract.secondDriver)) {
      ry = fieldRow(rightLeft, colW, ry, label, value)
    }
  }

  const blockH = Math.max(ly, ry) - blockTop + 6
  doc.rect(left, blockTop, colW, blockH).lineWidth(0.8).strokeColor(BORDER).stroke()
  doc.rect(rightLeft, blockTop, colW, blockH).lineWidth(0.8).strokeColor(BORDER).stroke()
  y = Math.min(blockTop + blockH + 12, page1ContentMaxY)

  //
  // Supplements
  //
  sectionTitle('Suppléments')
  const supCols = [CONTENT_WIDTH - 300, 100, 80, 120]
  const supX = [left, left + supCols[0], left + supCols[0] + supCols[1], left + supCols[0] + supCols[1] + supCols[2]]
  const rowH = 17

  doc.rect(left, y, CONTENT_WIDTH, 16).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
  doc.text('SUPPLÉMENT', supX[0] + 8, y + 5, { width: supCols[0] - 16 })
  doc.text('TARIF HT', supX[1], y + 5, { width: supCols[1] - 8, align: 'right' })
  doc.text('TVA', supX[2], y + 5, { width: supCols[2] - 8, align: 'right' })
  doc.text('TARIF TTC', supX[3], y + 5, { width: supCols[3] - 8, align: 'right' })
  y += 16

  if (contract.supplements.length === 0) {
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
    doc.text('Aucun supplément', supX[0] + 8, y + 4, { width: CONTENT_WIDTH - 16 })
    doc.rect(left, y, CONTENT_WIDTH, rowH).lineWidth(0.5).strokeColor(BORDER).stroke()
    y += rowH
  } else {
    for (const sup of contract.supplements) {
      if (y + rowH > page1ContentMaxY) {
        break
      }
      doc.font('Helvetica').fontSize(8.5).fillColor(NAVY_DARK)
      doc.text(sup.label, supX[0] + 8, y + 4, { width: supCols[0] - 16 })
      doc.text(money(sup.priceHT), supX[1], y + 4, { width: supCols[1] - 8, align: 'right' })
      doc.text(`${sup.vatRate}%`, supX[2], y + 4, { width: supCols[2] - 8, align: 'right' })
      doc.font('Helvetica-Bold')
      doc.text(money(sup.priceTTC), supX[3], y + 4, { width: supCols[3] - 8, align: 'right' })
      doc.rect(left, y, CONTENT_WIDTH, rowH).lineWidth(0.5).strokeColor(BORDER).stroke()
      y += rowH
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

  doc.rect(left, y, CONTENT_WIDTH, 16).fill(BAND)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
  doc.text('DATE', payX[0] + 8, y + 5, { width: payCols[0] - 8 })
  doc.text('MONTANT', payX[1], y + 5, { width: payCols[1] - 8, align: 'right' })
  doc.text('NATURE', payX[2] + 10, y + 5, { width: payCols[2] - 10 })
  doc.text('ÉTAT', payX[3], y + 5, { width: payCols[3] - 8 })
  doc.text('RAP', payX[4], y + 5, { width: payCols[4] - 8, align: 'right' })
  y += 16

  if (contract.payments.length === 0) {
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
    doc.text('Aucun règlement enregistré', payX[0] + 8, y + 4, { width: CONTENT_WIDTH - 16 })
    doc.rect(left, y, CONTENT_WIDTH, rowH).lineWidth(0.5).strokeColor(BORDER).stroke()
    y += rowH
  } else {
    for (const pay of contract.payments) {
      if (y + rowH > page1ContentMaxY) {
        break
      }
      doc.font('Helvetica').fontSize(8.5).fillColor(NAVY_DARK)
      doc.text(formatDate(pay.date) || dash(pay.date), payX[0] + 8, y + 4, { width: payCols[0] - 8 })
      doc.font('Helvetica-Bold')
      doc.text(money(pay.amount), payX[1], y + 4, { width: payCols[1] - 8, align: 'right' })
      doc.font('Helvetica')
      doc.text(pay.method, payX[2] + 10, y + 4, { width: payCols[2] - 10 })
      doc.text(dash(pay.status), payX[3], y + 4, { width: payCols[3] - 8 })
      doc.text(money(pay.balance || 0), payX[4], y + 4, { width: payCols[4] - 8, align: 'right' })
      doc.rect(left, y, CONTENT_WIDTH, rowH).lineWidth(0.5).strokeColor(BORDER).stroke()
      y += rowH
    }
  }
  y += 10

  //
  // Totals strip — H.TVA | prélèvement | TVA | TTC | reste
  //
  if (y + 32 <= page1ContentMaxY) {
    doc.rect(left, y, CONTENT_WIDTH, 30).fill(BAND)
    doc.rect(left, y, CONTENT_WIDTH, 30).lineWidth(0.5).strokeColor(BORDER).stroke()
    const levyLabel = dailyLevyRate > 0
      ? `PRÉLÈVEMENT (${dailyLevyRate} Dt/j)`
      : 'PRÉLÈVEMENT JOURNALIER'
    const totalCells: [string, string][] = [
      ['TOTAL H.TVA', `${money(totalHT)} ${currency}`],
      [levyLabel, `${money(dailyLevyTotal)} ${currency}`],
      [`TVA ${contract.vatRate}%`, `${money(totalVAT)} ${currency}`],
      ['TOTAL LOCATION TTC', `${money(totalTTC)} ${currency}`],
      ['RESTE À PAYER', `${money(balanceDue)} ${currency}`],
    ]
    const cellW = CONTENT_WIDTH / totalCells.length
    totalCells.forEach(([label, value], index) => {
      const cx = left + index * cellW
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
      doc.text(label, cx + 4, y + 5, { width: cellW - 8 })
      const strong = index === totalCells.length - 1 && balanceDue > 0
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(strong ? DANGER : NAVY_DARK)
      doc.text(value, cx + 4, y + 16, { width: cellW - 8 })
    })
    y += 36
  }

  //
  // Walk-around checklist
  //
  sectionTitle('État des lieux — si non coché : mauvais état')
  const checked = new Map(contract.checklist.map((item) => [item.key, item.ok]))
  const perRow = 5
  const itemW = CONTENT_WIDTH / perRow
  const checkRowH = 14
  const rowsCount = Math.ceil(CONTRACT_CHECKLIST.length / perRow)

  if (y + rowsCount * checkRowH <= page1ContentMaxY) {
    CONTRACT_CHECKLIST.forEach((item, index) => {
      const cx = left + (index % perRow) * itemW
      const cy = y + Math.floor(index / perRow) * checkRowH
      const ok = checked.get(item.key) !== false

      doc.rect(cx + 4, cy + 2, 8, 8).lineWidth(0.7).strokeColor(ok ? NAVY : DANGER).stroke()
      if (ok) {
        doc.moveTo(cx + 5.5, cy + 5.5).lineTo(cx + 7.5, cy + 7.5).lineTo(cx + 11, cy + 3.5)
          .lineWidth(1).strokeColor(NAVY).stroke()
      }
      doc.font('Helvetica').fontSize(7.5).fillColor(ok ? NAVY_DARK : DANGER)
      doc.text(item.label, cx + 16, cy + 2, { width: itemW - 22 })
    })
    y += rowsCount * checkRowH + 8
  }

  if (contract.notes && y + 16 <= page1ContentMaxY) {
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    doc.text(`Observations : ${contract.notes}`, left, y, {
      width: CONTENT_WIDTH,
      height: Math.max(12, page1ContentMaxY - y - 2),
      ellipsis: true,
    })
    y = Math.min(doc.y + 6, page1ContentMaxY)
  }

  //
  // Declarations and signatures — always anchored on page 1 (never alone on page 2)
  //
  const ack =
    "Je reconnais avoir accepté les Conditions Générales de Location spécifiées au verso de ce contrat, avoir reçu et accepté l'état des lieux du véhicule indiqué, et je m'engage à restituer le véhicule à la date et au lieu prévus."
  doc.font('Helvetica').fontSize(7)
  const ackH = doc.heightOfString(ack, { width: CONTENT_WIDTH })
  const signBoxH = 34
  const sigNeeded = ackH + 4 + 10 + 8 + 12 + signBoxH
  let sigTop = y + 4
  if (sigTop + sigNeeded > maxY) {
    sigTop = Math.max(PAGE_MARGIN, maxY - sigNeeded)
  }
  y = sigTop

  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
  doc.text(ack, left, y, { width: CONTENT_WIDTH })
  y = doc.y + 4
  doc.font('Helvetica-Bold').fontSize(7).fillColor(DANGER)
  doc.text('PASSÉE LA DATE DE RETOUR PRÉVUE, LE CONTRAT N\'EST PLUS VALABLE POUR LOCATION.', left, y, { width: CONTENT_WIDTH })
  y = doc.y + 8

  const signW = (CONTENT_WIDTH - 20) / 2
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
  doc.text('CACHET ET SIGNATURE SOCIÉTÉ', left, y, { width: signW, align: 'center' })
  doc.text('SIGNATURE DU CLIENT', left + signW + 20, y, { width: signW, align: 'center' })
  doc.rect(left, y + 12, signW, signBoxH).lineWidth(0.8).strokeColor(BORDER).dash(3, { space: 3 }).stroke()
  doc.rect(left + signW + 20, y + 12, signW, signBoxH).lineWidth(0.8).strokeColor(BORDER).stroke()
  doc.undash()

  //
  // Page 2 — bilingual general terms: French on the left, Arabic on the right,
  // laid out on a single page like the agency's printed form.
  // Tighter margins/gutter than page 1 so clauses can render larger.
  //
  termsPage = true
  doc.addPage()

  const termsMargin = 24
  // Keep clauses above the footer rule (drawn at A4_HEIGHT - PAGE_MARGIN - 34).
  const termsFooterReserve = PAGE_MARGIN + 34 - termsMargin + 8
  const termsLeft = termsMargin
  const termsRight = A4_WIDTH - termsMargin
  const termsContentW = termsRight - termsLeft
  const termGap = 8
  const termColW = (termsContentW - termGap) / 2
  const frenchX = termsLeft
  const arabicX = termsLeft + termColW + termGap
  y = termsMargin

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
    const options = arabic
      ? arabicTextOptions(termColW)
      : { width: termColW, align: 'justify' as const }

    doc.font(regular).fontSize(size)
    let h = doc.heightOfString(
      arabic ? prepareArabicForPdf(withAgencyName(intro, agency.fullName)) : withAgencyName(intro, agency.fullName),
      options,
    ) + (arabic ? 2 : 3)

    for (const article of articles) {
      doc.font(bold).fontSize(size)
      h += doc.heightOfString(
        arabic ? prepareArabicForPdf(withAgencyName(article.title, agency.fullName)) : withAgencyName(article.title, agency.fullName),
        options,
      ) + (arabic ? 0.25 : 0.5)
      doc.font(regular).fontSize(size)
      for (const paragraph of article.paragraphs) {
        const raw = withAgencyName(paragraph, agency.fullName)
        h += doc.heightOfString(arabic ? prepareArabicForPdf(raw) : raw, options) + (arabic ? 0.25 : 0.5)
      }
      h += arabic ? 1 : 1.5
    }
    return h
  }

  /** Draw one Arabic paragraph; rtla keeps list dashes on the right edge. */
  const drawArabicParagraph = (raw: string, x: number, cy: number, size: number): number => {
    doc.fontSize(size).text(prepareArabicForPdf(raw), x, cy, arabicTextOptions(termColW))
    return doc.y
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
    if (arabic) {
      cy = drawArabicParagraph(withAgencyName(intro, agency.fullName), x, cy, size) + 2
    } else {
      doc.text(withAgencyName(intro, agency.fullName), x, cy, options)
      cy = doc.y + 3
    }

    for (const article of articles) {
      doc.font(bold).fontSize(size).fillColor(NAVY)
      if (arabic) {
        cy = drawArabicParagraph(withAgencyName(article.title, agency.fullName), x, cy, size) + 0.25
      } else {
        doc.text(withAgencyName(article.title, agency.fullName), x, cy, options)
        cy = doc.y + 0.5
      }

      doc.font(regular).fontSize(size).fillColor(NAVY_DARK)
      for (const paragraph of article.paragraphs) {
        const raw = withAgencyName(paragraph, agency.fullName)
        if (arabic) {
          cy = drawArabicParagraph(raw, x, cy, size) + 0.25
        } else {
          doc.text(raw, x, cy, options)
          cy = doc.y + 0.5
        }
      }
      cy += arabic ? 1 : 1.5
    }
    return cy
  }

  // Title band: keep FR + AR on a single line each to free vertical space for the clauses
  const titleY = y
  let frTitleSize = 12
  doc.font('Helvetica-Bold')
  while (frTitleSize > 9 && doc.fontSize(frTitleSize).widthOfString(CONTRACT_TERMS_TITLE_FR) > termColW) {
    frTitleSize -= 0.5
  }
  doc.font('Helvetica-Bold').fontSize(frTitleSize).fillColor(NAVY)
  doc.text(CONTRACT_TERMS_TITLE_FR, frenchX, titleY, { width: termColW, lineBreak: false })
  const termsTitleBottom = titleY + frTitleSize + 2

  let arTitleBottom = termsTitleBottom
  if (arabicEnabled) {
    let arTitleSize = 16
    doc.font(ARABIC_FONT_BOLD)
    while (
      arTitleSize > 11
      && doc.fontSize(arTitleSize).widthOfString(CONTRACT_TERMS_TITLE_AR, arabicTextOptions(termColW)) > termColW
    ) {
      arTitleSize -= 0.5
    }
    doc.font(ARABIC_FONT_BOLD).fontSize(arTitleSize).fillColor(NAVY)
    doc.text(CONTRACT_TERMS_TITLE_AR, arabicX, titleY - 1, arabicTextOptions(termColW, { lineBreak: false }))
    arTitleBottom = titleY + arTitleSize + 2
  }
  y = Math.max(termsTitleBottom, arTitleBottom) + 2

  doc.moveTo(termsLeft, y).lineTo(termsRight, y).lineWidth(1.2).strokeColor(ORANGE).stroke()
  y += 4

  // Boxed warning, as on the paper form
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DANGER)
  const warnH = doc.heightOfString(CONTRACT_TERMS_IMPORTANT_FR, { width: termsContentW - 16 }) + 8
  doc.rect(termsLeft, y, termsContentW, warnH).lineWidth(0.8).strokeColor(DANGER).dash(3, { space: 2 }).stroke()
  doc.undash()
  doc.text(CONTRACT_TERMS_IMPORTANT_FR, termsLeft + 8, y + 4, { width: termsContentW - 16 })
  y += warnH + 4

  // Auto-fit: French column size, then a larger Arabic size when there is room below.
  // Binary search keeps the same visual result with far fewer expensive heightOfString calls
  // (Arabic + rtla bypasses PDFKit's layout cache and was slow in production).
  const available = A4_HEIGHT - termsMargin - termsFooterReserve - y

  const fitSize = (min: number, max: number, arabic: boolean): number => {
    const articles = arabic ? CONTRACT_TERMS_AR : CONTRACT_TERMS_FR
    const intro = arabic ? CONTRACT_TERMS_INTRO_AR : CONTRACT_TERMS_INTRO_FR
    const steps: number[] = []
    for (let s = min; s <= max + 1e-9; s += 0.25) {
      steps.push(Math.round(s * 100) / 100)
    }
    let lo = 0
    let hi = steps.length - 1
    let best = steps[0]
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (columnHeight(articles, intro, steps[mid], arabic) <= available) {
        best = steps[mid]
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return best
  }

  const termSize = fitSize(5, 10, false)
  const arTermSize = arabicEnabled ? fitSize(termSize, 18, true) : termSize

  drawColumn(CONTRACT_TERMS_FR, CONTRACT_TERMS_INTRO_FR, y, termSize, false)
  if (arabicEnabled) {
    drawColumn(CONTRACT_TERMS_AR, CONTRACT_TERMS_INTRO_AR, y, arTermSize, true)
  }

  // Separator between the two language columns
  doc.moveTo(arabicX - termGap / 2, y).lineTo(arabicX - termGap / 2, A4_HEIGHT - termsMargin - termsFooterReserve)
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

    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    if (contactLine) {
      doc.text(contactLine, left, fy + 6, { width: CONTENT_WIDTH, align: 'center' })
    }
    if (webLine) {
      doc.text(webLine, left, fy + 16, { width: CONTENT_WIDTH, align: 'center' })
    }
    if (range.count > 1) {
      doc.fontSize(7.5).text(`${i - range.start + 1} / ${range.count}`, left, fy + 6, {
        width: CONTENT_WIDTH,
        align: 'right',
      })
    }
  }

  doc.end()
  return done
}
