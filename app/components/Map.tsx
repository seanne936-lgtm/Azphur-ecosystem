"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet che a volte spariscono in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Station {
  id: string;
  name: string;
  kw_power: number;
  available_bays: number;
  total_bays: number;
  latitude?: number; 
  longitude?: number;
}

interface MapProps {
  center: [number, number];
  stations: Station[];
}

// Sotto-componente ottimizzato: previene loop infiniti su mobile
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
      return;
    }
    
    if (map && typeof map.setView === 'function') {
      try {
        // Usa una stringa fissa di controllo per evitare di triggerare cambi continui se le coordinate sono identiche
        const currentCenter = map.getCenter();
        const isSame = currentCenter.lat.toFixed(4) === center[0].toFixed(4) && 
                       currentCenter.lng.toFixed(4) === center[1].toFixed(4);
        
        if (!isSame) {
          map.setView(center, 13);
          // FIX PER MOBILE: Forza il rinfresco dei quadranti grafici se la mappa è rimasta nera
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }
      } catch (e) {
        console.error("Errore Leaflet durante il setView:", e);
      }
    }
  }, [center[0], center[1], map]); // Ascolta i singoli numeri, non l'array intero!
  
  return null;
};

export default function MapComponent({ center, stations }: MapProps) {
  // Controllo preventivo: se il centro non è valido, mostra un caricamento pulito
  if (!center || !Array.isArray(center) || center[0] === undefined || center[1] === undefined) {
    return <div style={{ padding: '20px', color: '#0891b2', fontFamily: 'monospace' }}>LOADING_MAP_COORDINATES...</div>;
  }

  return (
    // FIX MOBILE: Definiamo un'altezza minima fissa (minHeight) interna, così non collasserà MAI a zero
    <div style={{ height: "100%", minHeight: "350px", width: "100%", borderRadius: "inherit", overflow: "hidden" }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: "100%", minHeight: "350px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <ChangeView center={center} />
        
        {/* Sfondo open-source */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marker della posizione attuale dell'utente */}
        <Marker position={center} icon={defaultIcon}>
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              <strong>📍 YOUR_POSITION</strong><br />
              GPS Uplink Active.
            </div>
          </Popup>
        </Marker>

        {/* Marker dinamici delle colonnine */}
        {stations.map((station) => {
          const stringToSeed = station.id || station.name;
          let hash = 0;
          for (let i = 0; i < stringToSeed.length; i++) {
            hash = stringToSeed.charCodeAt(i) + ((hash << 5) - hash);
          }
          const pseudoLatOffset = ((hash % 100) / 1000) - 0.05;
          const pseudoLngOffset = (((hash >> 2) % 100) / 1000) - 0.05;

          const lat = station.latitude || center[0] + pseudoLatOffset;
          const lng = station.longitude || center[1] + pseudoLngOffset;

          return (
            <Marker key={station.id} position={[lat, lng]} icon={defaultIcon}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#1e293b' }}>
                  <strong style={{ fontSize: '13px', color: '#111' }}>{station.name}</strong><br />
                  <span style={{ color: '#3e6ae1', fontWeight: 'bold' }}>⚡ {station.kw_power} kW</span><br />
                  Bays: {station.available_bays}/{station.total_bays} Available
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}