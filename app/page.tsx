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
        .ticker-container {
          background-color: rgba(34, 211, 238, 0.05);
          border-bottom: 1px solid #111;
          padding: 10px 20px;
          overflow: hidden;
        }
        .ticker-content {
          display: flex;
          justify-content: center;
          gap: 15px;
          font-size: 9px;
          font-weight: 900;
          color: #22d3ee;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .separator { color: #111; }
        @media (max-width: 600px) {
          .hidden-mobile { display: none; }
          .ticker-content { font-size: 8px; gap: 8px; }
        }
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
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <TopTicker />

      {/* NAV SECTION */}
      <nav style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '8px', margin: 0 }}>AZPHUR</h1>
          <div style={{ height: '1px', width: '40px', backgroundColor: '#22d3ee', margin: '15px auto' }}></div>
          <p style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase' }}>
            Shaping Sustainable Possibilities
          </p>
      </nav>

      {/* HERO SECTION */}
      <div style={{ textAlign: 'center', padding: '40px 20px 80px' }}>
        <h2 style={{ fontSize: '12px', color: '#333', fontWeight: 'bold', letterSpacing: '8px', marginBottom: '20px' }}>PHILIPPINES 2026</h2>
        <h3 className="hero-text">
          DECENTRALIZING <br />
          <span style={{ color: '#22d3ee' }}>THE GRID.</span>
        </h3>
        {inventoryCount !== null && (
          <div className="inventory-badge">LIVE ASSETS: {inventoryCount} UNITS</div>
        )}
      </div>

      {/* I QUADRATONI - GRID RE-ENGINEERED */}
      <div className="main-grid">
        <Link href="/login" className="mega-card">
          <div className="card-inner">
            <span className="phase-tag">PHASE 01 // LOGISTICS</span>
            <h4 className="card-title">S2B PORTAL</h4>
            <p className="card-desc">Global procurement gateway. Individual asset tracking and fulfillment.</p>
            <div className="card-footer">OPERATOR ACCESS →</div>
          </div>
        </Link>

        <Link href="/b2b" className="mega-card">
          <div className="card-inner">
            <span className="phase-tag">PHASE 02 // ENTERPRISE</span>
            <h4 className="card-title">B2B CONSOLE</h4>
            <p className="card-desc">Industrial-scale PPA monitoring. Infrastructure asset management.</p>
            <div className="card-footer">NETWORK OVERVIEW →</div>
          </div>
        </Link>

        <Link href="/b2c" className="mega-card highlight">
          <div className="card-inner">
            <span className="phase-tag" style={{ color: 'rgba(0,0,0,0.4)' }}>PHASE 03 // RETAIL</span>
            <h4 className="card-title">TITAN STORE</h4>
            <p className="card-desc">Direct-to-consumer ecosystem. Advanced solar kits for the tropics.</p>
            <div className="card-footer">EXPLORE SERIES →</div>
          </div>
        </Link>
      </div>

      {/* COMMAND TERMINAL */}
      <div className="terminal-section">
        <div className={`terminal-box ${isAuthorized ? 'unlocked' : ''}`}>
          <div className="terminal-info">
            <h5 className="terminal-title">COMMAND TERMINAL</h5>
            <p className="terminal-status">{isAuthorized ? "ENCRYPTED LINK ACTIVE" : "AUTHENTICATION REQUIRED"}</p>
          </div>
          
          <div className="terminal-actions">
            <input 
              type="text" 
              placeholder="CREDENTIALS" 
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              className="terminal-input"
            />
            {isAuthorized ? (
              <Link href="/admin" className="btn-access active">ENTER HQ</Link>
            ) : (
              <div className="btn-access">LOCKED</div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-text { font-size: clamp(40px, 8vw, 85px); font-weight: 900; font-style: italic; line-height: 0.9; letter-spacing: -2px; margin: 0; }
        .inventory-badge { display: inline-block; margin-top: 30px; padding: 8px 20px; background: #111; border: 1px solid #22d3ee; color: #22d3ee; font-size: 10px; font-weight: 900; border-radius: 5px; }

        /* GRID DEI QUADRATONI */
        .main-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
          gap: 2px; /* Margine sottile tra i blocchi */
          padding: 0 20px; 
          max-width: 1400px; 
          margin: 0 auto; 
        }

        .mega-card { 
          aspect-ratio: 1 / 1; /* Forza la forma quadrata */
          background-color: #050505; 
          border: 1px solid #111;
          text-decoration: none;
          color: #fff;
          display: flex;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .mega-card.highlight { background-color: #22d3ee; color: #000; border: none; }
        .mega-card:hover { border-color: #22d3ee; z-index: 10; transform: scale(1.02); }

        .card-inner { padding: 40px; display: flex; flex-direction: column; justify-content: space-between; width: 100%; }
        .phase-tag { font-size: 10px; font-weight: 900; color: #22d3ee; letter-spacing: 2px; }
        .card-title { font-size: clamp(24px, 4vw, 36px); font-weight: 900; margin: 20px 0; letter-spacing: -1px; }
        .card-desc { font-size: 14px; line-height: 1.6; color: #666; max-width: 250px; }
        .mega-card.highlight .card-desc { color: rgba(0,0,0,0.7); }
        .card-footer { font-size: 11px; font-weight: 900; letter-spacing: 1px; margin-top: auto; }

        /* TERMINAL SECTION */
        .terminal-section { max-width: 1400px; margin: 80px auto; padding: 0 20px 100px; }
        .terminal-box { 
          background-color: #050505; 
          border: 1px solid #111; 
          border-radius: 40px; 
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.5s ease;
        }
        .terminal-box.unlocked { border-color: #22d3ee; box-shadow: 0 0 40px rgba(34, 211, 238, 0.1); }
        
        .terminal-title { font-size: 20px; font-weight: 900; margin: 0; }
        .terminal-status { font-size: 10px; color: #333; margin-top: 8px; letter-spacing: 2px; }
        .unlocked .terminal-status { color: #22d3ee; font-weight: bold; }

        .terminal-actions { display: flex; gap: 20px; align-items: center; }
        .terminal-input { background: #000; border: 1px solid #1a1a1a; padding: 15px; border-radius: 12px; color: #fff; width: 150px; text-align: center; font-size: 12px; outline: none; }
        .btn-access { padding: 15px 30px; background: #111; color: #333; border-radius: 12px; font-weight: 900; font-size: 12px; text-decoration: none; }
        .btn-access.active { background: #22d3ee; color: #000; cursor: pointer; }

        /* MOBILE FIXES */
        @media (max-width: 768px) {
          .terminal-box { flex-direction: column; text-align: center; gap: 30px; }
          .mega-card { aspect-ratio: auto; min-height: 350px; } /* Mantiene l'altezza ma non forza il quadrato se lo schermo è troppo stretto */
          .main-grid { gap: 20px; }
        }
      `}</style>
    </div>
  );
}