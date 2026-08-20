import React, { useEffect, useState } from 'react'
import { TileLayer } from 'react-leaflet'
import mapConfig from '@/config/map.config'

type TileSource =
  | { kind: 'google'; url: string; subdomains?: string[]; maxZoom?: number }
  | { kind: 'osm' }
  | { kind: 'loading' }

const googleRasterFallback: Extract<TileSource, { kind: 'google' }> = {
  kind: 'google',
  url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  maxZoom: 20,
}

/**
 * Shared basemap: Google tiles when `VITE_BC_GOOGLE_MAPS_API_KEY` is set,
 * otherwise OpenStreetMap.
 *
 * Prefers the official Map Tiles API (enable it on the key in Google Cloud).
 * Falls back to Google raster tiles if the session cannot be created.
 */
const MapTileLayer = () => {
  const [source, setSource] = useState<TileSource>(() => (
    mapConfig.useGoogleMaps ? { kind: 'loading' } : { kind: 'osm' }
  ))

  useEffect(() => {
    if (!mapConfig.useGoogleMaps) {
      return undefined
    }

    let cancelled = false

    const resolveTiles = async () => {
      try {
        const res = await fetch(
          `https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(mapConfig.googleMapsApiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mapType: mapConfig.googleMapType,
              language: 'fr',
              region: 'TN',
            }),
          },
        )

        if (!res.ok) {
          throw new Error(`Google createSession HTTP ${res.status}`)
        }

        const data = (await res.json()) as { session?: string }
        if (!data.session) {
          throw new Error('Google createSession: missing session token')
        }

        if (!cancelled) {
          setSource({
            kind: 'google',
            url: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(data.session)}&key=${encodeURIComponent(mapConfig.googleMapsApiKey)}`,
            maxZoom: 22,
          })
        }
      } catch (err) {
        console.warn(
          '[MapTileLayer] Map Tiles API session failed — using Google raster tiles. Enable “Map Tiles API” on this key for the official path.',
          err,
        )
        if (!cancelled) {
          setSource(googleRasterFallback)
        }
      }
    }

    void resolveTiles()

    return () => {
      cancelled = true
    }
  }, [])

  if (source.kind === 'loading') {
    return null
  }

  if (source.kind === 'google') {
    return (
      <TileLayer
        url={source.url}
        subdomains={source.subdomains}
        maxZoom={source.maxZoom ?? 22}
        attribution="&copy; Google"
      />
    )
  }

  return (
    <TileLayer
      url={mapConfig.osmTileUrl}
      attribution={mapConfig.osmAttribution}
    />
  )
}

export default MapTileLayer
