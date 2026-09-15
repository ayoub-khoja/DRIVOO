import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { HighlightOff } from '@mui/icons-material'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings } from '@/lang/verify-document'
import env from '@/config/env.config'
import * as langHelper from '@/utils/langHelper'

import '@/assets/css/verify-document.css'

/**
 * Legacy QR / bookmarked route. Redirects straight to the public PDF so the
 * browser shows the full contract (or invoice/receipt) natively — no HTML shell.
 */
const VerifyDocument = () => {
  const { kind = '', id = '' } = useParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    langHelper.setLanguage(strings)
  }, [])

  useEffect(() => {
    if (!kind || !id) {
      setError(true)
      return
    }
    const pdfUrl = `${env.API_HOST}/api/public/document/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/pdf`
    window.location.replace(pdfUrl)
  }, [kind, id])

  return (
    <Layout strict={false}>
      <div className="verify-document">
        {error ? (
          <div className="verify-document-card">
            <h1>{strings.TITLE}</h1>
            <div className="verify-document-status bad">
              <HighlightOff />
              {strings.INVALID}
            </div>
            <p className="verify-document-error">{strings.INVALID_HINT}</p>
          </div>
        ) : (
          <div className="verify-document-card">
            <h1>{strings.TITLE}</h1>
            <p className="vd-subtitle">{strings.SUBTITLE}</p>
            <div className="verify-document-loading">
              <CircularProgress size={36} />
              <p>{strings.LOADING}</p>
            </div>
          </div>
        )}
      </div>
      {error && <Footer />}
    </Layout>
  )
}

export default VerifyDocument
