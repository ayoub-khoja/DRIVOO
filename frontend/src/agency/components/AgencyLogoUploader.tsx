import React, { useRef, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { CloudUploadOutlined, DeleteOutline, ImageOutlined } from '@mui/icons-material'
import { strings } from '@/agency/lang/agency'
import * as AgencyProfileService from '@/agency/services/AgencyProfileService'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

interface AgencyLogoUploaderProps {
  avatar?: string | null
  agencyName: string
  share?: React.ReactNode
  onUploaded: (avatar: string) => void
  onDeleted: () => void
}

const AgencyLogoUploader = ({
  avatar,
  agencyName,
  share,
  onUploaded,
  onDeleted,
}: AgencyLogoUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const src = preview || AgencyProfileService.resolveLogoUrl(avatar)
  const initial = (agencyName || '?').trim().charAt(0).toUpperCase()

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/') || file.size > MAX_BYTES) {
      setError(strings.PROFILE_LOGO_INVALID)
      resetInput()
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setError('')
    setBusy(true)

    try {
      const result = await AgencyProfileService.updateLogo(file)
      onUploaded(result.avatar)
      setPreview('')
    } catch {
      setPreview('')
      setError(strings.PROFILE_LOGO_ERROR)
    } finally {
      URL.revokeObjectURL(localUrl)
      setBusy(false)
      resetInput()
    }
  }

  const onDelete = async () => {
    if (!avatar && !preview) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await AgencyProfileService.deleteLogo()
      setPreview('')
      onDeleted()
    } catch {
      setError(strings.PROFILE_LOGO_ERROR)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="agency-logo-card">
      <div className={`agency-logo-preview ${busy ? 'is-busy' : ''}`}>
        {src ? (
          <img src={src} alt={agencyName} />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
        {busy && (
          <div className="agency-logo-overlay">
            <CircularProgress size={28} />
          </div>
        )}
      </div>

      <div className="agency-logo-copy">
        <h3>{strings.PROFILE_LOGO}</h3>
        <p>{strings.PROFILE_LOGO_HINT}</p>
        <div className="agency-logo-actions">
          <Button
            variant="contained"
            className="btn-primary"
            startIcon={src ? <ImageOutlined /> : <CloudUploadOutlined />}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {src ? strings.PROFILE_LOGO_CHANGE : strings.PROFILE_LOGO_UPLOAD}
          </Button>
          {!!(avatar || preview) && (
            <Button
              color="inherit"
              startIcon={<DeleteOutline />}
              onClick={() => void onDelete()}
              disabled={busy}
            >
              {strings.PROFILE_LOGO_REMOVE}
            </Button>
          )}
        </div>
        {error && <em className="agency-field-error">{error}</em>}
      </div>

      {share}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(event) => void onPick(event)}
      />
    </div>
  )
}

export default AgencyLogoUploader
