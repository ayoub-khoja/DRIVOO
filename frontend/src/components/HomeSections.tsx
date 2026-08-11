import React from 'react'
import { Button } from '@mui/material'
import {
  DirectionsCar,
  LocalTaxi,
  FlightTakeoff,
  Person,
  Sell,
  Security,
  Groups,
  Phone,
  ArrowForward,
} from '@mui/icons-material'
import env from '@/config/env.config'
import { strings } from '@/lang/home'
import Mini from '@/assets/img/mini.png'
import Midi from '@/assets/img/midi.png'
import Maxi from '@/assets/img/maxi.png'

interface HomeSectionsProps {
  onBook: () => void
  onCall?: () => void
}

const HomeSections = ({ onBook }: HomeSectionsProps) => (
  <>
    {/* About */}
    <section className="drivoo-about drivoo-reveal">
      <div className="drivoo-about-inner">
        <div className="drivoo-about-visual">
          <div className="drivoo-about-badge">
            {strings.ABOUT_BADGE}
          </div>
          <div className="drivoo-about-collage">
            <div className="drivoo-about-img drivoo-about-img-a">
              <img src={Maxi} alt="" />
            </div>
            <div className="drivoo-about-img drivoo-about-img-b">
              <img src={Midi} alt="" />
            </div>
            <div className="drivoo-about-img drivoo-about-img-c">
              <img src={Mini} alt="" />
            </div>
          </div>
        </div>

        <div className="drivoo-about-copy">
          <span className="section-eyebrow">
            <DirectionsCar fontSize="inherit" />
            {strings.ABOUT_EYEBROW}
          </span>
          <h2>
            {strings.ABOUT_TITLE}
            <span>{env.WEBSITE_NAME}</span>
          </h2>
          <p className="drivoo-about-lead">{strings.ABOUT_LEAD}</p>
          <p className="drivoo-about-text">{strings.ABOUT_TEXT}</p>

          <div className="drivoo-about-stats">
            <div className="drivoo-stat">
              <div className="drivoo-stat-top">
                <span>{strings.ABOUT_STAT1_LABEL}</span>
                <strong>80%</strong>
              </div>
              <div className="drivoo-stat-bar">
                <span style={{ width: '80%' }} />
              </div>
            </div>
            <div className="drivoo-stat">
              <div className="drivoo-stat-top">
                <span>{strings.ABOUT_STAT2_LABEL}</span>
                <strong>90%</strong>
              </div>
              <div className="drivoo-stat-bar">
                <span style={{ width: '90%' }} />
              </div>
            </div>
          </div>

          <div className="drivoo-about-actions">
            <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={onBook}>
              {strings.BOOK_NOW}
            </Button>
            <a className="drivoo-call" href={`tel:${strings.CONTACT_PHONE_TEL}`}>
              <span className="drivoo-call-icon">
                <Phone fontSize="small" />
              </span>
              <span>
                <small>{strings.CALL_US}</small>
                <strong>{strings.CONTACT_PHONE}</strong>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* Offered services — 4 cards */}
    <section className="drivoo-offerings drivoo-reveal">
      <div className="section-heading">
        <span className="section-eyebrow">
          <DirectionsCar fontSize="inherit" />
          {strings.OFFER_EYEBROW}
        </span>
        <h2>{strings.OFFER_TITLE}</h2>
      </div>

      <div className="drivoo-offerings-grid">
        <article className="drivoo-offer-card">
          <div className="drivoo-offer-num">01</div>
          <div className="drivoo-offer-icon"><DirectionsCar /></div>
          <h3>{strings.OFFER1_TITLE}</h3>
          <p>{strings.OFFER1_TEXT}</p>
        </article>
        <article className="drivoo-offer-card">
          <div className="drivoo-offer-num">02</div>
          <div className="drivoo-offer-icon"><LocalTaxi /></div>
          <h3>{strings.OFFER2_TITLE}</h3>
          <p>{strings.OFFER2_TEXT}</p>
        </article>
        <article className="drivoo-offer-card">
          <div className="drivoo-offer-num">03</div>
          <div className="drivoo-offer-icon"><FlightTakeoff /></div>
          <h3>{strings.OFFER3_TITLE}</h3>
          <p>{strings.OFFER3_TEXT}</p>
        </article>
        <article className="drivoo-offer-card">
          <div className="drivoo-offer-num">04</div>
          <div className="drivoo-offer-icon"><Person /></div>
          <h3>{strings.OFFER4_TITLE}</h3>
          <p>{strings.OFFER4_TEXT}</p>
        </article>
      </div>
    </section>

    {/* Why choose us — 3 cards */}
    <section className="drivoo-choose drivoo-reveal">
      <div className="section-heading">
        <span className="section-eyebrow">
          <DirectionsCar fontSize="inherit" />
          {strings.CHOOSE_EYEBROW}
        </span>
        <h2>{strings.CHOOSE_TITLE}</h2>
      </div>

      <div className="drivoo-choose-grid">
        <article className="drivoo-choose-card">
          <div className="drivoo-choose-icon"><Sell /></div>
          <h3>{strings.CHOOSE1_TITLE}</h3>
          <p>{strings.CHOOSE1_TEXT}</p>
          <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={onBook}>
            {strings.BOOK_NOW}
          </Button>
        </article>
        <article className="drivoo-choose-card">
          <div className="drivoo-choose-icon"><Security /></div>
          <h3>{strings.CHOOSE2_TITLE}</h3>
          <p>{strings.CHOOSE2_TEXT}</p>
          <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={onBook}>
            {strings.BOOK_NOW}
          </Button>
        </article>
        <article className="drivoo-choose-card">
          <div className="drivoo-choose-icon"><Groups /></div>
          <h3>{strings.CHOOSE3_TITLE}</h3>
          <p>{strings.CHOOSE3_TEXT}</p>
          <Button variant="contained" className="btn-primary" endIcon={<ArrowForward />} onClick={onBook}>
            {strings.BOOK_NOW}
          </Button>
        </article>
      </div>
    </section>
  </>
)

export default HomeSections
