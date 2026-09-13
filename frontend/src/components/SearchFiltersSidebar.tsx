import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/search-filters'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'
import { SearchFacets, PRICE_BUCKETS, PriceBucket } from '@/utils/searchFacetsHelper'
import Accordion from '@/components/Accordion'

import '@/assets/css/search-filters-sidebar.css'

interface FilterOptionProps {
  id: string
  label: string
  count?: number
  checked: boolean
  /** Keep visible with 0 results only when this option is an active user selection */
  pinned?: boolean
  onChange: (checked: boolean) => void
}

const FilterOption = ({ id, label, count, checked, onChange }: FilterOptionProps) => {
  const n = count ?? 0
  const disabled = n === 0 && !checked

  return (
    <label className={`search-filter-option${disabled ? ' is-disabled' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="search-filter-option-label">{label}</span>
      <span className="search-filter-count">{n}</span>
    </label>
  )
}

const maybeOption = (props: FilterOptionProps) => {
  const n = props.count ?? 0
  if (n === 0 && !props.pinned) {
    return null
  }
  return <FilterOption key={props.id} {...props} />
}

interface FilterSectionProps {
  title: string
  children: ReactNode
}

const FilterSection = ({ title, children }: FilterSectionProps) => {
  const items = React.Children.toArray(children).filter(Boolean)
  if (items.length === 0) {
    return null
  }

  return (
    <Accordion title={title} collapse className="search-filter-section">
      {items}
    </Accordion>
  )
}

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
  const [otherOpen, setOtherOpen] = useState(false)
  const [priceLabels, setPriceLabels] = useState<Record<PriceBucket, string>>({
    '0-50': '',
    '50-100': '',
    '100-150': '',
    '150-200': '',
    '200+': '',
  })
  const [depositLabels, setDepositLabels] = useState({
    '0-300': '',
    '300-600': '',
    '600+': '',
  })

  useEffect(() => {
    const loadCurrencyLabels = async () => {
      const language = UserService.getLanguage()
      const currency = PaymentService.getCurrencySymbol()
      const format = (amount: number) => bookcarsHelper.formatPrice(amount, currency, language)

      const [p50, p100, p150, p200, d300, d600] = await Promise.all([
        PaymentService.convertPrice(50),
        PaymentService.convertPrice(100),
        PaymentService.convertPrice(150),
        PaymentService.convertPrice(200),
        PaymentService.convertPrice(300),
        PaymentService.convertPrice(600),
      ])

      const round = (n: number) => Math.round(n)

      setPriceLabels({
        '0-50': `${format(0)} - ${format(round(p50))}`,
        '50-100': `${format(round(p50))} - ${format(round(p100))}`,
        '100-150': `${format(round(p100))} - ${format(round(p150))}`,
        '150-200': `${format(round(p150))} - ${format(round(p200))}`,
        '200+': `${format(round(p200))} ${strings.AND_MORE}`,
      })

      setDepositLabels({
        '0-300': `${format(0)} - ${format(round(d300))}`,
        '300-600': `${format(round(d300))} - ${format(round(d600))}`,
        '600+': `${format(round(d600))} ${strings.AND_MORE}`,
      })
    }

    void loadCurrencyLabels()
  }, [])

  const toggleArrayValue = <T,>(values: T[], value: T, checked: boolean): T[] => {
    if (checked) return values.includes(value) ? values : [...values, value]
    return values.filter((v) => v !== value)
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

  const gearboxActive = gearbox.length > 0 && gearbox.length < allGearbox.length
  const rangesActive = ranges.length > 0 && ranges.length < allRanges.length
  const carTypeActive = carType.length > 0 && carType.length < bookcarsHelper.getAllCarTypes().length
  const mileageActive = mileage.length > 0 && mileage.length < allMileage.length
  const fuelPolicyActive = fuelPolicy.length > 0 && fuelPolicy.length < allFuelPolicies.length
  const deliveryActive = deliveryTypes.length > 0
  const priceActive = priceBuckets.length > 0

  const hasSecondaryActive = useMemo(() => {
    const ratingActive = rating > 0
    const depositActive = deposit > 0
    const specsActive = !!carSpecs.aircon || !!carSpecs.moreThanFourDoors
    const driverActive = requireAdditionalDriver
    const supplierActive = !env.HIDE_SUPPLIERS
      && suppliers.length > 0
      && supplierIds.length > 0
      && supplierIds.length < suppliers.filter((s) => s._id).length

    return deliveryActive
      || mileageActive
      || ratingActive
      || depositActive
      || specsActive
      || driverActive
      || fuelPolicyActive
      || supplierActive
  }, [
    deliveryActive,
    mileageActive,
    rating,
    deposit,
    carSpecs,
    requireAdditionalDriver,
    fuelPolicyActive,
    supplierIds,
    suppliers,
  ])

  const primaryFilters = (
    <>
      <FilterSection title={strings.PRICE_PER_DAY}>
        {PRICE_BUCKETS.map((bucket) => maybeOption({
          id: `price-${bucket}`,
          label: priceLabels[bucket] || bucket,
          count: facets.pricePerDay[bucket],
          checked: priceBuckets.length === 0 || priceBuckets.includes(bucket),
          pinned: priceActive && priceBuckets.includes(bucket),
          onChange: (checked) => onPriceBucketsChange(toggleArrayValue(priceBuckets, bucket, checked)),
        }))}
      </FilterSection>

      <FilterSection title={strings.TRANSMISSION}>
        {maybeOption({
          id: 'gearbox-auto',
          label: strings.AUTOMATIC,
          count: facets.gearbox[bookcarsTypes.GearboxType.Automatic],
          checked: isGearboxChecked(bookcarsTypes.GearboxType.Automatic),
          pinned: gearboxActive && gearbox.includes(bookcarsTypes.GearboxType.Automatic),
          onChange: (checked) => handleGearboxToggle(bookcarsTypes.GearboxType.Automatic, checked),
        })}
        {maybeOption({
          id: 'gearbox-manual',
          label: strings.MANUAL,
          count: facets.gearbox[bookcarsTypes.GearboxType.Manual],
          checked: isGearboxChecked(bookcarsTypes.GearboxType.Manual),
          pinned: gearboxActive && gearbox.includes(bookcarsTypes.GearboxType.Manual),
          onChange: (checked) => handleGearboxToggle(bookcarsTypes.GearboxType.Manual, checked),
        })}
      </FilterSection>

      <FilterSection title={strings.SEATS}>
        {maybeOption({
          id: 'seats-5',
          label: strings.SEATS_5,
          count: facets.seats['5'],
          checked: seats === 5,
          pinned: seats === 5,
          onChange: (checked) => onSeatsChange(checked ? 5 : -1),
        })}
        {maybeOption({
          id: 'seats-6',
          label: strings.SEATS_6,
          count: facets.seats['6+'],
          checked: seats === 6,
          pinned: seats === 6,
          onChange: (checked) => onSeatsChange(checked ? 6 : -1),
        })}
      </FilterSection>

      <FilterSection title={strings.CAR_CATEGORY}>
        {categoryOptions.map((opt, i) => maybeOption({
          id: `range-${opt.key || opt.value}-${i}`,
          label: opt.label,
          count: facets.ranges[opt.value],
          checked: ranges.length === 0 || ranges.includes(opt.value),
          pinned: rangesActive && ranges.includes(opt.value),
          onChange: (checked) => {
            let next = toggleArrayValue(ranges.length === 0 ? allRanges : ranges, opt.value, checked)
            if (next.length === 0) next = allRanges
            onRangesChange(next)
          },
        }))}
      </FilterSection>

      <FilterSection title={strings.FUEL_TYPE}>
        {maybeOption({
          id: 'fuel-electric',
          label: strings.ELECTRIC,
          count: facets.carType[bookcarsTypes.CarType.Electric],
          checked: carType.length === 0 || carType.includes(bookcarsTypes.CarType.Electric),
          pinned: carTypeActive && carType.includes(bookcarsTypes.CarType.Electric),
          onChange: (checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.Electric, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          },
        })}
        {maybeOption({
          id: 'fuel-hybrid',
          label: strings.HYBRID,
          count: facets.carType[bookcarsTypes.CarType.Hybrid],
          checked: carType.length === 0 || carType.includes(bookcarsTypes.CarType.Hybrid),
          pinned: carTypeActive && carType.includes(bookcarsTypes.CarType.Hybrid),
          onChange: (checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.Hybrid, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          },
        })}
        {maybeOption({
          id: 'fuel-plugin',
          label: strings.PLUG_IN_HYBRID,
          count: facets.carType[bookcarsTypes.CarType.PlugInHybrid],
          checked: carType.length === 0 || carType.includes(bookcarsTypes.CarType.PlugInHybrid),
          pinned: carTypeActive && carType.includes(bookcarsTypes.CarType.PlugInHybrid),
          onChange: (checked) => {
            let next = toggleArrayValue(carType.length === 0 ? allFuelTypes : carType, bookcarsTypes.CarType.PlugInHybrid, checked)
            if (next.length === 0) next = bookcarsHelper.getAllCarTypes()
            onCarTypeChange(next)
          },
        })}
        {maybeOption({
          id: 'fuel-petrol',
          label: strings.PETROL_DIESEL,
          count: (facets.carType[bookcarsTypes.CarType.Diesel] || 0) + (facets.carType[bookcarsTypes.CarType.Gasoline] || 0),
          checked: carType.length === 0
            || carType.includes(bookcarsTypes.CarType.Diesel)
            || carType.includes(bookcarsTypes.CarType.Gasoline),
          pinned: carTypeActive && (
            carType.includes(bookcarsTypes.CarType.Diesel)
            || carType.includes(bookcarsTypes.CarType.Gasoline)
          ),
          onChange: (checked) => {
            if (checked) {
              onCarTypeChange([bookcarsTypes.CarType.Diesel, bookcarsTypes.CarType.Gasoline])
            } else {
              onCarTypeChange(bookcarsHelper.getAllCarTypes())
            }
          },
        })}
      </FilterSection>
    </>
  )

  const secondaryFilters = (
    <>
      <FilterSection title={strings.LOCATION}>
        {maybeOption({
          id: 'delivery-airport',
          label: strings.AIRPORT_TERMINAL,
          count: facets.deliveryType[bookcarsTypes.DeliveryType.Airport],
          checked: deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Airport),
          pinned: deliveryActive && deliveryTypes.includes(bookcarsTypes.DeliveryType.Airport),
          onChange: (checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Airport,
            checked,
          )),
        })}
        {maybeOption({
          id: 'delivery-office',
          label: strings.AIRPORT_MEET,
          count: facets.deliveryType[bookcarsTypes.DeliveryType.Office],
          checked: deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Office),
          pinned: deliveryActive && deliveryTypes.includes(bookcarsTypes.DeliveryType.Office),
          onChange: (checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Office,
            checked,
          )),
        })}
        {maybeOption({
          id: 'delivery-shuttle',
          label: strings.AIRPORT_SHUTTLE,
          count: facets.deliveryType[bookcarsTypes.DeliveryType.Delivery],
          checked: deliveryTypes.length === 0 || deliveryTypes.includes(bookcarsTypes.DeliveryType.Delivery),
          pinned: deliveryActive && deliveryTypes.includes(bookcarsTypes.DeliveryType.Delivery),
          onChange: (checked) => onDeliveryTypesChange(toggleArrayValue(
            deliveryTypes,
            bookcarsTypes.DeliveryType.Delivery,
            checked,
          )),
        })}
      </FilterSection>

      {!env.HIDE_SUPPLIERS && suppliers.length > 0 && (
        <FilterSection title={strings.SUPPLIER}>
          {suppliers.map((supplier) => {
            const id = supplier._id
            if (!id) {
              return null
            }
            const allIds = suppliers.map((s) => s._id).filter(Boolean) as string[]
            const supplierActive = supplierIds.length > 0 && supplierIds.length < allIds.length
            return maybeOption({
              id: `supplier-${id}`,
              label: supplier.fullName,
              count: facets.suppliers[id] ?? supplier.carCount,
              checked: supplierIds.length === 0 || supplierIds.includes(id),
              pinned: supplierActive && supplierIds.includes(id),
              onChange: (checked) => handleSupplierToggle(id, checked),
            })
          })}
        </FilterSection>
      )}

      <FilterSection title={strings.MILEAGE}>
        {maybeOption({
          id: 'mileage-unlimited',
          label: strings.UNLIMITED,
          count: facets.mileage[bookcarsTypes.Mileage.Unlimited],
          checked: mileage.length === 0 || mileage.includes(bookcarsTypes.Mileage.Unlimited),
          pinned: mileageActive && mileage.includes(bookcarsTypes.Mileage.Unlimited),
          onChange: (checked) => {
            let next = toggleArrayValue(mileage.length === 0 ? allMileage : mileage, bookcarsTypes.Mileage.Unlimited, checked)
            if (next.length === 0) next = allMileage
            onMileageChange(next)
          },
        })}
        {maybeOption({
          id: 'mileage-limited',
          label: strings.LIMITED_MILEAGE,
          count: facets.mileage[bookcarsTypes.Mileage.Limited],
          checked: mileage.length === 0 || mileage.includes(bookcarsTypes.Mileage.Limited),
          pinned: mileageActive && mileage.includes(bookcarsTypes.Mileage.Limited),
          onChange: (checked) => {
            let next = toggleArrayValue(mileage.length === 0 ? allMileage : mileage, bookcarsTypes.Mileage.Limited, checked)
            if (next.length === 0) next = allMileage
            onMileageChange(next)
          },
        })}
      </FilterSection>

      <FilterSection title={strings.OPTIONS}>
        {(facets.specs.additionalDriver > 0 || requireAdditionalDriver) && (
          <p className="search-filter-hint">{strings.OPTIONS_HINT}</p>
        )}
        {maybeOption({
          id: 'spec-additional-driver',
          label: strings.ADDITIONAL_DRIVER,
          count: facets.specs.additionalDriver,
          checked: requireAdditionalDriver,
          pinned: requireAdditionalDriver,
          onChange: onRequireAdditionalDriverChange,
        })}
      </FilterSection>

      <FilterSection title={strings.REVIEWS}>
        {maybeOption({
          id: 'rating-8',
          label: strings.VERY_GOOD,
          count: facets.rating['8+'],
          checked: rating === 4,
          pinned: rating === 4,
          onChange: (checked) => onRatingChange(checked ? 4 : -1),
        })}
        {maybeOption({
          id: 'rating-7',
          label: strings.GOOD,
          count: facets.rating['7+'],
          checked: rating === 3.5,
          pinned: rating === 3.5,
          onChange: (checked) => onRatingChange(checked ? 3.5 : -1),
        })}
      </FilterSection>

      <FilterSection title={strings.VEHICLE_SPECS}>
        {maybeOption({
          id: 'spec-aircon',
          label: strings.AIRCON,
          count: facets.specs.aircon,
          checked: !!carSpecs.aircon,
          pinned: !!carSpecs.aircon,
          onChange: (checked) => onCarSpecsChange({ ...carSpecs, aircon: checked }),
        })}
        {maybeOption({
          id: 'spec-doors',
          label: strings.FOUR_DOORS,
          count: facets.specs.fourPlusDoors,
          checked: !!carSpecs.moreThanFourDoors,
          pinned: !!carSpecs.moreThanFourDoors,
          onChange: (checked) => onCarSpecsChange({ ...carSpecs, moreThanFourDoors: checked }),
        })}
      </FilterSection>

      <FilterSection title={strings.DEPOSIT}>
        {maybeOption({
          id: 'deposit-0-300',
          label: depositLabels['0-300'] || strings.DEPOSIT_0_300,
          count: facets.deposit['0-300'],
          checked: deposit === -1 || deposit === 300,
          pinned: deposit === 300,
          onChange: (checked) => onDepositChange(checked ? 300 : -1),
        })}
        {maybeOption({
          id: 'deposit-300-600',
          label: depositLabels['300-600'] || strings.DEPOSIT_300_600,
          count: facets.deposit['300-600'],
          checked: deposit === 600,
          pinned: deposit === 600,
          onChange: (checked) => onDepositChange(checked ? 600 : -1),
        })}
        {maybeOption({
          id: 'deposit-600',
          label: depositLabels['600+'] || strings.DEPOSIT_600,
          count: facets.deposit['600+'],
          checked: deposit === 10000,
          pinned: deposit === 10000,
          onChange: (checked) => onDepositChange(checked ? 10000 : -1),
        })}
      </FilterSection>

      <FilterSection title={strings.FUEL_POLICY}>
        {allFuelPolicies.map((policy) => maybeOption({
          id: `fuel-policy-${policy}`,
          label: helper.getFuelPolicy(policy),
          count: facets.fuelPolicy[policy],
          checked: fuelPolicy.length === 0 || fuelPolicy.includes(policy),
          pinned: fuelPolicyActive && fuelPolicy.includes(policy),
          onChange: (checked) => {
            let next = toggleArrayValue(fuelPolicy.length === 0 ? allFuelPolicies : fuelPolicy, policy, checked)
            if (next.length === 0) next = allFuelPolicies
            onFuelPolicyChange(next)
          },
        }))}
      </FilterSection>
    </>
  )

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

      {primaryFilters}

      <button
        type="button"
        className={`search-filters-other-btn${hasSecondaryActive ? ' has-active' : ''}`}
        onClick={() => setOtherOpen(true)}
      >
        {strings.OTHER_FILTERS}
      </button>

      <Dialog
        open={otherOpen}
        onClose={() => setOtherOpen(false)}
        fullWidth
        maxWidth="sm"
        className="search-filters-dialog"
      >
        <DialogTitle className="search-filters-dialog-title">
          <span>{strings.OTHER_FILTERS}</span>
          <IconButton onClick={() => setOtherOpen(false)} aria-label={strings.CLOSE_FILTERS}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="search-filters-dialog-content">
          {secondaryFilters}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" className="btn-primary" onClick={() => setOtherOpen(false)}>
            {strings.CLOSE_FILTERS}
          </Button>
        </DialogActions>
      </Dialog>
    </aside>
  )
}

export default SearchFiltersSidebar
