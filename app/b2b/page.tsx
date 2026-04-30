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

  // --- FUNZIONE DINAMICA: CAMBIA IL CONTENUTO IN BASE AL TAB ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ESG Reporting':
        return (
          <section className="dynamic-section">
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">CARBON_OFFSET_TOTAL</span>
                <div className="stat-value">1,420.50 TONS</div>
                <div className="mini-graph"><div className="fill" style={{width: '75%'}}></div></div>
              </div>
              <div className="stat-card">
                <span className="stat-label">RENEWABLE_ENERGY_RATIO</span>
                <div className="stat-value">94.2%</div>
                <div className="mini-graph"><div className="fill" style={{width: '94%'}}></div></div>
              </div>
            </div>
            <div className="terminal-log">
              <h3>SYSTEM_AUDIT_LOG_2026</h3>
              <div className="log-entry"><span>[2026-04-12]</span> ISO-14064 VERIFICATION COMPLETED</div>
              <div className="log-entry"><span>[2026-03-28]</span> SOLAR_YIELD_OPTIMIZATION_ACTIVE</div>
              <div className="log-entry"><span>[2026-02-15]</span> BLOCKCHAIN_CREDIT_MINTING_SYNCED</div>
            </div>
          </section>
        );
      case 'Contracts':
        return (
          <section className="dynamic-section">
            <div className="contract-preview">
              <div className="preview-header">
                <h3>MASTER_PPA_AGREEMENT_v4.2</h3>
                <span className="status-badge">SIGNED // ACTIVE</span>
              </div>
              <div className="preview-body">
                <div className="data-line"><span>EFFECTIVE_DATE:</span> JAN 01, 2026</div>
                <div className="data-line"><span>TARIFF_STRUCTURE:</span> TIER-1 INDUSTRIAL</div>
                <div className="data-line"><span>ENERGY_GUARANTEE:</span> 99.8% UPTIME</div>
                <div className="data-line"><span>CONTRACT_HASH:</span> SHA256: 8f92b...41e12</div>
              </div>
              <button className="download-btn">DOWNLOAD_DOCUMENT.PDF</button>
            </div>
          </section>
        );
      case 'Support':
        return (
          <section className="dynamic-section">
            <div className="support-terminal">
              <div className="terminal-header">ENCRYPTED_SUPPORT_CHANNEL</div>
              <div className="terminal-screen">
                <p>{">"} INITIALIZING SECURE LINK...</p>
                <p>{">"} CONNECTION ESTABLISHED VIA SATELLITE NODE 04</p>
                <p>{">"} OPERATOR STATUS: ONLINE</p>
                <div className="cursor-line">
                  <span className="cyan-txt">{">"}</span>
                  <input type="text" placeholder="TYPE_MESSAGE_OR_COMMAND..." className="term-input" />
                </div>
              </div>
            </div>
          </section>
        );
      default: // Dashboard (Default)
        return (
          <>
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
          </>
        );
    }
  };

  return (
    <div className="b2b-layout">
      
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

      <main className="main-content">
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

        {/* QUI VIENE CARICATO IL CONTENUTO CHE CAMBIA */}
        {renderTabContent()}

      </main>

      <style jsx>{`
        .b2b-layout { background-color: #000; color: #fff; min-height: 100vh; display: flex; font-family: 'Inter', sans-serif; }
        .sidebar { width: 300px; background: #050505; border-right: 1px solid #111; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 40px; position: sticky; top: 0; height: 100vh; }
        .logo { display: block; font-size: 28px; font-weight: 900; letter-spacing: 4px; font-style: italic; color: #22d3ee; }
        .module-tag { font-size: 8px; color: #222; font-weight: 900; letter-spacing: 3px; }
        .menu { display: flex; flex-direction: column; gap: 20px; }
        .menu-btn { background: none; border: none; color: #333; text-align: left; font-size: 11px; font-weight: 900; letter-spacing: 2px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: 0.3s; }
        .menu-btn.active { color: #22d3ee; }
        .menu-btn .dot { width: 4px; height: 4px; background: #111; border-radius: 50%; }
        .menu-btn.active .dot { background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }
        .exit-link { font-size: 10px; color: #222; text-decoration: none; font-weight: 900; letter-spacing: 2px; }

        .main-content { flex: 1; padding: 60px; max-width: 1600px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #111; padding-bottom: 40px; margin-bottom: 60px; }
        .main-title { font-size: 64px; font-weight: 900; margin: 0; font-style: italic; letter-spacing: -2px; }
        .cursor { color: #22d3ee; animation: blink 1s infinite; }
        .load-monitor { text-align: right; background: #080808; padding: 25px; border-radius: 4px; border: 1px solid #111; }
        .monitor-value { font-size: 24px; font-weight: 900; color: #22d3ee; }

        /* KPI & TABLES */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; background: #111; border: 1px solid #111; margin-bottom: 60px; }
        .kpi-card { background: #000; padding: 40px; aspect-ratio: 1/0.8; display: flex; flex-direction: column; justify-content: center; }
        .kpi-card.highlight .kpi-data { color: #22d3ee; }
        .kpi-tag { font-size: 9px; color: #444; font-weight: 900; letter-spacing: 2px; margin-bottom: 15px; }
        .kpi-data { font-size: 36px; font-weight: 900; margin: 0; }
        .table-section { background: #050505; border: 1px solid #111; padding: 40px; }
        .asset-row { display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr; padding: 25px 0; border-bottom: 1px solid #0a0a0a; align-items: center; }
        .asset-status { color: #22d3ee; font-size: 10px; font-weight: 900; }

        /* DINAMIC CONTENT STYLES */
        .dynamic-section { animation: fadeIn 0.3s ease; }
        .stats-row { display: flex; gap: 20px; margin-bottom: 40px; }
        .stat-card { flex: 1; background: #050505; border: 1px solid #111; padding: 30px; }
        .stat-value { font-size: 28px; font-weight: 900; color: #22d3ee; margin: 15px 0; }
        .mini-graph { height: 4px; background: #111; width: 100%; }
        .mini-graph .fill { height: 100%; background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }
        .terminal-log { background: #050505; border: 1px solid #111; padding: 30px; font-family: monospace; }
        .log-entry { font-size: 12px; margin-bottom: 8px; }
        .log-entry span { color: #22d3ee; margin-right: 15px; }

        .contract-preview { background: #050505; border: 1px solid #111; padding: 40px; }
        .status-badge { color: #00ff88; border: 1px solid #00ff88; padding: 4px 10px; font-size: 10px; }
        .download-btn { background: #22d3ee; color: #000; border: none; padding: 15px 30px; font-weight: 900; margin-top: 30px; cursor: pointer; }

        .support-terminal { background: #080808; border: 1px solid #111; font-family: monospace; }
        .terminal-header { background: #111; padding: 10px 20px; font-size: 10px; color: #444; }
        .terminal-screen { padding: 30px; color: #22d3ee; }
        .term-input { background: none; border: none; color: #fff; outline: none; width: 80%; font-family: monospace; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        @media (max-width: 1024px) { .sidebar { display: none; } .main-content { padding: 30px; } .kpi-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}