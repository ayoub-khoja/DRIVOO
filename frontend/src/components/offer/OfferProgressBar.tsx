import React from 'react'

interface OfferProgressBarProps {
  activeStep: number
  totalSteps?: number
}

const OfferProgressBar = ({ activeStep, totalSteps = 4 }: OfferProgressBarProps) => (
  <div className="offer-progress">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`offer-progress-step${i < activeStep ? ' active' : ''}`}
      />
    ))}
  </div>
)

export default OfferProgressBar
