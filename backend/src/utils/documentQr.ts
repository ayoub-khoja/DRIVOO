import QRCode from 'qrcode'
import { NAVY_DARK, WHITE } from './pdfShared'

/**
 * Unique, stable QR payload for agency printable documents.
 * Format: DRIVOO:<kind>:<number>:<mongoId>
 */
export type AgencyDocumentKind = 'contract' | 'invoice' | 'receipt'

export const DOCUMENT_QR_SIZE = 56

export const buildAgencyDocumentQrValue = (
  kind: AgencyDocumentKind,
  id: string,
  number: string,
): string => `DRIVOO:${kind}:${number}:${id}`

/** PNG buffer sized for crisp embedding in PDFKit. */
export const renderDocumentQrPng = async (
  kind: AgencyDocumentKind,
  id: string,
  number: string,
): Promise<Buffer> => {
  const value = buildAgencyDocumentQrValue(kind, id, number)
  return QRCode.toBuffer(value, {
    type: 'png',
    width: 168,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: NAVY_DARK,
      light: WHITE,
    },
  })
}

/**
 * Draw a scannable QR with a white pad in the document header (top-right).
 * Returns the bottom Y of the QR block (including the caption).
 */
export const drawDocumentQr = (
  doc: PDFKit.PDFDocument,
  qrPng: Buffer,
  x: number,
  y: number,
  size = DOCUMENT_QR_SIZE,
): number => {
  const pad = 3
  doc.rect(x - pad, y - pad, size + pad * 2, size + pad * 2).fill(WHITE)
  doc.image(qrPng, x, y, { width: size, height: size })
  doc.font('Helvetica').fontSize(6).fillColor('#7a889c')
  doc.text('Document unique', x - pad, y + size + 2, {
    width: size + pad * 2,
    align: 'center',
  })
  return y + size + 12
}
