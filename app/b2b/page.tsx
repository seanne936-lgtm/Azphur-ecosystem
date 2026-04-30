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

  // --- RENDERING SECTIONS ---

  const renderDashboard = () => (
    <>
      <div className="kpi-grid">
        {[
          { label: "ESTIMATED SAVINGS (MTD)", value: "₱124,500", color: "#00ff88", sub: "vs National Grid Rates" },
          { label: "PPA TARIFF RATE", value: "₱5.80 /kWh", color: "#22d3ee", sub: "Fixed Tier-1 Agreement" },
          { label: "SYSTEM PERFORMANCE", value: "102.4%", color: "#fff", sub: "Yield Optimization Active" },
          { label: "CARBON CREDITS", value: "1,240 AZP", color: "#22d3ee", sub: "Blockchain Verified" }
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <h3 className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</h3>
            <p className="kpi-sub">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <section className="asset-section">
        <h3 className="section-title">INFRASTRUCTURE ASSETS (TIER-1)</h3>
        
        {/* DESKTOP TABLE */}
        <div className="desktop-only">
          <table className="asset-table">
            <thead>
              <tr>
                <th>ASSET ID</th>
                <th>LOCATION</th>
                <th>STATUS</th>
                <th>LIVE OUTPUT</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "AZ-MNL-001", loc: "Manila Hub", status: "SYNCED", output: "420.5 MW", color: "#00ff88" },
                { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW", color: "#22d3ee" }
              ].map((row, i) => (
                <tr key={i}>
                  <td className="mono-text">{row.id}</td>
                  <td style={{ fontWeight: 'bold' }}>{row.loc}</td>
                  <td style={{ color: row.color, fontSize: '11px', fontWeight: '900' }}>● {row.status}</td>
                  <td style={{ fontWeight: '900' }}>{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="mobile-only">
          {[
            { id: "AZ-MNL-001", loc: "Manila Hub", status: "SYNCED", output: "420.5 MW", color: "#00ff88" },
            { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW", color: "#22d3ee" }
          ].map((row, i) => (
            <div key={i} className="asset-card">
              <div className="asset-card-header">
                <span className="mono-text">{row.id}</span>
                <span style={{ color: row.color, fontSize: '10px', fontWeight: '900' }}>● {row.status}</span>
              </div>
              <div className="asset-card-body">
                <div style={{ fontWeight: 'bold' }}>{row.loc}</div>
                <div style={{ fontWeight: '900', color: '#fff' }}>{row.output}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderESGReport = () => (
    <div className="content-card">
      <h2 style={{ color: '#22d3ee', fontWeight: '900' }}>Sustainability Audit</h2>
      <div className="esg-grid">
        <div className="esg-item">
          <p className="esg-label">NET-ZERO PROGRESS</p>
          <div className="esg-value">65.4%</div>
        </div>
        <div className="esg-item">
          <p className="esg-label">CLEAN ENERGY RATIO</p>
          <div className="esg-value" style={{ color: '#22d3ee' }}>92%</div>
        </div>
      </div>
    </div>
  );

  const renderContracts = () => (
    <div className="content-card">
      <h3 style={{ color: '#22d3ee', fontWeight: '900', marginBottom: '25px' }}>ACTIVE AGREEMENTS</h3>
      <div className="contracts-list">
        {["PPA - Phase 1 (Manila)", "SLA - O&M Services", "Carbon Rights Agreement"].map((doc, i) => (
          <div key={i} className="contract-item">
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{doc}</span>
            <button className="view-btn">PDF</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="content-card">
      <h3 style={{ fontWeight: '900', marginBottom: '20px' }}>TECH SUPPORT</h3>
      <div className="support-box">
        <p className="esg-label">DEDICATED MANAGER</p>
        <h4 style={{ margin: '5px 0' }}>Enzo Valenzuela</h4>
        <button className="chat-btn">INITIATE SECURE CHAT</button>
      </div>
    </div>
  );

  return (
    <div className="b2b-container">
      {/* SIDEBAR / TOP NAV */}
      <aside className="b2b-sidebar">
        <div className="sidebar-header">
          <div className="logo">AZPHUR</div>
          <nav className="nav-menu">
            {['Dashboard', 'ESG Reporting', 'Contracts', 'Support'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              >
                {tab === 'ESG Reporting' && typeof window !== 'undefined' && window.innerWidth < 768 ? 'ESG' : tab.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <Link href="/" className="back-link">&larr; BACK</Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="b2b-main">
        <header className="main-header">
          <h1 className="page-title">{activeTab.toUpperCase()}</h1>
          <div className="live-load">
            <p className="load-label">LIVE LOAD</p>
            <div className="load-value">{realTimeMW} MW</div>
          </div>
        </header>

        <div className="tab-content">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'ESG Reporting' && renderESGReport()}
          {activeTab === 'Contracts' && renderContracts()}
          {activeTab === 'Support' && renderSupport()}
        </div>
      </main>

      <style jsx>{`
        .b2b-container { background-color: #020202; min-height: 100vh; color: #e5e7eb; display: flex; flex-direction: column; }
        
        /* Sidebar/Nav */
        .b2b-sidebar { background-color: #050505; border-bottom: 1px solid #111; padding: 15px; width: 100%; position: sticky; top: 0; z-index: 50; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #22d3ee; font-weight: 900; font-size: 18px; font-style: italic; }
        .nav-menu { display: flex; gap: 5px; }
        .nav-btn { padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer; background: transparent; color: #444; font-size: 10px; font-weight: bold; }
        .nav-btn.active { background: #22d3ee10; color: #22d3ee; }
        .sidebar-footer { display: none; }

        /* Main Content */
        .b2b-main { width: 100%; padding: 20px; }
        .main-header { margin-bottom: 40px; border-bottom: 1px solid #111; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .page-title { font-size: 24px; font-weight: 900; font-style: italic; margin: 0; }
        .load-label { font-size: 8px; color: #444; margin: 0; }
        .load-value { font-size: 20px; font-weight: 900; color: #22d3ee; }

        /* Dashboard Grid */
        .kpi-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 30px; }
        .kpi-card { background-color: #0a0a0a; padding: 20px; border-radius: 20px; border: 1px solid #151515; }
        .kpi-label { font-size: 9px; color: #444; margin-bottom: 5px; font-weight: bold; }
        .kpi-value { font-size: 24px; font-weight: 800; margin: 0; }
        .kpi-sub { font-size: 8px; color: #333; margin-top: 5px; }

        /* Assets */
        .asset-section { background-color: #0a0a0a; border-radius: 24px; border: 1px solid #151515; padding: 20px; }
        .section-title { font-size: 11px; color: #666; marginBottom: 20px; fontWeight: 900; }
        .desktop-only { display: none; }
        .mobile-only { display: flex; flex-direction: column; gap: 15px; }
        .asset-card { background: #050505; padding: 15px; border-radius: 15px; border: 1px solid #111; }
        .asset-card-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .asset-card-body { display: flex; justify-content: space-between; align-items: center; }
        .mono-text { font-family: monospace; fontSize: 11px; color: #444; }

        /* Other Tabs */
        .content-card { background-color: #0a0a0a; padding: 25px; border-radius: 24px; border: 1px solid #151515; }
        .esg-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 20px; }
        .esg-item { padding: 20px; background-color: #070707; border-radius: 15px; border: 1px solid #111; }
        .esg-value { font-size: 36px; font-weight: 900; }
        .contracts-list { display: flex; flex-direction: column; gap: 10px; }
        .contract-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background-color: #050505; border-radius: 12px; border: 1px solid #111; }
        .view-btn { background: #111; color: #fff; border: 1px solid #222; padding: 5px 10px; border-radius: 6px; font-size: 9px; }
        .support-box { padding: 20px; background-color: #050505; border-radius: 15px; border: 1px solid #111; }
        .chat-btn { margin-top: 15px; width: 100%; padding: 12px; background: #22d3ee; color: #000; border: none; borderRadius: 10px; font-weight: bold; cursor: pointer; font-size: 12px; }

        @media (min-width: 768px) {
          .b2b-container { flex-direction: row; }
          .b2b-sidebar { width: 280px; height: 100vh; position: fixed; border-right: 1px solid #111; border-bottom: none; padding: 40px 20px; }
          .sidebar-header { flex-direction: column; align-items: flex-start; }
          .logo { font-size: 22px; margin-bottom: 40px; }
          .nav-menu { flex-direction: column; width: 100%; gap: 8px; }
          .nav-btn { font-size: 14px; padding: 14px 18px; width: 100%; text-align: left; }
          .sidebar-footer { display: block; position: absolute; bottom: 40px; }
          .back-link { color: #222; fontSize: 11px; textDecoration: none; fontWeight: bold; }
          
          .b2b-main { marginLeft: 280px; padding: 40px 60px; }
          .page-title { font-size: 42px; }
          .load-value { font-size: 32px; }
          
          .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .desktop-only { display: block; }
          .mobile-only { display: none; }
          .asset-table { width: 100%; border-collapse: collapse; }
          .asset-table th { textAlign: left; color: #333; borderBottom: 1px solid #151515; fontSize: 12px; padding-bottom: 15px; }
          .asset-table td { padding: 20px 0; border-bottom: 1px solid #111; }
          
          .esg-grid { grid-template-columns: 1fr 1fr; }
          .kpi-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        }
      `}</style>
    </div>
  );
}