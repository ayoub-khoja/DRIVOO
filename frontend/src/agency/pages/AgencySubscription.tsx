import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import {
  CheckCircle,
  CardGiftcardOutlined,
  SettingsOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import * as AgencySubscriptionService from '@/agency/services/AgencySubscriptionService'
import {
  SERVICE_CATALOG,
  formatPlanPrice,
  pickLabel,
} from '@/agency/utils/subscriptionPlan'

type PlanCardProps = {
  plan: bookcarsTypes.SubscriptionPlan
  lang: string
  current: boolean
  busy: boolean
  submitting: boolean
  onSelect: (planId: string) => void
}

const PlanCard = React.memo(({ plan, lang, current, busy, submitting, onSelect }: PlanCardProps) => {
  const name = pickLabel(plan.name, lang) || '—'
  const subtitle = pickLabel(plan.subtitle, lang)
  const price = formatPlanPrice(plan, lang)
  const features = plan.features.filter((f) => f.included).slice(0, 4)
  const services = useMemo(
    () => SERVICE_CATALOG.filter((item) => plan.services.includes(item.key)).slice(0, 4),
    [plan.services],
  )
  const pricedRows = plan.pricing.filter((row) => row.monthlyPrice > 0 || row.totalPrice > 0)
  const isFreeLabel = price === 'Gratuit' || price === 'Free' || price === 'مجاني'

  return (
    <article className={`agency-sub-card${plan.mostPopular ? ' is-popular' : ''}${current ? ' is-current' : ''}`}>
      {current ? (
        <span className="agency-sub-badge is-current">{strings.PLAN_CURRENT_BADGE}</span>
      ) : plan.mostPopular ? (
        <span className="agency-sub-badge is-popular">
          <WorkspacePremiumOutlined fontSize="inherit" />
          {strings.PLAN_POPULAR}
        </span>
      ) : null}

      <header className="agency-sub-card-head">
        <h3>{name}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <div className="agency-sub-price">
        <strong>{price}</strong>
        {!plan.freePlan && !isFreeLabel ? <span>{strings.PLAN_PER_MONTH}</span> : null}
      </div>

      <div className="agency-sub-meta">
        <span>
          <SettingsOutlined fontSize="inherit" />
          {strings.PLAN_TOKENS.replace('{0}', String(plan.tokens))}
        </span>
        {plan.freeTokens > 0 ? (
          <span>
            <CardGiftcardOutlined fontSize="inherit" />
            {strings.PLAN_FREE_TOKENS.replace('{0}', String(plan.freeTokens))}
          </span>
        ) : null}
        {plan.trialMonths > 0 ? (
          <span className="agency-sub-trial">
            {strings.PLAN_TRIAL.replace('{0}', String(plan.trialMonths))}
          </span>
        ) : null}
        {plan.firstTrialFree ? <span className="agency-sub-trial">{strings.PLAN_FIRST_TRIAL_FREE}</span> : null}
      </div>

      {pricedRows.length > 0 && !plan.freePlan ? (
        <ul className="agency-sub-durations">
          {pricedRows.map((row) => (
            <li key={row.months}>
              <span>{strings.PLAN_DURATION.replace('{0}', String(row.months))}</span>
              <strong>
                {row.totalPrice > 0
                  ? `${row.totalPrice.toFixed(2)} DT`
                  : `${(row.monthlyPrice * row.months).toFixed(2)} DT`}
              </strong>
              {row.discountPercent > 0 ? <em>-{row.discountPercent}%</em> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="agency-sub-features">
        {features.map((feature) => (
          <li key={feature.id}>
            <CheckCircle className="is-on" />
            <span>{pickLabel(feature.label, lang) || '—'}</span>
          </li>
        ))}
        {services.map((service) => (
          <li key={service.key}>
            <CheckCircle className="is-on" />
            <span>{pickLabel(service.label, lang)}</span>
          </li>
        ))}
      </ul>

      {current ? (
        <Button type="button" variant="outlined" className="agency-sub-cta" disabled>
          {strings.PLAN_CURRENT_BADGE}
        </Button>
      ) : (
        <Button
          type="button"
          variant="contained"
          className="btn-primary agency-sub-cta"
          disabled={busy}
          onClick={() => plan._id && onSelect(plan._id)}
        >
          {submitting ? <CircularProgress size={18} color="inherit" /> : strings.PLAN_SWITCH}
        </Button>
      )}
    </article>
  )
})

PlanCard.displayName = 'PlanCard'

const AgencySubscription = () => {
  const { agency, setAgency } = useAgencyContext()
  const [plans, setPlans] = useState<bookcarsTypes.SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submittingId, setSubmittingId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk] = useState('')
  const lang = agency?.language || strings.getLanguage() || 'fr'

  const currentPlanId = useMemo(() => {
    const raw = agency?.subscriptionPlan
    if (!raw) {
      return ''
    }
    if (typeof raw === 'object' && raw !== null && '_id' in raw) {
      return String((raw as { _id?: string })._id || '')
    }
    return String(raw)
  }, [agency?.subscriptionPlan])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const data = await AgencySubscriptionService.getPublicPlans()
        if (!cancelled) {
          setPlans(data)
        }
      } catch {
        if (!cancelled) {
          setLoadError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlan = useMemo(
    () => plans.find((plan) => plan._id === currentPlanId) || null,
    [plans, currentPlanId],
  )

  const otherPlans = useMemo(
    () => plans.filter((plan) => plan._id !== currentPlanId),
    [plans, currentPlanId],
  )

  const onSelect = useCallback(async (planId: string) => {
    if (!agency?._id || planId === currentPlanId) {
      return
    }

    setSubmitError('')
    setSubmitOk('')
    setSubmittingId(planId)
    try {
      const result = await AgencySubscriptionService.selectPlan(planId)
      const updated = { ...agency, subscriptionPlan: result.subscriptionPlan }
      AgencyAuthService.setCurrentUser({
        _id: updated._id,
        email: updated.email,
        fullName: updated.fullName,
        language: updated.language,
        type: updated.type,
        agencyApproved: updated.agencyApproved,
        parentAgency: typeof updated.parentAgency === 'object' && updated.parentAgency
          ? updated.parentAgency._id
          : updated.parentAgency,
        subscriptionPlan: updated.subscriptionPlan || null,
      })
      setAgency(updated)
      setSubmitOk(strings.PLAN_SWITCH_OK)
    } catch {
      setSubmitError(strings.PLAN_SAVE_ERROR)
    } finally {
      setSubmittingId('')
    }
  }, [agency, currentPlanId, setAgency])

  return (
    <div className="agency-page agency-subscription-page">
      <div className="agency-page-head">
        <h2>{strings.SUBSCRIPTION}</h2>
        <p>{strings.SUBSCRIPTION_SUBTITLE}</p>
      </div>

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : loadError ? (
        <div className="agency-sub-empty">
          <p>{strings.PLAN_LOAD_ERROR}</p>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            {strings.RETRY}
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="agency-sub-empty">
          <p>{strings.PLAN_EMPTY}</p>
        </div>
      ) : (
        <>
          {!currentPlan ? <p className="agency-sub-none">{strings.PLAN_NONE}</p> : null}

          <div className="agency-sub-grid">
            {currentPlan ? (
              <PlanCard
                plan={currentPlan}
                lang={lang}
                current
                busy={!!submittingId}
                submitting={false}
                onSelect={onSelect}
              />
            ) : null}
            {otherPlans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                lang={lang}
                current={false}
                busy={!!submittingId}
                submitting={submittingId === plan._id}
                onSelect={onSelect}
              />
            ))}
          </div>

          {submitError ? <p className="agency-sub-feedback is-error">{submitError}</p> : null}
          {submitOk ? <p className="agency-sub-feedback is-ok">{submitOk}</p> : null}
        </>
      )}
    </div>
  )
}

export default AgencySubscription
