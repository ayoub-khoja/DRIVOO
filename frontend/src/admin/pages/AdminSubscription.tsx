import React, { useCallback, useEffect, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import * as AdminSubscriptionService from '@/admin/services/AdminSubscriptionService'
import PlanCard from '@/admin/components/subscription/PlanCard'
import PlanFormDialog from '@/admin/components/subscription/PlanFormDialog'
import DiscountPanel from '@/admin/components/subscription/DiscountPanel'
import ConfirmDialog from '@/admin/components/subscription/ConfirmDialog'
import { pickLabel } from '@/admin/components/subscription/subscription.constants'

import '@/admin/assets/css/subscription.css'

type TabId = 'plans' | 'discounts'

const AdminSubscription = () => {
  const lang = strings.getLanguage()
  const [tab, setTab] = useState<TabId>('plans')
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<bookcarsTypes.SubscriptionPlan[]>([])
  const [discounts, setDiscounts] = useState<bookcarsTypes.SubscriptionDiscount[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<bookcarsTypes.SubscriptionPlan | null>(null)
  const [deleting, setDeleting] = useState<bookcarsTypes.SubscriptionPlan | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextPlans, nextDiscounts] = await Promise.all([
        AdminSubscriptionService.getPlans(),
        AdminSubscriptionService.getDiscounts(),
      ])
      setPlans(nextPlans || [])
      setDiscounts(nextDiscounts || [])
    } catch (err) {
      console.error(err)
      setPlans([])
      setDiscounts([])
      toast.error(strings.ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (plan: bookcarsTypes.SubscriptionPlan) => {
    setEditing(plan)
    setFormOpen(true)
  }

  const onDelete = (plan: bookcarsTypes.SubscriptionPlan) => {
    setDeleting(plan)
  }

  const confirmDelete = async () => {
    if (!deleting?._id) {
      return
    }
    setDeletingBusy(true)
    try {
      await AdminSubscriptionService.deletePlan(deleting._id)
      toast.info(subStrings.PLAN_DELETED)
      setDeleting(null)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(strings.ERROR)
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h2>{strings.SUBSCRIPTION_TITLE}</h2>
        <p>{strings.SUBSCRIPTION_SUBTITLE}</p>
      </div>

      <div className="sub-workspace">
        <div className="sub-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={tab === 'plans' ? 'is-active' : ''}
            aria-selected={tab === 'plans'}
            onClick={() => setTab('plans')}
          >
            {subStrings.TAB_PLANS}
          </button>
          <button
            type="button"
            role="tab"
            className={tab === 'discounts' ? 'is-active' : ''}
            aria-selected={tab === 'discounts'}
            onClick={() => setTab('discounts')}
          >
            {subStrings.TAB_DISCOUNTS}
          </button>
        </div>

        {loading ? (
          <div className="admin-inline-loading">
            <CircularProgress size={28} />
            <span>{strings.LOADING}</span>
          </div>
        ) : tab === 'plans' ? (
          <>
            <div className="sub-toolbar">
              <Button className="sub-add-btn" startIcon={<AddIcon />} onClick={openCreate}>
                {subStrings.ADD_PLAN}
              </Button>
            </div>
            <div className="sub-grid">
              {plans.length === 0 ? (
                <p className="sub-empty">{subStrings.EMPTY_PLANS}</p>
              ) : (
                plans.map((plan) => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    lang={lang}
                    onEdit={openEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <DiscountPanel discounts={discounts} onChanged={load} />
        )}
      </div>

      <PlanFormDialog
        open={formOpen}
        plan={editing}
        discounts={discounts}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title={subStrings.CONFIRM_DELETE_PLAN}
        name={deleting ? pickLabel(deleting.name, lang) : ''}
        message={subStrings.CONFIRM_DELETE_PLAN_TEXT}
        busy={deletingBusy}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default AdminSubscription
