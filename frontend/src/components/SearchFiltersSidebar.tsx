import React from 'react'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/search-filters'
import * as helper from '@/utils/helper'
import { SearchFacets, PRICE_BUCKETS, PriceBucket } from '@/utils/searchFacetsHelper'
import Accordion from '@/components/Accordion'

import '@/assets/css/search-filters-sidebar.css'

interface FilterOptionProps {
  id: string
  label: string
  count?: number
  checked: boolean
  onChange: (checked: boolean) => void
}

const FilterOption = ({ id, label, count, checked, onChange }: FilterOptionProps) => (
  <label className="search-filter-option" htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="search-filter-option-label">{label}</span>
    {count !== undefined && <span className="search-filter-count">{count}</span>}
  </label>
)

export interface SearchFiltersSidebarProps {
  facets: SearchFacets
  suppliers: bookcarsTypes.User[]
  gearbox: bookcarsTypes.GearboxType[]
  carType: bookcarsTypes.CarType[]
  mileage: bookcarsTypes.Mileage[]
  ranges: bookcarsTypes.CarRange[]
  fuelPolicy: bookcarsTypes.FuelPolicy[]
  multimedia: bookcarsTypes.CarMultimedia[]
  rating: number
  seats: number
  deposit: number
  carSpecs: bookcarsTypes.CarSpecs
  requireAdditionalDriver: boolean
  priceBuckets: PriceBucket[]
  deliveryTypes: string[]
  supplierIds: string[]
  onGearboxChange: (values: bookcarsTypes.GearboxType[]) => void
  onCarTypeChange: (values: bookcarsTypes.CarType[]) => void
  onMileageChange: (values: bookcarsTypes.Mileage[]) => void
  onRangesChange: (values: bookcarsTypes.CarRange[]) => void
  onFuelPolicyChange: (values: bookcarsTypes.FuelPolicy[]) => void
  onMultimediaChange: (values: bookcarsTypes.CarMultimedia[]) => void
  onRatingChange: (value: number) => void
  onSeatsChange: (value: number) => void
  onDepositChange: (value: number) => void
  onCarSpecsChange: (value: bookcarsTypes.CarSpecs) => void
  onRequireAdditionalDriverChange: (value: boolean) => void
  onPriceBucketsChange: (values: PriceBucket[]) => void
  onDeliveryTypesChange: (values: string[]) => void
  onSupplierIdsChange: (values: string[]) => void
  onClearAll: () => void
  onMapClick?: () => void
  showMapButton?: boolean
}

const SearchFiltersSidebar = ({
  facets,
  suppliers,
  gearbox,
  carType,
  mileage,
  ranges,
  fuelPolicy,
  rating,
  seats,
  deposit,
  carSpecs,
  requireAdditionalDriver,
  priceBuckets,
  deliveryTypes,
  supplierIds,
  onGearboxChange,
  onCarTypeChange,
  onMileageChange,
  onRangesChange,
  onFuelPolicyChange,
  onRatingChange,
  onSeatsChange,
  onDepositChange,
  onCarSpecsChange,
  onRequireAdditionalDriverChange,
  onPriceBucketsChange,
  onDeliveryTypesChange,
  onSupplierIdsChange,
  onClearAll,
  onMapClick,
  showMapButton,
}: SearchFiltersSidebarProps) => {
  const toggleArrayValue = <T,>(values: T[], value: T, checked: boolean): T[] => {
    if (checked) return values.includes(value) ? values : [...values, value]
    const next = values.filter((v) => v !== value)
    return next
  }

  const allGearbox = [bookcarsTypes.GearboxType.Automatic, bookcarsTypes.GearboxType.Manual]
  const allMileage = [bookcarsTypes.Mileage.Limited, bookcarsTypes.Mileage.Unlimited]
  const allFuelTypes = [
    bookcarsTypes.CarType.Diesel,
    bookcarsTypes.CarType.Gasoline,
    bookcarsTypes.CarType.Electric,
    bookcarsTypes.CarType.Hybrid,
    bookcarsTypes.CarType.PlugInHybrid,
  ]
  const allRanges = bookcarsHelper.getAllRanges()
  const allFuelPolicies = bookcarsHelper.getAllFuelPolicies()

  const isGearboxChecked = (value: bookcarsTypes.GearboxType) =>
    gearbox.length === 0 || gearbox.includes(value)

  const handleGearboxToggle = (value: bookcarsTypes.GearboxType, checked: boolean) => {
    let next = toggleArrayValue(gearbox.length === 0 ? allGearbox : gearbox, value, checked)
    if (next.length === allGearbox.length) next = allGearbox
    onGearboxChange(next.length === 0 ? allGearbox : next)
  }

  const handleSupplierToggle = (id: string, checked: boolean) => {
    const allIds = suppliers.map((s) => s._id).filter((supplierId): supplierId is string => supplierId !== undefined)
    const base = supplierIds.length === 0 ? allIds : supplierIds
    let next = toggleArrayValue(base, id, checked)
    if (next.length === allIds.length) next = allIds
    onSupplierIdsChange(next)
  }

  const categoryOptions = [
    { value: bookcarsTypes.CarRange.Mini, label: strings.SMALL_CAR, key: 'mini' },
    { value: bookcarsTypes.CarRange.Midi, label: strings.MEDIUM_CAR, key: 'midi' },
    { value: bookcarsTypes.CarRange.Maxi, label: strings.LARGE_CAR, key: 'maxi' },
    { value: bookcarsTypes.CarRange.Bus, label: strings.MINIVAN, key: 'minivan' },
  ]

  const priceLabels: Record<PriceBucket, string> = {
    '0-50': '0 € - 50 €',
    '50-100': '50 € - 100 €',
    '100-150': '100 € - 150 €',
    '150-200': '150 € - 200 €',
    '200+': '200 € et +',
  }

  return (
    <aside className="search-filters-sidebar">
      <div className="search-filters-header">
        <h2>{strings.FILTERS}</h2>
        <button type="button" className="search-filters-clear" onClick={onClearAll}>
          {strings.CLEAR_ALL}
        </button>
      </div>

      {showMapButton && onMapClick && (
        <button type="button" className="search-filters-map-btn" onClick={onMapClick}>
          {strings.VIEW_ON_MAP}
        </button>
      )}

      <Accordion title={strings.LOCATION} collapse className="search-filter-section">
        <FilterOption
          id="delivery-airport"
          label={strings.AIRPORT_TERMINAL}
          count={facets.deliveryType[bookcarsTypes.DeliveryType.Airport]}
          checked={deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Airport)}
          onChange={(checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Airport,
            checked,
          ))}
        />
        <FilterOption
          id="delivery-office"
          label={strings.AIRPORT_MEET}
          count={facets.deliveryType[bookcarsTypes.DeliveryType.Office]}
          checked={deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Office)}
          onChange={(checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Office,
            checked,
          ))}
        />
        <FilterOption
          id="delivery-shuttle"
          label={strings.AIRPORT_SHUTTLE}
          count={facets.deliveryType[bookcarsTypes.DeliveryType.Delivery]}
          checked={deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Delivery)}
          onChange={(checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Delivery,
            checked,
          ))}
        />
      </Accordion>

      <Accordion title={strings.TRANSMISSION} collapse className="search-filter-section">
        <FilterOption
          id="gearbox-auto"
          label={strings.AUTOMATIC}
          count={facets.gearbox[bookcarsTypes.GearboxType.Automatic]}
          checked={isGearboxChecked(bookcarsTypes.GearboxType.Automatic)}
          onChange={(checked) => handleGearboxToggle(bookcarsTypes.GearboxType.Automatic, checked)}
        />
        <FilterOption
          id="gearbox-manual"
          label={strings.MANUAL}
          count={facets.gearbox[bookcarsTypes.GearboxType.Manual]}
          checked={isGearboxChecked(bookcarsTypes.GearboxType.Manual)}
          onChange={(checked) => handleGearboxToggle(bookcarsTypes.GearboxType.Manual, checked)}
        />
      </Accordion>

      {!env.HIDE_SUPPLIERS && suppliers.length > 0 && (
        <Accordion title={strings.SUPPLIER} collapse className="search-filter-section">
          {suppliers.map((supplier) => {
            const id = supplier._id
            if (!id) {
              return null
            }
            return (
              <FilterOption
                key={id}
                id={`supplier-${id}`}
                label={supplier.fullName}
                count={facets.suppliers[id] ?? supplier.carCount}
                checked={supplierIds.length === 0 || supplierIds.includes(id)}
                onChange={(checked) => handleSupplierToggle(id, checked)}
              />
            )
          })}
        </Accordion>
      )}

      <Accordion title={strings.MILEAGE} collapse className="search-filter-section">
        <FilterOption
          id="mileage-unlimited"
          label={strings.UNLIMITED}
          count={facets.mileage[bookcarsTypes.Mileage.Unlimited]}
          checked={mileage.length === 0 || mileage.includes(bookcarsTypes.Mileage.Unlimited)}
          onChange={(checked) => {
            let next = toggleArrayValue(mileage.length === 0 ? allMileage : mileage, bookcarsTypes.Mileage.Unlimited, checked)
            if (next.length === 0) next = allMileage
            onMileageChange(next)
          }}
        />
      </Accordion>

      <Accordion title={strings.OPTIONS} collapse className="search-filter-section">
        <p className="search-filter-hint">{strings.OPTIONS_HINT}</p>
        <FilterOption
          id="spec-additional-driver"
          label={strings.ADDITIONAL_DRIVER}
          count={facets.specs.additionalDriver}
          checked={requireAdditionalDriver}
          onChange={onRequireAdditionalDriverChange}
        />
      </Accordion>

      <Accordion title={strings.CAR_CATEGORY} collapse className="search-filter-section">
        {categoryOptions.map((opt, i) => (
          <FilterOption
            key={opt.key || opt.value + i}
            id={`range-${opt.key || opt.value}-${i}`}
            label={opt.label}
            count={facets.ranges[opt.value]}
            checked={ranges.length === 0 || ranges.includes(opt.value)}
            onChange={(checked) => {
              let next = toggleArrayValue(ranges.length === 0 ? allRanges : ranges, opt.value, checked)
              if (next.length === 0) next = allRanges
              onRangesChange(next)
            }}
          />
        ))}
      </Accordion>

      <Accordion title={strings.PRICE_PER_DAY} collapse className="search-filter-section">
        {PRICE_BUCKETS.map((bucket) => (
          <FilterOption
            key={bucket}
            id={`price-${bucket}`}
            label={priceLabels[bucket]}
            count={facets.pricePerDay[bucket]}
            checked={priceBuckets.length === 0 || priceBuckets.includes(bucket)}
            onChange={(checked) => onPriceBucketsChange(toggleArrayValue(priceBuckets, bucket, checked))}
          />
        ))}
      </Accordion>

      <Accordion title={strings.SEATS} collapse className="search-filter-section">
        <FilterOption
          id="seats-5"
          label={strings.SEATS_5}
          count={facets.seats['5']}
          checked={seats === 5}
          onChange={(checked) => onSeatsChange(checked ? 5 : -1)}
        />
        <FilterOption
          id="seats-6"
          label={strings.SEATS_6}
          count={facets.seats['6+']}
          checked={seats === 6}
          onChange={(checked) => onSeatsChange(checked ? 6 : -1)}
        />
      </Accordion>

      <Accordion title={strings.REVIEWS} collapse className="search-filter-section">
        <FilterOption
          id="rating-8"
          label={strings.VERY_GOOD}
          count={facets.rating['8+']}
          checked={rating === 4}
          onChange={(checked) => onRatingChange(checked ? 4 : -1)}
        />
        <FilterOption
          id="rating-7"
          label={strings.GOOD}
          count={facets.rating['7+']}
          checked={rating === 3.5}
          onChange={(checked) => onRatingChange(checked ? 3.5 : -1)}
        />
      </Accordion>

      <Accordion title={strings.VEHICLE_SPECS} collapse className="search-filter-section">
        <FilterOption
          id="spec-aircon"
          label={strings.AIRCON}
          count={facets.specs.aircon}
          checked={!!carSpecs.aircon}
          onChange={(checked) => onCarSpecsChange({ ...carSpecs, aircon: checked })}
        />
        <FilterOption
          id="spec-doors"
          label={strings.FOUR_DOORS}
          count={facets.specs.fourPlusDoors}
          checked={!!carSpecs.moreThanFourDoors}
          onChange={(checked) => onCarSpecsChange({ ...carSpecs, moreThanFourDoors: checked })}
        />
      </Accordion>

      <Accordion title={strings.FUEL_TYPE} collapse className="search-filter-section">
        <FilterOption
          id="fuel-electric"
          label={strings.ELECTRIC}
          count={facets.carType[bookcarsTypes.CarType.Electric]}
          checked={carType.length === 0 || carType.includes(bookcarsTypes.CarType.Electric)}
          onChange={(checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.Electric, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          }}
        />
        <FilterOption
          id="fuel-hybrid"
          label={strings.HYBRID}
          count={facets.carType[bookcarsTypes.CarType.Hybrid]}
          checked={carType.length === 0 || carType.includes(bookcarsTypes.CarType.Hybrid)}
          onChange={(checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.Hybrid, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          }}
        />
        <FilterOption
          id="fuel-plugin"
          label={strings.PLUG_IN_HYBRID}
          count={facets.carType[bookcarsTypes.CarType.PlugInHybrid]}
          checked={carType.length === 0 || carType.includes(bookcarsTypes.CarType.PlugInHybrid)}
          onChange={(checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.PlugInHybrid, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          }}
        />
        <FilterOption
          id="fuel-petrol"
          label={strings.PETROL_DIESEL}
          count={(facets.carType[bookcarsTypes.CarType.Diesel] || 0) + (facets.carType[bookcarsTypes.CarType.Gasoline] || 0)}
          checked={carType.length === 0
            || carType.includes(bookcarsTypes.CarType.Diesel)
            || carType.includes(bookcarsTypes.CarType.Gasoline)}
          onChange={(checked) => {
            if (checked) {
              onCarTypeChange([bookcarsTypes.CarType.Diesel, bookcarsTypes.CarType.Gasoline])
            } else {
              onCarTypeChange(bookcarsHelper.getAllCarTypes())
            }
          }}
        />
      </Accordion>

      <Accordion title={strings.DEPOSIT} collapse className="search-filter-section">
        <FilterOption
          id="deposit-0-300"
          label={strings.DEPOSIT_0_300}
          count={facets.deposit['0-300']}
          checked={deposit === -1 || deposit === 300}
          onChange={(checked) => onDepositChange(checked ? 300 : -1)}
        />
        <FilterOption
          id="deposit-300-600"
          label={strings.DEPOSIT_300_600}
          count={facets.deposit['300-600']}
          checked={deposit === 600}
          onChange={(checked) => onDepositChange(checked ? 600 : -1)}
        />
        <FilterOption
          id="deposit-600"
          label={strings.DEPOSIT_600}
          count={facets.deposit['600+']}
          checked={deposit === 10000}
          onChange={(checked) => onDepositChange(checked ? 10000 : -1)}
        />
      </Accordion>

      <Accordion title={strings.FUEL_POLICY} collapse className="search-filter-section">
        {allFuelPolicies.map((policy) => (
          <FilterOption
            key={policy}
            id={`fuel-policy-${policy}`}
            label={helper.getFuelPolicy(policy)}
            count={facets.fuelPolicy[policy]}
            checked={fuelPolicy.length === 0 || fuelPolicy.includes(policy)}
            onChange={(checked) => {
              let next = toggleArrayValue(fuelPolicy.length === 0 ? allFuelPolicies : fuelPolicy, policy, checked)
              if (next.length === 0) next = allFuelPolicies
              onFuelPolicyChange(next)
            }}
          />
        ))}
      </Accordion>
    </aside>
  )
}

export default SearchFiltersSidebar
