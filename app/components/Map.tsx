"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  activeService?: 'CHARGING' | 'GRAB'; // Prop per gestire il cambio di vista
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

const MapComponent = React.memo(function MapComponent({ center, stations, onlineDrivers, drivers, activeService }: MapProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // Caricamento dinamico di Leaflet solo lato client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default || leaflet);
      });
    }
  }, []);

  // Icone generate in modo sicuro lato client
  const icons = useMemo(() => {
    if (!L) return null;

    return {
      defaultIcon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
      greenStationIcon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }),
      yellowDriverIcon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    };
  }, [L]);

  if (!center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined || !L || !icons) {
    return <div style={{ padding: '20px', color: '#0891b2', fontFamily: 'monospace' }}>LOADING_MAP_COORDINATES...</div>;
  }

  // Supporta sia onlineDrivers che drivers
  const activeDriversList = onlineDrivers || drivers || [];

  // Marker delle Stazioni di Ricarica (Icona Verde)
  const renderedStationMarkers = stations.map((station) => {
    const rawLat = station.lat !== undefined && station.lat !== null ? station.lat : station.latitude;
    const rawLng = station.lng !== undefined && station.lng !== null ? station.lng : station.longitude;

    if (!rawLat || !rawLng) return null;

    const stationLat = Number(rawLat);
    const stationLng = Number(rawLng);

    if (isNaN(stationLat) || isNaN(stationLng) || stationLat === 0 || stationLng === 0) {
      return null;
    }

    return (
      <Marker key={`station-${station.id}`} position={[stationLat, stationLng]} icon={icons.greenStationIcon}>
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

  // Marker dei Driver Online (Pin Giallo per la modalità GRAB)
  const renderedDriverMarkers = activeDriversList.map((driver) => {
    if (!driver.lat || !driver.lng || isNaN(driver.lat) || isNaN(driver.lng)) {
      return null;
    }

    return (
      <Marker key={`driver-${driver.id}`} position={[driver.lat, driver.lng]} icon={icons.yellowDriverIcon}>
        <Popup>
          <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ background: '#eab308', color: '#111', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                DRIVER ONLINE
              </span>
            </div>
            <strong style={{ fontSize: '13px', color: '#111' }}>{driver.full_name}</strong><br />
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
              🏎️ <strong>Veicolo:</strong> {driver.vehicle_model}<br />
              🏷️ <strong>Targa:</strong> {driver.vehicle_plate}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });

  const mapKey = `${center[0]}-${center[1]}-${activeService || 'default'}`;

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
        <Marker position={center} icon={icons.defaultIcon}>
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
    prevProps.activeService === nextProps.activeService &&
    prevProps.stations.length === nextProps.stations.length &&
    prevDrivers.length === nextDrivers.length &&
    JSON.stringify(prevProps.stations) === JSON.stringify(nextProps.stations) &&
    JSON.stringify(prevDrivers) === JSON.stringify(nextDrivers)
  );
});

export default MapComponent;