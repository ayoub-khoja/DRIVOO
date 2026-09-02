import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Const from '@/config/const'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/search-filters'
import { strings as carStrings } from '@/lang/cars'
import * as CarService from '@/services/CarService'
import Pager from '@/components/Pager'
import SearchCarCard from '@/components/SearchCarCard'
import Car from '@/components/Car'
import Progress from '@/components/Progress'
import {
  CarSortOption,
  PriceBucket,
  sortCars,
  filterCarsByPriceBuckets,
  filterCarsByDeliveryTypes,
} from '@/utils/searchFacetsHelper'

import '@/assets/css/car-list.css'

interface CarListProps {
  from?: Date
  to?: Date
  suppliers?: string[]
  pickupLocation?: string
  dropOffLocation?: string
  pickupLocationName?: string
  carSpecs?: bookcarsTypes.CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[]
  deposit?: number
  cars?: bookcarsTypes.Car[]
  reload?: boolean
  booking?: bookcarsTypes.Booking
  className?: string
  hidePrice?: boolean
  hideSupplier?: boolean
  loading?: boolean
  sizeAuto?: boolean
  ranges?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  distance?: string
  includeAlreadyBookedCars?: boolean
  includeComingSoonCars?: boolean
  onLoad?: bookcarsTypes.DataEvent<bookcarsTypes.Car>
  onBaselineCarsLoaded?: (cars: bookcarsTypes.Car[]) => void
  sortBy?: CarSortOption
  onSortChange?: (sort: CarSortOption) => void
  priceBuckets?: PriceBucket[]
  deliveryTypes?: string[]
  requireAdditionalDriver?: boolean
  searchLayout?: boolean
}

const CarList = ({
  from,
  to,
  suppliers,
  pickupLocation,
  dropOffLocation,
  pickupLocationName,
  carSpecs,
  carType: _carType,
  gearbox,
  mileage,
  fuelPolicy,
  deposit,
  cars,
  reload,
  booking,
  className,
  hidePrice,
  hideSupplier,
  loading: carListLoading,
  ranges,
  multimedia,
  rating,
  seats,
  includeAlreadyBookedCars,
  includeComingSoonCars,
  onLoad,
  onBaselineCarsLoaded,
  sortBy = 'recommended',
  onSortChange,
  priceBuckets = [],
  deliveryTypes = [],
  requireAdditionalDriver = false,
  searchLayout = false,
}: CarListProps) => {
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [allRows, setAllRows] = useState<bookcarsTypes.Car[]>([])
  const [rawRows, setRawRows] = useState<bookcarsTypes.Car[]>([])
  const [rows, setRows] = useState<bookcarsTypes.Car[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
      const element = document.querySelector('body')

      if (element) {
        element.onscroll = () => {
          if (fetch
            && !loading
            && window.scrollY > 0
            && window.scrollY + window.innerHeight + env.INFINITE_SCROLL_OFFSET >= document.body.scrollHeight) {
            setLoading(true)
            setPage(page + 1)
          }
        }
      }
    }
  }, [fetch, loading, page])

  const applyClientFilters = (data: bookcarsTypes.Car[]) => {
    let filtered = [...data]

    if (priceBuckets.length > 0) {
      filtered = filterCarsByPriceBuckets(filtered, priceBuckets)
    }

    if (deliveryTypes.length > 0) {
      filtered = filterCarsByDeliveryTypes(filtered, deliveryTypes)
    }

    if (requireAdditionalDriver) {
      filtered = filtered.filter((car) => car.additionalDriver >= 0)
    }

    return sortCars(filtered, sortBy)
  }

  const paginateRows = (filtered: bookcarsTypes.Car[], _page: number) => {
    if (searchLayout) {
      const start = (_page - 1) * env.CARS_PAGE_SIZE
      return filtered.slice(start, start + env.CARS_PAGE_SIZE)
    }
    return filtered
  }

  const fetchData = async (
    _page: number,
    _suppliers?: string[],
    _pickupLocation?: string,
    _carSpecs?: bookcarsTypes.CarSpecs,
    __carType?: string[],
    _gearbox?: string[],
    _mileage?: string[],
    _fuelPolicy?: string[],
    _deposit?: number,
    _ranges?: string[],
    _multimedia?: string[],
    _rating?: number,
    _seats?: number,
  ) => {
    try {
      setLoading(true)

      const payload: bookcarsTypes.GetCarsPayload = {
        suppliers: _suppliers ?? [],
        pickupLocation: _pickupLocation,
        carSpecs: _carSpecs,
        carType: __carType,
        gearbox: _gearbox,
        mileage: _mileage,
        fuelPolicy: _fuelPolicy,
        deposit: _deposit,
        ranges: _ranges,
        multimedia: _multimedia,
        rating: _rating,
        seats: _seats,
        from,
        to,
        includeAlreadyBookedCars,
        includeComingSoonCars,
      }

      const fetchSize = searchLayout ? 500 : env.CARS_PAGE_SIZE
      const fetchPage = searchLayout ? 1 : _page
      const data = await CarService.getCars(payload, fetchPage, fetchSize)

      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }

      setRawRows(_data.resultData)

      const filtered = applyClientFilters(_data.resultData)
      const _totalRecords = searchLayout ? filtered.length : (
        Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0
      )

      if (searchLayout && onBaselineCarsLoaded) {
        onBaselineCarsLoaded(_data.resultData)
      }

      setAllRows(filtered)

      let pageRows = paginateRows(filtered, _page)

      if (!searchLayout && (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile)) {
        pageRows = _page === 1 ? filtered : [...rows, ...filtered]
      }

      setRows(pageRows)
      setRowCount((_page - 1) * env.CARS_PAGE_SIZE + pageRows.length)
      setTotalRecords(_totalRecords)
      setFetch(pageRows.length > 0)

      if (((env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) && _page === 1) || (env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile)) {
        window.scrollTo(0, 0)
      }

      if (onLoad) {
        onLoad({ rows: pageRows, rowCount: _totalRecords })
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      setInit(false)
    }
  }

  useEffect(() => {
    if (rawRows.length > 0 && searchLayout) {
      const filtered = applyClientFilters(rawRows)
      const pageRows = paginateRows(filtered, page)
      setAllRows(filtered)
      setRows(pageRows)
      setTotalRecords(filtered.length)
      setRowCount((page - 1) * env.CARS_PAGE_SIZE + pageRows.length)
    }
  }, [sortBy, priceBuckets, deliveryTypes, requireAdditionalDriver, page, rawRows, searchLayout]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (suppliers) {
      if (suppliers.length > 0) {
        fetchData(page, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats)
      } else {
        setRows([])
        setRawRows([])
        setAllRows([])
        setFetch(false)
        if (onLoad) {
          onLoad({ rows: [], rowCount: 0 })
        }
        setInit(false)
      }
    }
  }, [page, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cars) {
      setRows(cars)
      setFetch(false)
      if (onLoad) {
        onLoad({ rows: cars, rowCount: cars.length })
      }
      setLoading(false)
    }
  }, [cars]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
  }, [suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats, from, to, sortBy, priceBuckets, deliveryTypes, requireAdditionalDriver])

  useEffect(() => {
    if (reload) {
      setPage(1)
      fetchData(1, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats)
    }
  }, [reload, suppliers, pickupLocation, carSpecs, _carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <section className={`${className ? `${className} ` : ''}car-list${searchLayout ? ' car-list-pro' : ''}`}>
        {rows.length === 0
          ? !init
          && !loading
          && !carListLoading
          && (
            <Card variant="outlined" className="empty-list">
              <CardContent>
                <Typography color="textSecondary">{carStrings.EMPTY_LIST}</Typography>
              </CardContent>
            </Card>
          )
          : ((from && to && pickupLocation && dropOffLocation) || hidePrice)
          && (
            <>
              {searchLayout && totalRecords > 0 && (
                <div className="car-list-toolbar">
                  <div className="car-list-count">
                    <strong>{totalRecords}</strong>
                    {' '}
                    {totalRecords === 1 ? strings.CAR_AVAILABLE : strings.CARS_AVAILABLE}
                  </div>
                  {onSortChange && (
                    <FormControl size="small" className="car-list-sort">
                      <Select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as CarSortOption)}
                        displayEmpty
                      >
                        <MenuItem value="recommended">{strings.SORT_RECOMMENDED}</MenuItem>
                        <MenuItem value="priceAsc">{strings.SORT_PRICE_ASC}</MenuItem>
                        <MenuItem value="priceDesc">{strings.SORT_PRICE_DESC}</MenuItem>
                        <MenuItem value="ratingDesc">{strings.SORT_RATING}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </div>
              )}

              {!searchLayout && totalRecords > 0 && (
                <div className="title">
                  <div className="car-count">
                    {`(${totalRecords})`}
                  </div>
                </div>
              )}

              {rows.map((car, index) => (
                searchLayout ? (
                  <SearchCarCard
                    key={car._id}
                    car={car}
                    from={from as Date}
                    to={to as Date}
                    pickupLocation={pickupLocation}
                    dropOffLocation={dropOffLocation}
                    pickupLocationName={pickupLocationName}
                    recommended={page === 1 && index === 0 && (car.searchScore ?? 0) >= 70}
                  />
                ) : (
                  <Car
                    key={car._id}
                    car={car}
                    booking={booking}
                    pickupLocation={pickupLocation}
                    dropOffLocation={dropOffLocation}
                    from={from as Date}
                    to={to as Date}
                    pickupLocationName={pickupLocationName}
                    hideSupplier={hideSupplier}
                    hidePrice={hidePrice}
                  />
                )
              ))}
            </>
          )}
        {loading && <Progress />}
      </section>
      {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
        <Pager page={page} pageSize={env.CARS_PAGE_SIZE} rowCount={rowCount} totalRecords={totalRecords} onNext={() => setPage(page + 1)} onPrevious={() => setPage(page - 1)} />
      )}
    </>
  )
}

export default CarList
