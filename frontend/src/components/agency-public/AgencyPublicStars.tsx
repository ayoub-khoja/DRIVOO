import React from 'react'
import { Star, StarBorder, StarHalf } from '@mui/icons-material'

type AgencyPublicStarsProps = {
  value: number
  size?: 'sm' | 'md'
}

const AgencyPublicStars = ({ value, size = 'sm' }: AgencyPublicStarsProps) => {
  const score = Math.max(0, Math.min(5, value))

  return (
    <span className={`agence-public-stars is-${size}`} aria-label={`${score} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        if (score >= star) {
          return <Star key={star} />
        }
        if (score >= star - 0.5) {
          return <StarHalf key={star} />
        }
        return <StarBorder key={star} />
      })}
    </span>
  )
}

export default AgencyPublicStars
