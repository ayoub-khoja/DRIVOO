import { Request, Response } from 'express'
import mongoose from 'mongoose'
import AgencyContract from '../models/AgencyContract'
import AgencyInvoice from '../models/AgencyInvoice'
import AgencyReceipt from '../models/AgencyReceipt'
import User from '../models/User'
import type { AgencyDocumentKind } from '../utils/documentQr'
import * as logger from '../utils/logger'

const KINDS: AgencyDocumentKind[] = ['contract', 'invoice', 'receipt']

const isKind = (value: string): value is AgencyDocumentKind =>
  KINDS.includes(value as AgencyDocumentKind)

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
