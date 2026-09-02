import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Switch,
  Tooltip,
} from '@mui/material'
import {
  AddRounded,
  ChevronLeft,
  ChevronRight,
  DeleteOutlineRounded,
  DirectionsCarFilledOutlined,
  EditOutlined,
  Search as SearchIcon,
} from '@mui/icons-material'
import * as bookcarsHelper from ':bookcars-helper'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings } from '@/agency/lang/agency'
import { useAgencyContext } from '@/agency/context/AgencyContext'
import * as AgencyCarService from '@/agency/services/AgencyCarService'
import AgencyAddCarStepper from '@/agency/pages/AgencyAddCarStepper'
import AgencyEditCarDialog from '@/agency/pages/AgencyEditCarDialog'
import * as helper from '@/utils/helper'

const PAGE_SIZE = 8

type FleetRentalState = 'available' | 'rented' | 'offline'

const fleetRentalState = (car: bookcarsTypes.Car): FleetRentalState => {
  if (!car.available) {
    return 'offline'
  }
  if (car.fullyBooked) {
    return 'rented'
  }
  return 'available'
}

const carGallery = (car: bookcarsTypes.Car) => {
  const fromImages = (car.images || []).filter(Boolean)
  if (fromImages.length > 0) {
    return fromImages
  }
  return car.image ? [car.image] : []
}

const AgencyFleetCardMedia = ({
  car,
  availableLabel,
  rentedLabel,
  unavailableLabel,
  photosLabel,
}: {
  car: bookcarsTypes.Car
  availableLabel: string
  rentedLabel: string
  unavailableLabel: string
  photosLabel: string
}) => {
  const photos = carGallery(car)
  const [index, setIndex] = useState(0)
  const safeIndex = photos.length === 0 ? 0 : ((index % photos.length) + photos.length) % photos.length
  const current = photos[safeIndex]
  const rentalState = fleetRentalState(car)

  useEffect(() => {
    setIndex(0)
  }, [car._id, photos.length])

  const go = (delta: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (photos.length < 2) {
      return
    }
    setIndex((prev) => (prev + delta + photos.length) % photos.length)
  }

  const badgeClass =
    rentalState === 'available' ? 'is-live' : rentalState === 'rented' ? 'is-rented' : 'is-off'
  const badgeLabel =
    rentalState === 'available' ? availableLabel : rentalState === 'rented' ? rentedLabel : unavailableLabel

  return (
    <div className="agency-fleet-card-media">
      {current ? (
        <img src={`${env.CDN_CARS}/${current}`} alt={car.name} loading="lazy" />
      ) : (
        <DirectionsCarFilledOutlined className="agency-fleet-card-fallback" />
      )}

      <span className={`agency-fleet-badge ${badgeClass}`}>
        {badgeLabel}
      </span>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="agency-fleet-nav is-prev"
            aria-label="Photo précédente"
            onClick={(e) => go(-1, e)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="agency-fleet-nav is-next"
            aria-label="Photo suivante"
            onClick={(e) => go(1, e)}
          >
            <ChevronRight />
          </button>
          <span className="agency-fleet-photo-count">
            {safeIndex + 1}/{photos.length} {photosLabel}
          </span>
          <div className="agency-fleet-dots" aria-hidden>
            {photos.map((photo, i) => (
              <button
                key={photo}
                type="button"
                className={`agency-fleet-dot${i === safeIndex ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIndex(i)
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const AgencyFleet = () => {
  const { agency, agencyLoaded } = useAgencyContext()
  const language = agency?.language || 'fr'

  const [cars, setCars] = useState<bookcarsTypes.Car[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openStepper, setOpenStepper] = useState(false)
  const [editCar, setEditCar] = useState<bookcarsTypes.Car | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadCars = useCallback(async (search = '', nextPage = 1) => {
    if (!agency?._id) {
      setCars([])
      setTotalRecords(0)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await AgencyCarService.getCars(search, {
        suppliers: [agency._id],
      }, nextPage, PAGE_SIZE)
      setCars(result?.[0]?.resultData || [])
      const pageInfo = result?.[0]?.pageInfo as unknown as { totalRecords?: number }[] | { totalRecords?: number } | undefined
      setTotalRecords((Array.isArray(pageInfo) ? pageInfo[0]?.totalRecords : pageInfo?.totalRecords) || 0)
      setPage(nextPage)
    } catch {
      setError(strings.CAR_LOAD_ERROR)
      setCars([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [agency?._id])

  useEffect(() => {
    if (agencyLoaded) {
      void loadCars(query, 1)
    }
  }, [agencyLoaded, loadCars, query])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, totalRecords)

  const stats = useMemo(() => {
    const available = cars.filter((car) => fleetRentalState(car) === 'available').length
    const rented = cars.filter((car) => fleetRentalState(car) === 'rented').length
    const offline = cars.filter((car) => fleetRentalState(car) === 'offline').length
    return {
      pageCount: cars.length,
      available,
      rented,
      offline,
      total: totalRecords,
    }
  }, [cars, totalRecords])

  const handleDelete = async (car: bookcarsTypes.Car) => {
    if (!window.confirm(strings.CAR_DELETE_CONFIRM.replace('{0}', car.name))) {
      return
    }
    setBusyId(car._id)
    try {
      await AgencyCarService.deleteCar(car._id)
      helper.info(strings.CAR_DELETED)
      const nextPage = cars.length === 1 && page > 1 ? page - 1 : page
      await loadCars(query, nextPage)
    } catch {
      helper.error(undefined, strings.CAR_DELETE_ERROR)
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleAvailable = async (car: bookcarsTypes.Car) => {
    setBusyId(car._id)
    try {
      const updated = await AgencyCarService.updateAvailability(car._id, !car.available)
      setCars((prev) => prev.map((row) => (row._id === car._id ? { ...row, ...updated, available: !car.available } : row)))
      helper.info(!car.available ? strings.CAR_MARKED_AVAILABLE : strings.CAR_MARKED_UNAVAILABLE)
    } catch {
      helper.error(undefined, strings.CAR_SAVE_ERROR)
    } finally {
      setBusyId(null)
    }
  }

  if (!agencyLoaded || !agency) {
    return (
      <div className="agency-inline-loading">
        <CircularProgress size={28} />
        <span>{strings.LOADING}</span>
      </div>
    )
  }

  return (
    <div className="agency-page agency-fleet-page">
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
        >
          {strings.ACTION_ADD_CAR}
        </Button>
      </div>

      <div className="agency-fleet-stats">
        <article>
          <span>{strings.FLEET_STAT_TOTAL}</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="is-live">
          <span>{strings.FLEET_STAT_AVAILABLE}</span>
          <strong>{stats.available}</strong>
        </article>
        <article className="is-rented">
          <span>{strings.FLEET_STAT_RENTED}</span>
          <strong>{stats.rented}</strong>
        </article>
        <article className="is-off">
          <span>{strings.FLEET_STAT_OFF}</span>
          <strong>{stats.offline}</strong>
        </article>
      </div>

      <OutlinedInput
        size="small"
        className="agency-search"
        placeholder={strings.FLEET_SEARCH}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(keyword)
          }
        }}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => setQuery(keyword)} aria-label={strings.FLEET_SEARCH}>
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        )}
      />

      {loading ? (
        <div className="agency-inline-loading">
          <CircularProgress size={28} />
          <span>{strings.LOADING}</span>
        </div>
      ) : error ? (
        <div className="agency-empty-stage">
          <p>{error}</p>
          <Button onClick={() => void loadCars(query, page)}>{strings.RETRY}</Button>
        </div>
      ) : cars.length === 0 ? (
        <div className="agency-empty-stage">
          <div className="agency-empty-ring" aria-hidden />
          <DirectionsCarFilledOutlined className="agency-empty-icon" />
          <p>{query ? strings.FLEET_EMPTY_SEARCH : strings.FLEET_EMPTY}</p>
          {!query && (
            <Button variant="contained" className="btn-primary" startIcon={<AddRounded />} onClick={() => setOpenStepper(true)}>
              {strings.ACTION_ADD_CAR}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="agency-fleet-grid">
            {cars.map((car) => {
              const busy = busyId === car._id
              const rentalState = fleetRentalState(car)
              const priceLabel = bookcarsHelper.formatPrice(
                Number(car.dailyPrice) || 0,
                env.BASE_CURRENCY || 'TND',
                language,
              )

              return (
                <article
                  key={car._id}
                  className={`agency-fleet-card${rentalState === 'offline' ? ' is-offline' : ''}${rentalState === 'rented' ? ' is-rented' : ''}${busy ? ' is-busy' : ''}`}
                >
                  <AgencyFleetCardMedia
                    car={car}
                    availableLabel={strings.CAR_AVAILABLE}
                    rentedLabel={strings.CAR_RENTED}
                    unavailableLabel={strings.CAR_UNAVAILABLE}
                    photosLabel={strings.CAR_PHOTOS_COUNT}
                  />

                  <div className="agency-fleet-card-body">
                    <div className="agency-fleet-card-title">
                      <h3 title={car.name}>{car.name}</h3>
                      <p>{car.licensePlate || strings.CAR_NO_PLATE}</p>
                    </div>

                    <div className="agency-fleet-card-tags">
                      {car.range && <span>{car.range}</span>}
                      {car.gearbox && (
                        <span>
                          {car.gearbox === bookcarsTypes.GearboxType.Automatic
                            ? strings.CAR_GEAR_AUTO
                            : strings.CAR_GEAR_MANUAL}
                        </span>
                      )}
                      {car.seats ? <span>{car.seats} {strings.CAR_SEATS_SHORT}</span> : null}
                    </div>

                    <div className="agency-fleet-card-price">
                      <strong>{priceLabel}</strong>
                      <span>/ {strings.CAR_PER_DAY}</span>
                    </div>

                    <div className="agency-fleet-card-actions">
                      <label className="agency-fleet-switch">
                        <Switch
                          size="small"
                          checked={!!car.available}
                          disabled={busy}
                          onChange={() => void handleToggleAvailable(car)}
                          inputProps={{ 'aria-label': strings.CAR_TOGGLE_AVAILABLE }}
                        />
                        <span>
                          {car.available ? strings.CAR_AVAILABLE_SHORT : strings.CAR_UNAVAILABLE_SHORT}
                        </span>
                      </label>

                      <div className="agency-fleet-card-buttons">
                        <Tooltip title={strings.CAR_EDIT}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => setEditCar(car)}
                              aria-label={strings.CAR_EDIT}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={strings.CAR_DELETE}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => void handleDelete(car)}
                              aria-label={strings.CAR_DELETE}
                            >
                              {busy ? <CircularProgress size={16} /> : <DeleteOutlineRounded fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {totalRecords > PAGE_SIZE && (
            <div className="agency-pager">
              <span>{`${from}–${to} / ${totalRecords}`}</span>
              <div className="agency-pager-actions">
                <Button size="small" disabled={page <= 1 || loading} onClick={() => void loadCars(query, page - 1)}>
                  {strings.BACK}
                </Button>
                <span>{page} / {totalPages}</span>
                <Button size="small" disabled={page >= totalPages || loading} onClick={() => void loadCars(query, page + 1)}>
                  {strings.NEXT}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AgencyAddCarStepper
        open={openStepper}
        agencyId={agency._id!}
        onClose={() => setOpenStepper(false)}
        onCreated={() => {
          setOpenStepper(false)
          setQuery('')
          setKeyword('')
          void loadCars('', 1)
          helper.info(strings.CAR_CREATED)
        }}
      />

      <AgencyEditCarDialog
        open={!!editCar}
        agencyId={agency._id!}
        car={editCar}
        onClose={() => setEditCar(null)}
        onSaved={(updated) => {
          setCars((prev) => prev.map((row) => (row._id === updated._id ? { ...row, ...updated } : row)))
          setEditCar(null)
          helper.info(strings.CAR_UPDATED)
        }}
      />
    </div>
  )
}

export default AgencyFleet
