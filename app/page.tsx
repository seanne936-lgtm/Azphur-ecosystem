"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface TickerStats {
  co2: number;
  mw: number;
}

interface AboutItem {
  id: number;
  tag: string;
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
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

  const formatCo2 = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className={`top-ticker-lux ${mounted ? 'visible' : ''}`}>
      <div className="ticker-inner">
        <span className="live-pill">SYSTEM_OK</span>
        <span className="stat">CO2_SAVED: <strong>{formatCo2(stats.co2)}</strong></span>
        <div className="sep"></div>
        <span className="stat">NET_POWER: <strong>{stats.mw.toFixed(2)}</strong> MW</span>
      </div>
      <style jsx>{`
        .top-ticker-lux { 
          position: fixed; top: 0; width: 100%; height: 45px; 
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); 
          z-index: 2000; border-bottom: 1px solid rgba(34, 211, 238, 0.2); 
          display: flex; align-items: center; justify-content: center; 
          opacity: 0; transition: 0.8s; box-sizing: border-box; padding: 0 15px;
        }
        .top-ticker-lux.visible { opacity: 1; }
        .ticker-inner { display: flex; align-items: center; justify-content: center; gap: 30px; font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #1d1d1f; flex-wrap: wrap; }
        .live-pill { background: #22d3ee; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 8px; flex-shrink: 0; }
        .stat { flex-shrink: 0; }
        .stat strong { color: #0891b2; }
        .sep { width: 1px; height: 10px; background: rgba(34, 211, 238, 0.3); }
        
        @media (max-width: 480px) {
          .ticker-inner { gap: 12px; }
          .sep { display: none; }
        }
      `}</style>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState<string>("");
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('loading...');
  
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'MOBILITY_MODULE'>('DASHBOARD');
  const [activeService, setActiveService] = useState<'CHARGING' | 'SHARING'>('CHARGING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vehicles, setVehicles] = useState<VehicleMock[]>([]);
  const [stations, setStations] = useState<StationMock[]>([]);

  const aboutData: AboutItem[] = [
    {
      id: 1,
      tag: "Core Value Proposition",
      title: "The place where energy transactions happen.",
      text: "AZPHUR is not just a website or a generic listing platform; it is a high-performance transactional exchange designed to accelerate the global energy transition. By bringing together project developers, industrial suppliers, and charging operators under a unified architecture, we capture, track, and convert high-value infrastructure opportunities without friction.",
      imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000",
      imageAlt: "AZPHUR Solar Panels"
    },
    {
      id: 2,
      tag: "Ecosystem Integration",
      title: "Decentralized Infrastructure Management",
      text: "Our core ledger connects distributed asset classes seamlessly. By optimizing the link between high-capacity hardware manufacturers and localized distribution grids, AZPHUR minimizes deployment delays and establishes a resilient operational environment for green energy infrastructure.",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
      imageAlt: "AZPHUR Technology Interface"
    },
    {
      id: 3,
      tag: "Data Integrity & Speed",
      title: "Engineered For Performance",
      text: "Utilizing high-performance relational mapping and secure data streams, the platform handles real-time verification of power metrics and supply contracts. Every single transaction node is monitored to guarantee flawless capital workflows and system durability.",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
      imageAlt: "AZPHUR Data Processing Network"
    }
  ];

  useEffect(() => {
    async function checkUserSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email.toLowerCase().trim());
      } else {
        setCurrentUserEmail('guest@azphur.com');
      }
    }
    checkUserSession();

    async function getCount() {
      const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
      if (count !== null) setInventoryCount(count);
    }
    getCount();

    setVehicles([
      { id: "EV-CAR-01", model: "AZPHUR Pod S", plate: "NEX-2026", battery: 84, status: "AVAILABLE", distance: "350m away" },
      { id: "EV-CAR-02", model: "AZPHUR Cargo E", plate: "LAL-9981", battery: 42, status: "AVAILABLE", distance: "1.2km away" },
      { id: "EV-CAR-03", model: "AZPHUR Pod X", plate: "GRB-4412", battery: 95, status: "IN_USE", distance: "800m away" }
    ]);

    setStations([
      { id: "ST-MNL-01", name: "Makati Central Hub", available_bays: 4, total_bays: 6, kw_power: 150, price_per_kwh: 12.50 },
      { id: "ST-QC-02", name: "Quezon City Node", available_bays: 0, total_bays: 4, kw_power: 60, price_per_kwh: 10.20 },
      { id: "ST-BGC-03", name: "BGC Supercharger", available_bays: 2, total_bays: 8, kw_power: 250, price_per_kwh: 15.00 }
    ]);

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
      clearInterval(msInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setCurrentUserEmail('guest@azphur.com');
        router.refresh();
      }
    } catch (err) {
      console.error("Errore logout:", err);
    }
  }

  const isAuthorized: boolean = staffCode.trim().toUpperCase() === 'AZ-001';

  return (
    <div className="az-premium-canvas">
      <div className="scroll-progress-indicator" style={{ width: `${scrollPercent}%` }}></div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; scroll-behavior: smooth; box-sizing: border-box; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; overflow-x: hidden; width: 100%; box-sizing: border-box; padding-top: 45px; }
        .scroll-progress-indicator { position: fixed; top: 45px; left: 0; height: 2px; background: #22d3ee; z-index: 2001; transition: width 0.1s ease-out; }

        .nav-minimal-lux { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 60px 60px 20px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; width: 100%;
        }
        .logo-group { display: flex; align-items: center; }
        .main-logo { height: 38px; cursor: pointer; transition: 0.3s; }
        .main-logo:hover { transform: scale(1.03); opacity: 0.85; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 10px #22d3ee; animation: pulse-glow 2s infinite; }
        @keyframes pulse-glow { 0%, 100% { transform: scale(1); box-shadow: 0 0 8px #22d3ee; } 50% { transform: scale(1.2); box-shadow: 0 0 15px #0891b2; } }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 15px; font-weight: 900; flex-shrink: 0; }
        
        .nav-items { display: flex; gap: 40px; align-items: center; }
        .network-signal { display: flex; align-items: center; gap: 8px; color: #0891b2; font-size: 8px; font-weight: 800; letter-spacing: 1px; flex-shrink: 0; }
        .sig-dot { width: 4px; height: 4px; background: #22d3ee; border-radius: 50%; animation: blink 1.5s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .btn-cyan-outline { background: none; border: 1px solid #22d3ee; color: #0891b2; padding: 8px 20px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; flex-shrink: 0; }
        .btn-cyan-outline:hover { background: #22d3ee; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2); }
        .btn-red-outline { background: none; border: 1px solid #ef4444; color: #ef4444; padding: 8px 20px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; flex-shrink: 0; }
        .btn-red-outline:hover { background: #ef4444; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }

        .hero-apple-style { padding: 100px 20px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; width: 100%; }
        .az-brand-label { color: #2cbcce; font-size: 50px; font-weight: 900; letter-spacing: 2px; animation: float-slow 6s ease-in-out infinite; }
        @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .shaping-text { color: #22d3ee; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px; }
        .hero-title { font-size: clamp(36px, 8vw, 85px); font-weight: 900; line-height: 0.95; letter-spacing: -0.05em; margin: 0; word-break: break-word; max-width: 100%; }
        .cyan-glitch { color: #22d3ee; text-shadow: 0 0 30px rgba(34, 211, 238, 0.2); }
        .hero-desc { font-size: clamp(14px, 2vw, 19px); color: #5c5e62; margin: 30px 0; font-weight: 500; max-width: 700px; line-height: 1.5; padding: 0 10px; box-sizing: border-box; }

        .monitor-grid-apple { display: flex; gap: 60px; margin: 40px auto; padding: 25px 50px; background: rgba(255,255,255,0.5); border-radius: 20px; border: 1px solid rgba(34, 211, 238, 0.2); backdrop-filter: blur(10px); box-sizing: border-box; max-width: 100%; }
        .monitor-item { display: flex; flex-direction: column; align-items: center; }
        .m-label { font-size: 8px; font-weight: 900; color: #86868b; letter-spacing: 1px; margin-bottom: 8px; }
        .m-value { font-size: 20px; font-weight: 900; color: #1d1d1f; font-family: monospace; }
        .m-value-green { font-size: 20px; font-weight: 900; color: #0891b2; font-family: monospace; }

        .live-stream-ticker {
          width: 100%; height: 120px; 
          background: linear-gradient(90deg, rgba(253, 251, 247, 0.75) 0%, rgba(255, 254, 252, 0.85) 50%, rgba(253, 251, 247, 0.75) 100%); 
          backdrop-filter: blur(25px);
          overflow: hidden; display: flex; align-items: center; position: relative;
          border-top: 1px solid rgba(34, 211, 238, 0.35); border-bottom: 1px solid rgba(34, 211, 238, 0.35); 
          margin-bottom: 80px; box-shadow: inset 0 0 30px rgba(34, 211, 238, 0.03), 0 10px 30px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
        }
        .live-stream-ticker::after {
          content: ''; position: absolute; top: 0; left: -50%; width: 30%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.12), transparent);
          transform: skewX(-25deg); animation: radar-sweep 6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          pointer-events: none; z-index: 1;
        }
        @keyframes radar-sweep { 0% { left: -50%; } 100% { left: 150%; } }
        .marquee-content { display: flex; align-items: center; white-space: nowrap; animation: marquee 35s linear infinite; z-index: 2; }
        .marquee-item { display: flex; align-items: center; gap: 15px; margin-right: 80px; font-family: monospace; font-size: 11px; font-weight: 800; color: #1d1d1f; letter-spacing: 1px; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .marquee-item:hover { transform: scale(1.04); cursor: pointer; }
        .marquee-item span { color: #0891b2; font-weight: 900; }
        .ticker-logo { height: 20px; filter: grayscale(1); opacity: 0.7; transition: 0.3s; animation: pulse-logo 2s infinite alternate; }
        @keyframes pulse-logo { from { opacity: 0.4; filter: grayscale(1); } to { opacity: 0.9; filter: grayscale(0); } }
        .ticker-thumb { width: 70px; height: 45px; object-fit: cover; border-radius: 8px; border: 2px solid #1d1d1f; box-shadow: 4px 4px 0px #22d3ee; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .marquee-item:hover .ticker-thumb { box-shadow: 6px 6px 0px #0891b2; transform: rotate(1deg); }
        @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }

        .about-section { max-width: 1100px; margin: 60px auto 100px; padding: 0 20px; display: flex; align-items: center; gap: 60px; text-align: left; transition: transform 0.8s ease-out, opacity 0.8s ease-out; box-sizing: border-box; width: 100%; }
        .about-section.reverse-layout { flex-direction: row-reverse; }
        .about-content { flex: 1; }
        .about-visual { flex: 1; position: relative; overflow: hidden; border-radius: 24px; width: 100%; }
        .about-image { width: 100%; border-radius: 24px; border: 4px solid #1d1d1f; box-shadow: 20px 20px 0px #22d3ee; transition: 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); box-sizing: border-box; }
        .about-visual:hover .about-image { transform: scale(1.02) rotate(0.5deg); box-shadow: 12px 12px 0px #0891b2; filter: brightness(1.05); }
        .about-tag { font-size: 9px; font-weight: 900; color: #22d3ee; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; display: block; }
        .about-title { font-size: 32px; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
        .about-text { font-size: 16px; color: #5c5e62; line-height: 1.6; font-weight: 500; }

        .modular-grid-apple { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto 100px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .quad-card-premium { background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); border: 4px solid #1d1d1f; border-radius: 24px; padding: 40px; text-align: left; transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 280px; position: relative; overflow: hidden; box-sizing: border-box; }
        .quad-card-premium::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.08), transparent); transform: translateX(-100%); transition: 0.6s; }
        .quad-card-premium:hover::before { transform: translateX(100%); }
        .quad-card-premium:hover { transform: translateY(-4px); border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }
        .phase-label { font-size: 9px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 15px; display: block; }
        .text-cyan { color: #22d3ee !important; font-size: 24px; font-weight: 800; margin: 0; }
        .quad-card-premium p { font-size: 14px; color: #5c5e62; margin: 15px 0; line-height: 1.5; font-weight: 500; }
        .action-text { font-size: 11px; font-weight: 900; color: #1d1d1f; letter-spacing: 1px; margin-top: auto; transition: 0.3s; }
        .quad-card-premium:hover .action-text { color: #0891b2; padding-left: 5px; }

        .blueprint-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto 100px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .blueprint-card { background: #ffffff; border: 2px solid #1d1d1f; border-radius: 20px; padding: 30px; text-align: left; transition: 0.3s ease; box-sizing: border-box; }
        .blueprint-card:hover { border-color: #22d3ee; transform: scale(1.01); }
        .blueprint-card h4 { font-size: 14px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: 0.5px; text-transform: uppercase; }
        .blueprint-card p { font-size: 13px; color: #5c5e62; line-height: 1.5; margin: 0; font-weight: 500; }

        .faq-section { max-width: 900px; margin: 100px auto; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .faq-header { text-align: center; margin-bottom: 50px; padding: 0 20px; box-sizing: border-box; }
        .faq-grid { display: flex; flex-direction: column; gap: 20px; }
        .faq-item { background: white; border: 2px solid #1d1d1f; border-radius: 16px; padding: 25px; transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-sizing: border-box; }
        .faq-item:hover { border-color: #22d3ee; transform: translateX(4px); }
        .faq-item h4 { margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #1d1d1f; text-transform: uppercase; letter-spacing: 0.5px; }
        .faq-item p { margin: 0; font-size: 14px; color: #5c5e62; line-height: 1.6; font-weight: 500; }

        .auth-footer-lux { margin: 80px 0 50px; display: flex; flex-direction: column; align-items: center; gap: 30px; padding: 0 20px; box-sizing: border-box; }
        .staff-box-lux { background: white; border: 4px solid #1d1d1f; padding: 25px; border-radius: 20px; width: 340px; max-width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: 0.3s; box-sizing: border-box; }
        .staff-box-lux:focus-within { border-color: #22d3ee; box-shadow: 0 15px 35px rgba(34, 211, 238, 0.15); }
        .auth-container { display: flex; gap: 12px; margin-top: 12px; }
        .auth-container input { flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; outline: none; background: #f9fafb; transition: 0.3s; min-width: 0; }
        .auth-container input:focus { border-color: #22d3ee; background: #fff; }
        .auth-container button { background: #1d1d1f; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 9px; font-weight: 900; cursor: pointer; transition: 0.3s; flex-shrink: 0; }
        .auth-container button.active { background: #22d3ee; color: #1d1d1f; animation: pulse-button 1s infinite alternate; }
        @keyframes pulse-button { from { opacity: 0.9; } to { opacity: 1; box-shadow: 0 0 12px #22d3ee; } }
        .legal-tag { font-size: 9px; font-weight: 900; color: #22d3ee; letter-spacing: 1.5px; }

        /* INTEGRATO PER EV MOBILITY INTERNAL VIEW */
        .mobility-container { background-color: #f8fafc; min-height: 80vh; max-width: 1400px; margin: 0 auto 60px; border: 4px solid #1d1d1f; border-radius: 24px; display: flex; flex-direction: column; color: #1e293b; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
        .app-header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .brand-link { text-decoration: none; display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-logo-img { height: 26px; width: auto; }
        .brand-text { font-weight: 900; font-size: 16px; letter-spacing: 2px; color: #111; display: flex; align-items: center; gap: 6px; }
        .blue-pill { background: #3e6ae1; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
        .user-profile-badge { background: #f1f5f9; padding: 8px 14px; border-radius: 100px; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; }
        .pulse-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
        .user-email { font-size: 11px; font-weight: 700; color: #64748b; font-family: monospace; }
        .mobility-layout { display: flex; flex: 1; height: 600px; overflow: hidden; }
        .control-panel { width: 400px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 24px; box-sizing: border-box; z-index: 10; overflow-y: auto; }
        .service-selector { display: grid; grid-template-columns: 1fr 1fr; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 20px; }
        .service-tab { border: none; background: transparent; padding: 12px; font-size: 11px; font-weight: 800; color: #64748b; border-radius: 10px; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px; }
        .active-charging { background: #ffffff; color: #3e6ae1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .active-sharing { background: #ffffff; color: #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .search-wrapper { position: relative; margin-bottom: 24px; }
        .search-input { width: 100%; padding: 14px 16px 14px 44px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; font-weight: 600; outline: none; box-sizing: border-box; transition: 0.2s; }
        .search-input:focus { border-color: #3e6ae1; background: #fff; }
        .search-icon { position: absolute; left: 16px; top: 14px; font-size: 16px; }
        .feed-container { flex: 1; display: flex; flex-direction: column; }
        .feed-title { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 14px; display: block; }
        .card-list { display: flex; flex-direction: column; gap: 12px; }
        .mobility-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; transition: 0.2s; }
        .mobility-card:hover { border-color: #cbd5e1; transform: translateY(-2px); }
        .card-main-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
        .node-title { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0; }
        .node-sub { font-size: 12px; color: #64748b; margin: 0; font-weight: 500; }
        .bay-badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
        .bay-badge.green { background: #d1fae5; color: #065f46; }
        .bay-badge.red { background: #fee2e2; color: #991b1b; }
        .battery-indicator { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; }
        .battery-indicator.high { color: #10b981; }
        .battery-indicator.low { color: #f59e0b; }
        .card-footer-info { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #f1f5f9; padding-top: 14px; }
        .price-tag { font-size: 14px; font-weight: 800; color: #1e293b; }
        .status-pill { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .status-pill.available { color: #10b981; }
        .status-pill.in_use { color: #64748b; }
        .action-btn-go { border: none; background: #3e6ae1; color: white; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .action-btn-go:hover { background: #111; }
        .action-btn-go.sharing { background: #10b981; }
        .action-btn-go:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
        .map-canvas { flex: 1; background: #edf2f7; position: relative; display: flex; flex-direction: column; }
        .map-overlay-stats { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 50; }
        .mini-stat-pill { background: #1e293b; color: white; padding: 6px 14px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .map-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
        .map-instruction-text { position: absolute; bottom: 30px; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; }
        .archipelago-visualizer { width: 300px; height: 400px; position: relative; opacity: 0.65; }
        .map-lines { position: absolute; width: 100%; height: 100%; top: 0; left: 0; }
        .map-node { position: absolute; display: flex; align-items: center; gap: 8px; }
        .map-node .lbl { font-size: 9px; font-weight: 800; color: #475569; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap; }
        .map-node.mnl { top: 25%; left: 35%; }
        .map-node.ceb { top: 50%; left: 65%; }
        .map-node.dvo { bottom: 25%; left: 45%; }
        .ping { width: 8px; height: 8px; background: #3e6ae1; border-radius: 50%; display: inline-block; position: relative; }
        .map-node.ceb .ping { background: #10b981; }
        .ping::after { content: ''; position: absolute; width: 24px; height: 24px; background: inherit; border-radius: 50%; top: -8px; left: -8px; opacity: 0.3; animation: radarPulse 1.5s infinite ease-out; }

        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes radarPulse { 0% { transform: scale(0.2); opacity: 0.8; } 100% { transform: scale(1.2); opacity: 0; } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 40px 20px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .nav-items { width: 100%; justify-content: space-between; gap: 15px; }
          .scroll-progress-indicator { top: 0; }
          .hero-apple-style { padding: 60px 20px 40px; }
          .monitor-grid-apple { gap: 20px; padding: 20px; flex-wrap: wrap; justify-content: center; margin: 20px auto; }
          .live-stream-ticker { height: 100px; margin-bottom: 40px; }
          .ticker-thumb { width: 55px; height: 35px; }
          .modular-grid-apple { grid-template-columns: 1fr; gap: 20px; margin-bottom: 60px; }
          .quad-card-premium { padding: 25px; min-height: auto; gap: 20px; }
          .blueprint-grid { grid-template-columns: 1fr; gap: 15px; margin-bottom: 60px; }
          .about-section { flex-direction: column !important; text-align: center; gap: 30px; margin-bottom: 60px; }
          .about-image { box-shadow: 12px 12px 0px #22d3ee; }
          .about-title { font-size: 24px; margin-bottom: 12px; }
          .faq-section { margin: 60px auto; }
          .faq-item { padding: 20px; }
          .faq-item h4 { font-size: 14px; }
          .mobility-layout { flex-direction: column-reverse; height: auto; overflow: visible; }
          .control-panel { width: 100%; height: auto; }
          .map-canvas { height: 350px; width: 100%; }
        }
      `}</style>

      <TopTicker />
      
      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img src="/logo-azphur.avif" alt="AZPHUR Logo" className="main-logo" onClick={() => setCurrentView('DASHBOARD')} />
          <div className="status-orb"></div>
          <span className="op-status-tag">CORE_v2.06_STABLE</span>
        </div>
        <div className="nav-items">
          <div className="network-signal">
            <span className="sig-dot"></span>
            <span>UPLINK_ACTIVE // {liveMs}ms</span>
          </div>
          {currentUserEmail && currentUserEmail !== 'loading...' && currentUserEmail !== 'guest@azphur.com' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0891b2', background: 'rgba(34, 211, 238, 0.1)', padding: '6px 12px', borderRadius: '100px' }}>
                {currentUserEmail}
              </span>
              <button className="btn-red-outline" onClick={handleLogout}>LOGOUT 🚪</button>
            </div>
          ) : (
            <button className="btn-cyan-outline" onClick={() => window.location.href='/login'}>ENTER_PORTAL</button>
          )}
        </div>
      </nav>

      {currentView === 'DASHBOARD' ? (
        <main>
          <section className="hero-apple-style">
            <div className="az-brand-label">AZPHUR</div>
            <div className="shaping-text">Shaping Sustainable Possibilities</div>
            
            <h1 className="hero-title">
              THE ENERGY <br /><span className="cyan-glitch">EXCHANGE</span>
            </h1>
            <p className="hero-desc">
              The transactional nervous system for Energy, EV, and Infrastructure operations.<br/>
              We enforce complete control over leads, transactions, and critical infrastructure data.
            </p>

            <div className="monitor-grid-apple">
              <div className="monitor-item">
                <span className="m-label">ACTIVE_TRANSACTIONS</span>
                <span className="m-value">1,402.00</span>
              </div>
              <div className="monitor-item">
                <span className="m-label">SUPPLIER_NODES</span>
                <span className="m-value">{inventoryCount || '0'}</span>
              </div>
              <div className="monitor-item">
                <span className="m-label">REVENUE_FLOW</span>
                <span className="m-value-green">ENFORCED</span>
              </div>
            </div>
          </section>

          <div className="live-stream-ticker">
            <div className="marquee-content">
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
                <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
                <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-SINGAPORE]</span> SUBSTATION PROCURED VIA HUB_01 // ACTIVE
                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-USA]</span> GRID INTELLIGENCE MIDDLEWARE UPLINK // ENFORCED
                <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
                <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
              <div className="marquee-item">
                <img src="/logo-azphur.avif" alt="AZPHUR Node" className="ticker-logo" />
                <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
                <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
              </div>
            </div>
          </div>

          {aboutData.map((item, index) => (
            <section 
              key={item.id} 
              className={`about-section ${index % 2 !== 0 ? 'reverse-layout' : ''}`}
            >
              <div className="about-content">
                <span className="about-tag">{item.tag}</span>
                <h2 className="about-title">{item.title}</h2>
                <p className="about-text">{item.text}</p>
              </div>
              <div className="about-visual">
                <img src={item.imageUrl} alt={item.imageAlt} className="about-image" />
              </div>
            </section>
          ))}

          <section className="modular-grid-apple">
            <div onClick={() => window.location.href='/login'} className="quad-card-premium">
              <div>
                <span className="phase-label">MODULE_01 // SUPPLY</span>
                <h3 className="text-cyan">Supply Chain Hub & Nodes Tracking</h3>
                <p>Onboard vetted industrial suppliers, manage profiles, and catalog high-capacity hardware assets across Solar Installation, EV Infrastructure, Electrical Works, and Energy Equipment categories, Tracking Every Nodes All Across The World.</p>
              </div>
              <div className="action-text">MANAGE_LISTINGS →</div>
            </div>

            <div onClick={() => window.location.href='/b2b'} className="quad-card-premium">
              <div>
                <span className="phase-label">MODULE_02 // BUILD</span>
                <h3 className="text-cyan">Matching Engine</h3>
                <p>Direct B2B lead generation and quote request system. Captures utility-scale project demands and dispatches structured opportunities directly to high-ranking verified suppliers.</p>
              </div>
              <div className="action-text">TRACK_LEADS →</div>
            </div>

            <div onClick={() => window.location.href='/b2c'} className="quad-card-premium">
              <div>
                <span className="phase-label">MODULE_03 // CHARGE</span>
                <h3 className="text-cyan">Charge Network</h3>
                <p>Real-time EV charging session creation and transaction logging layer. Built to map localized station nodes and scale recurring revenue streams through automated payment gateways.</p>
              </div>
              <div className="action-text">INITIALIZE_NODE →</div>
            </div>

            <div onClick={() => window.location.href='/partner'} className="quad-card-premium">
              <div>
                <span className="phase-label">MODULE_04 // PARTNER</span>
                <h3 className="text-cyan">Partner Portal</h3>
                <p>SaaS administration and ledger deployment node for decentralized supply chains, providing absolute transparency over contract parameters, commission tracking, and billing operations.</p>
              </div>
              <div className="action-text">NODE_LOGIN →</div>
            </div>

            <div onClick={() => setCurrentView('MOBILITY_MODULE')} className="quad-card-premium">
              <div>
                <span className="phase-label">MODULE_05 // GO</span>
                <h3 className="text-cyan" style={{ color: '#3e6ae1' }}>AZPHUR GO Mobility Hub</h3>
                <p>On-demand EV routing layer matching local transport logistics with hardware nodes. Access terminal management pipelines for high-frequency dispatch execution directly across regional grids.</p>
              </div>
              <div className="action-text" style={{ color: '#3e6ae1' }}>LAUNCH_TERMINAL →</div>
            </div>
          </section>

          <section className="faq-header">
            <span className="about-tag">Product Architecture</span>
            <h2 className="about-title">The Architectural Blueprint</h2>
          </section>
          <section className="blueprint-grid">
            <div className="blueprint-card">
              <span className="phase-label" style={{ color: '#22d3ee' }}>01 // EFFICIENCY</span>
              <h4>Direct Pipelines</h4>
              <p>Zero intermediaries. We link procurement demands directly to terminal logistics data pipelines.</p>
            </div>
            <div className="blueprint-card">
              <span className="phase-label" style={{ color: '#22d3ee' }}>02 // SECURITY</span>
              <h4>Cryptographic Trust</h4>
              <p>Every allocation signature is mapped through strict database isolation constraints and verified routing layers.</p>
            </div>
            <div className="blueprint-card">
              <span className="phase-label" style={{ color: '#22d3ee' }}>03 // SCALE</span>
              <h4>Global Nodes</h4>
              <p>Engineered to synchronize cross-border transaction assets without latency bottlenecks or operational degradation.</p>
            </div>
          </section>

          <section className="faq-section">
            <div className="faq-header">
              <span className="about-tag">Operational Framework</span>
              <h2 className="about-title">Frequently Asked Questions</h2>
            </div>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>What exactly is AZPHUR?</h4>
                <p>AZPHUR is an integrated transaction engine that coordinates and controls lead fulfillment, capital exchange, and validation data for renewable energy and electric mobility assets.</p>
              </div>
              <div className="faq-item">
                <h4>How does AZPHUR capture and enforce transaction revenue?</h4>
                <p>By routing all inquiries, project matches, and charging allocations through our proprietary core ledger, the platform tracks deal status from initial quote to closed contract, preventing bypass and securing commission processing.</p>
              </div>
              <div className="faq-item">
                <h4>Is the infrastructure scalable for enterprise use cases?</h4>
                <p>Yes. The system architecture is built on a modular design, decoupling supply lifecycle operations, automated lead dispatching pipelines, and transaction verification ledgers for maximum data integrity.</p>
              </div>
              <div className="faq-item">
                <h4>How can new suppliers join the exchange?</h4>
                <p>Suppliers must submit credentials through the Supply Chain Hub module. Once vetted by the technical administration panel, their profiles and hardware assets are unlocked for matching processes.</p>
              </div>
              <div className="faq-item">
                <h4>What safeguards guarantee network communication security?</h4>
                <p>All data pathways are secured via client-to-server TLS routing and real-time middleware validation rules in Supabase, keeping platform parameters and operations confidential and protected.</p>
              </div>
              <div className="faq-item">
                <h4>How are EV charging nodes initialized?</h4>
                <p>Station administrators can deploy specialized localized nodes directly inside the Charge Network dashboard. Once connected, automated transaction logs begin calculating active power consumption streams immediately.</p>
              </div>
            </div>
          </section>

          <footer className="auth-footer-lux">
            <div className="staff-box-lux">
              <span className="phase-label">EXECUTIVE_OVERRIDE</span>
              <div className="auth-container">
                <input 
                  type="password" 
                  placeholder="CTO_ACCESS_KEY" 
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                />
                <button 
                  onClick={() => isAuthorized && (window.location.href = '/admin')} 
                  className={isAuthorized ? 'active' : ''}
                >
                  {isAuthorized ? "GO_TO_CORE" : "LOCKED"}
                </button>
              </div>
            </div>
            <div className="legal-tag">2026. ALL RIGHTS RESERVED</div>
          </footer>
        </main>
      ) : (
        /* IL MODULO EV MOBILITY APRE INTERNAMENTE QUI INVECE DI REINDIRIZZARE */
        <div className="mobility-container fade-in">
          {currentUserEmail === 'guest@azphur.com' || currentUserEmail === 'loading...' ? (
            /* LOCK DI SICUREZZA PER UTENTI NON AUTENTICATI */
            <div className="auth-gate-container" style={{ maxWidth: '450px', margin: '100px auto', background: '#fff', border: '4px solid #1d1d1f', borderRadius: '24px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
              <h2 className="auth-gate-title" style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>Access Denied</h2>
              <p className="auth-gate-subtitle" style={{ fontSize: '12px', color: '#64748b', marginBottom: '30px' }}>Sign in to access Module 05: EV Mobility &amp; Charging Terminal</p>
              <div className="error-banner" style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '11px', fontWeight: 700, padding: '12px', borderRadius: '8px', marginBottom: '25px', fontFamily: 'monospace' }}>
                ❌ AUTH_REQUIRED: Terminal access locked for unauthorized uplink.
              </div>
              <button onClick={() => window.location.href = '/login'} className="btn-login-exec" style={{ background: '#1d1d1f', color: '#22d3ee', border: '1px solid #22d3ee', padding: '16px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', borderRadius: '12px', letterSpacing: '1px', width: '100%', marginBottom: '12px', textTransform: 'uppercase' }}>
                PROCEED TO GATEWAY LOGIN
              </button>
              <button onClick={() => setCurrentView('DASHBOARD')} style={{ background: '#f1f5f9', color: '#1e293b', border: 'none', padding: '12px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', borderRadius: '12px', width: '100%' }}>
                RETURN TO DASHBOARD
              </button>
            </div>
          ) : (
            /* ACCESSO AUTORIZZATO */
            <>
              <header className="app-header">
                <div className="header-left">
                  <div className="brand-link" onClick={() => setCurrentView('DASHBOARD')}>
                    <img src="/logo-azphur.avif" alt="Logo" className="brand-logo-img" />
                    <span className="brand-text">AZPHUR <span className="blue-pill">GO</span></span>
                  </div>
                </div>
                <div className="header-right">
                  <div className="user-profile-badge">
                    <span className="pulse-dot"></span>
                    <span className="user-email">{currentUserEmail}</span>
                  </div>
                </div>
              </header>

              <div className="mobility-layout">
                <aside className="control-panel">
                  <div className="service-selector">
                    <button 
                      onClick={() => setActiveService('CHARGING')} 
                      className={`service-tab ${activeService === 'CHARGING' ? 'active-charging' : ''}`}
                    >
                      ⚡ CHARGE HUB
                    </button>
                    <button 
                      onClick={() => setActiveService('SHARING')} 
                      className={`service-tab ${activeService === 'SHARING' ? 'active-sharing' : ''}`}
                    >
                      🚗 CAR SHARING
                    </button>
                  </div>

                  <div className="search-wrapper">
                    <input 
                      type="text" 
                      placeholder={activeService === 'CHARGING' ? "Search charging stations nearby..." : "Find an available vehicle..."} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    <span className="search-icon">📍</span>
                  </div>

                  <div className="feed-container">
                    <span className="feed-title">NEARBY RIDES &amp; NODES</span>
                    
                    {activeService === 'CHARGING' && (
                      <div className="card-list fade-in">
                        {stations
                          .filter(st => st.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(st => (
                            <div key={st.id} className="mobility-card">
                              <div className="card-main-info">
                                <div>
                                  <h4 className="node-title">{st.name}</h4>
                                  <p className="node-sub">{st.kw_power} kW Ultra-Fast Charging</p>
                                </div>
                                <span className={`bay-badge ${st.available_bays > 0 ? 'green' : 'red'}`}>
                                  {st.available_bays} / {st.total_bays} BAYS
                                </span>
                              </div>
                              <div className="card-footer-info">
                                <span className="price-tag">₱{st.price_per_kwh.toFixed(2)}/kWh</span>
                                <button className="action-btn-go" disabled={st.available_bays === 0}>
                                  {st.available_bays > 0 ? 'BOOK BAY ⚡' : 'FULL'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {activeService === 'SHARING' && (
                      <div className="card-list fade-in">
                        {vehicles
                          .filter(vh => vh.model.toLowerCase().includes(searchQuery.toLowerCase()) || vh.plate.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(vh => (
                            <div key={vh.id} className="mobility-card">
                              <div className="card-main-info">
                                <div>
                                  <h4 className="node-title">{vh.model}</h4>
                                  <p className="node-sub">Plate: {vh.plate} • {vh.distance}</p>
                                </div>
                                <span className={`battery-indicator ${vh.battery > 50 ? 'high' : 'low'}`}>
                                  🔋 {vh.battery}%
                                </span>
                              </div>
                              <div className="card-footer-info">
                                <span className={`status-pill ${vh.status.toLowerCase()}`}>{vh.status}</span>
                                <button className="action-btn-go sharing" disabled={vh.status !== 'AVAILABLE'}>
                                  {vh.status === 'AVAILABLE' ? 'UNLOCK CAR 🔑' : 'RENTED'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </aside>

                <main className="map-canvas">
                  <div className="map-overlay-stats">
                    <div className="mini-stat-pill">NETWORK: ONLINE</div>
                    <div className="mini-stat-pill">ACTIVE DRIVERS: 1,420</div>
                  </div>
                  
                  <div className="map-placeholder">
                    <div className="archipelago-visualizer">
                      <svg className="map-lines" viewBox="0 0 200 300">
                        <line x1="60" y1="60" x2="120" y2="135" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4" />
                        <line x1="120" y1="135" x2="80" y2="240" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4" />
                      </svg>
                      <div className="map-node mnl"><span className="ping"></span><span className="lbl">MANILA CORE</span></div>
                      <div className="map-node ceb"><span className="ping"></span><span className="lbl">CEBU NODE</span></div>
                      <div className="map-node dvo"><span className="ping"></span><span className="lbl">DAVAO HUB</span></div>
                    </div>
                    <p className="map-instruction-text">◀ Select an asset or asset node from the left drawer to dispatch instructions</p>
                  </div>
                </main>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                <button className="btn-cyan-outline" onClick={() => setCurrentView('DASHBOARD')}>← BACK TO CORE SYSTEM</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}