import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  needsAgencyPlan,
  pickLabel,
} from '@/agency/utils/subscriptionPlan'
import logo from '@/assets/img/logoWhite.png'
import carImg from '@/assets/img/car.png'
import magazineImg from '@/assets/img/magazine.png'

const persistAgencySession = (user: bookcarsTypes.User) => {
  AgencyAuthService.setCurrentUser({
    _id: user._id,
    email: user.email,
    fullName: user.fullName,
    language: user.language,
    type: user.type,
    agencyApproved: user.agencyApproved,
    parentAgency: typeof user.parentAgency === 'object' && user.parentAgency
      ? user.parentAgency._id
      : user.parentAgency,
    subscriptionPlan: user.subscriptionPlan || null,
  })
}

type PlanCardProps = {
  plan: bookcarsTypes.SubscriptionPlan
  lang: string
  selected: boolean
  busy: boolean
  onSelect: (planId: string) => void
}

const PlanCard = React.memo(({ plan, lang, selected, busy, onSelect }: PlanCardProps) => {
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
    <article className={`agency-plan-card${plan.mostPopular ? ' is-popular' : ''}${selected ? ' is-selected' : ''}`}>
      {plan.mostPopular ? (
        <span className="agency-plan-ribbon">
          <WorkspacePremiumOutlined fontSize="inherit" />
          {strings.PLAN_POPULAR}
        </span>
      ) : null}

      <header className="agency-plan-card-head">
        <h2>{name}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <div className="agency-plan-price-block">
        <strong>{price}</strong>
        {!plan.freePlan && !isFreeLabel ? <span>{strings.PLAN_PER_MONTH}</span> : null}
      </div>

      <div className="agency-plan-meta">
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
          <span className="agency-plan-trial">
            {strings.PLAN_TRIAL.replace('{0}', String(plan.trialMonths))}
          </span>
        ) : null}
        {plan.firstTrialFree ? <span className="agency-plan-trial">{strings.PLAN_FIRST_TRIAL_FREE}</span> : null}
      </div>

      {pricedRows.length > 0 && !plan.freePlan ? (
        <ul className="agency-plan-durations">
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

      <ul className="agency-plan-features">
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

      <Button
        type="button"
        variant="contained"
        className="btn-primary agency-plan-cta"
        disabled={busy}
        onClick={() => plan._id && onSelect(plan._id)}
      >
        {busy && selected ? <CircularProgress size={18} color="inherit" /> : strings.PLAN_CHOOSE}
      </Button>
    </article>
  )
})

PlanCard.displayName = 'PlanCard'

const AgencyChoosePlan = () => {
  const navigate = useNavigate()
  const { agency, agencyLoaded, setAgency } = useAgencyContext()
  const [plans, setPlans] = useState<bookcarsTypes.SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submittingId, setSubmittingId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const lang = agency?.language || strings.getLanguage() || 'fr'

  useEffect(() => {
    if (!agencyLoaded) {
      return
    }

    if (agency && !needsAgencyPlan(agency)) {
      navigate('/agency/dashboard', { replace: true })
      return
    }

    if (!agency && !AgencyAuthService.getOnboardingCredentials()) {
      navigate('/sign-in', { replace: true })
    }
  }, [agency, agencyLoaded, navigate])

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

  const ensureSession = useCallback(async (): Promise<bookcarsTypes.User | null> => {
    if (agency?._id) {
      return agency
    }

    const credentials = AgencyAuthService.getOnboardingCredentials()
    if (!credentials) {
      return null
    }

    const signInResult = await AgencyAuthService.signin({
      email: credentials.email,
      password: credentials.password,
    })
    if (signInResult.status !== 200 || !signInResult.data?._id) {
      return null
    }

    const user = await AgencyAuthService.getUser(signInResult.data._id)
    if (!user || user.type !== bookcarsTypes.UserType.Supplier) {
      await AgencyAuthService.signout(false)
      return null
    }

    persistAgencySession(user)
    setAgency(user)
    return user
  }, [agency, setAgency])

  const onSelect = useCallback(async (planId: string) => {
    setSubmitError('')
    setSubmittingId(planId)
    try {
      const user = await ensureSession()
      if (!user?._id) {
        AgencyAuthService.clearOnboardingCredentials()
        setSubmitError(strings.PLAN_SESSION_ERROR)
        navigate('/sign-in', { replace: true })
        return
      }

      const result = await AgencySubscriptionService.selectPlan(planId)
      const updated = { ...user, subscriptionPlan: result.subscriptionPlan }
      persistAgencySession(updated)
      setAgency(updated)
      AgencyAuthService.clearOnboardingCredentials()
      navigate('/agency/dashboard', { replace: true })
    } catch {
      setSubmitError(strings.PLAN_SAVE_ERROR)
    } finally {
      setSubmittingId('')
    }
  }, [ensureSession, navigate, setAgency])

  if (!agencyLoaded) {
    return (
      <div className="agency-plans-page">
        <div className="agency-signin-ambient" aria-hidden />
        <div className="agency-inline-loading agency-plans-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      </div>
    )
  }

  const plansContent = loading ? (
    <div className="agency-inline-loading agency-plans-loading">
      <CircularProgress size={28} />
      <span>{strings.LOADING}</span>
    </div>
  ) : loadError ? (
    <div className="agency-plans-empty">
      <p>{strings.PLAN_LOAD_ERROR}</p>
      <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>
        {strings.RETRY}
      </Button>
    </div>
  ) : plans.length === 0 ? (
    <div className="agency-plans-empty">
      <p>{strings.PLAN_EMPTY}</p>
      <Button
        variant="contained"
        className="btn-primary"
        onClick={() => navigate('/sign-in', { replace: true })}
      >
        {strings.SIGN_IN}
      </Button>
    </div>
  ) : (
    <div className="agency-plans-grid">
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          lang={lang}
          selected={submittingId === plan._id}
          busy={!!submittingId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )

  return (
    <div className="agency-plans-page">
      <div className="agency-signin-ambient" aria-hidden />

      <div className="agency-plans-shell">
        <aside className="agency-plans-hero">
          <img src={logo} alt="DRIVOO" />
          <p className="agency-plans-eyebrow">{strings.PLAN_EYEBROW}</p>
          <h1>{strings.PLAN_TITLE}</h1>
          <p className="agency-plans-lead">{strings.PLAN_SUBTITLE}</p>
        </aside>

        <section className="agency-plans-main">
          {plansContent}
          {submitError ? <p className="agency-plans-error">{submitError}</p> : null}
        </section>
      </div>

      <div className="agency-plans-car-track" aria-hidden>
        <img className="agency-plans-magazine" src={magazineImg} alt="" />
        <img className="agency-plans-car" src={carImg} alt="" />
      </div>
    </div>
  )
}

export default AgencyChoosePlan
