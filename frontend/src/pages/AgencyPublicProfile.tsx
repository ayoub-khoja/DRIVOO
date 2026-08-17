import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, CircularProgress } from '@mui/material'
import {
  AlternateEmailOutlined,
  DirectionsCarFilledOutlined,
  DirectionsCarOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  StorefrontOutlined,
  VerifiedOutlined,
  WhatsApp,
  WifiTethering,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import AgencyPublicMap from '@/components/AgencyPublicMap'
import AgencyPublicPanel from '@/components/agency-public/AgencyPublicPanel'
import { strings } from '@/lang/agency-public'
import * as AgencyPublicService from '@/services/AgencyPublicService'
import * as AgencyProfileService from '@/agency/services/AgencyProfileService'

import '@/assets/css/agency-public.css'

const toWhatsAppUrl = (phone?: string) => {
  if (!phone) {
    return ''
  }
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    digits = `216${digits.replace(/^0+/, '')}`
  }
  return digits ? `https://wa.me/${digits}` : ''
}

const DetailRow = ({
  icon,
  children,
  href,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  href?: string
}) => {
  const content = (
    <>
      <span className="agence-public-ico">{icon}</span>
      <span>{children}</span>
    </>
  )
  if (href) {
    return <a className="agence-public-row" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{content}</a>
  }
  return <p className="agence-public-row">{content}</p>
}

const AgencyPublicProfile = () => {
  const { slug = '' } = useParams()
  const [profile, setProfile] = useState<bookcarsTypes.PublicAgencyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setMissing(false)
      try {
        const data = await AgencyPublicService.getPublicProfile(slug)
        if (!cancelled) {
          setProfile(data)
        }
      } catch {
        if (!cancelled) {
          setMissing(true)
          setProfile(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  const logo = AgencyProfileService.resolveLogoUrl(profile?.avatar)
  const placeLine = [profile?.city, profile?.governorate].filter(Boolean).join(', ')
  const addressLine = [profile?.address, profile?.postalCode, profile?.city, profile?.governorate].filter(Boolean).join(' · ')
  const whatsapp = useMemo(() => toWhatsAppUrl(profile?.whatsapp || profile?.phone), [profile])
  const available = (profile?.carCount || 0) > 0

  return (
    <Layout strict={false}>
      {loading ? (
        <div className="agence-public-state">
          <CircularProgress size={32} />
        </div>
      ) : missing || !profile ? (
        <div className="agence-public-state">
          <p>{strings.NOT_FOUND}</p>
          <Button component={Link} to="/" variant="contained" className="btn-primary">{strings.BACK}</Button>
        </div>
      ) : (
        <div className="agence-public">
          <div className="agence-public-layout">
            <aside className="agence-public-profile">
              <div className="agence-public-identity">
                <div className="agence-public-avatar">
                  {logo ? <img src={logo} alt={profile.fullName} /> : <span>{profile.fullName.charAt(0)}</span>}
                </div>
                <div>
                  <h2>{profile.fullName}</h2>
                  <p className="agence-public-role">
                    <StorefrontOutlined />
                    {strings.ACTIVITY}
                  </p>
                  {placeLine && (
                    <p className="agence-public-place">
                      <LocationOnOutlined />
                      {placeLine}
                    </p>
                  )}
                </div>
              </div>

              <div className="agence-public-details">
                <DetailRow icon={<DirectionsCarFilledOutlined />}>{strings.ACTIVITY}</DetailRow>
                {profile.email && (
                  <DetailRow icon={<AlternateEmailOutlined />} href={`mailto:${profile.email}`}>
                    {profile.email}
                  </DetailRow>
                )}
                {profile.phone && (
                  <DetailRow icon={<PhoneOutlined />} href={`tel:${profile.phone}`}>
                    {profile.phone}
                  </DetailRow>
                )}
                {(profile.whatsapp || profile.phone) && (
                  <DetailRow icon={<WhatsApp />} href={whatsapp || undefined}>
                    {profile.whatsapp || profile.phone}
                  </DetailRow>
                )}
                <DetailRow icon={<WifiTethering className={available ? 'is-live' : ''} />}>
                  {available ? strings.AVAILABLE : strings.ON_REQUEST}
                </DetailRow>
              </div>

              <div className="agence-public-map-block">
                <h3>
                  <LocationOnOutlined />
                  {strings.LOCATION}
                </h3>
                {addressLine && <p className="agence-public-map-address">{addressLine}</p>}
                {profile.latitude != null && profile.longitude != null ? (
                  <div className="agence-public-map">
                    <AgencyPublicMap
                      latitude={profile.latitude}
                      longitude={profile.longitude}
                      label={profile.fullName}
                    />
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="agence-public-left">
              <section className="agence-public-hero">
                <div className="agence-public-orb" aria-hidden />
                <p className="agence-public-kicker">{strings.KICKER}</p>
                <h1>{profile.fullName}</h1>
                {profile.agencyApproved !== false && (
                  <span className="agence-public-badge">
                    <VerifiedOutlined />
                    {strings.VERIFIED}
                  </span>
                )}
                <div className="agence-public-actions">
                  <Button component={Link} to="/" variant="contained" className="btn-primary" startIcon={<DirectionsCarOutlined />}>
                    {strings.CTA}
                  </Button>
                  {profile.phone && (
                    <Button href={`tel:${profile.phone}`} variant="outlined" className="agence-public-ghost" startIcon={<PhoneOutlined />}>
                      {strings.CALL}
                    </Button>
                  )}
                  {whatsapp && (
                    <Button href={whatsapp} target="_blank" rel="noreferrer" variant="outlined" className="agence-public-ghost" startIcon={<WhatsApp />}>
                      {strings.WHATSAPP}
                    </Button>
                  )}
                </div>
              </section>

              <AgencyPublicPanel slug={slug} profile={profile} />
            </div>
          </div>
        </div>
      )}
      <Footer />
    </Layout>
  )
}

export default AgencyPublicProfile
