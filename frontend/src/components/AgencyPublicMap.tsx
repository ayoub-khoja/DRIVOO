import React, { useEffect } from 'react'
import { MapContainer, Marker } from 'react-leaflet'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import MapTileLayer from '@/components/MapTileLayer'

import 'leaflet/dist/leaflet.css'

const pin = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface AgencyPublicMapProps {
  latitude: number
  longitude: number
  label: string
}

const AgencyPublicMap = ({ latitude, longitude, label }: AgencyPublicMapProps) => {
  useEffect(() => {
    L.Marker.prototype.options.icon = pin
  }, [])

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="agence-public-leaflet"
      attributionControl={false}
    >
      <MapTileLayer />
      <Marker position={[latitude, longitude]} icon={pin} title={label} />
    </MapContainer>
  )
}

export default AgencyPublicMap
