import React, { useCallback, useEffect, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { AddRounded, DirectionsCarFilledOutlined } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import AgencyAddCarStepper from '@/agency/pages/AgencyAddCarStepper'

const AgencyFleet = () => {
  const { agency } = useAgencyContext()
  const [cars, setCars] = useState<bookcarsTypes.Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openStepper, setOpenStepper] = useState(false)

  const loadCars = useCallback(async () => {
    if (!agency?._id) {
      setCars([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await AgencyCarService.getCars('', {
        suppliers: [agency._id],
      }, 1, 100)
      setCars(result?.[0]?.resultData || [])
    } catch {
      setError(strings.CAR_LOAD_ERROR)
      setCars([])
    } finally {
      setLoading(false)
    }
  }, [agency?._id])

  useEffect(() => {
    void loadCars()
  }, [loadCars])

  return (
    <div className="agency-page">
      <div className="agency-page-head agency-fleet-head">
        <div>
          <h2>{strings.FLEET}</h2>
          <p>{strings.FLEET_SUBTITLE}</p>
        </div>
        <Button
          variant="contained"
          className="btn-primary"
          startIcon={<AddRounded />}
          onClick={() => setOpenStepper(true)}
          disabled={!agency?._id}
        >
          {strings.ACTION_ADD_CAR}
        </Button>
      </div>

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void loadCars()}>{strings.RETRY}</Button>
        </div>
      ) : cars.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <DirectionsCarFilledOutlined className="agency-empty-icon" />
          <p>{strings.FLEET_EMPTY}</p>
          <Button variant="contained" className="btn-primary" startIcon={<AddRounded />} onClick={() => setOpenStepper(true)}>
            {strings.ACTION_ADD_CAR}
          </Button>
        </div>
      ) : (
        <div className="agency-fleet-grid">
          {cars.map((car) => (
            <article key={car._id} className="agency-fleet-card">
              <div className="agency-fleet-card-media">
                {car.image ? (
                  <img src={`${env.CDN_CARS}/${car.image}`} alt={car.name} />
                ) : (
                  <DirectionsCarFilledOutlined />
                )}
              </div>
              <div className="agency-fleet-card-body">
                <h3>{car.name}</h3>
                <p>{car.licensePlate || '—'}</p>
                <div className="agency-fleet-card-meta">
                  <span>{car.dailyPrice} TND / j</span>
                  <span className={car.available ? 'is-live' : 'is-pending'}>
                    {car.available ? strings.CAR_AVAILABLE : strings.CAR_UNAVAILABLE}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {agency?._id && (
        <AgencyAddCarStepper
          open={openStepper}
          agencyId={agency._id}
          onClose={() => setOpenStepper(false)}
          onCreated={(car) => {
            setCars((prev) => [car, ...prev])
            setOpenStepper(false)
          }}
        />
      )}
    </div>
  )
}

export default AgencyFleet
