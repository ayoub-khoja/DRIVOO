import React from 'react'
import { IconButton } from '@mui/material'
import {
  MailOutline,
  FacebookTwoTone as FacebookIcon,
  X,
  LinkedIn,
  Instagram,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/footer'
import NewsletterForm from '@/components/NewsletterForm'
import env from '@/config/env.config'
import { appNavigate } from '@/utils/appNavigate'

import Stripe from '@/assets/img/stripe.png'
import PayPal from '@/assets/img/paypal.png'
import Logo from '@/assets/img/logoWhite.png'
import '@/assets/css/footer.css'

const SecurePayment = env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe ? Stripe : PayPal

const Footer = () => (
  <div className="footer">
    <div className="footer-top">
      <div
        className="header footer-logo"
        onClick={() => appNavigate('/')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            appNavigate('/')
          }
        }}
        role="button"
        tabIndex={0}
      >
        <img src={Logo} alt={env.WEBSITE_NAME} className="footer-logo-img" />
      </div>

      <section className="main">
        <div className="main-section">
          <div className="title">{strings.CORPORATE}</div>
          <ul className="links">
            <li onClick={() => appNavigate('/about')}>{strings.ABOUT}</li>
            <li onClick={() => appNavigate('/cookie-policy')}>{strings.COOKIE_POLICY}</li>
            <li onClick={() => appNavigate('/privacy')}>{strings.PRIVACY_POLICY}</li>
            <li onClick={() => appNavigate('/tos')}>{strings.TOS}</li>
          </ul>
        </div>

        <div className="main-section">
          <div className="title">{strings.RENT}</div>
          <ul className="links">
            {!env.HIDE_SUPPLIERS && <li onClick={() => appNavigate('/suppliers')}>{strings.SUPPLIERS}</li>}
            <li onClick={() => appNavigate('/locations')}>{strings.LOCATIONS}</li>
          </ul>
        </div>

        <div className="main-section">
          <div className="title">{strings.SUPPORT}</div>
          <ul className="links">
            <li onClick={() => appNavigate('/contact')}>{strings.CONTACT}</li>
            <li onClick={() => appNavigate('/faq')}>{strings.FAQ}</li>
          </ul>
          <div className="footer-contact">
            <MailOutline className="icon" />
            <a href={`mailto:${env.CONTACT_EMAIL}`}>{env.CONTACT_EMAIL}</a>
          </div>
          <div className="footer-contact footer-socials">
            <IconButton href="https://www.facebook.com/" target="_blank" aria-label="Facebook" className="social-icon"><FacebookIcon /></IconButton>
            <IconButton href="https://x.com/" target="_blank" aria-label="X" className="social-icon"><X /></IconButton>
            <IconButton href="https://www.linkedin.com/" target="_blank" aria-label="LinkedIn" className="social-icon"><LinkedIn /></IconButton>
            <IconButton href="https://www.instagram.com/" target="_blank" aria-label="Instagram" className="social-icon"><Instagram /></IconButton>
          </div>
        </div>

        <div className="main-section footer-newsletter">
          <div className="newsletter">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>

    <section className="footer-bottom">
      <div className="copyright">
        <span>{strings.COPYRIGHT_PART1}</span>
        <span>{strings.COPYRIGHT_PART2}</span>
      </div>
      <div className="payment">
        <div className="payment-text">{strings.SECURE_PAYMENT}</div>
        <img
          src={SecurePayment}
          alt=""
          className={env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal ? 'payment-img paypal' : 'payment-img'}
        />
      </div>
    </section>
  </div>
)

export default Footer
