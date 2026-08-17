import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DirectionsCarFilledOutlined,
  ForumOutlined,
  InfoOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/agency-public'
import * as AgencyPublicService from '@/services/AgencyPublicService'
import AgencyPublicFleet from './AgencyPublicFleet'
import AgencyPublicReviews from './AgencyPublicReviews'

type TabId = 'about' | 'cars' | 'reviews'

type AgencyPublicPanelProps = {
  slug: string
  profile: bookcarsTypes.PublicAgencyProfile
}

const AgencyPublicPanel = ({ slug, profile }: AgencyPublicPanelProps) => {
  const [tab, setTab] = useState<TabId>('cars')
  const [cars, setCars] = useState<bookcarsTypes.PublicAgencyCar[]>([])
  const [carsLoading, setCarsLoading] = useState(true)
  const [reviews, setReviews] = useState<bookcarsTypes.AgencyReviewList | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadCars = async () => {
      setCarsLoading(true)
      try {
        const data = await AgencyPublicService.getPublicCars(slug)
        if (!cancelled) {
          setCars(data)
        }
      } catch {
        if (!cancelled) {
          setCars([])
        }
      } finally {
        if (!cancelled) {
          setCarsLoading(false)
        }
      }
    }

    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const data = await AgencyPublicService.getPublicReviews(slug)
        if (!cancelled) {
          setReviews(data)
        }
      } catch {
        if (!cancelled) {
          setReviews({ average: 0, count: 0, reviews: [] })
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false)
        }
      }
    }

    void loadCars()
    void loadReviews()

    return () => {
      cancelled = true
    }
  }, [slug])

  const onCreated = useCallback((review: bookcarsTypes.AgencyReview) => {
    setReviews((prev) => {
      const list = [review, ...(prev?.reviews || [])]
      const count = list.length
      const average = Math.round((list.reduce((sum, item) => sum + item.rating, 0) / count) * 10) / 10
      return { average, count, reviews: list }
    })
  }, [])

  const tabs = useMemo(() => ([
    { id: 'cars' as const, label: strings.TAB_CARS, icon: <DirectionsCarFilledOutlined />, count: profile.carCount },
    { id: 'about' as const, label: strings.TAB_ABOUT, icon: <InfoOutlined /> },
    { id: 'reviews' as const, label: strings.TAB_REVIEWS, icon: <ForumOutlined />, count: reviews?.count },
  ]), [profile.carCount, reviews?.count])

  const facts = [
    { label: strings.ACTIVITY_LABEL, value: strings.ACTIVITY },
    { label: strings.LOCATION, value: [profile.city, profile.governorate].filter(Boolean).join(', ') },
    { label: strings.ADDRESS, value: [profile.address, profile.postalCode].filter(Boolean).join(', ') },
    { label: strings.EMAIL, value: profile.email },
    { label: strings.FLEET, value: String(profile.carCount ?? 0) },
  ].filter((item) => item.value)

  return (
    <section className="agence-public-panel">
      <nav className="agence-public-tabs" aria-label={strings.TAB_MENU}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {typeof item.count === 'number' && <em>{item.count}</em>}
          </button>
        ))}
      </nav>

      <div className="agence-public-tab-body">
        {tab === 'about' && (
          <article className="agence-public-about">
            <h2>{strings.ABOUT_OF} {profile.fullName}</h2>
            <p>{profile.bio?.trim() || strings.EMPTY_BIO}</p>
            {facts.length > 0 && (
              <dl className="agence-public-facts">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        )}

        {tab === 'cars' && (
          <AgencyPublicFleet loading={carsLoading} cars={cars} />
        )}

        {tab === 'reviews' && (
          <AgencyPublicReviews
            slug={slug}
            loading={reviewsLoading}
            data={reviews}
            onCreated={onCreated}
          />
        )}
      </div>
    </section>
  )
}

export default AgencyPublicPanel
