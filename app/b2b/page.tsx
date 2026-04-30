"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AzphurB2B() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [realTimeMW, setRealTimeMW] = useState(842.15);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setRealTimeMW(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  // --- RENDERING SECTIONS (STILE ORIGINALE PRESERVATO) ---

  const renderDashboard = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: "ESTIMATED SAVINGS (MTD)", value: "₱124,500", color: "#00ff88", sub: "vs National Grid Rates" },
          { label: "PPA TARIFF RATE", value: "₱5.80 /kWh", color: "#22d3ee", sub: "Fixed Tier-1 Agreement" },
          { label: "SYSTEM PERFORMANCE", value: "102.4%", color: "#fff", sub: "Yield Optimization Active" },
          { label: "CARBON CREDITS", value: "1,240 AZP", color: "#22d3ee", sub: "Blockchain Verified" }
        ].map((kpi, i) => (
          <div key={i} style={{ backgroundColor: '#0a0a0a', padding: '25px', borderRadius: '20px', border: '1px solid #151515' }}>
            <p style={{ fontSize: '10px', color: '#444', marginBottom: '10px', fontWeight: 'bold' }}>{kpi.label}</p>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: kpi.color, margin: 0 }}>{kpi.value}</h3>
            <p style={{ fontSize: '9px', color: '#333', marginTop: '8px' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <section style={{ backgroundColor: '#0a0a0a', borderRadius: '24px', border: '1px solid #151515', padding: '30px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '25px', fontWeight: '900' }}>INFRASTRUCTURE ASSETS (TIER-1)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#333', borderBottom: '1px solid #151515', fontSize: '12px' }}>
              <th style={{ paddingBottom: '15px' }}>ASSET ID</th>
              <th style={{ paddingBottom: '15px' }}>LOCATION</th>
              <th style={{ paddingBottom: '15px' }}>STATUS</th>
              <th style={{ paddingBottom: '15px' }}>LIVE OUTPUT</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: "AZ-MNL-001", loc: "Manila Hub", status: "SYNCED", output: "420.5 MW", color: "#00ff88" },
              { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW", color: "#22d3ee" }
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '20px 0', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{row.id}</td>
                <td style={{ padding: '20px 0', fontWeight: 'bold' }}>{row.loc}</td>
                <td style={{ color: row.color, fontSize: '11px', fontWeight: '900' }}>● {row.status}</td>
                <td style={{ fontWeight: '900' }}>{row.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );

  const renderESGReport = () => (
    <section style={{ backgroundColor: '#0a0a0a', borderRadius: '24px', border: '1px solid #151515', padding: '30px' }}>
      <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '25px', fontWeight: '900' }}>SUSTAINABILITY METRICS</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '25px', border: '1px solid #151515', borderRadius: '20px', backgroundColor: '#050505' }}>
          <p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold' }}>CO2 REDUCTION (TOTAL)</p>
          <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#22d3ee', marginTop: '10px' }}>4,120.80 TONS</h3>
        </div>
        <div style={{ padding: '25px', border: '1px solid #151515', borderRadius: '20px', backgroundColor: '#050505' }}>
          <p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold' }}>RENEWABLE COMPLIANCE</p>
          <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#00ff88', marginTop: '10px' }}>94.2%</h3>
        </div>
      </div>
    </section>
  );

  const renderContracts = () => (
    <section style={{ backgroundColor: '#0a0a0a', borderRadius: '24px', border: '1px solid #151515', padding: '30px' }}>
      <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '25px', fontWeight: '900' }}>ACTIVE AGREEMENTS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {["PPA_PHASE_01_MANILA.PDF", "SLA_OPERATIONS_CEBU.PDF", "GRID_INTERCONNECT_2026.PDF"].map((doc, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #151515', borderRadius: '15px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>{doc}</span>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #22d3ee', color: '#22d3ee', padding: '8px 16px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>DOWNLOAD</button>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSupport = () => (
    <section style={{ backgroundColor: '#0a0a0a', borderRadius: '24px', border: '1px solid #151515', padding: '30px', maxWidth: '500px' }}>
      <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '25px', fontWeight: '900' }}>24/7 INFRASTRUCTURE SUPPORT</h3>
      <div style={{ border: '1px solid #151515', borderRadius: '20px', padding: '25px' }}>
        <p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', marginBottom: '5px' }}>ASSIGNED ACCOUNT MANAGER</p>
        <p style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 20px 0' }}>Enzo Valenzuela</p>
        <button style={{ width: '100%', backgroundColor: '#22d3ee', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}>OPEN SECURE CHANNEL</button>
      </div>
    </section>
  );

  return (
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#e5e7eb', fontFamily: 'Inter, sans-serif', display: 'flex' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', height: '100vh', borderRight: '1px solid #111', padding: '40px 20px', position: 'fixed', backgroundColor: '#050505' }}>
        <div style={{ color: '#22d3ee', fontWeight: '900', fontSize: '22px', fontStyle: 'italic', marginBottom: '40px' }}>AZPHUR</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Dashboard', 'ESG Reporting', 'Contracts', 'Support'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                textAlign: 'left', padding: '14px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#22d3ee10' : 'transparent',
                color: activeTab === tab ? '#22d3ee' : '#444',
                fontSize: '14px', fontWeight: 'bold',
                transition: '0.2s'
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: '40px' }}>
          <Link href="/" style={{ color: '#222', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>← BACK TO CORE</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: '280px', width: '100%', padding: '40px 60px' }}>
        <header style={{ marginBottom: '60px', borderBottom: '1px solid #111', paddingBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', fontStyle: 'italic', margin: 0 }}>{activeTab.toUpperCase()}</h1>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>LIVE NETWORK LOAD</p>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#22d3ee' }}>{realTimeMW} MW</div>
          </div>
        </header>

        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'ESG Reporting' && renderESGReport()}
        {activeTab === 'Contracts' && renderContracts()}
        {activeTab === 'Support' && renderSupport()}
      </main>
    </div>
  );
}