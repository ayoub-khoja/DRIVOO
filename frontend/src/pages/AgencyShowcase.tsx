import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  ArrowForward,
  AssignmentOutlined,
  DescriptionOutlined,
  DrawOutlined,
  FolderOpenOutlined,
  InsightsOutlined,
  KeyOutlined,
  NotificationsActiveOutlined,
  PaymentsOutlined,
  RateReviewOutlined,
  ReceiptLongOutlined,
  StorefrontOutlined,
  TaskAlt,
  TravelExploreOutlined,
  VerifiedOutlined,
} from '@mui/icons-material'
import { strings } from '@/lang/agency-showcase'
import * as langHelper from '@/utils/langHelper'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import homeAgence from '@/assets/img/home-agence.png'
import homeAgenceRtl from '@/assets/img/home-agence-rtl.png'

import '@/assets/css/agency-showcase.css'

const AgencyShowcase = () => {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  const values = [
    { icon: TravelExploreOutlined, title: strings.VALUE_1_TITLE, text: strings.VALUE_1_TEXT },
    { icon: InsightsOutlined, title: strings.VALUE_2_TITLE, text: strings.VALUE_2_TEXT },
    { icon: ReceiptLongOutlined, title: strings.VALUE_5_TITLE, text: strings.VALUE_5_TEXT, accent: true },
    { icon: DescriptionOutlined, title: strings.VALUE_6_TITLE, text: strings.VALUE_6_TEXT, accent: true },
    { icon: VerifiedOutlined, title: strings.VALUE_3_TITLE, text: strings.VALUE_3_TEXT },
    { icon: StorefrontOutlined, title: strings.VALUE_4_TITLE, text: strings.VALUE_4_TEXT },
  ]

  const tools = [
    { icon: DrawOutlined, title: strings.TOOL_1_TITLE, text: strings.TOOL_1_TEXT },
    { icon: RateReviewOutlined, title: strings.TOOL_2_TITLE, text: strings.TOOL_2_TEXT },
    { icon: FolderOpenOutlined, title: strings.TOOL_3_TITLE, text: strings.TOOL_3_TEXT },
    { icon: PaymentsOutlined, title: strings.TOOL_4_TITLE, text: strings.TOOL_4_TEXT },
  ]

  const steps = [
    { n: '01', icon: AssignmentOutlined, title: strings.STEP_1_TITLE, text: strings.STEP_1_TEXT },
    { n: '02', icon: KeyOutlined, title: strings.STEP_2_TITLE, text: strings.STEP_2_TEXT },
    { n: '03', icon: NotificationsActiveOutlined, title: strings.STEP_3_TITLE, text: strings.STEP_3_TEXT },
  ]

  const offers = [strings.OFFER_1, strings.OFFER_2, strings.OFFER_3, strings.OFFER_4, strings.OFFER_5, strings.OFFER_6]

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
  const goLogin = () => navigate('/sign-in')
  const isAr = langHelper.getLanguage() === 'ar'

  return (
    <Layout strict={false}>
      <div className="vitrine" ref={rootRef}>
        <section className="vitrine-hero">
          <img className="vitrine-hero-media" src={isAr ? homeAgenceRtl : homeAgence} alt="" />
          <div className="vitrine-hero-shade" aria-hidden />
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
                <article
                  key={item.title}
                  className={`vitrine-value-card vitrine-reveal${item.accent ? ' is-accent' : ''}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <Icon />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              )
            })}
          </div>
          <div className="vitrine-tools">
            <p className="vitrine-tools-label">{strings.TOOLS_TITLE}</p>
            <div className="vitrine-tools-grid">
              {tools.map((item, index) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="vitrine-tool vitrine-reveal" style={{ animationDelay: `${index * 70}ms` }}>
                    <Icon />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="vitrine-block">
          <header className="vitrine-heading vitrine-steps-head vitrine-reveal">
            <p className="vitrine-kicker">{strings.STEPS_KICKER}</p>
            <h2>{strings.STEPS_TITLE}</h2>
            <p>{strings.STEPS_TEXT}</p>
          </header>
          <div className="vitrine-steps">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.n} className="vitrine-step vitrine-reveal" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="vitrine-step-top">
                    <span>{step.n}</span>
                    <Icon />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              )
            })}
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
