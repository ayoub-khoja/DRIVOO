import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { CheckCircleOutline, HighlightOff } from '@mui/icons-material'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings } from '@/lang/verify-document'
import * as DocumentVerifyService from '@/services/DocumentVerifyService'
import type { VerifiedDocument } from '@/services/DocumentVerifyService'
import env from '@/config/env.config'

import '@/assets/css/verify-document.css'

const formatDate = (value?: string) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const money = (value: number, currency: string) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(3)} ${currency || ''}`.trim()

const kindLabel = (kind?: string) => {
  if (kind === 'contract') {
    return strings.KIND_CONTRACT
  }
  if (kind === 'invoice') {
    return strings.KIND_INVOICE
  }
  if (kind === 'receipt') {
    return strings.KIND_RECEIPT
  }
  return kind || ''
}

const VerifyDocument = () => {
  const { kind = '', id = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [doc, setDoc] = useState<VerifiedDocument | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await DocumentVerifyService.verifyDocument(kind, id)
        if (!cancelled) {
          setDoc(data)
          setError(!data?.valid)
        }
      } catch {
        if (!cancelled) {
          setDoc(null)
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kind, id])

  const avatarUrl = doc?.agency?.avatar
    ? (doc.agency.avatar.startsWith('http')
      ? doc.agency.avatar
      : `${env.CDN_USERS}/${doc.agency.avatar}`)
    : ''

  return (
    <Layout strict={false}>
      <div className="verify-document">
        <div className="verify-document-card">
          <h1>{strings.TITLE}</h1>
          <p className="vd-subtitle">{strings.SUBTITLE}</p>

          {loading && (
            <div className="verify-document-loading">
              <CircularProgress size={36} />
              <p>{strings.LOADING}</p>
            </div>
          )}

          {!loading && error && (
            <>
              <div className="verify-document-status bad">
                <HighlightOff />
                {strings.INVALID}
              </div>
              <p className="verify-document-error">{strings.INVALID_HINT}</p>
            </>
          )}

          {!loading && !error && doc?.valid && (
            <>
              <div className="verify-document-status ok">
                <CheckCircleOutline />
                {strings.VALID}
              </div>

              <span className="verify-document-kind">{kindLabel(doc.kind)}</span>

              <div className="verify-document-meta">
                <div className="verify-document-row">
                  <span className="label">{strings.NUMBER}</span>
                  <span className="value">{doc.number}</span>
                </div>
                <div className="verify-document-row">
                  <span className="label">{strings.ISSUED_ON}</span>
                  <span className="value">{formatDate(doc.issueDate)}</span>
                </div>

                {doc.contract && (
                  <>
                    <div className="verify-document-row">
                      <span className="label">{strings.VEHICLE}</span>
                      <span className="value">{doc.contract.vehicleModel}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.PLATE}</span>
                      <span className="value">{doc.contract.vehiclePlate}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.DRIVER}</span>
                      <span className="value">{doc.contract.driverName}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.PERIOD}</span>
                      <span className="value">
                        {strings.FROM}
                        {' '}
                        {formatDate(doc.contract.departureDate)}
                        <br />
                        {strings.TO}
                        {' '}
                        {formatDate(doc.contract.returnDate)}
                      </span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.TOTAL}</span>
                      <span className="value">{money(doc.contract.totalTTC, doc.contract.currency)}</span>
                    </div>
                  </>
                )}

                {doc.invoice && (
                  <>
                    <div className="verify-document-row">
                      <span className="label">{strings.CLIENT}</span>
                      <span className="value">{doc.invoice.clientName}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.OBJECT}</span>
                      <span className="value">{doc.invoice.object}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.TOTAL}</span>
                      <span className="value">{money(doc.invoice.totalTTC, doc.invoice.currency)}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.BALANCE}</span>
                      <span className="value">{money(doc.invoice.balanceDue, doc.invoice.currency)}</span>
                    </div>
                  </>
                )}

                {doc.receipt && (
                  <>
                    <div className="verify-document-row">
                      <span className="label">{strings.CLIENT}</span>
                      <span className="value">{doc.receipt.clientName}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.DESCRIPTION}</span>
                      <span className="value">{doc.receipt.description}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.AMOUNT}</span>
                      <span className="value">{money(doc.receipt.amount, doc.receipt.currency)}</span>
                    </div>
                    <div className="verify-document-row">
                      <span className="label">{strings.METHOD}</span>
                      <span className="value">{doc.receipt.paymentMethod}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="verify-document-agency">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 8 }} />
                ) : null}
                <div className="name">
                  {strings.AGENCY}
                  {': '}
                  {doc.agency.fullName}
                </div>
                {doc.agency.city ? (
                  <div className="detail">
                    {strings.CITY}
                    {': '}
                    {doc.agency.city}
                  </div>
                ) : null}
                {doc.agency.phone ? (
                  <div className="detail">
                    {strings.PHONE}
                    {': '}
                    {doc.agency.phone}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default VerifyDocument
