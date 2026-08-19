import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material'
import { Add as AddIcon, DeleteOutline } from '@mui/icons-material'
import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import { strings as common } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import * as AdminSubscriptionService from '@/admin/services/AdminSubscriptionService'
import {
  emptyLocalized,
  emptyPlanForm,
  emptyPricing,
  LANGS,
  PLAN_DURATIONS,
  SERVICE_CATALOG,
  type LangCode,
} from './subscription.constants'

type PlanFormDialogProps = {
  open: boolean
  plan: bookcarsTypes.SubscriptionPlan | null
  discounts: bookcarsTypes.SubscriptionDiscount[]
  onClose: () => void
  onSaved: () => void
}

const toForm = (plan: bookcarsTypes.SubscriptionPlan | null): bookcarsTypes.UpsertSubscriptionPlanPayload => {
  if (!plan) {
    return emptyPlanForm()
  }
  const pricingMap = new Map(plan.pricing.map((row) => [row.months, row]))
  return {
    visible: plan.visible !== false,
    name: { ...emptyLocalized(), ...plan.name },
    subtitle: { ...emptyLocalized(), ...plan.subtitle },
    tokens: plan.tokens || 0,
    freeTokens: plan.freeTokens || 0,
    trialMonths: plan.trialMonths || 0,
    pricing: emptyPricing().map((row) => pricingMap.get(row.months) || row),
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
    features: (plan.features || []).map((feature) => ({
      ...feature,
      label: { ...emptyLocalized(), ...feature.label },
    })),
    services: [...(plan.services || [])],
  }
}

const LocalizedField = ({
  label,
  value,
  lang,
  onLang,
  onChange,
}: {
  label: string
  value: bookcarsTypes.LocalizedText
  lang: LangCode
  onLang: (code: LangCode) => void
  onChange: (next: bookcarsTypes.LocalizedText) => void
}) => (
  <div className="sub-block">
    <div className="sub-block-head">
      <h3>{label}</h3>
      <div className="sub-lang-tabs">
        {LANGS.map((item) => (
          <button
            key={item.code}
            type="button"
            className={lang === item.code ? 'is-active' : ''}
            onClick={() => onLang(item.code)}
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
      value={value[lang]}
      onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
    />
  </div>
)

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

const PlanFormDialog = ({ open, plan, discounts, onClose, onSaved }: PlanFormDialogProps) => {
  const [form, setForm] = useState(emptyPlanForm)
  const [nameLang, setNameLang] = useState<LangCode>('fr')
  const [subtitleLang, setSubtitleLang] = useState<LangCode>('fr')
  const [featureLang, setFeatureLang] = useState<LangCode>('fr')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(toForm(plan))
      setNameLang('fr')
      setSubtitleLang('fr')
      setFeatureLang('fr')
    }
  }, [open, plan])

  const activeDiscounts = useMemo(
    () => discounts.filter((item) => item.active),
    [discounts],
  )

  const setPricing = (months: number, key: keyof bookcarsTypes.SubscriptionPlanPricing, raw: string) => {
    const value = Number(raw)
    setForm((prev) => ({
      ...prev,
      pricing: prev.pricing.map((row) => {
        if (row.months !== months) {
          return row
        }
        const next = { ...row, [key]: Number.isFinite(value) ? value : 0 }
        if (key === 'monthlyPrice') {
          const factor = 1 - (next.discountPercent / 100)
          next.totalPrice = Number((next.monthlyPrice * next.months * factor).toFixed(2))
        }
        return next
      }),
    }))
  }

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { id: `f_${Date.now()}`, label: emptyLocalized(), included: true },
      ],
    }))
  }

  const onSubmit = async () => {
    if (!form.name.fr.trim() && !form.name.en.trim() && !form.name.ar.trim()) {
      toast.error(subStrings.PLAN_NAME_REQUIRED)
      return
    }
    setSaving(true)
    try {
      if (plan?._id) {
        await AdminSubscriptionService.updatePlan(plan._id, form)
      } else {
        await AdminSubscriptionService.createPlan(form)
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
      maxWidth="md"
      scroll="paper"
      PaperProps={{ className: 'sub-form-paper' }}
      slotProps={{ paper: { className: 'sub-form-paper' } }}
    >
      <div className="sub-form-header">
        <h2>{plan ? `✎ ${subStrings.EDIT_PLAN_TITLE}` : `+ ${subStrings.ADD_PLAN_TITLE}`}</h2>
      </div>
      <DialogContent className="sub-form-content">
        <ToggleRow
          blue
          label={`${subStrings.VISIBILITY}: ${form.visible ? subStrings.VISIBLE : subStrings.HIDDEN}`}
          checked={form.visible}
          onChange={(visible) => setForm((prev) => ({ ...prev, visible }))}
        />

        <LocalizedField
          label={subStrings.PLAN_NAME}
          value={form.name}
          lang={nameLang}
          onLang={setNameLang}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
        />
        <LocalizedField
          label={subStrings.PLAN_SUBTITLE}
          value={form.subtitle}
          lang={subtitleLang}
          onLang={setSubtitleLang}
          onChange={(subtitle) => setForm((prev) => ({ ...prev, subtitle }))}
        />

        <div className="sub-fields-2">
          <TextField
            size="small"
            type="number"
            label={subStrings.TOKENS}
            value={form.tokens}
            onChange={(e) => setForm((prev) => ({ ...prev, tokens: Number(e.target.value) || 0 }))}
          />
          <TextField
            size="small"
            type="number"
            label={subStrings.FREE_TOKENS}
            value={form.freeTokens}
            onChange={(e) => setForm((prev) => ({ ...prev, freeTokens: Number(e.target.value) || 0 }))}
          />
        </div>
        <TextField
          size="small"
          type="number"
          label={subStrings.TRIAL_MONTHS}
          value={form.trialMonths}
          onChange={(e) => setForm((prev) => ({ ...prev, trialMonths: Number(e.target.value) || 0 }))}
        />

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.PRICING}</h3>
          </div>
          <div className="sub-pricing-grid">
            {PLAN_DURATIONS.map((months) => {
              const row = form.pricing.find((item) => item.months === months) || emptyPricing()[0]
              return (
                <div key={months} className="sub-pricing-row">
                  <strong>{subStrings.MONTHS.replace('{0}', String(months))}</strong>
                  <TextField
                    size="small"
                    type="number"
                    label={subStrings.MONTHLY_PRICE}
                    value={row.monthlyPrice}
                    onChange={(e) => setPricing(months, 'monthlyPrice', e.target.value)}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={subStrings.TOTAL_PRICE}
                    value={row.totalPrice}
                    onChange={(e) => setPricing(months, 'totalPrice', e.target.value)}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={subStrings.DISCOUNT_PERCENT}
                    value={row.discountPercent}
                    onChange={(e) => setPricing(months, 'discountPercent', e.target.value)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="sub-toggles">
          <ToggleRow label={subStrings.FREE_PLAN} checked={form.freePlan} onChange={(freePlan) => setForm((prev) => ({ ...prev, freePlan }))} />
          <ToggleRow label={subStrings.MOST_POPULAR} checked={form.mostPopular} onChange={(mostPopular) => setForm((prev) => ({ ...prev, mostPopular }))} />
          <ToggleRow label={subStrings.FIRST_TRIAL_FREE} checked={form.firstTrialFree} onChange={(firstTrialFree) => setForm((prev) => ({ ...prev, firstTrialFree }))} />
          <ToggleRow label={subStrings.ACTIVE} checked={form.active} onChange={(active) => setForm((prev) => ({ ...prev, active }))} />
          <ToggleRow label={subStrings.VISIBLE_VERIFIED} checked={form.visibleVerified} onChange={(visibleVerified) => setForm((prev) => ({ ...prev, visibleVerified }))} />
          <ToggleRow label={subStrings.VISIBLE_UNVERIFIED} checked={form.visibleUnverified} onChange={(visibleUnverified) => setForm((prev) => ({ ...prev, visibleUnverified }))} />
          <ToggleRow label={subStrings.SHOW_PAYMENT} checked={form.showPaymentButton} onChange={(showPaymentButton) => setForm((prev) => ({ ...prev, showPaymentButton }))} />
          <ToggleRow label={subStrings.UNLIMITED} checked={form.unlimitedDuration} onChange={(unlimitedDuration) => setForm((prev) => ({ ...prev, unlimitedDuration }))} />
        </div>
        <ToggleRow
          label={subStrings.REQUIRES_APPROVAL}
          checked={form.requiresApproval}
          onChange={(requiresApproval) => setForm((prev) => ({ ...prev, requiresApproval }))}
        />

        <FormControl size="small" fullWidth>
          <InputLabel>{subStrings.DISCOUNT}</InputLabel>
          <Select
            label={subStrings.DISCOUNT}
            value={form.discountId || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, discountId: e.target.value || null }))}
          >
            <MenuItem value="">{subStrings.DISCOUNT_NONE}</MenuItem>
            {activeDiscounts.map((item) => (
              <MenuItem key={item._id} value={item._id}>
                {item.name} ({item.percent}%)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.FEATURES}</h3>
            <div className="sub-lang-tabs">
              {LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={featureLang === item.code ? 'is-active' : ''}
                  onClick={() => setFeatureLang(item.code)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addFeature}>
              {subStrings.ADD_FEATURE}
            </Button>
          </div>
          {form.features.length === 0 ? (
            <div className="sub-feature-empty">{subStrings.NO_FEATURES}</div>
          ) : (
            <div className="sub-feature-list">
              {form.features.map((feature, index) => (
                <div key={feature.id} className="sub-feature-item">
                  <Switch
                    checked={feature.included}
                    onChange={(_, included) => setForm((prev) => ({
                      ...prev,
                      features: prev.features.map((item, i) => (i === index ? { ...item, included } : item)),
                    }))}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={subStrings.FEATURE_LABEL}
                    value={feature.label[featureLang]}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      features: prev.features.map((item, i) => (
                        i === index
                          ? { ...item, label: { ...item.label, [featureLang]: e.target.value } }
                          : item
                      )),
                    }))}
                  />
                  <IconButton
                    aria-label={common.DELETE}
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      features: prev.features.filter((_, i) => i !== index),
                    }))}
                  >
                    <DeleteOutline />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sub-block">
          <div className="sub-block-head">
            <h3>{subStrings.SERVICES}</h3>
          </div>
          <div className="sub-service-list">
            {SERVICE_CATALOG.map((service) => {
              const checked = form.services.includes(service.key)
              return (
                <label key={service.key} className="sub-service-item">
                  <Switch
                    checked={checked}
                    onChange={(_, value) => setForm((prev) => ({
                      ...prev,
                      services: value
                        ? [...prev.services, service.key]
                        : prev.services.filter((key) => key !== service.key),
                    }))}
                  />
                  <span className="sub-toggle-copy">
                    <strong>{service.label.fr}</strong>
                    <small>{service.key}</small>
                  </span>
                </label>
              )
            })}
          </div>
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
