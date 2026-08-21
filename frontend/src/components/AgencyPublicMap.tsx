import React, { useEffect, useMemo } from 'react'
import { MapContainer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import MapTileLayer from '@/components/MapTileLayer'

import 'leaflet/dist/leaflet.css'

interface AgencyPublicMapProps {
  latitude: number
  longitude: number
  label: string
  logoUrl?: string
}

const MapInvalidate = () => {
  const map = useMap()
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(id)
  }, [map])
  return null
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildAgencyIcon = (label: string, logoUrl?: string) => {
  const initial = escapeAttr((label.trim().charAt(0) || 'A').toUpperCase())
  const media = logoUrl
    ? `<img src="${escapeAttr(logoUrl)}" alt="" />`
    : `<span>${initial}</span>`

  return L.divIcon({
    className: 'agence-public-map-marker',
    html: `
      <div class="agence-public-map-pin" title="${escapeAttr(label)}">
        <div class="agence-public-map-pin-face">${media}</div>
        <span class="agence-public-map-pin-tip" aria-hidden="true"></span>
      </div>
    `,
    iconSize: [48, 58],
    iconAnchor: [24, 58],
    popupAnchor: [0, -52],
  })
}

const AgencyPublicMap = ({ latitude, longitude, label, logoUrl }: AgencyPublicMapProps) => {
  const icon = useMemo(() => buildAgencyIcon(label, logoUrl), [label, logoUrl])

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={8}
      minZoom={6}
      maxZoom={18}
      scrollWheelZoom
      className="agence-public-leaflet"
      attributionControl={false}
    >
      <MapTileLayer />
      <MapInvalidate />
      <Marker position={[latitude, longitude]} icon={icon} title={label} />
    </MapContainer>
  )
}

export default AgencyPublicMap
