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
    <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.06)', borderBottom: '1px solid rgba(34, 211, 238, 0.12)', padding: '10px', display: 'flex', justifyContent: 'center', gap: '40px', fontSize: '10px', fontWeight: 'bold', color: '#22d3ee', letterSpacing: '1px', minHeight: '35px' }}>
      <span>TOTAL CO2 REDUCTION: {stats.co2.toLocaleString('en-US')} TONS</span>
      <span>NETWORK CAPACITY: {stats.mw.toFixed(2)} MW</span>
      <span>STATUS: ARCHIPELAGO GRID ACTIVE</span>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState("");

  useEffect(() => {
    async function initializeHome() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsLoggedIn(true);

      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setInventoryCount(count);
      }
    }
    initializeHome();
  }, []);

  // La logica di autorizzazione: sblocca se il codice è AZ-001
  const isAuthorized = staffCode.trim().toUpperCase() === 'AZ-001';

  const cardStyle = (type: 's2b' | 'b2b' | 'b2c'): React.CSSProperties => ({
    backgroundColor: type === 'b2c' ? '#22d3ee' : '#0a0a0a',
    border: type === 'b2c' ? 'none' : '1px solid #1a1a1a',
    borderRadius: '30px',
    padding: '40px',
    flex: '1',
    minWidth: '320px',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    color: type === 'b2c' ? '#000' : '#fff',
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer'
  });

  return (
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      <TopTicker />

      <nav style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '4px', margin: 0 }}>AZPHUR</h1>
          <p style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '2px', marginTop: '5px', textTransform: 'uppercase' }}>
            Shaping Sustainable Possibilities
          </p>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '40px 20px 60px' }}>
        <h2 style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '5px', marginBottom: '20px' }}>PHILIPPINES 2026</h2>
        <h3 style={{ fontSize: '72px', fontWeight: '900', fontStyle: 'italic', margin: '0', letterSpacing: '-3px', lineHeight: '1.1' }}>
          DECENTRALIZING <br />
          <span style={{ color: '#22d3ee' }}>THE GRID.</span>
        </h3>
        <p style={{ color: '#888', maxWidth: '650px', margin: '30px auto', fontSize: '16px', lineHeight: '1.6' }}>
          Leading the archipelago's energy revolution through Tier-1 N-Type solar technology. 
          {inventoryCount !== null && (
            <span style={{ display: 'block', marginTop: '10px', color: '#22d3ee', fontWeight: 'bold' }}>
              CURRENT LIVE ASSETS IN STOCK: {inventoryCount}
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', padding: '25px', borderTop: '1px solid #111', borderBottom: '1px solid #111', backgroundColor: 'rgba(255,255,255,0.01)', marginBottom: '60px' }}>
        {['TIER-1 RATED COMPONENTS', 'ISO 9001 CERTIFIED', 'DENR COMPLIANT', '25-YEAR WARRANTY'].map((text) => (
          <span key={text} style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', fontWeight: 'bold' }}>{text}</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', flexWrap: 'wrap', padding: '0 40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <Link href="/login" style={cardStyle('s2b')}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#22d3ee' }}>PHASE 01: SUPPLY CHAIN</span>
            <h4 style={{ fontSize: '32px', fontWeight: '900', margin: '15px 0' }}>S2B PORTAL</h4>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.5' }}>Global procurement gateway. Individual customer tracking.</p>
          </div>
          <div style={{ marginTop: '40px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>
            CUSTOMER LOGIN &rarr;
          </div>
        </Link>

        <Link href="/b2b" style={cardStyle('b2b')}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#22d3ee' }}>PHASE 02: ENTERPRISE</span>
            <h4 style={{ fontSize: '32px', fontWeight: '900', margin: '15px 0' }}>B2B CONSOLE</h4>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.5' }}>Industrial-scale PPA monitoring and asset management.</p>
          </div>
          <div style={{ marginTop: '40px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>MANAGE ASSETS &rarr;</div>
        </Link>

        <Link href="/b2c" style={cardStyle('b2c')}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(0,0,0,0.5)' }}>PHASE 03: HOUSEHOLD</span>
            <h4 style={{ fontSize: '32px', fontWeight: '900', margin: '15px 0' }}>TITAN STORE</h4>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '14px', lineHeight: '1.5' }}>Direct-to-consumer ecosystem. Kits for tropical climate.</p>
          </div>
          <div style={{ marginTop: '40px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>SHOP ECOSYSTEM &rarr;</div>
        </Link>
      </div>

      {/* STAFF COMMAND CENTER - FIXED LOGIC */}
      <div style={{ maxWidth: '1300px', margin: '100px auto', padding: '0 40px 100px' }}>
        <div style={{ 
          backgroundColor: '#050505', 
          padding: '40px', 
          borderRadius: '40px', 
          border: isAuthorized ? '1px solid #22d3ee' : '1px solid #111', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '30px',
          transition: 'all 0.5s ease',
          boxShadow: isAuthorized ? '0 0 30px rgba(34, 211, 238, 0.15)' : 'none'
        }}>
          <div>
            <h5 style={{ fontWeight: '900', fontSize: '20px', margin: 0 }}>HQ COMMAND TERMINAL</h5>
            <p style={{ color: isAuthorized ? '#22d3ee' : '#333', fontSize: '12px', marginTop: '5px', fontWeight: isAuthorized ? 'bold' : 'normal', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isAuthorized ? "IDENTITY VERIFIED: ACCESS GRANTED" : "Restricted: Enter Staff Credentials"}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="STAFF ID" 
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              style={{ 
                backgroundColor: '#000', 
                border: isAuthorized ? '1px solid #22d3ee' : '1px solid #222', 
                padding: '15px 20px', 
                borderRadius: '15px', 
                color: '#fff', 
                fontSize: '12px', 
                width: '160px',
                outline: 'none',
                letterSpacing: '2px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }} 
            />

            {isAuthorized ? (
              <Link 
                href="/admin" 
                style={{ 
                  backgroundColor: '#22d3ee', 
                  color: '#000', 
                  padding: '15px 35px', 
                  borderRadius: '15px', 
                  fontWeight: '900', 
                  textDecoration: 'none', 
                  fontSize: '12px', 
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
                  animation: 'pulse 2s infinite'
                }}
              >
                UNLOCKED: GO TO HQ &rarr;
              </Link>
            ) : (
              <div style={{ 
                backgroundColor: '#111', 
                color: '#222', 
                padding: '15px 35px', 
                borderRadius: '15px', 
                fontWeight: '900', 
                fontSize: '12px', 
                border: '1px solid #1a1a1a',
                cursor: 'not-allowed'
              }}>
                LOCKED
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}