import React, { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import * as LocationService from '@/services/LocationService'
import * as SupplierService from '@/services/SupplierService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import CarFilter from '@/components/CarFilter'
import SearchFiltersSidebar from '@/components/SearchFiltersSidebar'
import CarList from '@/components/CarList'
import Map from '@/components/Map'
import ViewOnMapButton from '@/components/ViewOnMapButton'
import MapDialog from '@/components/MapDialog'
import {
  CarSortOption,
  PriceBucket,
  SearchFacets,
  computeSearchFacets,
} from '@/utils/searchFacetsHelper'

import '@/assets/css/search.css'

const Search = () => {
  const location = useLocation()

  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [allSuppliersIds, setAllSuppliersIds] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [supplierIds, setSupplierIds] = useState<string[]>()
  const [loading, setLoading] = useState(true)
  const [carSpecs, setCarSpecs] = useState<bookcarsTypes.CarSpecs>({})
  const [carType, setCarType] = useState(bookcarsHelper.getAllCarTypes())
  const [gearbox, setGearbox] = useState([bookcarsTypes.GearboxType.Automatic, bookcarsTypes.GearboxType.Manual])
  const [mileage, setMileage] = useState([bookcarsTypes.Mileage.Limited, bookcarsTypes.Mileage.Unlimited])
  const [fuelPolicy, setFuelPolicy] = useState(bookcarsHelper.getAllFuelPolicies())
  const [deposit, setDeposit] = useState(-1)
  const [ranges, setRanges] = useState(bookcarsHelper.getAllRanges())
  const [multimedia, setMultimedia] = useState<bookcarsTypes.CarMultimedia[]>([])
  const [rating, setRating] = useState(-1)
  const [seats, setSeats] = useState(-1)
  const [openMapDialog, setOpenMapDialog] = useState(false)
  const [baselineCars, setBaselineCars] = useState<bookcarsTypes.Car[]>([])
  const [sortBy, setSortBy] = useState<CarSortOption>('recommended')
  const [priceBuckets, setPriceBuckets] = useState<PriceBucket[]>([])
  const [deliveryTypes, setDeliveryTypes] = useState<string[]>([])
  const [requireAdditionalDriver, setRequireAdditionalDriver] = useState(false)

  const facets: SearchFacets = useMemo(
    () => computeSearchFacets(baselineCars),
    [baselineCars],
  )

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const fetchedSuppliers = await SupplierService.getAllSuppliers()
        setAllSuppliers(fetchedSuppliers)
        setAllSuppliersIds(bookcarsHelper.flattenSuppliers(fetchedSuppliers))
      } catch (err) {
        helper.error(err, 'Failed to fetch suppliers')
      }
    }

    fetchSuppliers()
  }, [])

  useEffect(() => {
    const updateSuppliers = async () => {
      if (pickupLocation) {
        const payload: bookcarsTypes.GetCarsPayload = {
          pickupLocation: pickupLocation._id,
          carSpecs,
          carType,
          gearbox,
          mileage,
          fuelPolicy,
          deposit,
          ranges,
          multimedia,
          rating,
          seats,
          from,
          to,
        }
        const _suppliers = await SupplierService.getFrontendSuppliers(payload)
        setSuppliers(_suppliers)
      }
    }

    if (from && to) {
      updateSuppliers()
    }
  }, [pickupLocation, carSpecs, carType, gearbox, mileage, fuelPolicy, deposit, ranges, multimedia, rating, seats, from, to])

  const handleCarFilterSubmit = async (filter: bookcarsTypes.CarFilter) => {
    if (suppliers.length < allSuppliers.length) {
      const _supplierIds = bookcarsHelper.clone(allSuppliersIds)
      setSupplierIds(_supplierIds)
    }

    setPickupLocation(filter.pickupLocation)
    setDropOffLocation(filter.dropOffLocation)
    setFrom(filter.from)
    setTo(filter.to)
  }

  const handleClearAllFilters = () => {
    setCarSpecs({})
    setCarType(bookcarsHelper.getAllCarTypes())
    setGearbox([bookcarsTypes.GearboxType.Automatic, bookcarsTypes.GearboxType.Manual])
    setMileage([bookcarsTypes.Mileage.Limited, bookcarsTypes.Mileage.Unlimited])
    setFuelPolicy(bookcarsHelper.getAllFuelPolicies())
    setDeposit(-1)
    setRanges(bookcarsHelper.getAllRanges())
    setMultimedia([])
    setRating(-1)
    setSeats(-1)
    setPriceBuckets([])
    setDeliveryTypes([])
    setRequireAdditionalDriver(false)
    setSortBy('recommended')
    if (supplierIds) {
      setSupplierIds(bookcarsHelper.flattenSuppliers(suppliers))
    }
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    const { state } = location
    if (!state) {
      setNoMatch(true)
      return
    }

    const { pickupLocationId } = state
    const { dropOffLocationId } = state
    const { from: _from } = state
    const { to: _to } = state

    if (!pickupLocationId || !dropOffLocationId || !_from || !_to) {
      setLoading(false)
      setNoMatch(true)
      return
    }

    let _pickupLocation
    let _dropOffLocation
    try {
      _pickupLocation = await LocationService.getLocation(pickupLocationId)

      if (!_pickupLocation) {
        setLoading(false)
        setNoMatch(true)
        return
      }

      if (dropOffLocationId !== pickupLocationId) {
        _dropOffLocation = await LocationService.getLocation(dropOffLocationId)
      } else {
        _dropOffLocation = _pickupLocation
      }

      if (!_dropOffLocation) {
        setLoading(false)
        setNoMatch(true)
        return
      }

      const payload: bookcarsTypes.GetCarsPayload = {
        pickupLocation: _pickupLocation._id,
        carSpecs,
        carType,
        gearbox,
        mileage,
        fuelPolicy,
        deposit,
        ranges,
        multimedia,
        rating,
        seats,
        from: _from,
        to: _to,
      }
      const _suppliers = await SupplierService.getFrontendSuppliers(payload)
      const _supplierIds = bookcarsHelper.flattenSuppliers(_suppliers)

      setPickupLocation(_pickupLocation)
      setDropOffLocation(_dropOffLocation)
      setFrom(_from)
      setTo(_to)
      setSuppliers(_suppliers)
      setSupplierIds(_supplierIds)

      const { ranges: _ranges } = state
      if (_ranges) {
        setRanges(_ranges)
      }

      setLoading(false)
      if (!user || (user && user.verified)) {
        setVisible(true)
      }
    } catch (err) {
      helper.error(err)
      setLoading(false)
    }
  }

  return (
    <>
      <Layout onLoad={onLoad} strict={false}>
        {visible && supplierIds && pickupLocation && dropOffLocation && from && to && (
          <div className="search search-pro">
            <div className="col-1">
              {!loading && (
                <>
                  {((pickupLocation.latitude && pickupLocation.longitude)
                    || (pickupLocation.parkingSpots && pickupLocation.parkingSpots.length > 0)) && (
                      <Map
                        position={[pickupLocation.latitude || Number(pickupLocation.parkingSpots![0].latitude), pickupLocation.longitude || Number(pickupLocation.parkingSpots![0].longitude)]}
                        initialZoom={10}
                        locations={[pickupLocation]}
                        parkingSpots={pickupLocation.parkingSpots}
                        className="map"
                      >
                        <ViewOnMapButton onClick={() => setOpenMapDialog(true)} />
                      </Map>
                    )}

                  <CarFilter
                    className="filter"
                    pickupLocation={pickupLocation}
                    dropOffLocation={dropOffLocation}
                    from={from}
                    to={to}
                    collapse
                    onSubmit={handleCarFilterSubmit}
                  />

                  <SearchFiltersSidebar
                    facets={facets}
                    suppliers={suppliers}
                    gearbox={gearbox}
                    carType={carType}
                    mileage={mileage}
                    ranges={ranges}
                    fuelPolicy={fuelPolicy}
                    multimedia={multimedia}
                    rating={rating}
                    seats={seats}
                    deposit={deposit}
                    carSpecs={carSpecs}
                    requireAdditionalDriver={requireAdditionalDriver}
                    priceBuckets={priceBuckets}
                    deliveryTypes={deliveryTypes}
                    supplierIds={supplierIds}
                    onGearboxChange={setGearbox}
                    onCarTypeChange={setCarType}
                    onMileageChange={setMileage}
                    onRangesChange={setRanges}
                    onFuelPolicyChange={setFuelPolicy}
                    onMultimediaChange={setMultimedia}
                    onRatingChange={setRating}
                    onSeatsChange={setSeats}
                    onDepositChange={setDeposit}
                    onCarSpecsChange={setCarSpecs}
                    onRequireAdditionalDriverChange={setRequireAdditionalDriver}
                    onPriceBucketsChange={setPriceBuckets}
                    onDeliveryTypesChange={setDeliveryTypes}
                    onSupplierIdsChange={setSupplierIds}
                    onClearAll={handleClearAllFilters}
                    onMapClick={() => setOpenMapDialog(true)}
                    showMapButton
                  />
                </>
              )}
            </div>
            <div className="col-2">
              <CarList
                carSpecs={carSpecs}
                suppliers={supplierIds}
                carType={carType}
                gearbox={gearbox}
                mileage={mileage}
                fuelPolicy={fuelPolicy}
                deposit={deposit}
                pickupLocation={pickupLocation._id}
                dropOffLocation={dropOffLocation._id}
                pickupLocationName={pickupLocation.name}
                loading={loading}
                from={from}
                to={to}
                ranges={ranges}
                multimedia={multimedia}
                rating={rating}
                seats={seats}
                includeComingSoonCars
                searchLayout
                sortBy={sortBy}
                onSortChange={setSortBy}
                priceBuckets={priceBuckets}
                deliveryTypes={deliveryTypes}
                requireAdditionalDriver={requireAdditionalDriver}
                onBaselineCarsLoaded={setBaselineCars}
                hideSupplier={env.HIDE_SUPPLIERS}
              />
            </div>
          </div>
        )}

        <MapDialog
          pickupLocation={pickupLocation}
          openMapDialog={openMapDialog}
          carCount={facets.total}
          baselineCars={baselineCars}
          from={from}
          to={to}
          onClose={() => setOpenMapDialog(false)}
        />

        {noMatch && <NoMatch hideHeader />}
      </Layout>
    </>
  )
}

export default Search
