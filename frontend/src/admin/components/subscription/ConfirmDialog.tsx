import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { strings as common } from '@/admin/lang/admin'

type ConfirmDialogProps = {
  open: boolean
  title: string
  name?: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}

const ConfirmDialog = ({
  open,
  title,
  name,
  message,
  confirmLabel,
  busy,
  onClose,
  onConfirm,
}: ConfirmDialogProps) => (
  <Dialog
    open={open}
    onClose={() => !busy && onClose()}
    fullWidth
    maxWidth="xs"
    PaperProps={{ className: 'sub-confirm-paper' }}
    slotProps={{ paper: { className: 'sub-confirm-paper' } }}
  >
    <div className="sub-confirm-header">
      <div>
        <span className="sub-confirm-badge">{confirmLabel || common.DELETE}</span>
        <h2>{title}</h2>
        {name ? <p>{name}</p> : null}
      </div>
      <IconButton aria-label={common.CLOSE} onClick={onClose} disabled={busy}>
        <CloseIcon />
      </IconButton>
    </div>
    <DialogContent className="sub-confirm-content">
      <p>{message}</p>
    </DialogContent>
    <DialogActions className="sub-confirm-actions">
      <Button variant="outlined" onClick={onClose} disabled={busy}>
        {common.CANCEL}
      </Button>
      <Button variant="contained" className="sub-confirm-delete" onClick={onConfirm} disabled={busy}>
        {confirmLabel || common.DELETE}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmDialog
