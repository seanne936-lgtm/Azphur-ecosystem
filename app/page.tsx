"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Mantengo il TopTicker invariato come richiesto
const TopTicker = () => {
  const [stats, setStats] = useState({ co2: 14200, mw: 842.15 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setStats(prev => ({
        co2: prev.co2 + Math.floor(Math.random() * 5),
        mw: +(prev.mw + (Math.random() * 0.1)).toFixed(2)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <div style={{ height: '35px', backgroundColor: '#020202' }} />;

  return (
    <div className="ticker-container">
      <div className="ticker-content">
        <span>TOTAL CO2 REDUCTION: {stats.co2.toLocaleString()} TONS</span>
        <span className="separator">|</span>
        <span>NETWORK CAPACITY: {stats.mw.toFixed(2)} MW</span>
        <span className="separator hidden-mobile">|</span>
        <span className="hidden-mobile">STATUS: ARCHIPELAGO GRID ACTIVE</span>
      </div>
      <style jsx>{`
        .ticker-container { background: #000; border-bottom: 1px solid rgba(34, 211, 238, 0.1); padding: 10px 20px; }
        .ticker-content { display: flex; justify-content: center; gap: 20px; font-size: 9px; font-weight: 900; color: #22d3ee; letter-spacing: 1px; }
        .separator { color: #111; }
        @media (max-width: 600px) { .hidden-mobile { display: none; } }
      `}</style>
    </div>
  );
};

export default function Home() {
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState("");

  useEffect(() => {
    async function getCount() {
      const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
      if (count !== null) setInventoryCount(count);
    }
    getCount();
  }, []);

  const isAuthorized = staffCode.trim().toUpperCase() === 'AZ-001';

  return (
    <div className="main-wrapper">
      <TopTicker />

      {/* HEADER LOGO */}
      <nav className="main-nav">
          <h1 className="logo-text">AZPHUR</h1>
          <div className="accent-line"></div>
          <p className="tagline">Shaping Sustainable Possibilities</p>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section">
        <h2 className="year-tag">PHILIPPINES 2026</h2>
        <h3 className="hero-main">
          DECENTRALIZING <br />
          <span className="cyan-text">THE GRID.</span>
        </h3>
        {inventoryCount !== null && (
          <div className="live-badge">NETWORK_NODES: {inventoryCount} UNITS</div>
        )}
      </section>

      {/* GRID DEI QUADRATONI - NASA/APPLE STYLE */}
      <div className="bento-grid">
        <Link href="/login" className="card card-modern">
          <div className="card-content">
            <div className="card-top">
              <span className="label">PHASE_01 // LOGISTICS</span>
              <div className="status-dot"></div>
            </div>
            <h4 className="title">S2B_PORTAL</h4>
            <p className="desc">Global procurement gateway. Asset tracking and fulfillment infrastructure.</p>
            <div className="footer">ACCESS SYSTEM →</div>
          </div>
        </Link>

        <Link href="/b2b" className="card card-modern">
          <div className="card-content">
            <div className="card-top">
              <span className="label">PHASE_02 // ENTERPRISE</span>
              <div className="status-dot"></div>
            </div>
            <h4 className="title">B2B_CONSOLE</h4>
            <p className="desc">Industrial-scale PPA monitoring. High-yield asset management for partners.</p>
            <div className="footer">VIEW NETWORK →</div>
          </div>
        </Link>

        <Link href="/b2c" className="card card-modern card-highlight">
          <div className="card-content">
            <div className="card-top">
              <span className="label dark">PHASE_03 // RETAIL</span>
              <div className="status-dot dark"></div>
            </div>
            <h4 className="title">TITAN_STORE</h4>
            <p className="desc">Direct-to-consumer ecosystem. Advanced solar hardware for the tropics.</p>
            <div className="footer">EXPLORE SERIES →</div>
          </div>
        </Link>
      </div>

      {/* COMMAND TERMINAL */}
      <section className="terminal-area">
        <div className={`terminal-card ${isAuthorized ? 'unlocked' : ''}`}>
          <div className="terminal-text">
            <h5>COMMAND_TERMINAL</h5>
            <p>{isAuthorized ? "LINK_ENCRYPTED_AND_READY" : "SECURE_AUTH_REQUIRED"}</p>
          </div>
          <div className="terminal-form">
            <input 
              type="password" 
              placeholder="CREDENTIALS" 
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
            />
            {isAuthorized ? (
              <Link href="/admin" className="auth-btn active">ENTER_HQ</Link>
            ) : (
              <div className="auth-btn">LOCKED</div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .main-wrapper { background-color: #000; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        /* NAV & HERO */
        .main-nav { padding: 80px 20px 40px; text-align: center; }
        .logo-text { font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: 12px; margin: 0; }
        .accent-line { height: 1px; width: 40px; background: #22d3ee; margin: 20px auto; }
        .tagline { font-size: 10px; color: #22d3ee; letter-spacing: 4px; text-transform: uppercase; font-weight: 800; }
        
        .hero-section { text-align: center; padding: 40px 20px 80px; }
        .year-tag { font-size: 12px; color: #333; letter-spacing: 8px; margin-bottom: 20px; font-weight: 900; }
        .hero-main { font-size: clamp(40px, 10vw, 90px); font-weight: 900; font-style: italic; line-height: 0.85; letter-spacing: -3px; margin: 0; }
        .cyan-text { color: #22d3ee; text-shadow: 0 0 30px rgba(34, 211, 238, 0.3); }
        .live-badge { display: inline-block; margin-top: 40px; padding: 10px 25px; background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.2); color: #22d3ee; font-size: 10px; font-weight: 900; border-radius: 100px; letter-spacing: 1px; }

        /* IL GRID DEI BLOCCHETTONI - NASA STYLE */
        .bento-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
          max-width: 1300px; 
          margin: 0 auto; 
          gap: 25px;
          padding: 0 25px;
        }

        .card-modern { 
          aspect-ratio: 1 / 1; 
          background: rgba(15, 15, 15, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px; /* Angoli smussati Apple-style */
          text-decoration: none !important;
          color: #fff; 
          display: flex; 
          transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          backdrop-filter: blur(10px);
        }

        .card-modern:hover { 
          transform: translateY(-10px);
          background: rgba(20, 20, 20, 0.8);
          border-color: rgba(34, 211, 238, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.1);
        }

        .card-highlight { 
          background: #22d3ee; 
          color: #000; 
          border: none; 
          box-shadow: 0 10px 30px rgba(34, 211, 238, 0.3);
        }

        .card-highlight:hover {
          background: #fff;
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 50px rgba(255, 255, 255, 0.2);
        }

        .card-content { padding: 50px; display: flex; flex-direction: column; width: 100%; height: 100%; box-sizing: border-box; }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        
        .label { font-size: 11px; font-weight: 900; color: #22d3ee; letter-spacing: 2px; }
        .label.dark { color: rgba(0, 0, 0, 0.4); }
        
        .status-dot { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 10px #22d3ee; }
        .status-dot.dark { background: rgba(0,0,0,0.2); box-shadow: none; }

        .title { font-size: 36px; font-weight: 900; margin: 30px 0 15px; letter-spacing: -1px; }
        .desc { font-size: 15px; color: #888; line-height: 1.6; max-width: 280px; }
        .card-highlight .desc { color: rgba(0, 0, 0, 0.6); }
        
        .footer { margin-top: auto; font-size: 12px; font-weight: 900; letter-spacing: 2px; opacity: 0.6; }

        /* TERMINAL AREA */
        .terminal-area { max-width: 1300px; margin: 100px auto; padding: 0 25px 100px; }
        .terminal-card { 
          background: rgba(10, 10, 10, 0.8); 
          border: 1px solid rgba(255, 255, 255, 0.05); 
          padding: 40px 60px; 
          border-radius: 40px;
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          backdrop-filter: blur(20px);
        }
        .terminal-card.unlocked { border-color: rgba(34, 211, 238, 0.5); box-shadow: 0 0 50px rgba(34, 211, 238, 0.1); }
        
        .terminal-text h5 { font-size: 18px; margin: 0; letter-spacing: 2px; font-weight: 900; }
        .terminal-text p { font-size: 10px; color: #444; margin-top: 10px; letter-spacing: 3px; font-weight: 900; text-transform: uppercase; }
        .unlocked .terminal-text p { color: #22d3ee; }
        
        .terminal-form { display: flex; gap: 20px; }
        .terminal-form input { 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          padding: 18px 25px; 
          border-radius: 20px; 
          color: #fff; 
          font-family: monospace; 
          outline: none; 
          width: 200px;
          transition: all 0.3s;
        }
        .terminal-form input:focus { border-color: #22d3ee; background: rgba(34, 211, 238, 0.05); }

        .auth-btn { 
          padding: 18px 40px; 
          background: rgba(255, 255, 255, 0.05); 
          color: #444; 
          border-radius: 20px; 
          font-weight: 900; 
          font-size: 12px; 
          text-decoration: none; 
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .auth-btn.active { 
          background: #22d3ee; 
          color: #000; 
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(34, 211, 238, 0.2);
        }
        .auth-btn.active:hover { transform: scale(1.05); background: #fff; }

        /* MOBILE */
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .card-modern { aspect-ratio: 1.1 / 1; border-radius: 30px; }
          .terminal-card { flex-direction: column; text-align: center; gap: 30px; padding: 40px; border-radius: 30px; }
          .card-content { padding: 35px; }
          .terminal-form { flex-direction: column; width: 100%; }
          .terminal-form input, .auth-btn { width: 100%; box-sizing: border-box; }
        }
      `}</style>
    </div>
  );
}