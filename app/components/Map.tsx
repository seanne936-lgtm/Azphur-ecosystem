"use client";

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet: Posizione Utente
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Icona Verde per le Stazioni di Ricarica
const greenStationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icona Blu per i Driver Online
const blueDriverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface Station {
  id: string;
  name: string;
  kw_power: number;
  available_bays: number;
  total_bays: number;
  lat?: number | string; 
  lng?: number | string;
  latitude?: number | string; 
  longitude?: number | string;
}

export interface OnlineDriver {
  id: string;
  full_name: string;
  vehicle_model: string;
  vehicle_plate: string;
  lat?: number;
  lng?: number;
  email?: string;
}

interface MapProps {
  center: [number, number];
  stations: Station[];
  onlineDrivers?: OnlineDriver[];
  drivers?: OnlineDriver[]; // Alias per retrocompatibilità
}

// Sub-componente sicuro per la gestione del cambio coordinate/vista
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
      return;
    }
    
    try {
      const currentCenter = map.getCenter();
      if (!currentCenter) return;

      const isSame = currentCenter.lat.toFixed(4) === center[0].toFixed(4) && 
                     currentCenter.lng.toFixed(4) === center[1].toFixed(4);
      
      if (!isSame) {
        map.setView(center, 13, { animate: false });
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);
      }
    } catch (e) {
      console.warn("Map not ready for setView:", e);
    }
  }, [center, map]);
  
  return null;
};

const MapComponent = React.memo(function MapComponent({ center, stations, onlineDrivers, drivers }: MapProps) {
  if (!center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
    return <div style={{ padding: '20px', color: '#0891b2', fontFamily: 'monospace' }}>LOADING_MAP_COORDINATES...</div>;
  }

  // Supporta sia onlineDrivers che drivers
  const activeDriversList = onlineDrivers || drivers || [];

  // Marker delle Stazioni di Ricarica
  const renderedStationMarkers = useMemo(() => {
    return stations.map((station) => {
      const rawLat = station.lat !== undefined && station.lat !== null ? station.lat : station.latitude;
      const rawLng = station.lng !== undefined && station.lng !== null ? station.lng : station.longitude;

      if (!rawLat || !rawLng) return null;

      const stationLat = Number(rawLat);
      const stationLng = Number(rawLng);

      if (isNaN(stationLat) || isNaN(stationLng) || stationLat === 0 || stationLng === 0) {
        return null;
      }

      return (
        <Marker key={`station-${station.id}`} position={[stationLat, stationLng]} icon={greenStationIcon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b' }}>
              <strong style={{ fontSize: '13px', color: '#111' }}>{station.name}</strong><br />
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>⚡ {station.kw_power} kW</span><br />
              Bays: {station.available_bays}/{station.total_bays} Available
              
              <div style={{ marginTop: '10px' }}>
                <a 
                  href={`https://www.google.com/maps?q=${stationLat},${stationLng}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: '#22c55e',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  🗺️ START NAVIGATION
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [stations]);

  // Marker dei Driver Online (Pin Blu con Popup descrittivo)
  const renderedDriverMarkers = useMemo(() => {
    return activeDriversList.map((driver) => {
      if (!driver.lat || !driver.lng || isNaN(driver.lat) || isNaN(driver.lng)) {
        return null;
      }

      return (
        <Marker key={`driver-${driver.id}`} position={[driver.lat, driver.lng]} icon={blueDriverIcon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                  DRIVER ONLINE
                </span>
              </div>
              <strong style={{ fontSize: '13px', color: '#111' }}>{driver.full_name}</strong><br />
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                🚗 <strong>Veicolo:</strong> {driver.vehicle_model}<br />
                🏷️ <strong>Targa:</strong> {driver.vehicle_plate}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [activeDriversList]);

  const mapKey = `${center[0]}-${center[1]}`;

  return (
    <div style={{ height: "100%", minHeight: "350px", width: "100%", borderRadius: "inherit", overflow: "hidden" }}>
      <MapContainer 
        key={mapKey}
        center={center} 
        zoom={13} 
        style={{ height: "100%", minHeight: "350px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <ChangeView center={center} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marker posizione Utente corrente */}
        <Marker position={center} icon={defaultIcon}>
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              <strong>📍 YOUR_POSITION</strong><br />
              GPS Uplink Active.
            </div>
          </Popup>
        </Marker>

        {/* Stazioni di Ricarica */}
        {renderedStationMarkers}

        {/* Driver Online */}
        {renderedDriverMarkers}
      </MapContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevDrivers = prevProps.onlineDrivers || prevProps.drivers || [];
  const nextDrivers = nextProps.onlineDrivers || nextProps.drivers || [];

  return (
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1] &&
    prevProps.stations.length === nextProps.stations.length &&
    prevDrivers.length === nextDrivers.length &&
    JSON.stringify(prevProps.stations) === JSON.stringify(nextProps.stations) &&
    JSON.stringify(prevDrivers) === JSON.stringify(nextDrivers)
  );
});

export default MapComponent;