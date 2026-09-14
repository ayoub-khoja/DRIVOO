import type * as bookcarsTypes from ':bookcars-types'
import type { AgencyContract } from '@/agency/types/contract'
import { computeDailyLevyTotal, round3 } from '@/agency/utils/invoiceMath'

const PAYMENT_METHOD_MAP: Record<string, keyof bookcarsTypes.AgencyInvoicePayments> = {
  Espèce: 'cash',
  Chèque: 'cheque',
  Traite: 'draft',
  TPE: 'card',
  Virement: 'transfer',
}

const formatPeriodLabel = (from?: string, to?: string) => {
  const format = (value?: string) => {
    if (!value) {
      return ''
    }
    try {
      return new Date(value).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return value
    }
  }
  const start = format(from)
  const end = format(to)
  if (start && end) {
    return `Location d'un véhicule du ${start} au ${end}`
  }
  return 'Location de véhicule'
}

const mapPayments = (
  payments: bookcarsTypes.AgencyContractPayment[] | undefined,
): bookcarsTypes.AgencyInvoicePayments => {
  const result: bookcarsTypes.AgencyInvoicePayments = {
    cash: 0,
    cheque: 0,
    draft: 0,
    card: 0,
    transfer: 0,
  }
  for (const payment of payments || []) {
    const key = PAYMENT_METHOD_MAP[payment.method]
    if (!key) {
      continue
    }
    result[key] = round3(result[key] + (Number(payment.amount) || 0))
  }
  return result
}

/**
 * Build an invoice payload from a saved contract + the rental HT used at creation.
 * Does not alter contract/invoice calculation logic — the invoice API recomputes totals.
 */
export const buildInvoicePayloadFromContract = (
  contract: AgencyContract,
  rentalHT: number,
  agency?: bookcarsTypes.User | null,
): bookcarsTypes.CreateAgencyInvoicePayload => {
  const dailyLevy = computeDailyLevyTotal(
    contract.departureDate,
    contract.returnDate,
    undefined,
    contract.dailyLevyRate,
  )
  const rentalLineTotal = round3(Math.max(0, Number(rentalHT) || 0))
  const vehicleLabel = [contract.vehicleModel, contract.vehiclePlate]
    .filter(Boolean)
    .join(' · ')

  const lines: bookcarsTypes.AgencyInvoiceLine[] = [
    {
      designation: 'Location véhicule',
      contractNumber: contract.number,
      vehicleLabel: vehicleLabel || undefined,
      periodFrom: contract.departureDate,
      periodTo: contract.returnDate,
      dailyLevy,
      quantity: 1,
      unitPrice: rentalLineTotal,
      total: rentalLineTotal,
    },
  ]

  for (const supplement of contract.supplements || []) {
    const label = supplement.label?.trim()
    const priceHT = round3(Math.max(0, Number(supplement.priceHT) || 0))
    if (!label || priceHT <= 0) {
      continue
    }
    lines.push({
      designation: label,
      contractNumber: contract.number,
      vehicleLabel: vehicleLabel || undefined,
      periodFrom: contract.departureDate,
      periodTo: contract.returnDate,
      dailyLevy: 0,
      quantity: 1,
      unitPrice: priceHT,
      total: priceHT,
    })
  }

  return {
    issueCity: contract.issueCity || '',
    issueDate: (contract.issueDate || '').slice(0, 10),
    clientName: contract.driver?.fullName?.trim() || '—',
    clientIdNumber: contract.driver?.idNumber?.trim() || undefined,
    clientPhone: contract.driver?.phone?.trim() || undefined,
    clientAddress: contract.driver?.address?.trim() || undefined,
    object: formatPeriodLabel(contract.departureDate, contract.returnDate),
    lines,
    discount: 0,
    vatRate: Number(contract.vatRate) || Number(agency?.invoiceVatRate) || 19,
    stampDuty: Number(agency?.invoiceStampDuty) || 1,
    payments: mapPayments(contract.payments),
    currency: contract.currency || 'TND',
    notes: contract.notes,
  }
}

export const getInvoiceLinkedContractNumbers = (
  invoice: bookcarsTypes.AgencyInvoice | null | undefined,
): string[] => {
  if (!invoice?.lines?.length) {
    return []
  }
  return [...new Set(
    invoice.lines
      .map((line) => line.contractNumber?.trim())
      .filter((value): value is string => !!value),
  )]
}

export const isInvoiceLinkedToContract = (
  invoice: bookcarsTypes.AgencyInvoice | null | undefined,
): boolean => getInvoiceLinkedContractNumbers(invoice).length > 0
