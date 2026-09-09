import { buildAgencyDocumentQrValue } from './documentQr'
import { formatDate, money, ribFromIban, type PdfAgencyInfo } from './pdfShared'

/**
 * Structured XML export of an agency invoice (accounting / archive interchange).
 * Complements the PDF — same data, machine-readable.
 */

export interface InvoiceXmlLine {
  designation: string
  contractNumber?: string
  vehicleLabel?: string
  periodFrom?: string
  periodTo?: string
  dailyLevy?: number
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceXmlInfo {
  id: string
  number: string
  issueCity: string
  issueDate: Date | string
  clientCode?: string
  clientName: string
  clientIdNumber?: string
  clientPhone?: string
  clientAddress?: string
  object: string
  lines: InvoiceXmlLine[]
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

export type InvoiceXmlAgencyInfo = PdfAgencyInfo

const esc = (value: unknown): string => {
  const text = value == null ? '' : String(value)
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const tag = (name: string, value: unknown, indent = 2): string => {
  const pad = ' '.repeat(indent)
  const body = esc(value)
  if (!body) {
    return `${pad}<${name}/>`
  }
  return `${pad}<${name}>${body}</${name}>`
}

const isoDate = (value: Date | string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString()
}

/**
 * Build a UTF-8 XML document for the given invoice + agency letterhead.
 */
export const buildInvoiceXml = (
  invoice: InvoiceXmlInfo,
  agency: InvoiceXmlAgencyInfo,
): string => {
  const currency = invoice.currency || 'TND'
  const qrPayload = buildAgencyDocumentQrValue('invoice', invoice.id, invoice.number)
  const rib = ribFromIban(agency.iban)
  const generatedAt = new Date().toISOString()

  const linesXml = invoice.lines.map((line, index) => [
    `    <Line index="${index + 1}">`,
    tag('Designation', line.designation, 6),
    tag('ContractNumber', line.contractNumber, 6),
    tag('VehicleLabel', line.vehicleLabel, 6),
    tag('PeriodFrom', line.periodFrom, 6),
    tag('PeriodTo', line.periodTo, 6),
    tag('DailyLevy', money(line.dailyLevy || 0), 6),
    tag('Quantity', line.quantity, 6),
    tag('UnitPrice', money(line.unitPrice), 6),
    tag('Total', money(line.total), 6),
    '    </Line>',
  ].join('\n')).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice',
    '  xmlns="https://drivoo.app/schemas/agency-invoice/1.0"',
    '  schemaVersion="1.0"',
    `  generatedAt="${esc(generatedAt)}">`,
    '  <Document>',
    tag('Id', invoice.id),
    tag('Number', invoice.number),
    tag('IssueDate', isoDate(invoice.issueDate)),
    tag('IssueDateLabel', formatDate(invoice.issueDate)),
    tag('IssueCity', invoice.issueCity),
    tag('Currency', currency),
    tag('Object', invoice.object),
    tag('Notes', invoice.notes),
    '  </Document>',
    '  <Seller>',
    tag('Name', agency.fullName),
    tag('TaxId', agency.taxId),
    tag('RneNumber', agency.rneNumber),
    tag('Iban', agency.iban),
    tag('Rib', rib),
    tag('Email', agency.email),
    tag('Phone', agency.phone),
    tag('Phone2', agency.phone2),
    tag('Phone3', agency.phone3),
    tag('Website', agency.website),
    tag('Address', agency.address),
    tag('PostalCode', agency.postalCode),
    tag('City', agency.city),
    tag('Governorate', agency.governorate),
    '  </Seller>',
    '  <Buyer>',
    tag('Code', invoice.clientCode),
    tag('Name', invoice.clientName),
    tag('IdNumber', invoice.clientIdNumber),
    tag('Phone', invoice.clientPhone),
    tag('Address', invoice.clientAddress),
    '  </Buyer>',
    '  <Lines>',
    linesXml || '    <!-- empty -->',
    '  </Lines>',
    '  <Fiscal>',
    tag('Discount', money(invoice.discount)),
    tag('VatRate', invoice.vatRate),
    tag('StampDuty', money(invoice.stampDuty)),
    tag(
      'DailyLevy',
      money(invoice.lines.reduce((sum, line) => sum + (Number(line.dailyLevy) || 0), 0)),
    ),
    '  </Fiscal>',
    '  <Totals>',
    tag('Gross', money(invoice.totalGross)),
    tag('HT', money(invoice.totalHT)),
    tag('VAT', money(invoice.totalVAT)),
    tag('TTC', money(invoice.totalTTC)),
    tag('Paid', money(invoice.totalPaid)),
    tag('BalanceDue', money(invoice.balanceDue)),
    '  </Totals>',
    '  <Payments>',
    tag('Cash', money(invoice.payments.cash)),
    tag('Cheque', money(invoice.payments.cheque)),
    tag('Draft', money(invoice.payments.draft)),
    tag('Card', money(invoice.payments.card)),
    tag('Transfer', money(invoice.payments.transfer)),
    '  </Payments>',
    '  <Authentication>',
    tag('DocumentId', invoice.id),
    tag('QrPayload', qrPayload),
    '  </Authentication>',
    '</Invoice>',
    '',
  ].join('\n')
}
