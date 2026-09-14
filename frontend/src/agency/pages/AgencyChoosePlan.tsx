import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material'
import {
  CheckCircle,
  DirectionsCarFilledOutlined,
  HourglassEmptyOutlined,
  LocalOfferOutlined,
  StarOutline,
  WhatsApp as WhatsAppIcon,
  WorkspacePremiumOutlined,
} from '@mui/icons-material'
import { CircleFlag } from 'react-circle-flags'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyAuthService from '@/agency/services/AgencyAuthService'
import * as AgencySubscriptionService from '@/agency/services/AgencySubscriptionService'
import * as UserService from '@/services/UserService'
import {
  SERVICE_CATALOG,
  formatPlanPrice,
  needsAgencyPlan,
  pickLabel,
} from '@/agency/utils/subscriptionPlan'
import * as helper from '@/utils/helper'
import * as langHelper from '@/utils/langHelper'
import logo from '@/assets/img/logoWhite.png'
// import carImg from '@/assets/img/car.png'
// import magazineImg from '@/assets/img/magazine.png'

const FLAG_SIZE = 22

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

type AccessItem = { key: string, label: bookcarsTypes.LocalizedText }

type PlanTag = {
  key: string
  label: string
  tone: 'popular' | 'trial' | 'free' | 'starter' | 'value' | 'premium'
  icon?: 'star' | 'premium' | 'offer' | 'hourglass'
}

type PlanCardProps = {
  plan: bookcarsTypes.SubscriptionPlan
  lang: string
  selected: boolean
  busy: boolean
  onSelect: (planId: string) => void
}

const buildPlanTags = (plan: bookcarsTypes.SubscriptionPlan): PlanTag[] => {
  const tags: PlanTag[] = []
  const carMax = plan.carLimitMax || plan.carLimit || 0

  if (plan.mostPopular) {
    tags.push({ key: 'popular', label: strings.PLAN_POPULAR, tone: 'popular', icon: 'premium' })
  }
  if (plan.freePlan) {
    tags.push({ key: 'free', label: strings.PLAN_TAG_FREE, tone: 'free', icon: 'offer' })
  }
  if (plan.firstTrialFree) {
    tags.push({ key: 'first-trial', label: strings.PLAN_FIRST_TRIAL_FREE, tone: 'trial', icon: 'offer' })
  }
  if (plan.trialMonths > 0) {
    tags.push({
      key: 'trial',
      label: strings.PLAN_TRIAL.replace('{0}', String(plan.trialMonths)),
      tone: 'trial',
      icon: 'hourglass',
    })
  }
  if (!plan.mostPopular && carMax > 0 && carMax <= 20) {
    tags.push({ key: 'starter', label: strings.PLAN_TAG_STARTER, tone: 'starter', icon: 'star' })
  }
  if (!plan.mostPopular && carMax >= 41) {
    tags.push({ key: 'premium', label: strings.PLAN_TAG_PREMIUM, tone: 'premium', icon: 'premium' })
  }
  if (!plan.mostPopular && carMax > 20 && carMax < 41) {
    tags.push({ key: 'value', label: strings.PLAN_TAG_VALUE, tone: 'value', icon: 'star' })
  }

  return tags
}

const TagIcon = ({ icon }: { icon?: PlanTag['icon'] }) => {
  if (icon === 'hourglass') {
    return <HourglassEmptyOutlined fontSize="inherit" />
  }
  if (icon === 'offer') {
    return <LocalOfferOutlined fontSize="inherit" />
  }
  if (icon === 'premium') {
    return <WorkspacePremiumOutlined fontSize="inherit" />
  }
  return <StarOutline fontSize="inherit" />
}

const PlanCard = React.memo(({ plan, lang, selected, busy, onSelect }: PlanCardProps) => {
  const name = pickLabel(plan.name, lang) || '—'
  const subtitle = pickLabel(plan.subtitle, lang)
  const price = formatPlanPrice(plan, lang)
  const carMin = plan.carLimitMin || 0
  const carMax = plan.carLimitMax || plan.carLimit || 0
  const tags = useMemo(() => buildPlanTags(plan), [plan])
  const accessItems = useMemo((): AccessItem[] => {
    const fromServices = SERVICE_CATALOG.filter((item) => plan.services?.includes(item.key))
    if (fromServices.length > 0) {
      return fromServices.slice(0, 8)
    }
    return plan.features
      .filter((feature) => feature.included)
      .slice(0, 8)
      .map((feature) => ({ key: feature.id, label: feature.label }))
  }, [plan.features, plan.services])
  const isFreeLabel = price === 'Gratuit' || price === 'Free' || price === 'مجاني'

  return (
    <article className={`agency-plan-card${plan.mostPopular ? ' is-popular' : ''}${selected ? ' is-selected' : ''}`}>
      {tags.length > 0 ? (
        <div className="agency-plan-tags">
          {tags.map((tag) => (
            <span key={tag.key} className={`agency-plan-tag is-${tag.tone}`}>
              <TagIcon icon={tag.icon} />
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}

      <header className="agency-plan-card-head">
        <h2>{name}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <div className="agency-plan-price-block">
        <strong>{price}</strong>
        {!plan.freePlan && !isFreeLabel ? (
          <>
            <span>{strings.PLAN_PER_MONTH}</span>
            <span className="agency-plan-price-ht">{strings.PLAN_PRICE_HT}</span>
          </>
        ) : null}
      </div>

      {carMax > 0 ? (
        <div className="agency-plan-fleet" aria-label={strings.PLAN_FLEET_LABEL}>
          <div className="agency-plan-fleet-icon">
            <DirectionsCarFilledOutlined />
          </div>
          <div className="agency-plan-fleet-body">
            <span className="agency-plan-fleet-label">{strings.PLAN_FLEET_LABEL}</span>
            <strong className="agency-plan-fleet-range">
              <span>{carMin}</span>
              <em>—</em>
              <span>{carMax}</span>
            </strong>
            <span className="agency-plan-fleet-unit">{strings.PLAN_FLEET_UNIT}</span>
          </div>
        </div>
      ) : null}

      <ul className="agency-plan-features">
        {accessItems.map((item) => (
          <li key={item.key}>
            <CheckCircle className="is-on" />
            <span>{pickLabel(item.label, lang) || '—'}</span>
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
  const [lang, setLang] = useState(helper.getLanguage(langHelper.getLanguage()))
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)
  const uiLang = agency?.language || lang?.code || strings.getLanguage() || 'fr'
  const whatsappHref = `https://wa.me/${env.WHATSAPP_NUMBER.replace(/\D/g, '')}`

  useEffect(() => {
    langHelper.setLanguage(strings)
  }, [])

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

  const onLanguageSelect = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(null)
    const { code } = event.currentTarget.dataset
    if (!code) {
      return
    }

    const currentLang = UserService.getLanguage()
    setLang(helper.getLanguage(code))
    UserService.setLanguage(code)
    if (code !== currentLang) {
      navigate(0)
    }
  }

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
    <div className={`agency-plans-grid agency-plans-grid--${Math.min(plans.length, 4)}`}>
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          lang={uiLang}
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

      <div className="agency-plans-toolbar">
        <Button
          variant="contained"
          onClick={(event) => setLangAnchorEl(event.currentTarget)}
          disableElevation
          className="agency-lang-btn"
          aria-label={strings.LANGUAGE}
        >
          <span className="language">
            <CircleFlag
              countryCode={lang?.countryCode || 'fr'}
              height={FLAG_SIZE}
              className="flag"
              title={lang?.label}
            />
          </span>
        </Button>
      </div>

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

      {/*
      <div className="agency-plans-car-track" aria-hidden>
        <img className="agency-plans-magazine" src={magazineImg} alt="" />
        <img className="agency-plans-car" src={carImg} alt="" />
      </div>
      */}

      <a
        className="agency-plans-whatsapp"
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`WhatsApp ${env.WHATSAPP_DISPLAY}`}
        title={`WhatsApp ${env.WHATSAPP_DISPLAY}`}
      >
        <WhatsAppIcon />
      </a>

      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        className="menu agency-lang-menu"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { className: 'agency-lang-menu-paper' },
        }}
      >
        {env._LANGUAGES.map((languageOption) => (
          <MenuItem onClick={onLanguageSelect} data-code={languageOption.code} key={languageOption.code}>
            <div className="language">
              <CircleFlag countryCode={languageOption.countryCode} height={FLAG_SIZE} className="flag" title={languageOption.label} />
              <span>{languageOption.label}</span>
            </div>
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

export default AgencyChoosePlan
