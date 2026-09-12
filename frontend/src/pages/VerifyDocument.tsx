import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { HighlightOff } from '@mui/icons-material'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings } from '@/lang/verify-document'
import env from '@/config/env.config'

import '@/assets/css/verify-document.css'

/**
 * Legacy QR codes pointed at this page. Redirect straight to the public PDF
 * so a phone scan always opens the file, not a summary card.
 */
const VerifyDocument = () => {
  const { kind = '', id = '' } = useParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const safeKind = encodeURIComponent(kind)
    const safeId = encodeURIComponent(id)
    if (!kind || !id) {
      setError(true)
      return
    }

    const pdfUrl = `${env.API_HOST}/api/public/document/${safeKind}/${safeId}/pdf`
    window.location.replace(pdfUrl)
  }, [kind, id])

  return (
    <Layout strict={false}>
      <div className="verify-document">
        <div className="verify-document-card">
          <h1>{strings.TITLE}</h1>
          {!error && (
            <div className="verify-document-loading">
              <CircularProgress size={36} />
              <p>{strings.LOADING}</p>
            </div>
          )}
          {error && (
            <>
              <div className="verify-document-status bad">
                <HighlightOff />
                {strings.INVALID}
              </div>
              <p className="verify-document-error">{strings.INVALID_HINT}</p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default VerifyDocument
