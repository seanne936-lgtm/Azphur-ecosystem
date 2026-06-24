"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import dinamico del componente Mappa per evitare crash SSR sul server
const MapComponent = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{ color: '#22d3ee', fontFamily: 'monospace', padding: '20px', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#edf2f7', width: '100%' }}>
      📡 INITIALIZING_SATELLITE_TILES...
    </div>
  )
});

interface TickerStats {
  co2: number;
  mw: number;
}

interface VehicleMock {
  id: string;
  model: string;
  plate: string;
  battery: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  distance: string;
}

interface StationMock {
  id: string;
  name: string;
  available_bays: number;
  total_bays: number;
  kw_power: number;
  price_per_kwh: number;
  distance_km?: number;
  address?: string;
}

const TopTicker: React.FC = () => {
  const [stats, setStats] = useState<TickerStats>({ co2: 15420, mw: 912.45 });
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setStats(prev => ({
        co2: prev.co2 + Math.floor(Math.random() * 3),
        mw: +(prev.mw + (Math.random() * 0.05)).toFixed(2)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`top-ticker-lux ${mounted ? 'visible' : ''}`}>
      <div className="ticker-inner">
        <span className="live-pill">SYSTEM_OK</span>
        <span className="stat">CO2_SAVED: <strong>{new Intl.NumberFormat('en-US').format(stats.co2)}</strong></span>
        <div className="sep"></div>
        <span className="stat">NET_POWER: <strong>{stats.mw.toFixed(2)}</strong> MW</span>
      </div>
      <style jsx>{`
        .top-ticker-lux { 
          position: fixed; top: 0; left: 0; width: 100%; min-height: 45px; 
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px);  
          z-index: 2000; border-bottom: 1px solid rgba(34, 211, 238, 0.2); 
          display: flex; align-items: center; justify-content: center; 
          opacity: 0; transition: 0.8s; box-sizing: border-box; padding: 5px 15px;
        }
        .top-ticker-lux.visible { opacity: 1; }
        .ticker-inner { display: flex; align-items: center; justify-content: center; gap: 30px; font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #1d1d1f; flex-wrap: wrap; text-align: center; }
        .live-pill { background: #22d3ee; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 8px; }
        .stat strong { color: #0891b2; }
        .sep { width: 1px; height: 10px; background: rgba(34, 211, 238, 0.3); }
        @media (max-width: 480px) { .ticker-inner { gap: 10px; } .sep { display: none; } }
      `}</style>
    </div>
  );
};

export default function EVMobilityPage() {
  const router = useRouter();
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  
  const [isClient, setIsClient] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const [activeService, setActiveService] = useState<'CHARGING' | 'SHARING'>('CHARGING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vehicles, setVehicles] = useState<VehicleMock[]>([]);
  const [stations, setStations] = useState<StationMock[]>([]);
  
  const [geoStatus, setGeoStatus] = useState<string>("INITIALIZING_GPS_STREAM...");
  const FALLBACK_LAT = 14.5547;
  const FALLBACK_LNG = 121.0244;

  const [mapCenter, setMapCenter] = useState<[number, number]>([FALLBACK_LAT, FALLBACK_LNG]);

  const adminEmails = ['admin@azphur.com', 'tuofratello@email.com'];

  const verifyCustomerAccess = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    if (adminEmails.includes(emailClean)) return true;
    try {
      const { data, error } = await supabase
        .from('module_05_customers')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error("Error verifying Module 5 privileges:", err);
      return false;
    }
  };

  const verifyModule01Access = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    try {
      const { data, error } = await supabase
        .from('module_01_customers')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  };

  const fetchRealSubStations = async (lat?: number, lng?: number) => {
    const currentLat = lat || FALLBACK_LAT;
    const currentLng = lng || FALLBACK_LNG;

    try {
      const response = await fetch(`/api/v1/stations/nerby?lat=${currentLat}&lng=${currentLng}`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await triggerDatabaseFallback();
        return;
      }

      const result = await response.json();

      if (response.ok && result.success && result.stations) {
        const formatted = result.stations.map((item: any) => ({
          id: item.id,
          name: item.name,
          available_bays: item.available_bays || 0,
          total_bays: item.total_bays || 0,
          kw_power: item.kw_power || item.power_kv || 0,
          price_per_kwh: Number(item.price_per_kwh || 0),
          distance_km: item.distance_km,
          address: item.address
        }));
        setStations(formatted);
      } else {
        await triggerDatabaseFallback();
      }
    } catch (err) {
      console.error("Error fetching sub_stations via API:", err);
      await triggerDatabaseFallback();
    }
  };

  const triggerDatabaseFallback = async () => {
    const { data, error } = await supabase
      .from('sub_stations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        available_bays: item.available_bays,
        total_bays: item.total_bays,
        kw_power: item.kw_power,
        price_per_kwh: Number(item.price_per_kwh)
      }));
      setStations(formatted);
    }
  };

 const triggerLocationAcquisition = () => {
  if (typeof window !== 'undefined' && navigator.geolocation) {
    setGeoStatus("REQUESTING_SATELLITE_LINK... [RECOMMENDED FOR OPTIMAL EXPERIENCE]");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoStatus("COORDINATES_LOCKED_SUCCESSFULLY");
        
        // Forza la mappa a spostarsi sulle coordinate reali dell'utente
        if (typeof setMapCenter === 'function') {
          setMapCenter([latitude, longitude]);
        }
        fetchRealSubStations(latitude, longitude);
      },
      (error) => {
        console.warn("GPS Access Denied. Using Manila core coordinates.");
        setGeoStatus("GPS_REJECTED_USING_METRO_FALLBACK [ALLOW LOCATION FOR OPTIMAL EXPERIENCE]");
        
        // FIX: Sposta la mappa sulle coordinate di Manila se il GPS fallisce
        if (typeof setMapCenter === 'function') {
          setMapCenter([FALLBACK_LAT, FALLBACK_LNG]);
        }
        fetchRealSubStations(FALLBACK_LAT, FALLBACK_LNG);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  } else {
    setGeoStatus("GPS_NOT_SUPPORTED_BY_BROWSER [UPGRADE BROWSER FOR OPTIMAL EXPERIENCE]");
    if (typeof setMapCenter === 'function') {
      setMapCenter([FALLBACK_LAT, FALLBACK_LNG]);
    }
    fetchRealSubStations(FALLBACK_LAT, FALLBACK_LNG);
  }
};

  useEffect(() => {
    setIsClient(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setGlobalLoading(true);

      if (session?.user?.email) {
        const emailClean = session.user.email.toLowerCase().trim();
        const hasModule5Access = await verifyCustomerAccess(emailClean);
        
        if (hasModule5Access) {
          setCurrentUserEmail(emailClean);
          setIsAuthenticated(true);
          
          setVehicles([
            { id: "EV-CAR-01", model: "AZPHUR Pod S", plate: "NEX-2026", battery: 84, status: "AVAILABLE", distance: "350m away" },
            { id: "EV-CAR-02", model: "AZPHUR Cargo E", plate: "LAL-9981", battery: 42, status: "AVAILABLE", distance: "1.2km away" },
            { id: "EV-CAR-03", model: "AZPHUR Pod X", plate: "GRB-4412", battery: 95, status: "IN_USE", distance: "800m away" }
          ]);
          
          triggerLocationAcquisition();
          setGlobalLoading(false);
        } else {
          setIsAuthenticated(false);
          setCurrentUserEmail('');
          router.push('/s2b');
          setGlobalLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUserEmail('');
        setGlobalLoading(false);
      }
    });

    const channel = supabase
      .channel('realtime-sub-stations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_stations' }, () => {
        triggerLocationAcquisition();
      })
      .subscribe();

    const msInterval = setInterval(() => {
      setLiveMs(() => Math.floor(Math.random() * 80) + 380);
    }, 1500);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollPercent((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(msInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const emailClean = email.trim().toLowerCase();
      const isAdmin = adminEmails.includes(emailClean);
      
      if (!isAdmin) {
        const hasModule5 = await verifyCustomerAccess(emailClean);
        if (!hasModule5) {
          const hasModule1 = await verifyModule01Access(emailClean);
          if (hasModule1) {
            const { error: authError } = await supabase.auth.signInWithPassword({
              email: emailClean,
              password: password
            });
            if (!authError) {
              router.push('/s2b');
              return;
            } else {
              setAuthError("INVALID_CREDENTIALS: Incorrect security code.");
              setAuthLoading(false);
              return;
            }
          } else {
            setAuthError("ACCESS_DENIED: Profile not configured for the AZPHUR ecosystem modules.");
            setAuthLoading(false);
            return;
          }
        }
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: password
      });

      if (authError) {
        setAuthError("INVALID_CREDENTIALS: Incorrect security code.");
      }
    } catch (err) {
      setAuthError('An unexpected authentication anomaly occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setGlobalLoading(true);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isClient || globalLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 style={{ color: 'cyan', fontSize: '18px', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: '0 20px' }}>
          SYSTEM_AUTHENTICATION // AZPHUR PORTAL
        </h2>
        <p>INITIALIZING ECOSYSTEM PROFILE UPLINK...</p>
        <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #1d1d1f; font-family: monospace; font-size: 12px; color: #22d3ee; }
          .spinner { width: 30px; height: 30px; border: 3px solid rgba(34, 211, 238, 0.2); border-top-color: #22d3ee; border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 15px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="az-premium-canvas">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;800&display=swap');
          html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; box-sizing: border-box; }
          .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; width: 100%; box-sizing: border-box; padding-top: 55px; }
          .nav-minimal-lux { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px 20px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; width: 100%; }
          .logo-group { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
          .main-logo { height: 35px; cursor: pointer; }
          .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 10px #22d3ee; animation: pulse-glow 2s infinite; }
          .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; font-weight: 900; }
          .nav-items { display: flex; gap: 30px; align-items: center; }
          .network-signal { display: flex; align-items: center; gap: 8px; color: #0891b2; font-size: 8px; font-weight: 800; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
          .sig-dot { width: 4px; height: 4px; background: #22d3ee; border-radius: 50%; animation: blink 1.5s infinite; }
          .auth-gate-container { max-width: 420px; margin: 80px auto; background: #ffffff; border: 4px solid #1d1d1f; border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); box-sizing: border-box; }
          .auth-gate-title { font-size: 20px; font-family: 'JetBrains Mono', monospace; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 4px; text-transform: uppercase; color: #1d1d1f; }
          .auth-gate-subtitle { font-size: 11px; color: #64748b; margin-bottom: 30px; font-weight: 500; font-family: 'JetBrains Mono', monospace; }
          .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; text-align: left; }
          .input-group label { font-size: 10px; font-weight: 900; color: #64748b; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
          .input-group input { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; color: #111; font-size: 13px; outline: none; border-radius: 12px; transition: 0.2s; width: 100%; box-sizing: border-box; font-family: 'JetBrains Mono', monospace; }
          .input-group input:focus { border-color: #22d3ee; background: #fff; }
          .btn-login-exec { background: #1d1d1f; color: #22d3ee; border: 1px solid #22d3ee; padding: 16px; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; border-radius: 12px; letter-spacing: 1.5px; width: 100%; box-sizing: border-box; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
          .btn-login-exec:hover { background: #22d3ee; color: #1d1d1f; box-shadow: 0 8px 20px rgba(34, 211, 238, 0.3); }
          .error-banner { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; font-size: 10px; font-weight: 700; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
          .encryption-tag { font-size: 8px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; text-align: center; margin-top: 15px; display: block; font-weight: bold; }
        `}</style>
        
        <TopTicker />

        <nav className="nav-minimal-lux">
          <div className="logo-group">
            <img src="/logo-azphur.avif" alt="AZPHUR Logo" className="main-logo" onClick={() => router.push('/')} />
            <div className="status-orb"></div>
            <span className="op-status-tag">EVMOB_MODULE_05</span>
          </div>
          <div className="nav-items">
            <div className="network-signal">
              <span className="sig-dot"></span>
              <span>SECURE_LINK // {liveMs}ms</span>
            </div>
          </div>
        </nav>

        <div className="auth-gate-container">
          <h2 className="auth-gate-title">SYSTEM_AUTHENTICATION</h2>
          <p className="auth-gate-subtitle">AZPHUR Universal Portal: Enter authorization credentials.</p>
          
          {authError && <div className="error-banner">❌ ALERT: {authError}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>ACCOUNT_EMAIL</label>
              <input 
                type="email" 
                placeholder="client@azphur.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>SECURITY_CODE</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login-exec" disabled={authLoading}>
              {authLoading ? "INITIALIZING UPLINK..." : "INITIALIZE_SESSION →"}
            </button>
          </form>
          <span className="encryption-tag">ENCRYPTION: AES-256 // STATUS: LINK_ACTIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="az-premium-canvas">
      <div className="scroll-progress-indicator" style={{ width: `${scrollPercent}%` }}></div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;800&display=swap');
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; box-sizing: border-box; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; width: 100%; box-sizing: border-box; padding-top: 55px; }
        .scroll-progress-indicator { position: fixed; top: 0; left: 0; height: 3px; background: #22d3ee; z-index: 2001; transition: width 0.1s ease-out; box-shadow: 0 0 8px #22d3ee; }
        .nav-minimal-lux { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px 20px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; width: 100%; }
        .logo-group { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .main-logo { height: 35px; cursor: pointer; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 10px #22d3ee; animation: pulse-glow 2s infinite; }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; font-weight: 900; }
        .nav-items { display: flex; gap: 30px; align-items: center; }
        .network-signal { display: flex; align-items: center; gap: 8px; color: #0891b2; font-size: 8px; font-weight: 800; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
        .sig-dot { width: 4px; height: 4px; background: #22d3ee; border-radius: 50%; animation: blink 1.5s infinite; }
        .btn-red-outline { background: none; border: 1px solid #ef4444; color: #ef4444; padding: 8px 18px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; white-space: nowrap; }
        .btn-red-outline:hover { background: #ef4444; color: #fff; }
        .mobility-container { background-color: #f8fafc; min-height: 70vh; max-width: 1300px; margin: 10px auto 60px; border: 4px solid #1d1d1f; border-radius: 24px; display: flex; flex-direction: column; color: #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
        .app-header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; }
        .brand-text { font-weight: 900; font-size: 16px; letter-spacing: 2px; color: #111; display: flex; align-items: center; gap: 6px; }
        .blue-pill { background: #3e6ae1; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        .user-profile-badge { background: #f1f5f9; padding: 8px 14px; border-radius: 100px; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; max-width: 100%; box-sizing: border-box; overflow: hidden; }
        .pulse-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        .user-email { font-size: 11px; font-weight: 700; color: #64748b; font-family: 'JetBrains Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mobility-layout { display: flex; flex: 1; height: 650px; overflow: hidden; }
        .control-panel { width: 420px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 24px; box-sizing: border-box; z-index: 10; overflow-y: auto; }
        .service-selector { display: grid; grid-template-columns: 1fr 1fr; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 20px; gap: 4px; }
        .service-tab { border: none; background: transparent; padding: 12px 6px; font-size: 11px; font-weight: 800; color: #64748b; border-radius: 10px; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px; text-align: center; }
        .active-charging { background: #ffffff; color: #3e6ae1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .active-sharing { background: #ffffff; color: #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .search-input { width: 100%; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box; margin-bottom: 24px; }
        .feed-title { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 14px; display: block; }
        .card-list { display: flex; flex-direction: column; gap: 12px; }
        .mobility-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; transition: 0.2s; }
        .mobility-card:hover { border-color: #cbd5e1; transform: translateY(-2px); }
        .card-main-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
        .node-title { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0; }
        .node-sub { font-size: 12px; color: #64748b; margin: 0; font-weight: 500; }
        .bay-badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
        .bay-badge.green { background: #d1fae5; color: #065f46; }
        .bay-badge.red { background: #fee2e2; color: #991b1b; }
        .battery-indicator { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; white-space: nowrap; }
        .battery-indicator.high { color: #10b981; }
        .battery-indicator.low { color: #f59e0b; }
        .card-footer-info { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #f1f5f9; padding-top: 14px; gap: 10px; }
        .price-tag { font-size: 14px; font-weight: 800; color: #1e293b; }
        .status-pill { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .status-pill.available { color: #10b981; }
        .status-pill.in_use { color: #64748b; }
        .action-btn-go { border: none; background: #3e6ae1; color: white; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .action-btn-go:hover { background: #111; }
        .action-btn-go.sharing { background: #10b981; }
        .action-btn-go:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
        
        .map-canvas { flex: 1; background: #edf2f7; position: relative; display: flex; flex-direction: column; }
        .map-overlay-stats { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 50; flex-wrap: wrap; right: 20px; }
        .mini-stat-pill { background: #1e293b; color: white; padding: 6px 14px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .map-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; padding: 0; overflow: hidden; }
        
        @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(34, 211, 238, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes radarPulse { 0% { transform: scale(0.2); opacity: 0.8; } 100% { transform: scale(1.2); opacity: 0; } }

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 20px; flex-direction: column; gap: 20px; text-align: center; }
          .logo-group { justify-content: center; }
          .nav-items { width: 100%; justify-content: space-between; gap: 15px; }
          .mobility-layout { flex-direction: column-reverse; height: auto; overflow: visible; }
          .control-panel { width: 100%; height: auto; max-height: none; overflow: visible; border-right: none; border-top: 1px solid #e2e8f0; }
          .map-canvas { height: 400px; width: 100%; }
          .mobility-container { margin: 10px 10px 40px 10px; border-width: 2px; }
          .app-header { padding: 15px; justify-content: center; text-align: center; }
        }
      `}</style>

      <TopTicker />

      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img src="/logo-azphur.avif" alt="AZPHUR Logo" className="main-logo" onClick={() => router.push('/')} />
          <div className="status-orb"></div>
          <span className="op-status-tag">EVMOB_MODULE_05</span>
          <span style={{ fontSize: '7px', color: '#0891b2', marginLeft: '10px', fontFamily: 'monospace' }}>[{geoStatus}]</span>
        </div>
        <div className="nav-items">
          <div className="network-signal">
            <span className="sig-dot"></span>
            <span>SECURE_LINK // {liveMs}ms</span>
          </div>
          <button className="btn-red-outline" onClick={handleLogout}>DISCONNECT 👋</button>
        </div>
      </nav>

      <main style={{ padding: '0 10px' }}>
        <div className="mobility-container">
          <div className="app-header">
            <div className="brand-link">
              <span className="brand-text">
                AZPHUR <span className="blue-pill">MODULE_05_LIVE</span>
              </span>
            </div>
            <div className="user-profile-badge">
              <span className="pulse-dot"></span>
              <span className="user-email">{currentUserEmail}</span>
            </div>
          </div>

          <div className="mobility-layout">
            <div className="control-panel">
              <div className="service-selector">
                <button 
                  className={`service-tab ${activeService === 'CHARGING' ? 'active-charging' : ''}`}
                  onClick={() => { setActiveService('CHARGING'); setSearchQuery(''); }}
                >
                  ⚡ CHARGING
                </button>
                <button 
                  className={`service-tab ${activeService === 'SHARING' ? 'active-sharing' : ''}`}
                  onClick={() => { setActiveService('SHARING'); setSearchQuery(''); }}
                >
                  🚗 SHARING
                </button>
              </div>

              <input 
                type="text" 
                className="search-input" 
                placeholder={activeService === 'CHARGING' ? "Filter charging stations..." : "Filter fleet vehicles..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="feed-container">
                <span className="feed-title">
                  {activeService === 'CHARGING' ? 'AVAILABLE CHARGING NODES' : 'VEHICLES READY FOR DEPLOYMENT'}
                </span>
                
                <div className="card-list">
                  {activeService === 'CHARGING' ? (
                    filteredStations.map((station) => (
                      <div className="mobility-card" key={station.id}>
                        <div className="card-main-info">
                          <div>
                            <h3 className="node-title">{station.name}</h3>
                            <p className="node-sub">
                              {station.kw_power} kW • Fast Charge
                              {station.distance_km !== undefined && ` • ${station.distance_km} KM away`}
                            </p>
                          </div>
                          <span className={`bay-badge ${station.available_bays > 0 ? 'green' : 'red'}`}>
                            {station.available_bays}/{station.total_bays} AVAIL
                          </span>
                        </div>
                        <div className="card-footer-info">
                          <span className="price-tag">₱{station.price_per_kwh.toFixed(2)}/kWh</span>
                          <button className="action-btn-go" disabled={station.available_bays === 0}>
                            {station.available_bays > 0 ? 'CHARGE' : 'OCCUPIED'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <div className="mobility-card" key={vehicle.id}>
                        <div className="card-main-info">
                          <div>
                            <h3 className="node-title">{vehicle.model}</h3>
                            <p className="node-sub">{vehicle.plate} • {vehicle.distance}</p>
                          </div>
                          <span className={`battery-indicator ${vehicle.battery > 50 ? 'high' : 'low'}`}>
                            🔋 {vehicle.battery}%
                          </span>
                        </div>
                        <div className="card-footer-info">
                          <span className={`status-pill ${vehicle.status.toLowerCase()}`}>
                            {vehicle.status.replace('_', ' ')}
                          </span>
                          <button 
                            className="action-btn-go sharing" 
                            disabled={vehicle.status !== 'AVAILABLE'}
                          >
                            {vehicle.status === 'AVAILABLE' ? 'START' : 'IN USE'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="map-canvas">
              <div className="map-overlay-stats">
                <div className="mini-stat-pill">⚡ 42.8 MW</div>
                <div className="mini-stat-pill" style={{ background: '#0f766e' }}>🟢 SYNC: ON</div>
              </div>

            <div className="map-placeholder">
              {/* Il componente della mappa prende il posto del vecchio visualizer statico */}
              <MapComponent 
                 center={mapCenter} 
                  stations={filteredStations} 
                   />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}