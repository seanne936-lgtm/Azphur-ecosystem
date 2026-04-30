"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

  if (!mounted) return <div style={{ height: '35px', backgroundColor: '#000' }} />;

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

      <nav className="main-nav">
          <h1 className="logo-text">AZPHUR</h1>
          <div className="accent-line"></div>
          <p className="tagline">Shaping Sustainable Possibilities</p>
      </nav>

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

      {/* BENTO GRID - NASA/APPLE DESIGN */}
      <div className="bento-grid">
        
        <Link href="/login" className="quadratone">
          <div className="card-content">
            <span className="phase-label">PHASE_01 // LOGISTICS</span>
            <h4 className="card-title">S2B_PORTAL</h4>
            <p className="card-desc">Global procurement gateway. Asset tracking and fulfillment infrastructure.</p>
            <div className="card-footer">ACCESS_SYSTEM →</div>
          </div>
        </Link>

        <Link href="/b2b" className="quadratone">
          <div className="card-content">
            <span className="phase-label">PHASE_02 // ENTERPRISE</span>
            <h4 className="card-title">B2B_CONSOLE</h4>
            <p className="card-desc">Industrial-scale PPA monitoring. High-yield asset management for partners.</p>
            <div className="card-footer">VIEW_NETWORK →</div>
          </div>
        </Link>

        <Link href="/b2c" className="quadratone highlight">
          <div className="card-content">
            <span className="phase-label">PHASE_03 // PRODUCTS</span>
            <h4 className="card-title">TITAN_STORE</h4>
            <p className="card-desc">Direct-to-consumer ecosystem. Advanced solar hardware for the tropics.</p>
            <div className="card-footer">EXPLORE_SERIES →</div>
          </div>
        </Link>

      </div>

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
              <Link href="/admin" className="auth-link">ENTER_HQ</Link>
            ) : (
              <div className="auth-btn">LOCKED</div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        /* KILL UNDERLINES EVERYWHERE */
        :global(a), :global(a:hover), :global(a:visited) { 
          text-decoration: none !important; 
        }
        
        .main-wrapper { background-color: #000; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; }
        
        .main-nav { padding: 80px 20px 40px; text-align: center; }
        .logo-text { font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: 12px; margin: 0; }
        .accent-line { height: 1px; width: 40px; background: #22d3ee; margin: 20px auto; }
        .tagline { font-size: 10px; color: #22d3ee; letter-spacing: 4px; text-transform: uppercase; font-weight: 800; }
        
        .hero-section { text-align: center; padding: 40px 20px 80px; }
        .year-tag { font-size: 12px; color: #111; letter-spacing: 8px; margin-bottom: 20px; font-weight: 900; }
        .hero-main { font-size: clamp(40px, 10vw, 90px); font-weight: 900; font-style: italic; line-height: 0.85; letter-spacing: -3px; margin: 0; }
        .cyan-text { color: #22d3ee; }
        .live-badge { display: inline-block; margin-top: 40px; padding: 10px 25px; background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.2); color: #22d3ee; font-size: 10px; font-weight: 900; border-radius: 100px; }

        .bento-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
          max-width: 1300px; 
          margin: 0 auto; 
          gap: 25px;
          padding: 0 25px;
        }

        /* IL QUADRATONE */
        .quadratone { 
          aspect-ratio: 1 / 1; 
          background: #050505; 
          border: 1px solid #151515;
          border-radius: 45px;
          display: flex; 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          text-decoration: none !important;
        }

        /* RIMOZIONE FORZATA DI SOTTOLINEATURE SU TUTTI I FIGLI */
        .quadratone * {
          text-decoration: none !important;
        }

        .quadratone:hover {
          border-color: #22d3ee; /* Bordo verde acqua al passaggio */
          transform: translateY(-5px);
          background: #080808;
        }

        .quadratone.highlight {
          border-color: rgba(34, 211, 238, 0.3);
        }

        .card-content { 
          padding: 50px; 
          display: flex; 
          flex-direction: column; 
          width: 100%; 
        }

        .phase-label { font-size: 10px; font-weight: 900; color: #22d3ee; letter-spacing: 2px; margin-bottom: 25px; }
        .card-title { font-size: 36px; font-weight: 900; margin: 0 0 15px 0; color: #fff; letter-spacing: -1px; }
        .card-desc { font-size: 14px; color: #444; line-height: 1.6; max-width: 280px; }
        .card-footer { margin-top: auto; font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #22d3ee; }

        /* TERMINAL AREA */
        .terminal-area { max-width: 1300px; margin: 100px auto; padding: 0 25px 100px; }
        .terminal-card { 
          background: #050505; 
          border: 1px solid #111; 
          padding: 40px 60px; 
          border-radius: 40px;
          display: flex; 
          justify-content: space-between; 
          align-items: center;
        }
        .terminal-card.unlocked { border-color: #22d3ee; }
        .terminal-text h5 { font-size: 18px; margin: 0; letter-spacing: 1px; font-weight: 900; }
        .terminal-text p { font-size: 9px; color: #222; margin-top: 10px; letter-spacing: 3px; font-weight: 900; }
        .unlocked .terminal-text p { color: #22d3ee; }
        
        .terminal-form { display: flex; gap: 15px; }
        .terminal-form input { 
          background: #000; 
          border: 1px solid #111; 
          padding: 18px; 
          border-radius: 15px; 
          color: #fff; 
          font-family: monospace; 
          outline: none; 
          width: 180px; 
        }
        .auth-link { 
          background: #22d3ee; 
          color: #000; 
          padding: 18px 30px; 
          border-radius: 15px; 
          font-size: 11px; 
          font-weight: 900; 
          display: flex;
          align-items: center;
        }
        .auth-btn { background: #111; color: #222; padding: 18px 30px; border-radius: 15px; font-size: 11px; font-weight: 900; }

        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .quadratone { aspect-ratio: 1.1 / 1; border-radius: 30px; }
          .terminal-card { flex-direction: column; text-align: center; gap: 30px; padding: 40px; }
          .terminal-form { flex-direction: column; width: 100%; }
          .terminal-form input, .auth-link, .auth-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}