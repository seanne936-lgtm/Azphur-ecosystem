"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

  if (!mounted) {
    return <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.06)', borderBottom: '1px solid rgba(34, 211, 238, 0.12)', padding: '10px', minHeight: '35px' }} />;
  }

  return (
    <div className="ticker-container">
      <span>TOTAL CO2 REDUCTION: {stats.co2.toLocaleString('en-US')} TONS</span>
      <span>NETWORK CAPACITY: {stats.mw.toFixed(2)} MW</span>
      <span className="hidden-mobile">STATUS: ARCHIPELAGO GRID ACTIVE</span>
      <style jsx>{`
        .ticker-container {
          background-color: rgba(34, 211, 238, 0.06);
          border-bottom: 1px solid rgba(34, 211, 238, 0.12);
          padding: 10px;
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 9px;
          font-weight: bold;
          color: #22d3ee;
          letter-spacing: 1px;
          min-height: 35px;
          text-align: center;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .hidden-mobile { display: none; }
          .ticker-container { gap: 10px; flex-direction: column; }
        }
        @media (min-width: 768px) {
          .ticker-container { font-size: 10px; gap: 40px; flex-direction: row; }
        }
      `}</style>
    </div>
  );
};

export default function Home() {
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState("");

  useEffect(() => {
    async function initializeHome() {
      const { data: { session } } = await supabase.auth.getSession();
      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) setInventoryCount(count);
    }
    initializeHome();
  }, []);

  const isAuthorized = staffCode.trim().toUpperCase() === 'AZ-001';

  return (
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      <TopTicker />

      <nav style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '4px', margin: 0 }}>AZPHUR</h1>
          <p style={{ fontSize: '9px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '2px', marginTop: '5px', textTransform: 'uppercase' }}>
            Shaping Sustainable Possibilities
          </p>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '20px 20px 40px' }}>
        <h2 style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '5px', marginBottom: '20px' }}>PHILIPPINES 2026</h2>
        <h3 className="hero-title">
          DECENTRALIZING <br />
          <span style={{ color: '#22d3ee' }}>THE GRID.</span>
        </h3>
        <p style={{ color: '#888', maxWidth: '600px', margin: '30px auto', fontSize: '15px', lineHeight: '1.6', padding: '0 10px' }}>
          Leading the archipelago's energy revolution through Tier-1 N-Type solar technology. 
          {inventoryCount !== null && (
            <span style={{ display: 'block', marginTop: '10px', color: '#22d3ee', fontWeight: 'bold' }}>
              CURRENT LIVE ASSETS IN STOCK: {inventoryCount}
            </span>
          )}
        </p>
      </div>

      <div className="cert-bar">
        {['TIER-1 RATED', 'ISO 9001', 'DENR COMPLIANT', '25-YEAR WARRANTY'].map((text) => (
          <span key={text} style={{ fontSize: '8px', color: '#444', letterSpacing: '1px', fontWeight: 'bold' }}>{text}</span>
        ))}
      </div>

      <div className="cards-grid">
        <Link href="/login" className="card s2b">
          <div>
            <span className="card-phase">PHASE 01: SUPPLY CHAIN</span>
            <h4 className="card-title">S2B PORTAL</h4>
            <p className="card-text">Global procurement gateway. Individual customer tracking.</p>
          </div>
          <div className="card-footer">CUSTOMER LOGIN &rarr;</div>
        </Link>

        <Link href="/b2b" className="card b2b">
          <div>
            <span className="card-phase">PHASE 02: ENTERPRISE</span>
            <h4 className="card-title">B2B CONSOLE</h4>
            <p className="card-text">Industrial-scale PPA monitoring and asset management.</p>
          </div>
          <div className="card-footer">MANAGE ASSETS &rarr;</div>
        </Link>

        <Link href="/b2c" className="card b2c">
          <div>
            <span className="card-phase" style={{ color: 'rgba(0,0,0,0.5)' }}>PHASE 03: HOUSEHOLD</span>
            <h4 className="card-title">TITAN STORE</h4>
            <p className="card-text" style={{ color: 'rgba(0,0,0,0.6)' }}>Direct-to-consumer ecosystem. Kits for tropical climate.</p>
          </div>
          <div className="card-footer">SHOP ECOSYSTEM &rarr;</div>
        </Link>
      </div>

      <div style={{ maxWidth: '1300px', margin: '60px auto', padding: '0 20px 100px' }}>
        <div className="command-terminal" style={{ 
          border: isAuthorized ? '1px solid #22d3ee' : '1px solid #111', 
          boxShadow: isAuthorized ? '0 0 30px rgba(34, 211, 238, 0.15)' : 'none'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h5 style={{ fontWeight: '900', fontSize: '18px', margin: 0 }}>HQ COMMAND TERMINAL</h5>
            <p style={{ color: isAuthorized ? '#22d3ee' : '#333', fontSize: '10px', marginTop: '5px', fontWeight: isAuthorized ? 'bold' : 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isAuthorized ? "IDENTITY VERIFIED: ACCESS GRANTED" : "Restricted: Enter Staff Credentials"}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexDirection: 'column' }}>
            <input 
              type="text" 
              placeholder="STAFF ID" 
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              className="staff-input"
            />

            {isAuthorized ? (
              <Link href="/admin" className="unlock-btn">UNLOCKED: GO TO HQ &rarr;</Link>
            ) : (
              <div className="lock-btn">LOCKED</div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hero-title { font-weight: 900; font-style: italic; margin: 0; letter-spacing: -1px; line-height: 1.1; font-size: 42px; }
        .cert-bar { display: flex; justify-content: center; gap: 15px; padding: 20px; border-top: 1px solid #111; border-bottom: 1px solid #111; background-color: rgba(255,255,255,0.01); margin-bottom: 40px; flex-wrap: wrap; }
        .cards-grid { display: flex; flex-direction: column; gap: 20px; padding: 0 20px; max-width: 1400px; margin: 0 auto; }
        .card { border-radius: 30px; padding: 30px; transition: all 0.3s ease; text-decoration: none; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; min-height: 280px; }
        .s2b, .b2b { background-color: #0a0a0a; border: 1px solid #1a1a1a; color: #fff; }
        .b2c { background-color: #22d3ee; color: #000; border: none; }
        .card-phase { font-size: 9px; font-weight: bold; color: #22d3ee; }
        .card-title { font-size: 28px; font-weight: 900; margin: 10px 0; }
        .card-text { color: #555; font-size: 13px; line-height: 1.5; }
        .card-footer { margin-top: 30px; font-weight: bold; font-size: 11px; letter-spacing: 1px; }
        .command-terminal { background-color: #050505; padding: 30px; borderRadius: 30px; display: flex; flex-direction: column; align-items: center; gap: 25px; transition: all 0.5s ease; }
        .staff-input { background-color: #000; border: 1px solid #222; padding: 12px; border-radius: 12px; color: #fff; fontSize: 12px; width: 100%; max-width: 200px; outline: none; letter-spacing: 2px; text-align: center; }
        .unlock-btn { background-color: #22d3ee; color: #000; padding: 12px 25px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 11px; animation: pulse 2s infinite; text-align: center; }
        .lock-btn { background-color: #111; color: #222; padding: 12px 25px; border-radius: 12px; font-weight: 900; font-size: 11px; border: 1px solid #1a1a1a; cursor: not-allowed; }

        @media (min-width: 768px) {
          .hero-title { font-size: 72px; letter-spacing: -3px; }
          .cards-grid { flex-direction: row; padding: 0 40px; }
          .card { flex: 1; padding: 40px; }
          .command-terminal { flex-direction: row; justify-content: space-between; padding: 40px; border-radius: 40px; }
          .staff-input { width: 160px; }
          .cert-bar { gap: 60px; }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}