import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Dialog,
  DialogContent,
  Tab,
  Tabs
} from '@mui/material'
import {
  CheckBox,
  LockOutlined,
  LocalOfferOutlined,
  AccessTimeOutlined,
  DirectionsCarOutlined,
} from '@mui/icons-material'
import L from 'leaflet'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as carsStrings } from '@/lang/cars'
import { strings } from '@/lang/home'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import * as CountryService from '@/services/CountryService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import Layout from '@/components/Layout'
import SupplierCarrousel from '@/components/SupplierCarrousel'
import TabPanel, { a11yProps } from '@/components/TabPanel'
import LocationCarrousel from '@/components/LocationCarrousel'
import SearchForm from '@/components/SearchForm'
import Map from '@/components/Map'
import Footer from '@/components/Footer'
import FaqList from '@/components/FaqList'
import HomeSections from '@/components/HomeSections'

import Mini from '@/assets/img/mini.png'
import Midi from '@/assets/img/midi.png'
import Maxi from '@/assets/img/maxi.png'

import '@/assets/css/home.css'

const Home = () => {
  const navigate = useNavigate()
  const homeRef = useRef<HTMLDivElement>(null)

  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [countries, setCountries] = useState<bookcarsTypes.CountryInfo[]>([])
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropOffLocation, setDropOffLocation] = useState('')
  const [sameLocation, setSameLocation] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [openLocationSearchFormDialog, setOpenLocationSearchFormDialog] = useState(false)
  const [locations, setLocations] = useState<bookcarsTypes.Location[]>([])
  const [ranges, setRanges] = useState([bookcarsTypes.CarRange.Mini, bookcarsTypes.CarRange.Midi])
  const [openRangeSearchFormDialog, setOpenRangeSearchFormDialog] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [miniPricePhr, setMiniPricePhr] = useState(2.5)
  const [miniPricePday, setMiniPricePday] = useState(40)
  const [midiPricePhr, setMidiPricePhr] = useState(3.5)
  const [midiPricePday, setMidiPricePday] = useState(50)
  const [maxiPricePhr, setMaxiPricePhr] = useState(4.5)
  const [maxiPricePday, setMaxiPricePday] = useState(80)

  useEffect(() => {
    const init = async () => {
      const _miniPricePhr = await PaymentService.convertPrice(miniPricePhr)
      setMiniPricePhr(_miniPricePhr)
      const _miniPricePday = await PaymentService.convertPrice(miniPricePday)
      setMiniPricePday(_miniPricePday)
      const _midiPricePhr = await PaymentService.convertPrice(midiPricePhr)
      setMidiPricePhr(_midiPricePhr)
      const _midiPricePday = await PaymentService.convertPrice(midiPricePday)
      setMidiPricePday(_midiPricePday)
      const _maxiPricePhr = await PaymentService.convertPrice(maxiPricePhr)
      setMaxiPricePhr(_maxiPricePhr)
      const _maxiPricePday = await PaymentService.convertPrice(maxiPricePday)
      setMaxiPricePday(_maxiPricePday)
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = homeRef.current
    if (!root) {
      return undefined
    }

    const nodes = Array.from(root.querySelectorAll('.drivoo-reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [countries, suppliers])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        video.muted = true
        video.play()
      } else {
        video.pause()
      }
    })
  }

  const scrollToSearch = () => {
    document.getElementById('drivoo-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onLoad = async () => {
    if (!env.HIDE_SUPPLIERS) {
      let _suppliers = await SupplierService.getAllSuppliers()
      _suppliers = _suppliers.filter((supplier) => supplier.avatar && !/no-image/i.test(supplier.avatar))
      bookcarsHelper.shuffle(_suppliers)
      setSuppliers(_suppliers)
    }

    const _countries = await CountryService.getCountriesWithLocations('', true, env.MIN_LOCATIONS)
    setCountries(_countries)
    const _locations = await LocationService.getLocationsWithPosition()
    setLocations(_locations)

    const observer = new IntersectionObserver(handleIntersection)
    const video = document.getElementById('cover') as HTMLVideoElement
    if (video) {
      observer.observe(video)
    } else {
      console.error('Cover video not found')
    }
  }

  const language = UserService.getLanguage()

  return (
    <Layout onLoad={onLoad} strict={false}>

      <div className="home" ref={homeRef}>
        <div className="home-content">

          <div className="video">
            <video
              id="cover"
              muted={!env.isSafari}
              autoPlay={!env.isSafari}
              loop
              playsInline
              disablePictureInPicture
              onLoadedData={async () => {
                setVideoLoaded(true)
              }}
            >
              <source src="cover.mp4" type="video/mp4" />
              <track kind="captions" />
            </video>
            {!videoLoaded && (
              <div className="video-background" />
            )}
          </div>

          <div className="home-hero-stack">
            <div className="search drivoo-book-banner drivoo-book-banner--hero" id="drivoo-search">
              <div className="drivoo-book-banner-content">
                <div className="drivoo-book-banner-intro">
                  <span className="drivoo-hero-eyebrow">{strings.BOOK_FORM_HEAD}</span>
                  <h2>{strings.BOOK_HERO_TITLE}</h2>
                  <p>{strings.BOOK_HERO_TEXT}</p>
                </div>

                <div className="drivoo-hero-panel">
                  <div className="drivoo-hero-panel-glow" aria-hidden />
                  <div className="home-search">
                    <SearchForm />
                  </div>

                  <div className="drivoo-trust-bar">
                    <div className="drivoo-trust-item">
                      <span className="drivoo-trust-icon-wrap">
                        <LockOutlined className="drivoo-trust-icon" />
                      </span>
                      <span>{strings.TRUST_SECURE}</span>
                    </div>
                    <div className="drivoo-trust-item">
                      <span className="drivoo-trust-icon-wrap">
                        <LocalOfferOutlined className="drivoo-trust-icon" />
                      </span>
                      <span>{strings.TRUST_PRICE}</span>
                    </div>
                    <div className="drivoo-trust-item">
                      <span className="drivoo-trust-icon-wrap">
                        <AccessTimeOutlined className="drivoo-trust-icon" />
                      </span>
                      <span>{strings.TRUST_SUPPORT}</span>
                    </div>
                    <div className="drivoo-trust-item">
                      <span className="drivoo-trust-icon-wrap">
                        <DirectionsCarOutlined className="drivoo-trust-icon" />
                      </span>
                      <span>{strings.TRUST_FLEET}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="home-scroll-hint" aria-hidden />

        </div>

        <HomeSections onBook={scrollToSearch} />

        <div className="how drivoo-reveal">
          <div className="section-heading">
            <span className="section-eyebrow">{strings.HOW_EYEBROW}</span>
            <h2>{strings.HOW_TITLE}</h2>
            <p>{strings.HOW_TEXT}</p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">01</div>
              <h3>{strings.HOW_STEP1_TITLE}</h3>
              <p>{strings.HOW_STEP1_TEXT}</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">02</div>
              <h3>{strings.HOW_STEP2_TITLE}</h3>
              <p>{strings.HOW_STEP2_TEXT}</p>
            </div>
            <div className="how-step">
              <div className="how-step-num">03</div>
              <h3>{strings.HOW_STEP3_TITLE}</h3>
              <p>{strings.HOW_STEP3_TEXT}</p>
            </div>
          </div>
        </div>

        <div className="home-suppliers drivoo-reveal" style={suppliers.length < 4 ? { margin: 0 } : undefined}>
          {suppliers.length > 3 && (
            <>
              <div className="section-heading">
                <span className="section-eyebrow">{strings.SUPPLIERS_EYEBROW}</span>
                <h1>{strings.SUPPLIERS_TITLE}</h1>
              </div>
              <SupplierCarrousel suppliers={suppliers} />
            </>
          )}
        </div>

        {countries.length > 0 && (
          <div className="destinations drivoo-reveal">
            <div className="section-heading">
              <span className="section-eyebrow">{strings.DESTINATIONS_EYEBROW}</span>
              <h1>{strings.DESTINATIONS_TITLE}</h1>
            </div>
            <div className="tabs">
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="destinations"
                TabIndicatorProps={{ sx: { display: env.isMobile ? 'none' : null } }}
                sx={{
                  '& .MuiTabs-flexContainer': {
                    flexWrap: 'wrap',
                  },
                }}
              >
                {
                  countries.map((country, index) => (
                    <Tab key={country._id} label={country.name?.toUpperCase()} {...a11yProps(index)} />
                  ))
                }
              </Tabs>

              {
                countries.map((country, index) => (
                  <TabPanel key={country._id} value={tabValue} index={index}>
                    <LocationCarrousel
                      locations={country.locations!}
                      onSelect={(location) => {
                        setPickupLocation(location._id)
                        setOpenLocationSearchFormDialog(true)
                      }}
                    />
                  </TabPanel>
                ))
              }
            </div>
          </div>
        )}

        <div className="car-size drivoo-reveal">
          <div className="section-heading">
            <span className="section-eyebrow">{strings.CAR_SIZE_EYEBROW}</span>
            <h1>{strings.CAR_SIZE_TITLE}</h1>
            <p>{strings.CAR_SIZE_TEXT}</p>
          </div>
          <div className="boxes">
            <div className="box">
              <div className="box-img">
                <img alt="Mini" src={Mini} />
              </div>
              <div className="box-content">
                <span>{carsStrings.CAR_RANGE_MINI}</span>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(miniPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · phr</span>
                  </li>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(miniPricePday, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · pday</span>
                  </li>
                </ul>
              </div>
              <div className="car-size-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-car-size"
                  aria-label="Search for a car"
                  disabled={ranges.length === 0}
                  onClick={() => {
                    setRanges([bookcarsTypes.CarRange.Mini])
                    setOpenRangeSearchFormDialog(true)
                  }}
                >
                  {strings.SEARCH_FOR_CAR}
                </Button>
              </div>
            </div>
            <div className="box">
              <div className="box-img">
                <img alt="Midi" src={Midi} />
              </div>
              <div className="box-content">
                <span>{carsStrings.CAR_RANGE_MIDI}</span>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(midiPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · phr</span>
                  </li>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(midiPricePday, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · pday</span>
                  </li>
                </ul>
              </div>
              <div className="car-size-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-car-size"
                  aria-label="Search for a car"
                  disabled={ranges.length === 0}
                  onClick={() => {
                    setRanges([bookcarsTypes.CarRange.Midi])
                    setOpenRangeSearchFormDialog(true)
                  }}
                >
                  {strings.SEARCH_FOR_CAR}
                </Button>
              </div>
            </div>
            <div className="box">
              <div className="box-img">
                <img alt="Maxi" src={Maxi} />
              </div>
              <div className="box-content">
                <span>{carsStrings.CAR_RANGE_MAXI}</span>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(maxiPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · phr</span>
                  </li>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(maxiPricePday, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · pday</span>
                  </li>
                </ul>
              </div>
              <div className="car-size-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-car-size"
                  aria-label="Search for a car"
                  disabled={ranges.length === 0}
                  onClick={() => {
                    setRanges([bookcarsTypes.CarRange.Maxi])
                    setOpenRangeSearchFormDialog(true)
                  }}
                >
                  {strings.SEARCH_FOR_CAR}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="faq drivoo-reveal">
          <FaqList />
        </div>

        <div className="home-map drivoo-reveal">
          <Map
            title={strings.MAP_TITLE}
            position={new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE)}
            initialZoom={env.MAP_ZOOM}
            locations={locations}
            onSelelectPickUpLocation={async (locationId) => {
              setPickupLocation(locationId)
              if (sameLocation) {
                setDropOffLocation(locationId)
              } else {
                setSameLocation(dropOffLocation === locationId)
              }
              setOpenLocationSearchFormDialog(true)
            }}
          />
        </div>

        <div className="customer-care drivoo-reveal">
          <div className="customer-care-wrapper">
            <div className="customer-care-text">
              <h1>{strings.CUSTOMER_CARE_TITLE}</h1>
              <h2>{strings.CUSTOMER_CARE_SUBTITLE}</h2>
              <div className="customer-care-content">{strings.CUSTOMER_CARE_TEXT}</div>
              <div className="customer-care-boxes">
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_ASSISTANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_MODIFICATION}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_GUIDANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_SUPPORT}</span>
                </div>
              </div>
              <Button
                variant="contained"
                className="btn-primary btn-home"
                onClick={() => navigate('/contact')}
              >
                {strings.CONTACT_US}
              </Button>
            </div>

            <div className="customer-care-img">
              <img src="/customer-care.png" alt="" />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        maxWidth={false}
        open={openLocationSearchFormDialog}
        onClose={() => {
          setOpenLocationSearchFormDialog(false)
        }}
      >
        <DialogContent className="search-dialog-content">
          <SearchForm
            ranges={bookcarsHelper.getAllRanges()}
            pickupLocation={pickupLocation}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        maxWidth={false}
        open={openRangeSearchFormDialog}
        onClose={() => {
          setOpenRangeSearchFormDialog(false)
        }}
      >
        <DialogContent className="search-dialog-content">
          <SearchForm
            ranges={ranges}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </Layout>
  )
}

export default Home
