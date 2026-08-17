import React, { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Rating, TextField } from '@mui/material'
import { ForumOutlined } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/agency-public'
import { useUserContext } from '@/context/UserContext'
import * as AgencyPublicService from '@/services/AgencyPublicService'
import * as UserService from '@/services/UserService'
import AgencyPublicStars from './AgencyPublicStars'

type AgencyPublicReviewsProps = {
  slug: string
  loading: boolean
  data: bookcarsTypes.AgencyReviewList | null
}

const nameInitial = (value: string) => value.trim().charAt(0).toUpperCase() || 'A'

const formatReviewDate = (value?: Date | string) => {
  if (!value) {
    return ''
  }
  const locale = UserService.getLanguage() === 'en' ? 'en-GB' : UserService.getLanguage() === 'ar' ? 'ar-TN' : 'fr-FR'
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const AgencyPublicReviews = ({ slug, loading, data }: AgencyPublicReviewsProps) => {
  const userContext = useUserContext()
  const user = userContext?.user
  const [name, setName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [rating, setRating] = useState<number | null>(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.fullName && !name) {
      setName(user.fullName)
    }
    if (user?.email && !email) {
      setEmail(user.email)
    }
  }, [user, name, email])

  const reviews = data?.reviews || []
  const average = data?.average || 0
  const count = data?.count || 0

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const trimmedName = name.trim()
    const trimmedComment = comment.trim()
    if (trimmedName.length < 2) {
      setError(strings.REVIEW_NAME_REQUIRED)
      return
    }
    if (trimmedComment.length < 8) {
      setError(strings.REVIEW_COMMENT_REQUIRED)
      return
    }
    if (!rating) {
      setError(strings.REVIEW_RATING_REQUIRED)
      return
    }

    setSubmitting(true)
    try {
      await AgencyPublicService.createPublicReview(slug, {
        name: trimmedName,
        email: email.trim() || undefined,
        rating,
        comment: trimmedComment,
      })
      setComment('')
      setRating(5)
      setMessage(strings.REVIEW_SENT)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 409 ? strings.REVIEW_DUPLICATE : strings.REVIEW_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="agence-public-reviews">
      <div className="agence-public-reviews-head">
        <div>
          <p className="agence-public-reviews-score">{average.toFixed(1)}</p>
          <AgencyPublicStars value={average} size="md" />
          <span>{count ? strings.REVIEWS_COUNT.replace('{0}', String(count)) : strings.REVIEWS_NONE}</span>
        </div>
      </div>

      {loading ? (
        <div className="agence-public-tab-state">
          <CircularProgress size={26} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="agence-public-tab-state">
          <ForumOutlined />
          <p>{strings.REVIEWS_EMPTY}</p>
        </div>
      ) : (
        <ul className="agence-public-review-list">
          {reviews.map((review) => (
            <li key={review._id} className="agence-public-review">
              <span className="agence-public-review-avatar">{nameInitial(review.name)}</span>
              <div>
                <div className="agence-public-review-meta">
                  <strong>{review.name}</strong>
                  <time>{formatReviewDate(review.createdAt)}</time>
                </div>
                <AgencyPublicStars value={review.rating} />
                <p>{review.comment}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="agence-public-review-form" onSubmit={submit}>
        <h3>{strings.ADD_REVIEW}</h3>
        <p>{strings.ADD_REVIEW_HINT}</p>
        <div className="agence-public-review-fields">
          <TextField
            label={strings.REVIEW_NAME}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            fullWidth
          />
          <TextField
            type="email"
            label={strings.REVIEW_EMAIL}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
          />
        </div>
        <div className="agence-public-review-rate">
          <span>{strings.REVIEW_RATING}</span>
          <Rating
            value={rating}
            onChange={(_, value) => setRating(value)}
            size="large"
            sx={{ color: '#f5a623' }}
          />
        </div>
        <TextField
          label={strings.REVIEW_COMMENT}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          multiline
          minRows={4}
          fullWidth
          required
        />
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" className="btn-primary" disabled={submitting}>
          {submitting ? strings.REVIEW_SENDING : strings.REVIEW_SUBMIT}
        </Button>
      </form>
    </div>
  )
}

export default AgencyPublicReviews
