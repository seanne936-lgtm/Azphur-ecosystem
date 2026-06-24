import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Estrazione sicura senza forzatura (!) immediata per prevenire crash bloccanti all'avvio del server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * ----------------------------------------------------------------
 * GET: SEARCH NEARBY CHARGING SUB_STATIONS (RADIUS 50KM)
 * ----------------------------------------------------------------
 */
export async function GET(request: Request) {
  try {
    // 1. Controllo preventivo di configurazione: evita il crash HTML restituendo un JSON parlante
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('--- CRITICAL CONFIGURATION ERROR: Missing Supabase Environment Variables ---');
      return NextResponse.json(
        { 
          success: false, 
          error: 'SERVER_CONFIGURATION_ERROR: Supabase URL or Service Role Key is missing from the environment.' 
        }, 
        { status: 500 }
      );
    }

    // Inizializzazione protetta dell'istanza client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Latitude (lat) and Longitude (lng) query parameters are required.' }, 
        { status: 400 }
      );
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinate format.' }, 
        { status: 400 }
      );
    }

    // Estrazione dati da sub_stations
    const { data: subStations, error } = await supabase
      .from('sub_stations')
      .select('*');

    if (error) {
      console.error('--- SUB_STATIONS FETCH ERROR ---', error.message);
      return NextResponse.json(
        { success: false, error: `Unable to retrieve sub-stations data matrix: ${error.message}` }, 
        { status: 500 }
      );
    }

    if (!subStations || subStations.length === 0) {
      return NextResponse.json({
        success: true,
        results: 0,
        stations: []
      }, { status: 200 });
    }

    // Calcolo della distanza balistica piana in KM con fallback robusti sulle chiavi
    const nearbyStations = subStations
      .map(station => {
        const sLat = station.latitude !== undefined && station.latitude !== null ? station.latitude : (station.lat || 0);
        const sLng = station.longitude !== undefined && station.longitude !== null ? station.longitude : (station.lng || 0);

        const ky = 111.13222;
        const kx = 111.13222 * Math.cos(userLat * Math.PI / 180);
        const dx = (userLng - sLng) * kx;
        const dy = (userLat - sLat) * ky;
        const distanceInKm = Math.sqrt(dx * dx + dy * dy);

        return { 
          ...station, 
          distance_km: Math.round(distanceInKm * 10) / 10 
        };
      })
      .filter(station => station.distance_km <= 50) // Raggio operativo standard di 50km
      .sort((a, b) => a.distance_km - b.distance_km);

    return NextResponse.json({
      success: true,
      results: nearbyStations.length,
      stations: nearbyStations
    }, { status: 200 });

  } catch (error: any) {
    console.error('Internal Server GET Charger Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error during geolocation routing.' 
    }, { status: 500 });
  }
}