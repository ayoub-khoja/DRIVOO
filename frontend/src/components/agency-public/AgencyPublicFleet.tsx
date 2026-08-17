import React from 'react'
import { Link } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import {
  AirlineSeatReclineNormalOutlined,
  DirectionsCarFilledOutlined,
  LocalGasStationOutlined,
  SettingsOutlined,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/agency-public'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'

type AgencyPublicFleetProps = {
  loading: boolean
  cars: bookcarsTypes.PublicAgencyCar[]
}

const carImage = (image?: string) => (image ? bookcarsHelper.joinURL(env.CDN_CARS, image) : '')

const AgencyPublicFleet = ({ loading, cars }: AgencyPublicFleetProps) => {
  if (loading) {
    return (
      <div className="agence-public-tab-state">
        <CircularProgress size={26} />
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className="agence-public-tab-state">
        <DirectionsCarFilledOutlined />
        <p>{strings.FLEET_EMPTY}</p>
      </div>
    )
  }

  return (
    <div className="agence-public-fleet-grid">
      {cars.map((car) => (
        <article key={car._id} className="agence-public-car">
          <div className="agence-public-car-media">
            {car.image ? (
              <img src={carImage(car.image)} alt={car.name} />
            ) : (
              <DirectionsCarFilledOutlined />
            )}
          </div>
          <div className="agence-public-car-body">
            <div className="agence-public-car-top">
              <h4>{car.name}</h4>
              {(car.brand || car.year) && (
                <p>{[car.brand, car.model, car.year].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <ul className="agence-public-car-meta">
              {car.seats ? (
                <li>
                  <AirlineSeatReclineNormalOutlined />
                  {car.seats} {strings.SEATS}
                </li>
              ) : null}
              {car.gearbox ? (
                <li>
                  <SettingsOutlined />
                  {helper.getGearboxType(car.gearbox)}
                </li>
              ) : null}
              {car.type ? (
                <li>
                  <LocalGasStationOutlined />
                  {helper.getCarType(car.type)}
                </li>
              ) : null}
            </ul>
            <div className="agence-public-car-footer">
              <strong>
                {bookcarsHelper.formatPrice(car.dailyPrice, commonStrings.CURRENCY, UserService.getLanguage())}
                <span>{commonStrings.DAILY}</span>
              </strong>
              <Link to="/" className="agence-public-car-cta">{strings.BOOK}</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default AgencyPublicFleet
