import React, { useMemo } from 'react'
import { Button, Dialog, DialogContent, DialogActions } from '@mui/material'
import {
  DirectionsCarFilledOutlined,
  WorkspacePremiumOutlined,
  InfoOutlined,
  LockOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import {
  formatPlanPrice,
  getPlanCarMax,
  getPlanCarMin,
  pickLabel,
} from '@/agency/utils/subscriptionPlan'

export type FleetLimitMode = 'last' | 'blocked'

type AgencyFleetLimitDialogProps = {
  open: boolean
  mode: FleetLimitMode
  lang: string
  carCount: number
  carLimit: number
  currentPlan: bookcarsTypes.SubscriptionPlan | null
  nextPlan: bookcarsTypes.SubscriptionPlan | null
  onClose: () => void
  onUpgrade: () => void
}

const AgencyFleetLimitDialog = ({
  open,
  mode,
  lang,
  carCount,
  carLimit,
  currentPlan,
  nextPlan,
  onClose,
  onUpgrade,
}: AgencyFleetLimitDialogProps) => {
  const currentName = useMemo(
    () => pickLabel(currentPlan?.name, lang) || strings.PLAN_CURRENT,
    [currentPlan, lang],
  )
  const nextName = useMemo(
    () => (nextPlan ? pickLabel(nextPlan.name, lang) : ''),
    [nextPlan, lang],
  )
  const nextPrice = useMemo(
    () => (nextPlan ? formatPlanPrice(nextPlan, lang) : ''),
    [nextPlan, lang],
  )
  const nextCars = useMemo(() => {
    if (!nextPlan) {
      return ''
    }
    return strings.PLAN_CARS
      .replace('{0}', String(getPlanCarMin(nextPlan)))
      .replace('{1}', String(getPlanCarMax(nextPlan)))
  }, [nextPlan])

  const title = mode === 'last' ? strings.FLEET_LIMIT_LAST_TITLE : strings.FLEET_LIMIT_BLOCKED_TITLE
  const body = mode === 'last'
    ? strings.FLEET_LIMIT_LAST_BODY
      .replace('{0}', String(carLimit))
      .replace('{1}', currentName)
    : strings.FLEET_LIMIT_BLOCKED_BODY
      .replace('{0}', currentName)
      .replace('{1}', String(carLimit))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="agency-fleet-limit-dialog"
      maxWidth="sm"
      fullWidth
    >
      <DialogContent className="agency-fleet-limit-content">
        <div className={`agency-fleet-limit-icon is-${mode}`}>
          {mode === 'last' ? <InfoOutlined /> : <LockOutlined />}
        </div>
        <h3>{title}</h3>
        <p className="agency-fleet-limit-body">{body}</p>
        <p className="agency-fleet-limit-usage">
          {strings.FLEET_LIMIT_CURRENT_USAGE
            .replace('{0}', String(carCount))
            .replace('{1}', String(carLimit))}
        </p>

        {nextPlan ? (
          <div className="agency-fleet-limit-next">
            <span className="agency-fleet-limit-next-kicker">
              <WorkspacePremiumOutlined fontSize="inherit" />
              {strings.FLEET_LIMIT_NEXT_TITLE}
            </span>
            <strong>{nextName}</strong>
            <div className="agency-fleet-limit-next-meta">
              <span>
                <DirectionsCarFilledOutlined fontSize="inherit" />
                {nextCars}
              </span>
              {nextPrice ? (
                <span>
                  {nextPrice}
                  {!nextPlan.freePlan ? ` ${strings.PLAN_PER_MONTH} ${strings.PLAN_PRICE_HT}` : ''}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="agency-fleet-limit-top">{strings.FLEET_LIMIT_TOP_PLAN}</p>
        )}
      </DialogContent>
      <DialogActions className="agency-fleet-limit-actions">
        <Button type="button" variant="outlined" onClick={onClose}>
          {strings.FLEET_LIMIT_CONTINUE}
        </Button>
        {nextPlan ? (
          <Button type="button" variant="contained" className="btn-primary" onClick={onUpgrade}>
            {strings.FLEET_LIMIT_SEE_PLANS}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  )
}

export default AgencyFleetLimitDialog
