import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

let catalogPromise: Promise<bookcarsTypes.GeoCatalog> | null = null

export const getTunisiaCatalog = (): Promise<bookcarsTypes.GeoCatalog> => {
  if (!catalogPromise) {
    catalogPromise = axiosInstance
      .get('/api/geo/tunisia')
      .then((res) => res.data as bookcarsTypes.GeoCatalog)
      .catch((err) => {
        catalogPromise = null
        throw err
      })
  }
  return catalogPromise
}

export const getGeoLabel = (
  names: bookcarsTypes.LocalizedName,
  language?: string,
): string => {
  if (language === 'ar') {
    return names.ar
  }
  if (language === 'en') {
    return names.en
  }
  return names.fr
}

export const matchGeoLabel = (
  names: bookcarsTypes.LocalizedName,
  label?: string,
): boolean => {
  if (!label) {
    return false
  }
  const needle = label.trim().toLowerCase()
  return [names.fr, names.en, names.ar].some((value) => value.trim().toLowerCase() === needle)
}
