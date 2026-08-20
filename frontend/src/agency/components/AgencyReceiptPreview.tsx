import React from 'react'
import * as bookcarsHelper from ':bookcars-helper'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import * as AgencyProfileService from '@/agency/services/AgencyProfileService'
import type { AgencyReceipt, AgencyReceiptPaymentMethod } from '@/agency/types/receipt'
import env from '@/config/env.config'

const paymentLabel = (method: AgencyReceiptPaymentMethod) => {
  switch (method) {
    case 'cash':
      return strings.RECEIPT_PAY_CASH
    case 'card':
      return strings.RECEIPT_PAY_CARD
    case 'transfer':
      return strings.RECEIPT_PAY_TRANSFER
    case 'cheque':
      return strings.RECEIPT_PAY_CHEQUE
    default:
      return method
  }
}

const formatDate = (value: string, language: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

interface AgencyReceiptPreviewProps {
  receipt: AgencyReceipt
  agency: bookcarsTypes.User
  language?: string
  elementId?: string
}

const AgencyReceiptPreview = ({
  receipt,
  agency,
  language = 'fr',
  elementId = 'agency-receipt-print',
}: AgencyReceiptPreviewProps) => {
  const logoUrl = agency.avatar ? AgencyProfileService.resolveLogoUrl(agency.avatar) : ''
  const currency = receipt.currency || env.BASE_CURRENCY || 'TND'
  const amountLabel = bookcarsHelper.formatPrice(receipt.amount, currency, language)
  const contactLine = [agency.address, agency.city, agency.phone].filter(Boolean).join(' · ')

  return (
    <article className="agency-receipt-sheet" id={elementId}>
      <div className="agency-receipt-sheet-frame">
        <div className="agency-receipt-hero">
          <div className="agency-receipt-hero-brand">
            {logoUrl ? (
              <img src={logoUrl} alt={agency.fullName} className="agency-receipt-logo" />
            ) : (
              <div className="agency-receipt-logo-fallback" aria-hidden>
                {(agency.fullName || 'D').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="agency-receipt-brand-kicker">DRIVOO PARTNER</p>
              <h3>{agency.fullName}</h3>
              {contactLine ? <p>{contactLine}</p> : null}
              {agency.email ? <p>{agency.email}</p> : null}
            </div>
          </div>

          <div className="agency-receipt-hero-doc">
            <span className="agency-receipt-badge">{strings.RECEIPT_DOC_TITLE}</span>
            <strong className="agency-receipt-doc-number">{receipt.number}</strong>
            <p className="agency-receipt-doc-date">{formatDate(receipt.paidAt, language)}</p>
            <span className="agency-receipt-paid-stamp">{strings.RECEIPT_PAID}</span>
          </div>
        </div>

        <section className="agency-receipt-parties">
          <div className="agency-receipt-party-card">
            <span>{strings.RECEIPT_CLIENT}</span>
            <strong>{receipt.clientName}</strong>
            {receipt.clientEmail ? <p>{receipt.clientEmail}</p> : null}
            {receipt.clientPhone ? <p>{receipt.clientPhone}</p> : null}
          </div>
          <div className="agency-receipt-party-card">
            <span>{strings.RECEIPT_PAYMENT}</span>
            <strong>{paymentLabel(receipt.paymentMethod)}</strong>
            {receipt.vehicleLabel ? (
              <>
                <span className="agency-receipt-inline-label">{strings.RECEIPT_VEHICLE}</span>
                <p>{receipt.vehicleLabel}</p>
              </>
            ) : null}
          </div>
        </section>

        <div className="agency-receipt-table-card">
          <table className="agency-receipt-lines">
            <thead>
              <tr>
                <th>{strings.RECEIPT_DESCRIPTION}</th>
                <th>{strings.RECEIPT_AMOUNT}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong className="agency-receipt-line-title">{receipt.description}</strong>
                </td>
                <td>{amountLabel}</td>
              </tr>
            </tbody>
          </table>

          <div className="agency-receipt-total-bar">
            <div>
              <span>{strings.RECEIPT_TOTAL}</span>
              <p>{strings.RECEIPT_TOTAL_HINT}</p>
            </div>
            <strong>{amountLabel}</strong>
          </div>
        </div>

        {receipt.notes ? (
          <div className="agency-receipt-notes">
            <span>{strings.RECEIPT_NOTES}</span>
            <p>{receipt.notes}</p>
          </div>
        ) : null}

        <footer className="agency-receipt-foot">
          <div className="agency-receipt-sign">
            <span>{strings.RECEIPT_SIGN_AGENCY}</span>
            <div className="agency-receipt-sign-line" />
            <p>{agency.fullName}</p>
          </div>
          <div className="agency-receipt-sign">
            <span>{strings.RECEIPT_SIGN_CLIENT}</span>
            <div className="agency-receipt-sign-line" />
            <p>{receipt.clientName}</p>
          </div>
        </footer>

        <div className="agency-receipt-bottom">
          <p>{strings.RECEIPT_THANKS}</p>
          <p className="agency-receipt-foot-muted">{strings.RECEIPT_FOOTER}</p>
        </div>
      </div>
    </article>
  )
}

export default AgencyReceiptPreview
export { paymentLabel, formatDate }
