import React, { useState } from 'react'
import { Button, IconButton, Switch, TextField } from '@mui/material'
import { Add as AddIcon, DeleteOutline, EditOutlined } from '@mui/icons-material'
import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import { strings as common } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import * as AdminSubscriptionService from '@/admin/services/AdminSubscriptionService'
import ConfirmDialog from './ConfirmDialog'

type DiscountPanelProps = {
  discounts: bookcarsTypes.SubscriptionDiscount[]
  onChanged: () => void
}

const DiscountPanel = ({ discounts, onChanged }: DiscountPanelProps) => {
  const [name, setName] = useState('')
  const [percent, setPercent] = useState(0)
  const [active, setActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<bookcarsTypes.SubscriptionDiscount | null>(null)

  const reset = () => {
    setName('')
    setPercent(0)
    setActive(true)
    setEditingId(null)
  }

  const onEdit = (item: bookcarsTypes.SubscriptionDiscount) => {
    setEditingId(item._id)
    setName(item.name)
    setPercent(item.percent)
    setActive(item.active)
  }

  const onSave = async () => {
    if (name.trim().length < 2) {
      toast.error(subStrings.DISCOUNT_NAME_REQUIRED)
      return
    }
    setBusy(true)
    try {
      const payload = { name: name.trim(), percent, active }
      if (editingId) {
        await AdminSubscriptionService.updateDiscount(editingId, payload)
      } else {
        await AdminSubscriptionService.createDiscount(payload)
      }
      toast.success(subStrings.DISCOUNT_SAVED)
      reset()
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error(common.ERROR)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = (item: bookcarsTypes.SubscriptionDiscount) => {
    setDeleting(item)
  }

  const confirmDelete = async () => {
    if (!deleting?._id) {
      return
    }
    setBusy(true)
    try {
      await AdminSubscriptionService.deleteDiscount(deleting._id)
      toast.info(subStrings.DISCOUNT_DELETED)
      if (editingId === deleting._id) {
        reset()
      }
      setDeleting(null)
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error(common.ERROR)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="sub-discount-form">
        <TextField
          size="small"
          label={subStrings.DISCOUNT_NAME}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          size="small"
          type="number"
          label={subStrings.DISCOUNT_VALUE}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value) || 0)}
        />
        <label className="sub-toggle-row">
          <span>{subStrings.ACTIVE}</span>
          <Switch checked={active} onChange={(_, value) => setActive(value)} />
        </label>
        <Button
          className="sub-add-btn"
          startIcon={<AddIcon />}
          disabled={busy}
          onClick={onSave}
        >
          {editingId ? common.SAVE : subStrings.ADD_DISCOUNT}
        </Button>
      </div>

      {discounts.length === 0 ? (
        <p className="sub-empty">{subStrings.EMPTY_DISCOUNTS}</p>
      ) : (
        <div className="sub-discount-list">
          {discounts.map((item) => (
            <div key={item._id} className="sub-discount-card">
              <div>
                <strong>{item.name}</strong>
                <span> — {item.percent}%</span>
              </div>
              <div>
                <span className={`sub-status ${item.active ? 'is-active' : 'is-inactive'}`}>
                  {item.active ? subStrings.ACTIVE : subStrings.INACTIVE}
                </span>
                <IconButton size="small" aria-label={common.EDIT} onClick={() => onEdit(item)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" className="is-delete" aria-label={common.DELETE} onClick={() => onDelete(item)}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={subStrings.CONFIRM_DELETE_DISCOUNT}
        name={deleting?.name}
        message={subStrings.CONFIRM_DELETE_DISCOUNT_TEXT}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default DiscountPanel
