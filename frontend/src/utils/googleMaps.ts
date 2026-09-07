import mapConfig from '@/config/map.config'

type GoogleMapsLibrary = 'places'

const SCRIPT_ID = 'bc-google-maps-js'
const LOAD_TIMEOUT_MS = 10_000

type GoogleMapsApi = typeof google

/**
 * Load the Maps JavaScript API once, then import the Places library.
 * Reuses `VITE_BC_GOOGLE_MAPS_API_KEY` (same key as map tiles).
 */
export const loadGoogleMaps = async (
  libraries: GoogleMapsLibrary[] = ['places'],
): Promise<GoogleMapsApi> => {
  if (!mapConfig.useGoogleMaps || !mapConfig.googleMapsApiKey) {
    throw new Error('Google Maps API key is not configured')
  }

  if (window.google?.maps?.places) {
    return window.google
  }

  if (!window.__bcGoogleMapsPromise) {
    window.__bcGoogleMapsPromise = loadGoogleMapsScript()
      .then(async (g) => {
        if (libraries.includes('places') && !g.maps.places) {
          const mapsWithImport = g.maps as google.maps.MapLibraryHost
          if (typeof mapsWithImport.importLibrary === 'function') {
            await mapsWithImport.importLibrary('places')
          }
        }
        if (!window.google?.maps?.places) {
          throw new Error('Google Places library failed to load (enable Places API on this key)')
        }
        return window.google
      })
      .catch((err) => {
        window.__bcGoogleMapsPromise = undefined
        throw err
      })
  }

  return window.__bcGoogleMapsPromise
}

const loadGoogleMapsScript = (): Promise<GoogleMapsApi> => new Promise((resolve, reject) => {
  if (window.google?.maps) {
    resolve(window.google)
    return
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    waitForGoogleMaps(resolve, reject)
    return
  }

  const timeoutId = window.setTimeout(() => {
    window.__bcGoogleMapsCallback = undefined
    reject(new Error('Google Maps script load timed out'))
  }, LOAD_TIMEOUT_MS)

  window.__bcGoogleMapsCallback = () => {
    window.clearTimeout(timeoutId)
    if (window.google?.maps) {
      resolve(window.google)
    } else {
      reject(new Error('Google Maps failed to initialize'))
    }
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  // Do not use loading=async here: it can fire the callback before libraries are ready.
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapConfig.googleMapsApiKey)}&v=weekly&language=fr&region=TN&callback=__bcGoogleMapsCallback`
  script.onerror = () => {
    window.clearTimeout(timeoutId)
    window.__bcGoogleMapsPromise = undefined
    window.__bcGoogleMapsCallback = undefined
    reject(new Error('Failed to load Google Maps JavaScript API'))
  }
  document.head.appendChild(script)
})

const waitForGoogleMaps = (
  resolve: (value: GoogleMapsApi) => void,
  reject: (reason?: unknown) => void,
) => {
  const started = Date.now()
  const tick = () => {
    if (window.google?.maps) {
      resolve(window.google)
      return
    }
    if (Date.now() - started > LOAD_TIMEOUT_MS) {
      reject(new Error('Google Maps script load timed out'))
      return
    }
    window.setTimeout(tick, 50)
  }
  tick()
}

export const isGooglePlacesEnabled = () => mapConfig.useGoogleMaps
