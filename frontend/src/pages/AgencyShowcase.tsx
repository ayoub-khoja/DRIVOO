import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  ArrowForward,
  DirectionsCarOutlined,
  InsightsOutlined,
  PaymentsOutlined,
  StorefrontOutlined,
  TaskAlt,
  TravelExploreOutlined,
  VerifiedOutlined,
} from '@mui/icons-material'
import { strings } from '@/lang/agency-showcase'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import Logo from '@/assets/img/logoWhite.png'

import '@/assets/css/agency-showcase.css'

const AgencyShowcase = () => {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  const values = [
    { icon: TravelExploreOutlined, title: strings.VALUE_1_TITLE, text: strings.VALUE_1_TEXT },
    { icon: InsightsOutlined, title: strings.VALUE_2_TITLE, text: strings.VALUE_2_TEXT },
    { icon: VerifiedOutlined, title: strings.VALUE_3_TITLE, text: strings.VALUE_3_TEXT },
    { icon: StorefrontOutlined, title: strings.VALUE_4_TITLE, text: strings.VALUE_4_TEXT },
  ]

  const steps = [
    { n: '01', title: strings.STEP_1_TITLE, text: strings.STEP_1_TEXT },
    { n: '02', title: strings.STEP_2_TITLE, text: strings.STEP_2_TEXT },
    { n: '03', title: strings.STEP_3_TITLE, text: strings.STEP_3_TEXT },
  ]

  const offers = [strings.OFFER_1, strings.OFFER_2, strings.OFFER_3, strings.OFFER_4]

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return undefined
    }

    const nodes = Array.from(root.querySelectorAll('.vitrine-reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const goJoin = () => navigate('/sign-up?role=agency')
  const goLogin = () => navigate('/agency/sign-in')

  return (
    <Layout strict={false}>
      <div className="vitrine" ref={rootRef}>
        <section className="vitrine-hero">
          <div className="vitrine-orb vitrine-orb-a" aria-hidden />
          <div className="vitrine-orb vitrine-orb-b" aria-hidden />
          <div className="vitrine-hero-inner">
            <p className="vitrine-kicker">{strings.EYEBROW}</p>
            <h1>{strings.HERO_TITLE}</h1>
            <p className="vitrine-lead">{strings.HERO_LEAD}</p>
            <div className="vitrine-hero-actions">
              <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={goJoin}>
                {strings.CTA_JOIN}
              </Button>
              <Button variant="outlined" className="vitrine-ghost" onClick={goLogin}>
                {strings.CTA_LOGIN}
              </Button>
            </div>
          </div>
          <div className="vitrine-hero-card" aria-hidden>
            <img src={Logo} alt="" />
            <div className="vitrine-hero-card-bar">
              <DirectionsCarOutlined />
              <span />
            </div>
            <div className="vitrine-hero-card-bar">
              <PaymentsOutlined />
              <span />
            </div>
          </div>
        </section>

        <section className="vitrine-stats vitrine-reveal">
          <article>
            <span>{strings.STAT_AGENCIES}</span>
            <strong>{strings.STAT_AGENCIES_VALUE}</strong>
          </article>
          <article>
            <span>{strings.STAT_CITIES}</span>
            <strong>{strings.STAT_CITIES_VALUE}</strong>
          </article>
          <article>
            <span>{strings.STAT_SUPPORT}</span>
            <strong>{strings.STAT_SUPPORT_VALUE}</strong>
          </article>
          <article>
            <span>{strings.STAT_PAYOUT}</span>
            <strong>{strings.STAT_PAYOUT_VALUE}</strong>
          </article>
        </section>

        <section className="vitrine-block">
          <header className="vitrine-heading vitrine-reveal">
            <p className="vitrine-kicker">{strings.EYEBROW}</p>
            <h2>{strings.VALUE_TITLE}</h2>
            <p>{strings.VALUE_TEXT}</p>
          </header>
          <div className="vitrine-value-grid">
            {values.map((item, index) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="vitrine-value-card vitrine-reveal" style={{ animationDelay: `${index * 80}ms` }}>
                  <Icon />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="vitrine-block">
          <header className="vitrine-heading vitrine-reveal">
            <h2>{strings.STEPS_TITLE}</h2>
          </header>
          <div className="vitrine-steps">
            {steps.map((step) => (
              <article key={step.n} className="vitrine-step vitrine-reveal">
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="vitrine-offer vitrine-reveal">
          <div>
            <h2>{strings.OFFER_TITLE}</h2>
            <ul>
              {offers.map((item) => (
                <li key={item}>
                  <TaskAlt />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="vitrine-offer-cta">
            <h2>{strings.CTA_TITLE}</h2>
            <p>{strings.CTA_TEXT}</p>
            <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={goJoin}>
              {strings.CTA_JOIN}
            </Button>
          </div>
        </section>
      </div>
      <Footer />
    </Layout>
  )
}

export default AgencyShowcase
