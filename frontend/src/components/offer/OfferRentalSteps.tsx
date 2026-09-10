import React from 'react'
import {
  HelpOutline as HelpIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material'
import { strings } from '@/lang/offer'

interface OfferRentalStepsProps {
  depositLabel?: string
}

const OfferRentalSteps = ({ depositLabel }: OfferRentalStepsProps) => {
  const steps = [
    { title: strings.RENTAL_STEP_1_TITLE, text: strings.RENTAL_STEP_1_TEXT },
    { title: strings.RENTAL_STEP_2_TITLE, text: strings.RENTAL_STEP_2_TEXT },
    {
      title: strings.RENTAL_STEP_3_TITLE,
      text: depositLabel
        ? strings.RENTAL_STEP_3_TEXT.replace('{deposit}', depositLabel)
        : strings.RENTAL_STEP_3_TEXT_NO_DEPOSIT,
    },
    { title: strings.RENTAL_STEP_4_TITLE, text: strings.RENTAL_STEP_4_TEXT },
  ]

  return (
    <section className="offer-rental-steps">
      <header className="offer-rental-steps-header">
        <HelpIcon />
        <h3>{strings.RENTAL_STEPS_TITLE}</h3>
      </header>
      <ol className="offer-rental-steps-list">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="offer-rental-step-num">{index + 1}.</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="offer-rental-steps-note">
        <ClockIcon fontSize="inherit" />
        {strings.RENTAL_STEPS_NOTE}
      </p>
    </section>
  )
}

export default OfferRentalSteps
