import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import mapConfig from '@/config/map.config'
import { isGooglePlacesEnabled } from '@/utils/googleMaps'
import * as LocationService from '@/services/LocationService'
import * as UserService from '@/services/UserService'

export const GOOGLE_PLACE_PREFIX = 'google:'

export interface PlaceSuggestion extends bookcarsTypes.Location {
  _id: string
  name: string
  secondaryText?: string
  placeId?: string
  isGooglePlace?: boolean
}

/** Tunisia-centered bias for Places autocomplete. */
const TUNISIA_CENTER = { lat: 33.8869, lng: 9.5375 }
/** Places API (New) locationBias circle radius max is 50_000 m. */
const LOCATION_BIAS_RADIUS_M = 50_000
const NEAREST_MAX_KM = 80
const REQUEST_TIMEOUT_MS = 8_000
/** Cities, municipalities and airports only (no neighborhoods, streets, POIs). */
const INCLUDED_PLACE_TYPES = [
  'locality',
  'administrative_area_level_2',
  'airport',
] as const

const ALLOWED_PLACE_TYPES = new Set<string>(INCLUDED_PLACE_TYPES)

interface PlacesNewPrediction {
  placeId?: string
  place?: string
  types?: string[]
  text?: { text?: string }
  structuredFormat?: {
    mainText?: { text?: string }
    secondaryText?: { text?: string }
  }
}

interface PlacesNewAutocompleteResponse {
  suggestions?: Array<{ placePrediction?: PlacesNewPrediction }>
  error?: { message?: string; status?: string }
}

interface PlacesNewDetailsResponse {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
  error?: { message?: string; status?: string }
}

export const isGooglePlaceId = (id?: string) => !!id && id.startsWith(GOOGLE_PLACE_PREFIX)

export const placesAvailable = () => isGooglePlacesEnabled() && Boolean(mapConfig.googleMapsApiKey)

const apiKey = () => mapConfig.googleMapsApiKey

const fetchWithTimeout = async (url: string, init: RequestInit, ms = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

/** Optional warm-up — Places (New) is stateless HTTP, nothing heavy to preload. */
export const prefetchGooglePlaces = () => {
  // no-op: REST Places (New) does not need the Maps JS script
}

/**
 * Autocomplete via Places API (New).
 * Requires `places.googleapis.com` enabled on the Google Cloud project.
 */
export class GooglePlacesError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GooglePlacesError'
    this.status = status
  }
}

const referrerHint = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  const origin = window.location.origin
  return ` Ajoutez « ${origin}/* » aux restrictions HTTP referrer de la clé API (Google Cloud → Credentials).`
}

export const getPlacePredictions = async (input: string): Promise<PlaceSuggestion[]> => {
  const keyword = input.trim()
  if (!keyword || !placesAvailable()) {
    return []
  }

  try {
    const res = await fetchWithTimeout('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey(),
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.place,suggestions.placePrediction.types,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify({
        input: keyword,
        includedRegionCodes: ['tn'],
        includedPrimaryTypes: [...INCLUDED_PLACE_TYPES],
        languageCode: UserService.getLanguage() || 'fr',
        regionCode: 'tn',
        locationBias: {
          circle: {
            center: {
              latitude: TUNISIA_CENTER.lat,
              longitude: TUNISIA_CENTER.lng,
            },
            radius: LOCATION_BIAS_RADIUS_M,
          },
        },
      }),
    })

    const data = (await res.json()) as PlacesNewAutocompleteResponse

    if (!res.ok) {
      const apiMessage = data?.error?.message || `HTTP ${res.status}`
      console.warn('[GooglePlaces] autocomplete HTTP', res.status, apiMessage, data)
      const blocked = res.status === 403
        || /referer|referrer|blocked|PERMISSION_DENIED/i.test(apiMessage)
      throw new GooglePlacesError(
        blocked
          ? `Google Places refusé (${apiMessage}).${referrerHint()} Activez aussi « Places API (New) ».`
          : `Google Places: ${apiMessage}`,
        res.status,
      )
    }

    const suggestions = (data.suggestions || [])
      .map((row) => row.placePrediction)
      .filter(Boolean) as PlacesNewPrediction[]

    return suggestions
      .filter((prediction) => {
        const types = prediction.types || []
        // Drop neighborhoods / streets / POIs if Google still returns them
        if (types.length === 0) {
          return true
        }
        return types.some((type) => ALLOWED_PLACE_TYPES.has(type))
      })
      .map((prediction) => {
        const placeId = prediction.placeId || prediction.place?.replace(/^places\//, '') || ''
        // City / municipality name only — no secondary address line
        const name = prediction.structuredFormat?.mainText?.text
          || prediction.text?.text
          || placeId

        return {
          _id: `${GOOGLE_PLACE_PREFIX}${placeId}`,
          name,
          secondaryText: undefined,
          placeId,
          isGooglePlace: true,
        }
      })
      .filter((row) => row.placeId)
  } catch (err) {
    if (err instanceof GooglePlacesError) {
      throw err
    }
    console.warn('[GooglePlaces] autocomplete failed', err)
    throw new GooglePlacesError(
      err instanceof Error ? err.message : 'Échec de l’appel Google Places',
    )
  }
}

const getPlaceDetails = async (placeId: string): Promise<PlacesNewDetailsResponse | null> => {
  const resource = placeId.startsWith('places/') ? placeId : `places/${placeId}`
  try {
    const res = await fetchWithTimeout(
      `https://places.googleapis.com/v1/${resource}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey(),
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
        },
      },
    )
    const data = (await res.json()) as PlacesNewDetailsResponse
    if (!res.ok) {
      console.warn('[GooglePlaces] details HTTP', res.status, data?.error?.message || data)
      return null
    }
    return data
  } catch (err) {
    console.warn('[GooglePlaces] details failed', err)
    return null
  }
}

const findByName = async (name: string): Promise<bookcarsTypes.Location | null> => {
  const language = UserService.getLanguage() || 'fr'
  const trimmed = name.trim()
  if (!trimmed) {
    return null
  }

  try {
    const { status, data } = await LocationService.getLocationId(trimmed, language)
    if (status === 200 && data) {
      return LocationService.getLocation(data)
    }
  } catch {
    // try keyword search below
  }

  try {
    const result = await LocationService.getLocations(trimmed, 1, 10)
    const rows = result?.[0]?.resultData || []
    const exact = rows.find((loc) => loc.name?.toLowerCase() === trimmed.toLowerCase())
    return exact || rows[0] || null
  } catch {
    return null
  }
}

const findNearest = async (lat: number, lng: number): Promise<bookcarsTypes.Location | null> => {
  try {
    const locations = await LocationService.getLocationsWithPosition()
    let best: bookcarsTypes.Location | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const loc of locations) {
      if (loc.latitude == null || loc.longitude == null) {
        continue
      }
      const d = bookcarsHelper.distance(lat, lng, loc.latitude, loc.longitude, 'K')
      if (d < bestDistance) {
        bestDistance = d
        best = loc
      }
    }

    if (best && bestDistance <= NEAREST_MAX_KM) {
      return best
    }
  } catch (err) {
    console.warn('[GooglePlaces] nearest location lookup failed', err)
  }
  return null
}

/**
 * Resolve a Google Place selection to a DRIVOO location (inventory requires DB ids).
 */
export const resolveGooglePlaceToLocation = async (
  suggestion: PlaceSuggestion,
): Promise<bookcarsTypes.Location | null> => {
  const placeId = suggestion.placeId || suggestion._id.replace(GOOGLE_PLACE_PREFIX, '')
  if (!placeId) {
    return null
  }

  const details = await getPlaceDetails(placeId)
  const candidates = [
    details?.displayName?.text,
    suggestion.name,
    details?.addressComponents?.find((c) => c.types?.includes('locality'))?.longText,
    details?.addressComponents?.find((c) => c.types?.includes('administrative_area_level_2'))?.longText,
  ].filter(Boolean) as string[]

  for (const name of candidates) {
    const match = await findByName(name)
    if (match) {
      return match
    }
  }

  const lat = details?.location?.latitude
  const lng = details?.location?.longitude
  if (typeof lat === 'number' && typeof lng === 'number') {
    const nearest = await findNearest(lat, lng)
    if (nearest) {
      return nearest
    }
  }

  return findByName(suggestion.name)
}
