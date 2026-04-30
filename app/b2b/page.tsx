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

  const renderDashboard = () => (
    <>
      {/* KPI GRID - I QUADRATONI */}
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

      {/* ASSET SECTION - DESIGN PULITO E TECH */}
      <section className="asset-section">
        <div className="section-header">
          <h3 className="section-title">INFRASTRUCTURE ASSETS (TIER-1)</h3>
          <div className="live-tag">● LIVE SATELLITE FEED</div>
        </div>
        
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr>
                <th>ASSET ID</th>
                <th>LOCATION</th>
                <th className="hide-mobile">STATUS</th>
                <th>LIVE OUTPUT</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "AZ-MNL-001", loc: "Manila Hub", status: "SYNCED", output: "420.5 MW", color: "#00ff88" },
                { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW", color: "#22d3ee" },
                { id: "AZ-DVO-089", loc: "Davao Wind", status: "ACTIVE", output: "293.4 MW", color: "#fff" }
              ].map((row, i) => (
                <tr key={i}>
                  <td className="mono-text">{row.id}</td>
                  <td className="bold-text">{row.loc}</td>
                  <td className="hide-mobile" style={{ color: row.color, fontSize: '10px', fontWeight: '900' }}>● {row.status}</td>
                  <td className="bold-text">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  return (
    <div className="b2b-wrapper">
      {/* SIDEBAR */}
      <aside className="b2b-sidebar">
        <div className="sidebar-brand">
          <div className="logo">AZPHUR</div>
          <div className="status-badge">B2B CONSOLE V.2</div>
        </div>
        
        <nav className="nav-list">
          {['Dashboard', 'ESG Reporting', 'Contracts', 'Support'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="back-btn">← EXIT TO TERMINAL</Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="b2b-content">
        <header className="content-header">
          <div className="header-text">
            <p className="breadcrumb">OPERATIONS / {activeTab.toUpperCase()}</p>
            <h1 className="page-title">{activeTab}</h1>
          </div>
          <div className="live-load-box">
            <span className="load-label">CURRENT NETWORK LOAD</span>
            <span className="load-value">{realTimeMW} MW</span>
          </div>
        </header>

        <div className="view-container">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab !== 'Dashboard' && (
            <div className="placeholder-view">
              <h2>{activeTab} Module</h2>
              <p>Initializing secure link with satellite infrastructure...</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .b2b-wrapper { 
          background-color: #020202; 
          min-height: 100vh; 
          color: #fff; 
          display: flex; 
          flex-direction: column; 
        }

        /* --- SIDEBAR DESIGN --- */
        .b2b-sidebar { 
          background-color: #050505; 
          padding: 20px; 
          border-bottom: 1px solid #111;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .sidebar-brand { display: flex; align-items: baseline; gap: 10px; }
        .logo { font-size: 20px; font-weight: 900; color: #22d3ee; font-style: italic; letter-spacing: 2px; }
        .status-badge { font-size: 7px; color: #444; letter-spacing: 2px; font-weight: bold; }
        .nav-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; }
        .nav-item { 
          white-space: nowrap; 
          padding: 10px 15px; 
          background: transparent; 
          border: 1px solid #111; 
          color: #444; 
          font-size: 10px; 
          font-weight: 900; 
          cursor: pointer;
          border-radius: 4px;
        }
        .nav-item.active { border-color: #22d3ee; color: #22d3ee; background: rgba(34, 211, 238, 0.05); }
        .sidebar-footer { display: none; }

        /* --- CONTENT AREA --- */
        .b2b-content { flex: 1; padding: 25px; }
        .content-header { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
          margin-bottom: 40px; 
          border-bottom: 1px solid #111;
          padding-bottom: 20px;
        }
        .breadcrumb { font-size: 8px; color: #444; letter-spacing: 3px; margin: 0; }
        .page-title { font-size: 32px; font-weight: 900; margin: 0; font-style: italic; }
        .live-load-box { background: #080808; padding: 15px; border-radius: 12px; border: 1px solid #111; }
        .load-label { display: block; font-size: 8px; color: #444; font-weight: 900; margin-bottom: 5px; }
        .load-value { font-size: 20px; color: #22d3ee; font-weight: 900; }

        /* --- I QUADRATONI (GRID) --- */
        .kpi-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          gap: 20px; 
          margin-bottom: 40px; 
        }
        .kpi-card { 
          background: #080808; 
          padding: 30px; 
          border-radius: 24px; 
          border: 1px solid #111; 
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .kpi-label { font-size: 10px; color: #444; font-weight: 900; letter-spacing: 1px; margin-bottom: 10px; }
        .kpi-value { font-size: 32px; font-weight: 900; margin: 0; }
        .kpi-sub { font-size: 9px; color: #222; margin-top: 10px; font-weight: bold; }

        /* --- TABLE SECTION --- */
        .asset-section { background: #080808; padding: 30px; border-radius: 24px; border: 1px solid #111; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .section-title { font-size: 11px; color: #444; font-weight: 900; letter-spacing: 2px; margin: 0; }
        .live-tag { font-size: 8px; color: #00ff88; font-weight: 900; }
        .table-responsive { overflow-x: auto; }
        .asset-table { width: 100%; border-collapse: collapse; }
        .asset-table th { text-align: left; padding: 15px 10px; border-bottom: 1px solid #111; font-size: 10px; color: #222; }
        .asset-table td { padding: 20px 10px; border-bottom: 1px solid #0a0a0a; font-size: 14px; }
        .mono-text { font-family: monospace; color: #444; font-size: 11px; }
        .bold-text { font-weight: 900; }
        .placeholder-view { padding: 100px 20px; text-align: center; color: #222; }

        /* --- PC OPTIMIZATION (min-width: 1024px) --- */
        @media (min-width: 1024px) {
          .b2b-wrapper { flex-direction: row; }
          .b2b-sidebar { 
            width: 280px; 
            height: 100vh; 
            position: fixed; 
            border-right: 1px solid #111; 
            border-bottom: none;
            padding: 40px 30px;
          }
          .sidebar-brand { flex-direction: column; margin-bottom: 60px; }
          .logo { font-size: 32px; }
          .nav-list { flex-direction: column; gap: 15px; }
          .nav-item { font-size: 12px; padding: 15px 20px; border: none; text-align: left; transition: 0.3s; }
          .nav-item:hover { color: #fff; background: #111; }
          .sidebar-footer { display: block; margin-top: auto; }
          .back-btn { font-size: 10px; color: #222; text-decoration: none; font-weight: 900; }

          .b2b-content { margin-left: 280px; padding: 60px; }
          .content-header { flex-direction: row; justify-content: space-between; align-items: flex-end; }
          .page-title { font-size: 56px; }
          .live-load-box { width: 250px; text-align: right; }
          .kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 30px; }
          .hide-mobile { display: table-cell; }
        }

        @media (max-width: 1023px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}