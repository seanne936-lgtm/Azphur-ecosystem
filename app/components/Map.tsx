"use client";

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet: Posizione Utente (Blu classica)
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

interface Station {
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

interface MapProps {
  center: [number, number];
  stations: Station[];
}

// Sotto-componente corretto con controlli di sicurezza rigorosi per evitare crash del setView
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
      return;
    }
    
    try {
      // Controllo di sicurezza: se la mappa si sta smontando, getCenter potrebbe fallire
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
      console.warn("Mappa non ancora pronta per setView:", e);
    }
  }, [center, map]);
  
  return null;
};

const MapComponent = React.memo(function MapComponent({ center, stations }: MapProps) {
  if (!center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
    return <div style={{ padding: '20px', color: '#0891b2', fontFamily: 'monospace' }}>LOADING_MAP_COORDINATES...</div>;
  }

  // Genera i marker reali passatigli dal Modulo 5
  const renderedMarkers = useMemo(() => {
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
        <Marker key={station.id} position={[stationLat, stationLng]} icon={greenStationIcon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b' }}>
              <strong style={{ fontSize: '13px', color: '#111' }}>{station.name}</strong><br />
              {/* RIPRISTINATO: Emoji saetta corretta */}
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>⚡ {station.kw_power} kW</span><br />
              Bays: {station.available_bays}/{station.total_bays} Available
              
              <div style={{ marginTop: '10px' }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${stationLat},${stationLng}`}
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
                  {/* RIPRISTINATO: Emoji mappa corretta */}
                  🗺️ START NAVIGATION
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [stations]);

  // FIX DEFINTIVO PER NEXT.JS: Usiamo una key univoca basata sul centro. 
  // Se cambia bruscamente o la pagina rinfresca, distrugge la vecchia istanza Leaflet ed evita il crash del DOM.
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

        <Marker position={center} icon={defaultIcon}>
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              {/* RIPRISTINATO: Emoji pin corretta */}
              <strong>📌 YOUR_POSITION</strong><br />
              GPS Uplink Active.
            </div>
          </Popup>
        </Marker>

        {renderedMarkers}
      </MapContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1] &&
    prevProps.stations.length === nextProps.stations.length &&
    JSON.stringify(prevProps.stations) === JSON.stringify(nextProps.stations)
  );
});

export default MapComponent;