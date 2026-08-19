import React from 'react'
import { IconButton } from '@mui/material'
import {
  CheckCircle,
  Cancel,
  EditOutlined,
  DeleteOutline,
  SettingsOutlined,
  CardGiftcardOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings as common } from '@/admin/lang/admin'
import { subStrings } from '@/admin/lang/subscription'
import { formatPlanPrice, pickLabel, SERVICE_CATALOG } from './subscription.constants'

type PlanCardProps = {
  plan: bookcarsTypes.SubscriptionPlan
  lang: string
  onEdit: (plan: bookcarsTypes.SubscriptionPlan) => void
  onDelete: (plan: bookcarsTypes.SubscriptionPlan) => void
}

const PlanCard = ({ plan, lang, onEdit, onDelete }: PlanCardProps) => {
  const name = pickLabel(plan.name, lang) || '—'
  const subtitle = pickLabel(plan.subtitle, lang)
  const features = plan.features.slice(0, 8)
  const extraServices = SERVICE_CATALOG.filter((item) => plan.services.includes(item.key)).slice(0, 4)

  return (
    <article className="sub-plan-card">
      <span className={`sub-plan-badge ${plan.active ? 'is-active' : 'is-inactive'}`}>
        {plan.active ? `✓ ${subStrings.ACTIVE}` : `✕ ${subStrings.INACTIVE}`}
      </span>
      <h3>{name}</h3>
      <p className="sub-plan-subtitle">{subtitle}</p>
      <p className="sub-plan-price">{formatPlanPrice(plan, lang)}</p>
      <div className="sub-plan-meta">
        <span>
          <SettingsOutlined />
          {subStrings.TOKENS_MONTH.replace('{0}', String(plan.tokens))}
        </span>
        <span>
          <CardGiftcardOutlined />
          {subStrings.TOKENS_FREE.replace('{0}', String(plan.freeTokens))}
        </span>
      </div>
      <ul className="sub-plan-features">
        {features.map((feature) => (
          <li key={feature.id}>
            {feature.included
              ? <CheckCircle className="is-on" />
              : <Cancel className="is-off" />}
            <span>{pickLabel(feature.label, lang) || '—'}</span>
          </li>
        ))}
        {extraServices.map((service) => (
          <li key={service.key}>
            <CheckCircle className="is-on" />
            <span>{pickLabel(service.label, lang)}</span>
          </li>
        ))}
      </ul>
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
