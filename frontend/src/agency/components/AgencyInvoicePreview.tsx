import React from 'react'
import { CircularProgress } from '@mui/material'
import { strings } from '@/agency/lang/agency'
import * as AgencyInvoiceService from '@/agency/services/AgencyInvoiceService'

interface AgencyInvoicePreviewProps {
  invoiceId: string
  /** Exposes the loaded object URL so the parent can print it. */
  onReady?: (objectUrl: string | null) => void
}

/**
 * Shows the invoice exactly as it will be printed: the PDF is rendered by the backend
 * and embedded here, so the preview and the downloaded file can never diverge.
 */
const AgencyInvoicePreview = ({ invoiceId, onReady }: AgencyInvoicePreviewProps) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null

    setObjectUrl(null)
    setError(false)

    AgencyInvoiceService.getInvoicePdf(invoiceId)
      .then((blob) => {
        if (cancelled) {
          return
        }
        createdUrl = URL.createObjectURL(blob)
        setObjectUrl(createdUrl)
        onReady?.(createdUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          onReady?.(null)
        }
      })

    return () => {
      cancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [invoiceId, onReady])

  if (error) {
    return (
      <div className="agency-invoice-preview-state">
        <p>{strings.INVOICE_PDF_ERROR}</p>
      </div>
    )
  }

  if (!objectUrl) {
    return (
      <div className="agency-invoice-preview-state">
        <CircularProgress size={28} />
        <span>{strings.LOADING}</span>
      </div>
    )
  }

  return (
    <iframe
      id="agency-invoice-pdf-frame"
      className="agency-invoice-pdf-frame"
      src={`${objectUrl}#toolbar=0&navpanes=0`}
      title={strings.INVOICE_DOC_TITLE}
    />
  )
}

export default AgencyInvoicePreview
