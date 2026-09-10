import React from 'react'
import { Check as CheckIcon } from '@mui/icons-material'
import { strings } from '@/lang/offer'

interface OfferProgressBarProps {
  activeStep: number
  totalSteps?: number
}

const STEP_LABELS = [
  () => strings.STEP_RESULTS,
  () => strings.STEP_OPTIONS,
  () => strings.STEP_PAYMENT,
  () => strings.STEP_CONFIRMATION,
] as const

const OfferProgressBar = ({ activeStep, totalSteps = 4 }: OfferProgressBarProps) => {
  const steps = STEP_LABELS.slice(0, totalSteps)

  return (
    <nav className="offer-progress" aria-label="Progression réservation">
      {steps.map((getLabel, i) => {
        const stepNumber = i + 1
        const done = stepNumber < activeStep
        const current = stepNumber === activeStep
        const className = [
          'offer-progress-step',
          done ? 'done' : '',
          current ? 'current' : '',
        ].filter(Boolean).join(' ')

        return (
          <div key={getLabel()} className={className}>
            <span className="offer-progress-marker" aria-hidden>
              {done ? <CheckIcon fontSize="inherit" /> : stepNumber}
            </span>
            <span className="offer-progress-label">{getLabel()}</span>
          </div>
        )
      })}
    </nav>
  )
}

export default OfferProgressBar
