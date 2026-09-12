import { Request, Response } from 'express'
import mongoose from 'mongoose'
import AgencyContract from '../models/AgencyContract'
import AgencyInvoice from '../models/AgencyInvoice'
import AgencyReceipt from '../models/AgencyReceipt'
import User from '../models/User'
import type { AgencyDocumentKind } from '../utils/documentQr'
import { buildContractPdf } from '../utils/contractPdf'
import { buildInvoicePdf } from '../utils/invoicePdf'
import { buildReceiptPdf } from '../utils/receiptPdf'
import { CONTRACT_DAILY_LEVY_RATE } from '../utils/contractHelper'
import type { PdfAgencyInfo } from '../utils/pdfShared'
import * as logger from '../utils/logger'

const KINDS: AgencyDocumentKind[] = ['contract', 'invoice', 'receipt']

const isKind = (value: string): value is AgencyDocumentKind =>
  KINDS.includes(value as AgencyDocumentKind)

const toAgencyInfo = (agency: {
  fullName?: string
  email?: string
  avatar?: string
  address?: string
  city?: string
  governorate?: string
  postalCode?: string
  phone?: string
  phone2?: string
  phone3?: string
  website?: string
  taxId?: string
  rneNumber?: string
  iban?: string
} | null): PdfAgencyInfo => ({
  fullName: agency?.fullName || '',
  email: agency?.email,
  avatar: agency?.avatar,
  address: agency?.address,
  city: agency?.city,
  governorate: agency?.governorate,
  postalCode: agency?.postalCode,
  phone: agency?.phone,
  phone2: agency?.phone2,
  phone3: agency?.phone3,
  website: agency?.website,
  taxId: agency?.taxId,
  rneNumber: agency?.rneNumber,
  iban: agency?.iban,
})

const sendPdf = (
  res: Response,
  pdf: Buffer,
  filename: string,
  download?: unknown,
) => {
  const disposition = download ? 'attachment' : 'inline'
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Length', pdf.length)
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`)
  res.status(200).end(pdf)
}

/**
 * Public document authenticity check (no auth).
 * Returns limited fields so a phone scan can confirm the PDF is genuine.
 */
export const verifyDocument = async (req: Request, res: Response) => {
  const { kind, id } = req.params

  try {
    if (!isKind(kind) || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ valid: false, message: 'Invalid document reference' })
      return
    }

    if (kind === 'contract') {
      const contract = await AgencyContract.findById(id).lean()
      if (!contract) {
        res.status(404).json({ valid: false, message: 'Document not found' })
        return
      }
      const agency = await User.findById(contract.agency).select('fullName avatar city phone').lean()
      res.json({
        valid: true,
        kind,
        number: contract.number,
        issueDate: contract.issueDate,
        issueCity: contract.issueCity || '',
        agency: {
          fullName: agency?.fullName || '',
          avatar: agency?.avatar || '',
          city: agency?.city || '',
          phone: agency?.phone || '',
        },
        contract: {
          vehicleModel: contract.vehicleModel,
          vehiclePlate: contract.vehiclePlate,
          driverName: contract.driver?.fullName || '',
          departureDate: contract.departureDate,
          returnDate: contract.returnDate,
          departurePlace: contract.departurePlace || '',
          returnPlace: contract.returnPlace || '',
          currency: contract.currency,
          totalTTC: contract.totalTTC,
        },
      })
      return
    }

    if (kind === 'invoice') {
      const invoice = await AgencyInvoice.findById(id).lean()
      if (!invoice) {
        res.status(404).json({ valid: false, message: 'Document not found' })
        return
      }
      const agency = await User.findById(invoice.agency).select('fullName avatar city phone').lean()
      res.json({
        valid: true,
        kind,
        number: invoice.number,
        issueDate: invoice.issueDate,
        issueCity: invoice.issueCity || '',
        agency: {
          fullName: agency?.fullName || '',
          avatar: agency?.avatar || '',
          city: agency?.city || '',
          phone: agency?.phone || '',
        },
        invoice: {
          clientName: invoice.clientName,
          object: invoice.object,
          currency: invoice.currency,
          totalTTC: invoice.totalTTC,
          balanceDue: invoice.balanceDue,
        },
      })
      return
    }

    const receipt = await AgencyReceipt.findById(id).lean()
    if (!receipt) {
      res.status(404).json({ valid: false, message: 'Document not found' })
      return
    }
    const agency = await User.findById(receipt.agency).select('fullName avatar city phone').lean()
    res.json({
      valid: true,
      kind,
      number: receipt.number,
      issueDate: receipt.paidAt,
      issueCity: '',
      agency: {
        fullName: agency?.fullName || '',
        avatar: agency?.avatar || '',
        city: agency?.city || '',
        phone: agency?.phone || '',
      },
      receipt: {
        clientName: receipt.clientName,
        description: receipt.description,
        amount: receipt.amount,
        currency: receipt.currency,
        paymentMethod: receipt.paymentMethod,
        vehicleLabel: receipt.vehicleLabel || '',
      },
    })
  } catch (err) {
    logger.error('[document.verifyDocument] error', err)
    res.status(500).json({ valid: false, message: 'Verification failed' })
  }
}

/**
 * Public PDF stream for QR scans (no auth).
 * Serves the same document as the agency download, inline so phones open the file.
 */
export const verifyDocumentPdf = async (req: Request, res: Response) => {
  const { kind, id } = req.params

  try {
    if (!isKind(kind) || !mongoose.isValidObjectId(id)) {
      res.status(400).send('Invalid document reference')
      return
    }

    if (kind === 'contract') {
      const contract = await AgencyContract.findById(id)
      if (!contract) {
        res.status(404).send('Document not found')
        return
      }
      const agency = await User.findById(contract.agency)
      const pdf = await buildContractPdf(
        {
          id: String(contract._id),
          number: contract.number,
          issueCity: contract.issueCity || '',
          issueDate: contract.issueDate,
          vehicleModel: contract.vehicleModel,
          vehiclePlate: contract.vehiclePlate,
          vehicleCategory: contract.vehicleCategory,
          vehicleFuel: contract.vehicleFuel,
          driver: contract.driver,
          secondDriver: contract.secondDriver,
          departureDate: contract.departureDate,
          departurePlace: contract.departurePlace || '',
          departureKm: contract.departureKm,
          departureFuel: contract.departureFuel,
          returnDate: contract.returnDate,
          returnPlace: contract.returnPlace || '',
          returnKm: contract.returnKm,
          returnFuel: contract.returnFuel,
          kmLimitPerDay: contract.kmLimitPerDay,
          extraKmPrice: contract.extraKmPrice,
          extraHourPrice: contract.extraHourPrice,
          extraDayPrice: contract.extraDayPrice,
          deposit: contract.deposit,
          depositReason: contract.depositReason,
          vatRate: contract.vatRate,
          dailyLevyRate: contract.dailyLevyRate ?? CONTRACT_DAILY_LEVY_RATE,
          dailyLevyTotal: contract.dailyLevyTotal ?? 0,
          supplements: contract.supplements,
          payments: contract.payments,
          checklist: contract.checklist,
          currency: contract.currency,
          notes: contract.notes,
          totalHT: contract.totalHT,
          totalVAT: contract.totalVAT,
          totalTTC: contract.totalTTC,
          totalPaid: contract.totalPaid,
          balanceDue: contract.balanceDue,
        },
        toAgencyInfo(agency),
      )
      sendPdf(res, pdf, `Contrat-${contract.number}.pdf`, req.query.download)
      return
    }

    if (kind === 'invoice') {
      const invoice = await AgencyInvoice.findById(id)
      if (!invoice) {
        res.status(404).send('Document not found')
        return
      }
      const agency = await User.findById(invoice.agency)
      const pdf = await buildInvoicePdf(
        {
          id: String(invoice._id),
          number: invoice.number,
          issueCity: invoice.issueCity || '',
          issueDate: invoice.issueDate,
          clientCode: invoice.clientCode,
          clientName: invoice.clientName,
          clientIdNumber: invoice.clientIdNumber,
          clientPhone: invoice.clientPhone,
          clientAddress: invoice.clientAddress,
          object: invoice.object || '',
          lines: invoice.lines,
          discount: invoice.discount,
          vatRate: invoice.vatRate,
          stampDuty: invoice.stampDuty,
          payments: invoice.payments,
          currency: invoice.currency,
          notes: invoice.notes,
          totalGross: invoice.totalGross,
          totalHT: invoice.totalHT,
          totalVAT: invoice.totalVAT,
          totalTTC: invoice.totalTTC,
          totalPaid: invoice.totalPaid,
          balanceDue: invoice.balanceDue,
        },
        toAgencyInfo(agency),
      )
      sendPdf(res, pdf, `Facture-${invoice.number}.pdf`, req.query.download)
      return
    }

    const receipt = await AgencyReceipt.findById(id)
    if (!receipt) {
      res.status(404).send('Document not found')
      return
    }
    const agency = await User.findById(receipt.agency)
    const pdf = await buildReceiptPdf(
      {
        id: String(receipt._id),
        number: receipt.number,
        paidAt: receipt.paidAt,
        clientName: receipt.clientName,
        clientEmail: receipt.clientEmail,
        clientPhone: receipt.clientPhone,
        vehicleLabel: receipt.vehicleLabel,
        description: receipt.description,
        amount: receipt.amount,
        currency: receipt.currency,
        paymentMethod: receipt.paymentMethod,
        notes: receipt.notes,
      },
      toAgencyInfo(agency),
    )
    sendPdf(res, pdf, `Recu-${receipt.number}.pdf`, req.query.download)
  } catch (err) {
    logger.error('[document.verifyDocumentPdf] error', err)
    res.status(500).send('Failed to open document')
  }
}
