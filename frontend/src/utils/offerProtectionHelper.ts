import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'

export interface ProtectionRow {
  id: string
  label: string
  basicCovered: boolean
  fullCovered: boolean
  basicNote?: string
}

export const getFranchiseAmount = (car: bookcarsTypes.Car | undefined, depositPrice: number): number =>
  depositPrice || car?.deposit || 0

export const getFullProtectionUnitPrice = (car: bookcarsTypes.Car): number => {
  if (car.fullInsurance > 0) {
    return car.fullInsurance
  }
  return Math.max(car.dailyPrice * 0.12, 15)
}

export const getFullProtectionTotal = (
  car: bookcarsTypes.Car,
  days: number,
  priceChangeRate: number,
): number => {
  const unit = getFullProtectionUnitPrice(car)
  return unit * days * (1 + priceChangeRate / 100)
}

export const getProtectionCoverageAmount = (car: bookcarsTypes.Car, depositPrice: number): number => {
  const franchise = getFranchiseAmount(car, depositPrice)
  return Math.max(franchise * 5, 5000)
}

export const buildProtectionRows = (franchiseLabel: string): ProtectionRow[] => [
  {
    id: 'theft',
    label: 'PROTECTION_ROW_THEFT',
    basicCovered: true,
    fullCovered: true,
  },
  {
    id: 'bodywork',
    label: 'PROTECTION_ROW_BODYWORK',
    basicCovered: true,
    fullCovered: true,
  },
  {
    id: 'other',
    label: 'PROTECTION_ROW_OTHER',
    basicCovered: false,
    fullCovered: true,
  },
  {
    id: 'breakdown',
    label: 'PROTECTION_ROW_BREAKDOWN',
    basicCovered: false,
    fullCovered: true,
  },
  {
    id: 'misc',
    label: 'PROTECTION_ROW_MISC',
    basicCovered: false,
    fullCovered: false,
  },
]

export const calculateOfferTotal = (
  car: bookcarsTypes.Car,
  from: Date,
  to: Date,
  priceChangeRate: number,
  options?: bookcarsTypes.CarOptions,
): number => bookcarsHelper.calculateTotalPrice(car, from, to, priceChangeRate, options)
