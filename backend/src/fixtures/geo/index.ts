import type { GeoCatalog, GeoCity, GeoMunicipality, LocalizedName } from ':bookcars-types'
import { TUNISIA_CITIES } from './tunisia.cities'
import { TUNISIA_MUNICIPALITIES } from './tunisia.municipalities'

const municipalitiesByCityId = new Map<number, GeoMunicipality[]>()

for (const municipality of TUNISIA_MUNICIPALITIES) {
  const list = municipalitiesByCityId.get(municipality.cityId)
  if (list) {
    list.push(municipality)
  } else {
    municipalitiesByCityId.set(municipality.cityId, [municipality])
  }
}

export const getTunisiaCatalog = (): GeoCatalog => ({
  cities: [...TUNISIA_CITIES],
  municipalities: [...TUNISIA_MUNICIPALITIES],
})

export const getTunisiaCities = (): readonly GeoCity[] => TUNISIA_CITIES

export const getTunisiaMunicipalitiesByCityId = (cityId: number): readonly GeoMunicipality[] =>
  municipalitiesByCityId.get(cityId) || []

export const getGeoLabel = (names: LocalizedName, language?: string): string => {
  if (language === 'ar') {
    return names.ar
  }
  if (language === 'en') {
    return names.en
  }
  return names.fr
}

export const matchGeoLabel = (names: LocalizedName, label?: string) => {
  if (!label) {
    return false
  }
  const needle = label.trim().toLowerCase()
  return [names.fr, names.en, names.ar].some((value) => value.trim().toLowerCase() === needle)
}

export const findTunisiaPoint = (governorate?: string, municipality?: string) => {
  if (municipality) {
    const match = TUNISIA_MUNICIPALITIES.find((item) => matchGeoLabel(item.names, municipality))
    if (match) {
      return { latitude: match.latitude, longitude: match.longitude }
    }
  }
  if (governorate) {
    const match = TUNISIA_CITIES.find((item) => matchGeoLabel(item.names, governorate))
    if (match) {
      return { latitude: match.latitude, longitude: match.longitude }
    }
  }
  return null
}
