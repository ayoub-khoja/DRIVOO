import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/map'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'
import MapTileLayer from '@/components/MapTileLayer'
import drivooLogo from '@/assets/img/drivoo-logo.png'

import 'leaflet-boundary-canvas'
import 'leaflet/dist/leaflet.css'
import '@/assets/css/map.css'

export interface MapGeoPoint {
  id: string | number
  name: string
  latitude: number
  longitude: number
}

interface MapMarker {
  key: string
  name: string
  position: L.LatLng
  locationId?: string
  selectable?: boolean
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildDrivooIcon = (label: string, size: 'md' | 'sm' = 'md') => {
  const dim = size === 'sm' ? 36 : 46
  const tip = size === 'sm' ? 10 : 12
  const anchorY = dim + tip - 4

  return L.divIcon({
    className: `drivoo-map-marker drivoo-map-marker--${size}`,
    html: `
      <div class="drivoo-map-pin" title="${escapeAttr(label)}">
        <div class="drivoo-map-pin-face">
          <img src="${drivooLogo}" alt="" />
        </div>
        <span class="drivoo-map-pin-tip" aria-hidden="true"></span>
        <span class="drivoo-map-pin-pulse" aria-hidden="true"></span>
      </div>
    `,
    iconSize: [dim, anchorY],
    iconAnchor: [dim / 2, anchorY],
    popupAnchor: [0, -(anchorY - 4)],
  })
}

interface ZoomTrackerProps {
  setZoom: Dispatch<SetStateAction<number>>
}

const ZoomTracker = ({ setZoom }: ZoomTrackerProps) => {
  const mapEvents = useMapEvents({
    zoom() {
      setZoom(mapEvents.getZoom())
    },
  })

  return null
}

interface FitBoundsProps {
  points: L.LatLngExpression[]
  enabled?: boolean
}

const FitBounds = ({ points, enabled = true }: FitBoundsProps) => {
  const map = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    if (!enabled || points.length === 0 || fittedRef.current) {
      return
    }

    fittedRef.current = true

    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 10), { animate: true })
      return
    }

    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9, animate: true })
  }, [map, points, enabled])

  return null
}

interface ZoomControlledLayerProps {
  zoom: number
  minZoom: number
  children: ReactNode
}

const ZoomControlledLayer = ({ zoom, minZoom, children }: ZoomControlledLayerProps) => {
  if (zoom >= minZoom) {
    return <>{children}</>
  }
  return null
}

interface MapProps {
  title?: string
  position?: LatLngExpression
  initialZoom?: number
  locations?: bookcarsTypes.Location[]
  /** Cities / municipalities to show with Drivoo pins */
  geoPoints?: MapGeoPoint[]
  /** Extra points shown only when zoomed in (e.g. municipalities) */
  geoPointsDetail?: MapGeoPoint[]
  parkingSpots?: bookcarsTypes.ParkingSpot[]
  className?: string
  children?: ReactNode
  fitToMarkers?: boolean
  onSelelectPickUpLocation?: (locationId: string) => void
}

const Map = ({
  title,
  position = new L.LatLng(34.0, 9.5),
  initialZoom,
  locations,
  geoPoints,
  geoPointsDetail,
  parkingSpots,
  className,
  children,
  fitToMarkers = true,
  onSelelectPickUpLocation,
}: MapProps) => {
  const _initialZoom = initialZoom || 6.5
  const [zoom, setZoom] = useState(_initialZoom)
  const map = useRef<L.Map | null>(null)
  const iconMd = useMemo(() => buildDrivooIcon('DRIVOO', 'md'), [])
  const iconSm = useMemo(() => buildDrivooIcon('DRIVOO', 'sm'), [])

  useEffect(() => {
    if (map.current) {
      map.current.attributionControl.setPrefix('')
      map.current.invalidateSize()
    }
  }, [map])

  const locationMarkers = useMemo((): MapMarker[] => (
    (locations
      && locations
        .filter((l) => l.latitude && l.longitude)
        .map((l) => ({
          key: `loc-${l._id}`,
          name: l.name || 'DRIVOO',
          position: new L.LatLng(l.latitude!, l.longitude!),
          locationId: l._id,
          selectable: true,
        }))
    ) || []
  ), [locations])

  const cityMarkers = useMemo((): MapMarker[] => (
    (geoPoints
      && geoPoints
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          key: `geo-${p.id}`,
          name: p.name,
          position: new L.LatLng(p.latitude, p.longitude),
          selectable: false,
        }))
    ) || []
  ), [geoPoints])

  const municipalityMarkers = useMemo((): MapMarker[] => (
    (geoPointsDetail
      && geoPointsDetail
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          key: `mun-${p.id}`,
          name: p.name,
          position: new L.LatLng(p.latitude, p.longitude),
          selectable: false,
        }))
    ) || []
  ), [geoPointsDetail])

  const fitPoints = useMemo(() => {
    const primary = locationMarkers.length > 0 ? locationMarkers : cityMarkers
    return primary.map((m) => m.position)
  }, [locationMarkers, cityMarkers])

  const renderMarkers = (items: MapMarker[], size: 'md' | 'sm') =>
    items.map((marker) => (
      <Marker
        key={marker.key}
        position={marker.position}
        icon={size === 'sm' ? iconSm : iconMd}
        title={marker.name}
      >
        <Popup className="marker drivoo-map-popup">
          <div className="name">{marker.name}</div>
          {!!onSelelectPickUpLocation && marker.selectable && (
            <div className="action">
              <button
                type="button"
                className="action-btn"
                onClick={async () => {
                  try {
                    if (marker.locationId) {
                      onSelelectPickUpLocation(marker.locationId)
                      return
                    }
                    const { status, data } = await LocationService.getLocationId(marker.name, 'en')
                    if (status === 200) {
                      onSelelectPickUpLocation(data)
                    } else {
                      helper.error()
                    }
                  } catch (err) {
                    helper.error(err)
                  }
                }}
              >
                {strings.SELECT_PICK_UP_LOCATION}
              </button>
            </div>
          )}
        </Popup>
      </Marker>
    ))

  const getParkingSpots = () =>
    parkingSpots && parkingSpots.map((parkingSpot) => (
      <Marker
        key={parkingSpot._id}
        position={[Number(parkingSpot.latitude), Number(parkingSpot.longitude)]}
        icon={iconSm}
      >
        <Popup className="marker drivoo-map-popup">
          <div className="name">{parkingSpot.name}</div>
        </Popup>
      </Marker>
    ))

  // Prefer rental locations; otherwise show cities. Municipalities appear when zoomed in.
  const showCities = locationMarkers.length === 0 && cityMarkers.length > 0

  return (
    <>
      {title && <h1 className="title">{title}</h1>}
      <MapContainer
        center={position}
        zoom={_initialZoom}
        className={`${className ? `${className} ` : ''}map`}
        ref={map}
      >
        <MapTileLayer />
        <ZoomTracker setZoom={setZoom} />
        <FitBounds points={fitPoints} enabled={fitToMarkers && fitPoints.length > 0} />

        {locationMarkers.length > 0 && renderMarkers(locationMarkers, 'md')}

        {showCities && (
          <ZoomControlledLayer zoom={zoom} minZoom={0}>
            {renderMarkers(cityMarkers, 'md')}
          </ZoomControlledLayer>
        )}

        {!showCities && cityMarkers.length > 0 && (
          <ZoomControlledLayer zoom={zoom} minZoom={6}>
            {renderMarkers(cityMarkers, 'sm')}
          </ZoomControlledLayer>
        )}

        {municipalityMarkers.length > 0 && (
          <ZoomControlledLayer zoom={zoom} minZoom={9}>
            {renderMarkers(municipalityMarkers, 'sm')}
          </ZoomControlledLayer>
        )}

        {getParkingSpots()}
        {children}
      </MapContainer>
    </>
  )
}

export default Map
