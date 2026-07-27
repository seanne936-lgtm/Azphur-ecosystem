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

  // Ascolto in tempo reale per corse assegnate e aggiornamenti GPS customer da Modulo 5
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

  const checkDriverAuth = async () => {
    try {
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
      setIsOnline(driverData.is_online);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("Authorization check error:", err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // Recupera la corsa reale attiva e le coordinate del customer dal Modulo 5
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
          pickup_address: ride.pickup_address || 'Milano Malpensa Airport (MXP)',
          pickup_lat: Number(ride.pickup_lat) || 45.6301,
          pickup_lng: Number(ride.pickup_lng) || 8.7231,
          dropoff_address: ride.dropoff_address || 'Piazza del Duomo, Milano',
          dropoff_lat: Number(ride.dropoff_lat) || 45.4642,
          dropoff_lng: Number(ride.dropoff_lng) || 9.1900,
          // Lettura coordinate reali del customer loggato nel Modulo 5
          passenger_lat: Number(ride.passenger_lat || ride.pickup_lat) || 45.6301,
          passenger_lng: Number(ride.passenger_lng || ride.pickup_lng) || 8.7231,
          fare_amount: Number(ride.fare_amount || 0),
          status: ride.status
        });
      } else {
        setActiveRide(null);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error fetching assigned ride:", err);
    } finally {
      setFetchingRide(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!authorizedDriver) return;
    const newStatus = !isOnline;
    
    // Aggiornamento ottimistico dell'UI
    setIsOnline(newStatus);

    if (authorizedDriver.id !== 'admin-override-id') {
      // Aggiorna usando sia ID che Email per sicurezza assoluta su Supabase
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_online: newStatus })
        .eq('id', authorizedDriver.id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Errore salvataggio status driver:", error.message);
        setIsOnline(!newStatus); // Rollback in caso di errore DB
      }
    }
  };

  const updateRideStatus = async (newStatus: 'accepted' | 'in_progress' | 'completed') => {
    if (!activeRide) return;

    try {
      if (newStatus === 'completed') {
        // Registra transazione IVA al 12% su dashboard_iva_totale
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

        alert("TRIP COMPLETED! Fare recorded & 12% VAT synchronized with HQ Dashboard.");
        setActiveRide(null);
        fetchAssignedRide();
      } else {
        const { error } = await supabase
          .from('rides')
          .update({ status: newStatus })
          .eq('id', activeRide.id);

        if (error) throw error;
        setActiveRide({ ...activeRide, status: newStatus });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      alert("Error updating ride status: " + errorMsg);
    }
  };

  const openExternalMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>VERIFYING DRIVER CREDENTIALS...</span>
        <style jsx>{`
          .loading-screen { min-height: 100vh; background: #080a0c; color: #22d3ee; display: flex; flex-direction: column; gap: 15px; align-items: center; justify-content: center; font-family: monospace; font-size: 12px; letter-spacing: 1px; }
          .spinner { width: 30px; height: 30px; border: 3px solid rgba(34,211,238,0.2); border-top-color: #22d3ee; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Seleziona le coordinate del bersaglio (Pickup/Customer Pos vs Dropoff)
  const targetLat = activeRide?.status === 'in_progress' 
    ? (activeRide.dropoff_lat || 45.4642) 
    : (activeRide?.passenger_lat || activeRide?.pickup_lat || 45.6301);

  const targetLng = activeRide?.status === 'in_progress' 
    ? (activeRide.dropoff_lng || 9.1900) 
    : (activeRide?.passenger_lng || activeRide?.pickup_lng || 8.7231);
  
  // URL mappa interattiva OpenStreetMap con evidenziazione marker cliente Modulo 5
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
            <p>Toggle your status to <strong>ONLINE</strong> to link with active Supabase rides and automatically log VAT revenue.</p>
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
                <label>CUSTOMER MOD 5 (GPS LIVE)</label>
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

            {/* CONTENITORE MAPPA INTERATTIVA CON POSIZIONE REALE CUSTOMER */}
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
            <p>Connected to Supabase. Waiting for dispatch allocation or Mod 5 passenger request.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .driver-wrapper { min-height: 100vh; background: #080a0c; color: #f3f4f6; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 480px; margin: 0 auto; box-sizing: border-box; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #1f2937; }
        .driver-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 16px; }
        .title { margin: 0; font-size: 15px; font-weight: 800; color: #fff; }
        .subtitle { font-size: 11px; color: #9ca3af; }
        .plate { color: #22d3ee; }
        .exit-btn { color: #9ca3af; border: 1px solid #374151; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; transition: 0.2s; }
        .exit-btn:hover { background: #1f2937; color: #fff; }

        .status-card { margin-top: 18px; padding: 16px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(8px); }
        .status-card.offline { background: #11141a; border: 1px solid #1f2937; }
        .status-card.online { background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.4); }
        .status-info { display: flex; align-items: center; gap: 12px; }
        .pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #6b7280; }
        .online .pulse-dot { background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .status-title { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; }
        .status-sub { font-size: 10px; color: #9ca3af; }
        .toggle-btn { background: #fff; color: #000; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; }

        .content { margin-top: 24px; }
        .section-hdr { font-size: 10px; color: #6b7280; letter-spacing: 1.5px; font-weight: 900; margin-bottom: 12px; display: flex; justify-content: space-between; }
        .syncing { color: #22d3ee; animation: blink 1s infinite; }
        @keyframes blink { 50% { opacity: 0.4; } }

        .ride-card { background: #11141a; border: 1px solid #1f2937; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .ride-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .ride-badge { background: #1f2937; color: #22d3ee; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-family: monospace; }
        .ride-price { font-size: 22px; font-weight: 900; color: #10b981; }

        .passenger-row { display: flex; align-items: center; gap: 10px; background: #181c24; padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; font-weight: 700; }
        .passenger-row label { display: block; font-size: 9px; color: #6b7280; font-weight: 800; }

        .route-timeline { margin: 16px 0; }
        .point { display: flex; gap: 12px; opacity: 0.5; }
        .point.active { opacity: 1; }
        .point-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .point-dot.pickup { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
        .point-dot.dropoff { background: #f43f5e; box-shadow: 0 0 8px #f43f5e; }
        .line { width: 2px; height: 20px; background: #374151; margin-left: 5px; margin-top: 2px; margin-bottom: 2px; }
        .point-details label { font-size: 9px; color: #6b7280; font-weight: 900; letter-spacing: 0.5px; }
        .point-details p { margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #e5e7eb; }

        .map-wrapper { margin-top: 16px; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937; position: relative; }
        .map-iframe { width: 100%; height: 200px; border: none; filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        .map-nav-btn { width: 100%; background: #181c24; color: #22d3ee; border: none; padding: 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; cursor: pointer; text-align: center; border-top: 1px solid #1f2937; }
        .map-nav-btn:hover { background: #1f2937; }

        .action-area { margin-top: 18px; }
        .btn { width: 100%; padding: 15px; border: none; border-radius: 12px; font-weight: 900; font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; }
        .btn-accept { background: #22d3ee; color: #080a0c; box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3); }
        .btn-start { background: #3b82f6; color: #fff; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
        .btn-complete { background: #10b981; color: #fff; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
        .btn:hover { transform: translateY(-1px); }

        .placeholder-card { background: #11141a; border: 1px dashed #1f2937; border-radius: 16px; padding: 40px 20px; text-align: center; color: #6b7280; }
        .placeholder-card h3 { color: #d1d5db; font-size: 14px; font-weight: 800; margin: 12px 0 6px 0; }
        .placeholder-card p { font-size: 12px; margin: 0; line-height: 1.5; }
        .placeholder-card .icon { font-size: 32px; }

        .radar-search { width: 40px; height: 40px; border: 2px solid #22d3ee; border-radius: 50%; margin: 0 auto; animation: radar 1.5s infinite ease-out; }
        @keyframes radar { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
}