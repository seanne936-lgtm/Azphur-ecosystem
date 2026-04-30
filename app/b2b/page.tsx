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

  return (
    <div className="b2b-layout">
      
      {/* SIDEBAR TECNICA */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <span className="logo">AZPHUR</span>
            <span className="module-tag">B2B_INFRASTRUCTURE</span>
          </div>
          
          <nav className="menu">
            {['Dashboard', 'ESG Reporting', 'Contracts', 'Support'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`menu-btn ${activeTab === tab ? 'active' : ''}`}
              >
                <span className="dot"></span> {tab.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <Link href="/" className="exit-link">← TERMINATE_SESSION</Link>
        </div>
      </aside>

      {/* AREA CONTENUTO */}
      <main className="main-content">
        
        {/* HEADER ORIZZONTALE RIGIDO */}
        <header className="page-header">
          <div className="header-info">
            <p className="breadcrumb">NETWORK_NODE / {activeTab.toUpperCase()}</p>
            <h1 className="main-title">{activeTab}<span className="cursor">_</span></h1>
          </div>
          <div className="load-monitor">
            <div className="monitor-label">GRID_LIVE_LOAD</div>
            <div className="monitor-value">{realTimeMW} MW</div>
          </div>
        </header>

        {/* I QUADRATONI (KPI GRID) */}
        <section className="kpi-section">
          <div className="kpi-grid">
            <div className="kpi-card highlight">
              <span className="kpi-tag">REVENUE_SAVED</span>
              <h2 className="kpi-data">₱124.5K</h2>
              <p className="kpi-desc">MTD vs National Rates</p>
            </div>
            <div className="kpi-card">
              <span className="kpi-tag">PPA_TARIFF</span>
              <h2 className="kpi-data">₱5.80</h2>
              <p className="kpi-desc">Fixed Tier-1 / kWh</p>
            </div>
            <div className="kpi-card">
              <span className="kpi-tag">YIELD_PERF</span>
              <h2 className="kpi-data">102.4%</h2>
              <p className="kpi-desc">Active Optimization</p>
            </div>
            <div className="kpi-card">
              <span className="kpi-tag">AZP_CREDITS</span>
              <h2 className="kpi-data">1,240</h2>
              <p className="kpi-desc">Blockchain Verified</p>
            </div>
          </div>
        </section>

        {/* ASSET TABLE (STILE TERMINALE) */}
        <section className="table-section">
          <div className="table-header">
            <h3>ACTIVE_INFRASTRUCTURE_ASSETS</h3>
            <span className="satellite-tag">SATELLITE_LINK: ACTIVE</span>
          </div>
          <div className="asset-list">
            {[
              { id: "AZ-MNL-001", loc: "Manila Hub", status: "SYNCED", output: "420.5 MW" },
              { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW" },
              { id: "AZ-DVO-089", loc: "Davao Wind", status: "ACTIVE", output: "293.4 MW" }
            ].map((asset, i) => (
              <div key={i} className="asset-row">
                <div className="asset-id">{asset.id}</div>
                <div className="asset-loc">{asset.loc}</div>
                <div className="asset-status">{asset.status}</div>
                <div className="asset-output">{asset.output}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .b2b-layout {
          background-color: #000;
          color: #fff;
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
        }

        /* SIDEBAR */
        .sidebar {
          width: 300px;
          background: #050505;
          border-right: 1px solid #111;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 40px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .brand { margin-bottom: 80px; }
        .logo { display: block; font-size: 28px; font-weight: 900; letter-spacing: 4px; font-style: italic; color: #22d3ee; }
        .module-tag { font-size: 8px; color: #222; font-weight: 900; letter-spacing: 3px; }

        .menu { display: flex; flex-direction: column; gap: 20px; }
        .menu-btn { 
          background: none; border: none; color: #333; text-align: left; 
          font-size: 11px; font-weight: 900; letter-spacing: 2px; cursor: pointer;
          display: flex; align-items: center; gap: 15px; transition: 0.3s;
        }
        .menu-btn .dot { width: 4px; height: 4px; background: #111; border-radius: 50%; }
        .menu-btn.active { color: #22d3ee; }
        .menu-btn.active .dot { background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }

        .exit-link { font-size: 10px; color: #222; text-decoration: none; font-weight: 900; letter-spacing: 2px; }

        /* MAIN CONTENT */
        .main-content { flex: 1; padding: 60px; max-width: 1600px; }

        .page-header { 
          display: flex; justify-content: space-between; align-items: flex-end; 
          border-bottom: 1px solid #111; padding-bottom: 40px; margin-bottom: 60px;
        }
        .breadcrumb { font-size: 9px; color: #222; letter-spacing: 4px; margin-bottom: 10px; }
        .main-title { font-size: 64px; font-weight: 900; margin: 0; font-style: italic; letter-spacing: -2px; }
        .cursor { color: #22d3ee; animation: blink 1s infinite; }

        .load-monitor { text-align: right; background: #080808; padding: 25px; border-radius: 4px; border: 1px solid #111; }
        .monitor-label { font-size: 9px; color: #444; font-weight: 900; margin-bottom: 5px; }
        .monitor-value { font-size: 24px; font-weight: 900; color: #22d3ee; }

        /* KPI GRID (I QUADRATONI) */
        .kpi-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 2px; 
          background: #111; 
          border: 1px solid #111;
          margin-bottom: 60px;
        }
        .kpi-card { 
          background: #000; 
          padding: 40px; 
          aspect-ratio: 1/0.8; 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
        }
        .kpi-card.highlight .kpi-data { color: #22d3ee; }
        .kpi-tag { font-size: 9px; color: #444; font-weight: 900; letter-spacing: 2px; margin-bottom: 15px; }
        .kpi-data { font-size: 36px; font-weight: 900; margin: 0; }
        .kpi-desc { font-size: 10px; color: #222; margin-top: 10px; font-weight: 900; }

        /* ASSET TABLE */
        .table-section { background: #050505; border: 1px solid #111; padding: 40px; }
        .table-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .table-header h3 { font-size: 11px; color: #444; font-weight: 900; letter-spacing: 2px; }
        .satellite-tag { font-size: 9px; color: #00ff88; font-weight: 900; }

        .asset-row { 
          display: grid; 
          grid-template-columns: 1.5fr 2fr 1fr 1fr; 
          padding: 25px 0; 
          border-bottom: 1px solid #0a0a0a;
          align-items: center;
        }
        .asset-id { font-family: monospace; color: #444; font-size: 12px; }
        .asset-loc { font-weight: 900; font-size: 15px; }
        .asset-status { color: #22d3ee; font-size: 10px; font-weight: 900; }
        .asset-output { font-weight: 900; text-align: right; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* MOBILE FIXES */
        @media (max-width: 1024px) {
          .sidebar { display: none; } /* Su mobile la nascondiamo per ora o la rendiamo un menu a scomparsa */
          .main-content { padding: 30px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 30px; }
          .main-title { font-size: 40px; }
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .kpi-card { aspect-ratio: 1/1; padding: 25px; }
          .asset-row { grid-template-columns: 1fr 1fr; gap: 20px; }
          .asset-status, .asset-output { text-align: left; }
        }
      `}</style>
    </div>
  );
}