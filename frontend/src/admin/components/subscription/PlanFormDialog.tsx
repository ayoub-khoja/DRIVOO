import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Switch,
  TextField,
} from '@mui/material'
import { CheckCircleOutline } from '@mui/icons-material'
import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import { strings as common } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import * as AdminSubscriptionService from '@/admin/services/AdminSubscriptionService'
import {
  AGENCY_ACCESS_POINTS,
  buildAccessFeatures,
  buildAccessServices,
  computePlanTaxBreakdown,
  emptyLocalized,
  emptyPlanForm,
  LANGS,
  pricingFromHt,
  type LangCode,
} from './subscription.constants'

type PlanFormDialogProps = {
  open: boolean
  plan: bookcarsTypes.SubscriptionPlan | null
  onClose: () => void
  onSaved: () => void
}

const toForm = (plan: bookcarsTypes.SubscriptionPlan | null): bookcarsTypes.UpsertSubscriptionPlanPayload => {
  if (!plan) {
    return emptyPlanForm()
  }
  const priceHt = plan.priceHt
    || plan.pricing.find((row) => row.monthlyPrice > 0)?.monthlyPrice
    || 0
  return {
    visible: plan.visible !== false,
    name: { ...emptyLocalized(), ...plan.name },
    subtitle: { ...emptyLocalized(), ...plan.subtitle },
    tokens: plan.tokens || 0,
    freeTokens: plan.freeTokens || 0,
    trialMonths: plan.trialMonths || 0,
    carLimitMin: plan.carLimitMin || 0,
    carLimitMax: plan.carLimitMax || plan.carLimit || 0,
    priceHt,
    pricing: pricingFromHt(priceHt),
    freePlan: !!plan.freePlan,
    mostPopular: !!plan.mostPopular,
    firstTrialFree: !!plan.firstTrialFree,
    active: plan.active !== false,
    visibleVerified: plan.visibleVerified !== false,
    visibleUnverified: plan.visibleUnverified !== false,
    showPaymentButton: plan.showPaymentButton !== false,
    unlimitedDuration: !!plan.unlimitedDuration,
    requiresApproval: !!plan.requiresApproval,
    discountId: plan.discountId ? String(plan.discountId) : null,
    features: buildAccessFeatures(),
    services: buildAccessServices(),
  }
}

const ToggleRow = ({
  label,
  checked,
  onChange,
  blue,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  blue?: boolean
}) => (
  <label className="sub-toggle-row">
    <span>{label}</span>
    <Switch
      checked={checked}
      onChange={(_, value) => onChange(value)}
      classes={blue ? { switchBase: 'sub-blue-switch' } : undefined}
    />
  </label>
)

const PlanFormDialog = ({ open, plan, onClose, onSaved }: PlanFormDialogProps) => {
  const [form, setForm] = useState(emptyPlanForm)
  const [nameLang, setNameLang] = useState<LangCode>('fr')
  const [hasTrial, setHasTrial] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const next = toForm(plan)
      setForm(next)
      setHasTrial((next.trialMonths || 0) > 0 || !!next.firstTrialFree)
      setNameLang('fr')
    }
  }, [open, plan])

  const tax = useMemo(() => computePlanTaxBreakdown(form.priceHt), [form.priceHt])

  const setPriceHt = (raw: string) => {
    const priceHt = Number(raw)
    const safe = Number.isFinite(priceHt) && priceHt >= 0 ? priceHt : 0
    setForm((prev) => ({
      ...prev,
      priceHt: safe,
      freePlan: safe === 0,
      pricing: pricingFromHt(safe),
    }))
  }

  const onSubmit = async () => {
    const hasName = LANGS.some((item) => form.name[item.code].trim().length > 0)
    if (!hasName) {
      toast.error(subStrings.PLAN_NAME_REQUIRED)
      return
    }
    if (hasTrial && (!form.trialMonths || form.trialMonths < 1)) {
      toast.error(subStrings.TRIAL_REQUIRED)
      return
    }
    if (!form.carLimitMin || form.carLimitMin < 1 || !form.carLimitMax || form.carLimitMax < 1) {
      toast.error(subStrings.CAR_LIMIT_REQUIRED)
      return
    }
    if (form.carLimitMin > form.carLimitMax) {
      toast.error(subStrings.CAR_LIMIT_RANGE_INVALID)
      return
    }

    const payload: bookcarsTypes.UpsertSubscriptionPlanPayload = {
      ...form,
      visible: true,
      trialMonths: hasTrial ? form.trialMonths : 0,
      firstTrialFree: hasTrial,
      features: buildAccessFeatures(),
      services: buildAccessServices(),
      pricing: pricingFromHt(form.priceHt),
      freePlan: form.priceHt <= 0,
    }

    setSaving(true)
    try {
      if (plan?._id) {
        await AdminSubscriptionService.updatePlan(plan._id, payload)
      } else {
        await AdminSubscriptionService.createPlan(payload)
      }
      toast.success(subStrings.PLAN_SAVED)
      onSaved()
    } catch (err) {
      console.error(err)
      toast.error(common.ERROR)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{ className: 'sub-form-paper' }}
      slotProps={{ paper: { className: 'sub-form-paper' } }}
    >
      <div className="sub-form-header">
        <h2>{plan ? `✎ ${subStrings.EDIT_PLAN_TITLE}` : `+ ${subStrings.ADD_PLAN_TITLE}`}</h2>
      </div>
      <DialogContent className="sub-form-content">
        <ToggleRow
          label={subStrings.ACTIVE}
          checked={form.active}
          onChange={(active) => setForm((prev) => ({ ...prev, active }))}
        />

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.PLAN_NAME}</h3>
            <div className="sub-lang-tabs">
              {LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={nameLang === item.code ? 'is-active' : ''}
                  onClick={() => setNameLang(item.code)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <TextField
            size="small"
            fullWidth
            placeholder={subStrings.LANG_PLACEHOLDER}
            value={form.name[nameLang]}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              name: { ...prev.name, [nameLang]: e.target.value },
            }))}
          />
        </div>

        <ToggleRow
          label={subStrings.TRIAL_ENABLED}
          checked={hasTrial}
          onChange={(enabled) => {
            setHasTrial(enabled)
            if (!enabled) {
              setForm((prev) => ({ ...prev, trialMonths: 0, firstTrialFree: false }))
            } else {
              setForm((prev) => ({
                ...prev,
                trialMonths: prev.trialMonths > 0 ? prev.trialMonths : 1,
                firstTrialFree: true,
              }))
            }
          }}
        />
        {hasTrial && (
          <TextField
            size="small"
            type="number"
            fullWidth
            label={subStrings.TRIAL_MONTHS}
            inputProps={{ min: 1, max: 36 }}
            value={form.trialMonths || ''}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              trialMonths: Math.max(0, Number(e.target.value) || 0),
            }))}
          />
        )}

        <div className="sub-fields-2">
          <TextField
            size="small"
            type="number"
            fullWidth
            label={subStrings.CAR_LIMIT_MIN}
            inputProps={{ min: 1 }}
            value={form.carLimitMin || ''}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              carLimitMin: Math.max(0, Number(e.target.value) || 0),
            }))}
          />
          <TextField
            size="small"
            type="number"
            fullWidth
            label={subStrings.CAR_LIMIT_MAX}
            helperText={subStrings.CAR_LIMIT_HINT}
            inputProps={{ min: 1 }}
            value={form.carLimitMax || ''}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              carLimitMax: Math.max(0, Number(e.target.value) || 0),
            }))}
          />
        </div>

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.PRICING}</h3>
          </div>
          <TextField
            size="small"
            type="number"
            fullWidth
            label={subStrings.PRICE_HT}
            inputProps={{ min: 0, step: '0.001' }}
            value={form.priceHt || ''}
            onChange={(e) => setPriceHt(e.target.value)}
          />
          <div className="sub-tax-breakdown">
            <div>
              <span>{subStrings.PRICE_HT}</span>
              <strong>{tax.priceHt.toFixed(3)} DT</strong>
            </div>
            <div>
              <span>{subStrings.TVA_19}</span>
              <strong>{tax.tva.toFixed(3)} DT</strong>
            </div>
            <div>
              <span>{subStrings.STAMP_DUTY}</span>
              <strong>{tax.stamp.toFixed(3)} DT</strong>
            </div>
            <div className="is-total">
              <span>{subStrings.TOTAL_TTC}</span>
              <strong>{tax.totalTtc.toFixed(3)} DT</strong>
            </div>
          </div>
        </div>

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.AGENCY_ACCESS}</h3>
          </div>
          <p className="sub-access-hint">{subStrings.AGENCY_ACCESS_HINT}</p>
          <ul className="sub-access-list">
            {AGENCY_ACCESS_POINTS.map((item) => (
              <li key={item.key}>
                <CheckCircleOutline />
                <span>{item.label.fr}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
      <DialogActions className="sub-form-actions">
        <Button variant="outlined" disabled={saving} onClick={onClose}>
          {common.CANCEL}
        </Button>
        <Button variant="contained" className="sub-submit" disabled={saving} onClick={onSubmit}>
          {subStrings.SUBMIT}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PlanFormDialog
