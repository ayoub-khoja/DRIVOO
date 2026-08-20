import env from '@/config/env.config'

export type GoogleMapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid'

/** Central map settings — coordinates, zoom, and Google Maps when a key is set. */
const mapConfig = {
  latitude: env.MAP_LATITUDE,
  longitude: env.MAP_LONGITUDE,
  zoom: env.MAP_ZOOM,
  googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
  /** true when Google Maps tiles should be used instead of OpenStreetMap */
  useGoogleMaps: Boolean(env.GOOGLE_MAPS_API_KEY),
  googleMapType: 'roadmap' as GoogleMapType,
  osmTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osmAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

export default mapConfig
