import React from 'react'
import { CircularProgress } from '@mui/material'
import { strings } from '@/agency/lang/agency'
import * as AgencyReceiptService from '@/agency/services/AgencyReceiptService'

interface AgencyReceiptPreviewProps {
  receiptId: string
  /** Exposes the loaded object URL so the parent can print it. */
  onReady?: (objectUrl: string | null) => void
}

/**
 * Shows the receipt exactly as it will be printed: the PDF is rendered by the
 * backend and embedded here, so preview and downloaded file cannot diverge.
 */
const AgencyReceiptPreview = ({ receiptId, onReady }: AgencyReceiptPreviewProps) => {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null

    setObjectUrl(null)
    setError(false)

    AgencyReceiptService.getReceiptPdf(receiptId)
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
  }, [receiptId, onReady])

  if (error) {
    return (
      <div className="agency-invoice-preview-state">
        <p>{strings.RECEIPT_PDF_ERROR}</p>
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
      id="agency-receipt-pdf-frame"
      className="agency-invoice-pdf-frame"
      src={`${objectUrl}#toolbar=0&navpanes=0`}
      title={strings.RECEIPT_DOC_TITLE}
    />
  )
}

export default AgencyReceiptPreview
