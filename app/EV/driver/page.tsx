"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DriverProfile {
  id: string;
  email?: string;
  full_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  is_online: boolean;
}

interface RealRide {
  id: string;
  passenger_name?: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  passenger_lat?: number;
  passenger_lng?: number;
  fare_amount: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
}

export default function DriverHQPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorizedDriver, setAuthorizedDriver] = useState<DriverProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState<RealRide | null>(null);
  const [fetchingRide, setFetchingRide] = useState(false);

  useEffect(() => {
    checkDriverAuth();
  }, []);

  // Ascolto in tempo reale per corse assegnate e aggiornamenti GPS customer
  useEffect(() => {
    if (authorizedDriver) {
      fetchAssignedRide();
      
      const subscription = supabase
        .channel('rides-dispatch-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
          fetchAssignedRide();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [authorizedDriver]);

  // Controllo autenticazione Driver
  const checkDriverAuth = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const userEmail = session.user.email?.toLowerCase().trim();

      // BYPASS ADMIN: Accesso diretto immediato per test
      if (userEmail === 'admin@azphur.com') {
        const adminProfile: DriverProfile = {
          id: 'admin-override-id',
          email: userEmail,
          full_name: 'AZPHUR Admin (Override)',
          vehicle_plate: 'ADMIN-HQ',
          vehicle_model: 'Fleet Executive EV',
          is_online: true
        };
        setAuthorizedDriver(adminProfile);
        setIsOnline(true);
        setLoading(false);
        return;
      }

      // Verifica tabella driver_profiles
      const { data: driverData, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error || !driverData) {
        alert("ACCESS DENIED: Your account is not registered as an official Driver.");
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setAuthorizedDriver(driverData);
      setIsOnline(driverData.is_online ?? false);
    } catch (err: unknown) {
      console.error("Authorization check error:", err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // 🚗 QUANDO IL DRIVER ACCETTA LA CORSA -> DIVENTA OCCUPATO
const handleAcceptRide = async (rideId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // 1. Aggiorna lo stato della corsa
  await supabase
    .from('rides')
    .update({ status: 'accepted' })
    .eq('id', rideId);

  // 2. Nasconde il driver dalla mappa dei clienti
  await supabase
    .from('driver_profiles')
    .update({ is_available: false })
    .eq('id', session.user.id);
};

// 🏁 QUANDO IL DRIVER COMPLETA O ANNULLA LA CORSA -> TORNA LIBERO
const handleCompleteRide = async (rideId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // 1. Chiude la corsa
  await supabase
    .from('rides')
    .update({ status: 'completed' })
    .eq('id', rideId);

  // 2. Rilancia il driver sulla mappa per i clienti
  await supabase
    .from('driver_profiles')
    .update({ is_available: true })
    .eq('id', session.user.id);
};

  // Recupera la corsa reale attiva
  const fetchAssignedRide = async () => {
    if (!authorizedDriver) return;
    setFetchingRide(true);

    try {
      let query = supabase
        .from('rides')
        .select('*')
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (authorizedDriver.id !== 'admin-override-id') {
        query = query.eq('driver_id', authorizedDriver.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const ride = data[0];
        setActiveRide({
          id: ride.id,
          passenger_name: ride.passenger_name || ride.customer_email || 'Verified EV Customer',
          pickup_address: ride.pickup_address || ride.pickup_location || 'Posizione GPS Attuale',
          pickup_lat: Number(ride.pickup_lat) || 45.6301,
          pickup_lng: Number(ride.pickup_lng) || 8.7231,
          dropoff_address: ride.dropoff_address || ride.destination || 'Destinazione Selezionata',
          dropoff_lat: Number(ride.destination_lat || ride.dropoff_lat) || 45.4642,
          dropoff_lng: Number(ride.destination_lng || ride.dropoff_lng) || 9.1900,
          passenger_lat: Number(ride.passenger_lat || ride.pickup_lat) || 45.6301,
          passenger_lng: Number(ride.passenger_lng || ride.pickup_lng) || 8.7231,
          fare_amount: Number(ride.fare || ride.fare_amount || 15.00),
          status: ride.status
        });
      } else {
        setActiveRide(null);
      }
    } catch (err: unknown) {
      console.error("Error fetching assigned ride:", err);
    } finally {
      setFetchingRide(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!authorizedDriver) return;
    const newStatus = !isOnline;
    
    setIsOnline(newStatus);

    if (authorizedDriver.id !== 'admin-override-id') {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ 
          is_online: newStatus,
          is_available: newStatus 
        })
        .eq('id', authorizedDriver.id);

      if (error) {
        console.error("Errore salvataggio status driver:", error.message);
        setIsOnline(!newStatus);
      }
    }
  };

  const updateRideStatus = async (newStatus: 'accepted' | 'in_progress' | 'completed') => {
    if (!activeRide) return;

    try {
      if (newStatus === 'accepted') {
        // Driver accetta la corsa e diventa OCCUPATO per gli altri clienti
        const { error } = await supabase
          .from('rides')
          .update({ status: 'accepted' })
          .eq('id', activeRide.id);

        if (error) throw error;

        if (authorizedDriver?.id !== 'admin-override-id') {
          await supabase
            .from('driver_profiles')
            .update({ is_available: false })
            .eq('id', authorizedDriver?.id);
        }

        setActiveRide({ ...activeRide, status: 'accepted' });

      } else if (newStatus === 'in_progress') {
        // Inizia viaggio verso il Drop-off
        const { error } = await supabase
          .from('rides')
          .update({ status: 'in_progress' })
          .eq('id', activeRide.id);

        if (error) throw error;
        setActiveRide({ ...activeRide, status: 'in_progress' });
        alert("🚀 Corsa iniziata! Navigazione impostata verso la destinazione.");

      } else if (newStatus === 'completed') {
        // Corsa completata -> Driver TORNA DISPONIBILE
        const { error: rpcError } = await supabase.rpc('complete_driver_ride', {
          p_ride_id: activeRide.id,
          p_driver_id: authorizedDriver?.id === 'admin-override-id' ? '00000000-0000-0000-0000-000000000000' : authorizedDriver?.id,
          p_fare_amount: activeRide.fare_amount,
          p_vat_rate: 0.12
        });

        if (rpcError) {
          await supabase
            .from('rides')
            .update({ status: 'completed' })
            .eq('id', activeRide.id);
        }

        if (authorizedDriver?.id !== 'admin-override-id') {
          await supabase
            .from('driver_profiles')
            .update({ is_available: true })
            .eq('id', authorizedDriver?.id);
        }

        alert("✅ TRIP COMPLETED! Il driver è nuovamente disponibile sulla mappa.");
        setActiveRide(null);
        fetchAssignedRide();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      alert("Errore aggiornamento corsa: " + errorMsg);
    }
  };

  const openExternalMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>VERIFYING DRIVER CREDENTIALS...</span>
        <style jsx>{`
          .loading-screen { min-height: 100vh; background: #f8fafc; color: #0284c7; display: flex; flex-direction: column; gap: 15px; align-items: center; justify-content: center; font-family: sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
          .spinner { width: 32px; height: 32px; border: 3px solid rgba(2, 132, 199, 0.2); border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const targetLat = activeRide?.status === 'in_progress' 
    ? (activeRide.dropoff_lat || 45.4642) 
    : (activeRide?.passenger_lat || activeRide?.pickup_lat || 45.6301);

  const targetLng = activeRide?.status === 'in_progress' 
    ? (activeRide.dropoff_lng || 9.1900) 
    : (activeRide?.passenger_lng || activeRide?.pickup_lng || 8.7231);
  
  const mapInteractiveUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${targetLng - 0.02}%2C${targetLat - 0.02}%2C${targetLng + 0.02}%2C${targetLat + 0.02}&layer=mapnik&marker=${targetLat}%2C${targetLng}`;

  return (
    <div className="driver-wrapper">
      <header className="header">
        <div className="driver-info">
          <div className="avatar">{authorizedDriver?.full_name.charAt(0)}</div>
          <div>
            <h2 className="title">{authorizedDriver?.full_name}</h2>
            <span className="subtitle">{authorizedDriver?.vehicle_model} • <strong className="plate">{authorizedDriver?.vehicle_plate}</strong></span>
          </div>
        </div>
        <Link href="/EV" className="exit-btn">EXIT HQ</Link>
      </header>

      {/* CARD TOGGLE STATO DRIVER */}
      <div className={`status-card ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-info">
          <div className="pulse-dot"></div>
          <div>
            <div className="status-title">{isOnline ? 'DISPATCH ONLINE' : 'DISPATCH OFFLINE'}</div>
            <div className="status-sub">{isOnline ? 'Ready to receive real-time EV customer trips' : 'Go online to accept incoming dispatches'}</div>
          </div>
        </div>
        <button onClick={toggleOnlineStatus} className="toggle-btn">
          {isOnline ? 'PAUSE' : 'GO ONLINE'}
        </button>
      </div>

      <main className="content">
        <div className="section-hdr">
          <span>ACTIVE DISPATCH ROUTE</span>
          {fetchingRide && <span className="syncing">SYNCING DB...</span>}
        </div>

        {!isOnline ? (
          <div className="placeholder-card">
            <div className="icon">📡</div>
            <h3>DRIVER IS CURRENTLY OFFLINE</h3>
            <p>Toggle your status to <strong>ONLINE</strong> to link with active Supabase rides and receive passenger requests.</p>
          </div>
        ) : activeRide ? (
          <div className="ride-card">
            <div className="ride-header">
              <div className="ride-badge">#{activeRide.id.slice(0, 8).toUpperCase()}</div>
              <div className="ride-price">€{activeRide.fare_amount.toFixed(2)}</div>
            </div>

            <div className="passenger-row">
              <span className="icon">👤</span>
              <div>
                <label>CUSTOMER (GPS LIVE)</label>
                <div>{activeRide.passenger_name}</div>
              </div>
            </div>

            <div className="route-timeline">
              <div className={`point ${activeRide.status !== 'in_progress' ? 'active' : ''}`}>
                <div className="point-dot pickup"></div>
                <div className="point-details">
                  <label>PICKUP / CUSTOMER LOCATION</label>
                  <p>{activeRide.pickup_address}</p>
                </div>
              </div>

              <div className="line"></div>

              <div className={`point ${activeRide.status === 'in_progress' ? 'active' : ''}`}>
                <div className="point-dot dropoff"></div>
                <div className="point-details">
                  <label>DESTINATION DROP-OFF</label>
                  <p>{activeRide.dropoff_address}</p>
                </div>
              </div>
            </div>

            {/* MAPPA INTERATTIVA */}
            <div className="map-wrapper">
              <iframe
                title="Interactive Map Customer GPS Navigation"
                src={mapInteractiveUrl}
                className="map-iframe"
                loading="lazy"
              ></iframe>
              <button 
                type="button" 
                className="map-nav-btn"
                onClick={() => openExternalMaps(targetLat, targetLng)}
              >
                🗺️ LAUNCH NATIVE GOOGLE MAPS NAVIGATION
              </button>
            </div>

            {/* AZIONI CORSA DRIVER */}
            <div className="action-area">
              {activeRide.status === 'pending' && (
                <button className="btn btn-accept" onClick={() => updateRideStatus('accepted')}>
                  ACCEPT DISPATCH
                </button>
              )}

              {activeRide.status === 'accepted' && (
                <button className="btn btn-start" onClick={() => updateRideStatus('in_progress')}>
                  ARRIVED AT PICKUP / START TRIP
                </button>
              )}

              {activeRide.status === 'in_progress' && (
                <button className="btn btn-complete" onClick={() => updateRideStatus('completed')}>
                  COMPLETE TRIP & RECORD VAT (12%)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="placeholder-card empty">
            <div className="radar-search"></div>
            <h3>SEARCHING FOR EV CUSTOMERS...</h3>
            <p>Connected to Supabase. Waiting for dispatch allocation or passenger request.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .driver-wrapper { min-height: 100vh; background: #f8fafc; color: #0f172a; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 480px; margin: 0 auto; box-sizing: border-box; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .driver-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 42px; height: 42px; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 18px; shadow: 0 2px 8px rgba(2, 132, 199, 0.2); }
        .title { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
        .subtitle { font-size: 12px; color: #64748b; }
        .plate { color: #0284c7; }
        .exit-btn { color: #64748b; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; transition: 0.2s; background: #fff; }
        .exit-btn:hover { background: #f1f5f9; color: #0f172a; }

        .status-card { margin-top: 18px; padding: 16px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .status-card.online { border-color: #38bdf8; background: #f0f9ff; }
        .status-info { display: flex; align-items: center; gap: 12px; }
        .pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; }
        .online .pulse-dot { background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .status-title { font-size: 12px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; }
        .status-sub { font-size: 11px; color: #64748b; }
        .toggle-btn { background: #0f172a; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .toggle-btn:hover { background: #1e293b; }

        .content { margin-top: 24px; }
        .section-hdr { font-size: 11px; color: #64748b; letter-spacing: 1.5px; font-weight: 900; margin-bottom: 12px; display: flex; justify-content: space-between; }
        .syncing { color: #0284c7; animation: blink 1s infinite; }
        @keyframes blink { 50% { opacity: 0.4; } }

        .ride-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .ride-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .ride-badge { background: #f1f5f9; color: #0284c7; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-family: monospace; }
        .ride-price { font-size: 24px; font-weight: 900; color: #059669; }

        .passenger-row { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 14px; font-weight: 700; border: 1px solid #f1f5f9; }
        .passenger-row label { display: block; font-size: 10px; color: #64748b; font-weight: 800; }

        .route-timeline { margin: 16px 0; }
        .point { display: flex; gap: 12px; opacity: 0.5; }
        .point.active { opacity: 1; }
        .point-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .point-dot.pickup { background: #0284c7; box-shadow: 0 0 8px rgba(2, 132, 199, 0.4); }
        .point-dot.dropoff { background: #e11d48; box-shadow: 0 0 8px rgba(225, 29, 72, 0.4); }
        .line { width: 2px; height: 20px; background: #cbd5e1; margin-left: 5px; margin-top: 2px; margin-bottom: 2px; }
        .point-details label { font-size: 10px; color: #64748b; font-weight: 900; letter-spacing: 0.5px; }
        .point-details p { margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a; }

        .map-wrapper { margin-top: 16px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; position: relative; }
        .map-iframe { width: 100%; height: 200px; border: none; }
        .map-nav-btn { width: 100%; background: #ffffff; color: #0284c7; border: none; padding: 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; cursor: pointer; text-align: center; border-top: 1px solid #e2e8f0; transition: 0.2s; }
        .map-nav-btn:hover { background: #f8fafc; }

        .action-area { margin-top: 18px; }
        .btn { width: 100%; padding: 15px; border: none; border-radius: 12px; font-weight: 900; font-size: 13px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; }
        .btn-accept { background: #0284c7; color: #ffffff; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); }
        .btn-start { background: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .btn-complete { background: #059669; color: #ffffff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
        .btn:hover { transform: translateY(-1px); opacity: 0.95; }

        .placeholder-card { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center; color: #64748b; }
        .placeholder-card h3 { color: #0f172a; font-size: 15px; font-weight: 800; margin: 12px 0 6px 0; }
        .placeholder-card p { font-size: 12px; margin: 0; line-height: 1.5; }
        .placeholder-card .icon { font-size: 32px; }

        .radar-search { width: 40px; height: 40px; border: 2px solid #0284c7; border-radius: 50%; margin: 0 auto; animation: radar 1.5s infinite ease-out; }
        @keyframes radar { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
}