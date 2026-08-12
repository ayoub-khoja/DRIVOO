import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import agencyAxiosInstance from './agencyAxios'
import * as AgencyAuthService from './AgencyAuthService'

const getLanguage = () => AgencyAuthService.getCurrentUser()?.language || env.DEFAULT_LANGUAGE

export const getLocations = (
  keyword: string,
  page: number,
  size: number,
): Promise<bookcarsTypes.Result<bookcarsTypes.Location>> =>
  agencyAxiosInstance
    .get(`/api/locations/${page}/${size}/${getLanguage()}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const getLocationId = (name: string): Promise<string | null> =>
  agencyAxiosInstance
    .get(`/api/location-id/${encodeURIComponent(name)}/${getLanguage()}`)
    .then((res) => (res.status === 200 ? String(res.data) : null))
    .catch(() => null)

export const getCountries = (
  keyword: string,
  page: number,
  size: number,
): Promise<bookcarsTypes.Result<bookcarsTypes.Country>> =>
  agencyAxiosInstance
    .get(`/api/countries/${page}/${size}/${getLanguage()}/?s=${encodeURIComponent(keyword)}`)
    .then((res) => res.data)

export const getCountryId = (name: string): Promise<string | null> =>
  agencyAxiosInstance
    .get(`/api/country-id/${encodeURIComponent(name)}/${getLanguage()}`)
    .then((res) => (res.status === 200 ? String(res.data) : null))
    .catch(() => null)

export const createCountry = (data: bookcarsTypes.UpsertCountryPayload): Promise<bookcarsTypes.Country> =>
  agencyAxiosInstance
    .post('/api/create-country', data)
    .then((res) => res.data)

export const createLocation = (data: bookcarsTypes.UpsertLocationPayload): Promise<bookcarsTypes.Location> =>
  agencyAxiosInstance
    .post('/api/create-location', data)
    .then((res) => res.data)

const countryNames = (): bookcarsTypes.CountryName[] =>
  env._LANGUAGES.map((lang) => ({
    language: lang.code,
    name: lang.code === 'ar' ? 'تونس' : lang.code === 'fr' ? 'Tunisie' : 'Tunisia',
  }))

const locationNames = (name: string): bookcarsTypes.LocationName[] =>
  env._LANGUAGES.map((lang) => ({
    language: lang.code,
    name,
  }))

/**
 * Resolve a free-text pickup place to a Location id (find or create).
 */
export const ensurePickupLocation = async (rawName: string, supplierId: string): Promise<string> => {
  const name = rawName.trim()
  if (!name) {
    throw new Error('Location name required')
  }

  const existingId = await getLocationId(name)
  if (existingId) {
    return existingId
  }

  let countryId = await getCountryId('Tunisie')
  if (!countryId) {
    countryId = await getCountryId('Tunisia')
  }
  if (!countryId) {
    const countries = await getCountries('', 1, 1)
    countryId = countries?.[0]?.resultData?.[0]?._id || null
  }
  if (!countryId) {
    const country = await createCountry({
      names: countryNames(),
      supplier: supplierId,
    })
    countryId = country._id
  }

  const location = await createLocation({
    country: countryId,
    names: locationNames(name),
    supplier: supplierId,
  })

  return location._id
}
