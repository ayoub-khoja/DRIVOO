import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, CircularProgress } from '@mui/material'
import { DownloadOutlined, HighlightOff, PictureAsPdfOutlined } from '@mui/icons-material'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings } from '@/lang/verify-document'
import * as DocumentVerifyService from '@/services/DocumentVerifyService'
import env from '@/config/env.config'
import * as langHelper from '@/utils/langHelper'

import '@/assets/css/verify-document.css'

const kindLabel = (docKind: string) => {
  if (docKind === 'invoice') {
    return strings.KIND_INVOICE
  }
  if (docKind === 'receipt') {
    return strings.KIND_RECEIPT
  }
  return strings.KIND_CONTRACT
}

/**
 * Public page opened by document QR codes.
 * Loads the same multi-page PDF as the agency print and embeds it locally
 * (blob URL) so phone scanners always see both contract pages.
 */
const VerifyDocument = () => {
  const { kind = '', id = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [meta, setMeta] = useState<DocumentVerifyService.VerifiedDocument | null>(null)
  const [pdfObjectUrl, setPdfObjectUrl] = useState('')

  useEffect(() => {
    langHelper.setLanguage(strings)
  }, [])

  useEffect(() => {
    if (!kind || !id) {
      setError(true)
      setLoading(false)
      return
    }

    let cancelled = false
    let objectUrl = ''

    const load = async () => {
      setLoading(true)
      setError(false)
      setPdfObjectUrl('')
      try {
        const [result, blob] = await Promise.all([
          DocumentVerifyService.verifyDocument(kind, id),
          DocumentVerifyService.getDocumentPdfBlob(kind, id),
        ])
        if (cancelled) {
          return
        }
        if (!result?.valid || !(blob instanceof Blob) || blob.size < 100) {
          setError(true)
          setMeta(null)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setMeta(result)
        setPdfObjectUrl(objectUrl)
      } catch {
        if (!cancelled) {
          setError(true)
          setMeta(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [kind, id])

  useEffect(() => () => {
    if (pdfObjectUrl) {
      URL.revokeObjectURL(pdfObjectUrl)
    }
  }, [pdfObjectUrl])

  const apiPdfUrl = kind && id
    ? `${env.API_HOST}/api/public/document/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/pdf`
    : ''
  const downloadHref = pdfObjectUrl || (apiPdfUrl ? `${apiPdfUrl}?download=1` : '')

  return (
    <Layout strict={false}>
      <div className={`verify-document${meta && !error && pdfObjectUrl ? ' is-viewer' : ''}`}>
        {loading && (
          <div className="verify-document-card">
            <h1>{strings.TITLE}</h1>
            <p className="vd-subtitle">{strings.SUBTITLE}</p>
            <div className="verify-document-loading">
              <CircularProgress size={36} />
              <p>{strings.LOADING}</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="verify-document-card">
            <h1>{strings.TITLE}</h1>
            <div className="verify-document-status bad">
              <HighlightOff />
              {strings.INVALID}
            </div>
            <p className="verify-document-error">{strings.INVALID_HINT}</p>
          </div>
        )}

        {!loading && !error && meta && pdfObjectUrl && (
          <div className="verify-document-viewer">
            <header className="verify-document-viewer-bar">
              <div className="verify-document-viewer-copy">
                <span className="verify-document-viewer-kicker">
                  <PictureAsPdfOutlined fontSize="inherit" />
                  {kindLabel(meta.kind)}
                </span>
                <h1>
                  {strings.NUMBER}
                  {' '}
                  {meta.number}
                </h1>
                <p>
                  {strings.VALID}
                  {meta.agency?.fullName ? ` · ${meta.agency.fullName}` : ''}
                </p>
              </div>
              <div className="verify-document-viewer-actions">
                <Button
                  variant="outlined"
                  href={apiPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {strings.OPEN_PDF}
                </Button>
                <Button
                  variant="contained"
                  className="btn-primary"
                  href={downloadHref}
                  download={meta.number ? `${meta.number}.pdf` : 'document.pdf'}
                  startIcon={<DownloadOutlined />}
                >
                  {strings.DOWNLOAD_PDF}
                </Button>
              </div>
            </header>
            <iframe
              title={`${meta.number} PDF`}
              className="verify-document-pdf-frame"
              src={`${pdfObjectUrl}#view=FitH`}
            />
          </div>
        )}
      </div>
      {(!meta || error) && <Footer />}
    </Layout>
  )
}

export default VerifyDocument
