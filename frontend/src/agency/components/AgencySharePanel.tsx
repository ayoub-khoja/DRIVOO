import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import {
  ContentCopyOutlined,
  DownloadOutlined,
  IosShareOutlined,
  OpenInNewOutlined,
} from '@mui/icons-material'
import QRCode from 'react-qr-code'
import { strings } from '@/agency/lang/agency'
import * as AgencyProfileService from '@/agency/services/AgencyProfileService'

interface AgencySharePanelProps {
  agencyName: string
  published?: boolean
}

const AgencySharePanel = ({ agencyName, published = true }: AgencySharePanelProps) => {
  const qrWrapRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const share = await AgencyProfileService.getShareLink()
        if (cancelled) {
          return
        }
        setUrl(share.url)
        setSlug(share.slug)
      } catch {
        if (!cancelled) {
          setError(strings.SHARE_ERROR)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const shortUrl = useMemo(() => url.replace(/^https?:\/\//i, ''), [url])

  const copy = async () => {
    if (!url) {
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(strings.SHARE_COPY_ERROR)
    }
  }

  const downloadQr = () => {
    const svg = qrWrapRef.current?.querySelector('svg')
    if (!svg || !slug) {
      return
    }
    const payload = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([payload], { type: 'image/svg+xml;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `drivoo-${slug}.svg`
    link.click()
    URL.revokeObjectURL(href)
  }

  const shareNative = async () => {
    if (!url) {
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: agencyName, url })
        return
      } catch {
        // user cancel
      }
    }
    void copy()
  }

  return (
    <aside className="agency-share-panel">
      <div className="agency-share-qr" ref={qrWrapRef}>
        {url ? (
          <QRCode value={url} size={108} fgColor="#0b1626" bgColor="#ffffff" />
        ) : (
          <span className="agency-share-qr-ghost" aria-hidden />
        )}
      </div>
      <div className="agency-share-copy">
        <p className="agency-share-kicker">{strings.SHARE_TITLE}</p>
        <strong>{strings.SHARE_HINT}</strong>
        <span className="agency-share-url" title={url}>{shortUrl || '…'}</span>
        <div className="agency-share-actions">
          <Tooltip title={copied ? strings.SHARE_COPIED : strings.SHARE_COPY}>
            <span>
              <IconButton size="small" onClick={() => void copy()} disabled={!url} aria-label={strings.SHARE_COPY}>
                <ContentCopyOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={strings.SHARE_OPEN}>
            <span>
              <IconButton
                size="small"
                onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                disabled={!url}
                aria-label={strings.SHARE_OPEN}
              >
                <OpenInNewOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={strings.SHARE_DOWNLOAD}>
            <span>
              <IconButton size="small" onClick={downloadQr} disabled={!url} aria-label={strings.SHARE_DOWNLOAD}>
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={strings.SHARE_NATIVE}>
            <span>
              <IconButton size="small" onClick={() => void shareNative()} disabled={!url} aria-label={strings.SHARE_NATIVE}>
                <IosShareOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        {error && <em className="agency-field-error">{error}</em>}
        {!published && <em className="agency-share-pending">{strings.SHARE_PENDING}</em>}
      </div>
    </aside>
  )
}

export default AgencySharePanel
