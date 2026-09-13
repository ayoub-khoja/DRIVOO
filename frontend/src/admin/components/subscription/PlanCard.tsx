import React, { useMemo } from 'react'
import { IconButton } from '@mui/material'
import {
  CheckCircle,
  EditOutlined,
  DeleteOutline,
  DirectionsCarFilledOutlined,
  HourglassEmptyOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings as common } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import {
  AGENCY_ACCESS_POINTS,
  computePlanTaxBreakdown,
  pickLabel,
} from './subscription.constants'

type PlanCardProps = {
  plan: bookcarsTypes.SubscriptionPlan
  lang: string
  onEdit: (plan: bookcarsTypes.SubscriptionPlan) => void
  onDelete: (plan: bookcarsTypes.SubscriptionPlan) => void
}

const PRIORITY_ACCESS_KEYS = [
  'dashboard',
  'fleet',
  'bookings',
  'agenda',
  'invoices',
  'receipts',
  'contracts',
  'clients',
  'branches',
  'reviews',
]

const getTierClass = (plan: bookcarsTypes.SubscriptionPlan) => {
  const max = plan.carLimitMax || plan.carLimit || 0
  if (max >= 41) {
    return 'tier-premium'
  }
  if (max >= 31) {
    return 'tier-business'
  }
  if (max >= 21) {
    return 'tier-pro'
  }
  return 'tier-start'
}

const PlanCard = ({ plan, lang, onEdit, onDelete }: PlanCardProps) => {
  const name = pickLabel(plan.name, lang) || '—'
  const tax = computePlanTaxBreakdown(plan.priceHt || 0)
  const carMin = plan.carLimitMin || 0
  const carMax = plan.carLimitMax || plan.carLimit || 0
  const isFree = plan.freePlan || tax.totalTtc <= 0

  const access = useMemo(() => {
    const catalog = plan.services?.length
      ? AGENCY_ACCESS_POINTS.filter((item) => plan.services.includes(item.key))
      : AGENCY_ACCESS_POINTS
    const prioritized = PRIORITY_ACCESS_KEYS
      .map((key) => catalog.find((item) => item.key === key))
      .filter(Boolean) as typeof AGENCY_ACCESS_POINTS
    const rest = catalog.filter((item) => !PRIORITY_ACCESS_KEYS.includes(item.key))
    return [...prioritized, ...rest].slice(0, 10)
  }, [plan.services])

  return (
    <article className={`sub-plan-card ${getTierClass(plan)}${plan.active ? '' : ' is-inactive-card'}`}>
      <header className="sub-plan-head">
        <div className="sub-plan-head-copy">
          <p className="sub-plan-kicker">{subStrings.TAB_PLANS}</p>
          <h3>{name}</h3>
        </div>
        <span className={`sub-plan-badge ${plan.active ? 'is-active' : 'is-inactive'}`}>
          {plan.active ? `✓ ${subStrings.ACTIVE}` : `✕ ${subStrings.INACTIVE}`}
        </span>
      </header>

      <div className="sub-plan-price-block">
        {isFree ? (
          <p className="sub-plan-price-free">{subStrings.PRICE_FREE}</p>
        ) : (
          <>
            <div className="sub-plan-price-main">
              <strong className="sub-plan-price-amount">{tax.totalTtc.toFixed(2)}</strong>
              <span className="sub-plan-price-currency">DT</span>
              <span className="sub-plan-price-period">{subStrings.PRICE_PER_MONTH}</span>
            </div>
            <span className="sub-plan-price-ttc-badge">{subStrings.PRICE_TTC_BADGE}</span>
            <div className="sub-plan-price-details">
              <div>
                <span>{subStrings.PRICE_HT}</span>
                <strong>{tax.priceHt.toFixed(2)} DT</strong>
              </div>
              <div>
                <span>{subStrings.TVA_19}</span>
                <strong>{tax.tva.toFixed(2)} DT</strong>
              </div>
              <div>
                <span>{subStrings.STAMP_DUTY}</span>
                <strong>{tax.stamp.toFixed(2)} DT</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sub-plan-fleet" aria-label={subStrings.CARS_FLEET_LABEL}>
        <div className="sub-plan-fleet-icon">
          <DirectionsCarFilledOutlined />
        </div>
        <div className="sub-plan-fleet-body">
          <span className="sub-plan-fleet-label">{subStrings.CARS_FLEET_LABEL}</span>
          <strong className="sub-plan-fleet-range">
            <span>{carMin}</span>
            <em>—</em>
            <span>{carMax}</span>
          </strong>
          <span className="sub-plan-fleet-unit">{subStrings.CARS_FLEET_UNIT}</span>
        </div>
      </div>

      {plan.trialMonths > 0 && (
        <div className="sub-plan-trial">
          <HourglassEmptyOutlined />
          <span>{subStrings.TRIAL_META.replace('{0}', String(plan.trialMonths))}</span>
        </div>
      )}

      <div className="sub-plan-features-wrap">
        <p className="sub-plan-features-title">{subStrings.AGENCY_ACCESS}</p>
        <ul className="sub-plan-features">
          {access.map((item) => (
            <li key={item.key}>
              <CheckCircle className="is-on" />
              <span>{pickLabel(item.label, lang)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sub-plan-actions">
        <IconButton size="small" aria-label={common.EDIT} onClick={() => onEdit(plan)}>
          <EditOutlined fontSize="small" />
        </IconButton>
        <IconButton size="small" className="is-delete" aria-label={common.DELETE} onClick={() => onDelete(plan)}>
          <DeleteOutline fontSize="small" />
        </IconButton>
      </div>
    </article>
  )
}

export default PlanCard
