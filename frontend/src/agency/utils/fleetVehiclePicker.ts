import { createFilterOptions } from '@mui/material'
import type { UseFormSetValue } from 'react-hook-form'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/agency/lang/agency'
import type { AgencyContractFormFields } from '@/agency/models/AgencyContractForm'

/** Fleet car suggestion for contract / form Autocomplete. */
export type FleetVehicleOption = {
  id: string
  brand: string
  model: string
  plate: string
  range: string
  fuel: string
  /** Primary line: "Peugeot 208" */
  label: string
  /** Indexed text for fast client-side filtering */
  searchText: string
}

const normalizePart = (value?: string | null) => (value || '').trim()

/** Localized fuel label from car.type (gasoline, diesel, …). */
export const carTypeFuelLabel = (type?: string | null): string => {
  switch (type) {
    case bookcarsTypes.CarType.Diesel:
      return strings.CAR_FUEL_DIESEL
    case bookcarsTypes.CarType.Hybrid:
      return strings.CAR_FUEL_HYBRID
    case bookcarsTypes.CarType.Electric:
      return strings.CAR_FUEL_ELECTRIC
    case bookcarsTypes.CarType.PlugInHybrid:
      return strings.CAR_FUEL_PHEV
    case bookcarsTypes.CarType.Gasoline:
      return strings.CAR_FUEL_GAS
    default:
      return normalizePart(type)
  }
}

const splitName = (name?: string) => {
  const parts = normalizePart(name).split(/\s+/).filter(Boolean)
  return {
    brand: parts[0] || '',
    model: parts.slice(1).join(' '),
  }
}

export const toFleetVehicleOption = (car: bookcarsTypes.Car): FleetVehicleOption | null => {
  if (!car?._id) {
    return null
  }
  const fromName = splitName(car.name)
  const brand = normalizePart(car.brand) || fromName.brand
  const model = normalizePart(car.model) || fromName.model
  const plate = normalizePart(car.licensePlate)
  if (!brand && !model && !plate) {
    return null
  }
  const label = [brand, model].filter(Boolean).join(' ') || car.name || plate
  return {
    id: String(car._id),
    brand,
    model,
    plate,
    range: car.range || bookcarsTypes.CarRange.Midi,
    fuel: carTypeFuelLabel(car.type),
    label,
    searchText: [brand, model, plate, car.name].filter(Boolean).join(' '),
  }
}

/** Build sorted, deduped options from the agency fleet (max once per dialog open). */
export const buildFleetVehicleOptions = (cars: bookcarsTypes.Car[]): FleetVehicleOption[] => {
  const seen = new Set<string>()
  const options: FleetVehicleOption[] = []
  for (const car of cars) {
    const option = toFleetVehicleOption(car)
    if (!option || seen.has(option.id)) {
      continue
    }
    seen.add(option.id)
    options.push(option)
  }
  options.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }))
  return options
}

export const filterFleetVehicleOption = createFilterOptions<FleetVehicleOption>({
  stringify: (option) => option.searchText,
  ignoreCase: true,
  ignoreAccents: true,
  matchFrom: 'any',
  limit: 40,
})

export const applyFleetVehicleSelection = (
  option: FleetVehicleOption,
  setValue: UseFormSetValue<AgencyContractFormFields>,
) => {
  const opts = { shouldValidate: true, shouldDirty: true } as const
  setValue('vehicleBrand', option.brand, opts)
  setValue('vehicleModel', option.model, opts)
  setValue('vehiclePlate', option.plate, opts)
  if (option.range) {
    setValue('vehicleCategory', option.range, opts)
  }
  if (option.fuel) {
    setValue('vehicleFuel', option.fuel, opts)
  }
}
