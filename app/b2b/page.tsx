"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Interfacce Rigorose
interface Lead {
  id: string;
  interest: string;
  budget: string | number;
  created_at: string;
  matching_status?: string;
}

interface AssetRow {
  id: string;
  loc: string;
  status: string;
  output: string;
  color: string;
}

interface Station {
  id: string;
  name: string;
  location_lat: number;
  location_long: number;
}

interface Transaction {
  id: string;
  amount_gross: number;
  status: string;
  created_at: string;
}

export default function AzphurB2B() {
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [realTimeMW, setRealTimeMW] = useState<number>(842.15);
  const [mounted, setMounted] = useState<boolean>(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchLeads();
    fetchStations();
    fetchRealTransactions();

    const channel = supabase
      .channel('realtime_revenue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        setTotalRevenue(prev => prev + (Number(payload.new.amount_gross) || 0));
        fetchRealTransactions(); 
      })
      .subscribe();

    const timer = setInterval(() => {
      setRealTimeMW(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
    }, 2000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRealTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        setRealTransactions(data as Transaction[]);
        const total = data.reduce((acc, curr) => acc + (Number(curr.amount_gross) || 0), 0);
        setTotalRevenue(total);
      }
    } catch (err) { console.log("Fin sync offline"); }
  }

  async function fetchLeads() {
    try {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5);
      if (!error && data) setLeads(data as Lead[]);
    } catch (err) { console.log("Lead sync offline"); }
  }

  async function fetchStations() {
    try {
      const { data, error } = await supabase.from('charging_stations').select('*');
      if (!error && data) setStations(data as Station[]);
    } catch (err) { console.log("Map sync offline"); }
  }

  if (!mounted) return null;

  const renderDashboard = () => (
    <div className="fade-in">
      {/* SEZIONE KPI */}
      <div className="asset-section kpi-section-override" style={{ marginBottom: '40px', borderLeft: '8px solid #0ea5e9' }}>
        <h3 className="section-subtitle">STRATEGIC_CONTROL_CENTER</h3>
        <div className="control-center-grid">
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
            <p className="kpi-label">PHASE_02_CHARGE_TX</p>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#111', margin: 0 }}>PAYMENT_GATEWAY_LIVE</p>
            <p style={{ fontSize: '10px', color: '#0ea5e9' }}>REAL_MONEY_FLOW_ACTIVE</p>
          </div>
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
            <p className="kpi-label">BUILD_MATCHING_ENGINE</p>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#111', margin: 0 }}>SUPPLIER_RANKING_V1</p>
            <p style={{ fontSize: '10px', color: '#0ea5e9' }}>AUTO_DISPATCH_ENABLED</p>
          </div>
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
            <p className="kpi-label">ESG_MONETIZATION</p>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#111', margin: 0 }}>CARBON_CREDIT_POOL</p>
            <p style={{ fontSize: '10px', color: '#0ea5e9' }}>BLOCKCHAIN_VERIFIED</p>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: "CO2 AVOIDED (ESG)", value: "42.8 Tons", color: "#10b981", sub: "Verified Carbon Offset" },
          { label: "PPA TARIFF RATE", value: "₱5.80 /kWh", color: "#0ea5e9", sub: "Fixed Tier-1 Agreement" },
          { label: "MATCHING EFFICIENCY", value: "92%", color: "#111", sub: "Lead to Supplier Speed" },
          { label: "REAL TX REVENUE", value: `₱${totalRevenue.toLocaleString()}`, color: "#0ea5e9", sub: "Live Phase 2 Earnings" }
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <h3 className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</h3>
            <p className="kpi-sub">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MAPPA */}
      <section className="asset-section" style={{ marginBottom: '40px' }}>
        <h3 className="section-subtitle">ARCHIPELAGO_GRID_VISUALIZER (DATA_CONTROL)</h3>
        <div className="map-viz-container" style={{ height: '400px', background: '#f8fafc', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '250px', height: '350px', position: 'relative' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 200 300">
              <line x1="60" y1="60" x2="120" y2="135" stroke="#111" strokeWidth="1" />
              <line x1="120" y1="135" x2="80" y2="240" stroke="#111" strokeWidth="1" />
            </svg>
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}><span style={{ position: 'absolute', left: '15px', top: '-5px', fontSize: '9px', fontWeight: '800', color: '#64748b' }}>LUZON</span></div>
            <div style={{ position: 'absolute', top: '45%', left: '60%', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}><span style={{ position: 'absolute', left: '15px', top: '-5px', fontSize: '9px', fontWeight: '800', color: '#64748b' }}>VISAYAS</span></div>
            <div style={{ position: 'absolute', bottom: '20%', left: '40%', width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}><span style={{ position: 'absolute', left: '15px', top: '-5px', fontSize: '9px', fontWeight: '800', color: '#64748b' }}>MINDANAO</span></div>
            {stations.map((st) => (
              <div key={st.id} style={{ position: 'absolute', top: `${((19 - (st.location_lat || 14)) / (19 - 5)) * 100}%`, left: `${(((st.location_long || 121) - 117) / (127 - 117)) * 100}%`, width: '10px', height: '10px', background: '#0ea5e9', borderRadius: '50%' }}>
                 <span style={{ position: 'absolute', left: '14px', top: '-4px', fontSize: '8px', fontWeight: '900', color: '#111', whiteSpace: 'nowrap', background: 'white', padding: '2px 5px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{st.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABELLA TRANSAZIONI */}
      <section className="asset-section" style={{ marginBottom: '30px' }}>
        <h3 className="section-subtitle">LIVE_PHASE_2_TRANSACTIONS</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>TX_ID</th><th>STATUS</th><th>REVENUE</th><th>TIMESTAMP</th></tr>
            </thead>
            <tbody>
              {realTransactions.map((tx) => (
                <tr key={tx.id} className="fade-in">
                  <td className="mono-id">{tx.id ? tx.id.split('-')[0].toUpperCase() : 'TX_LIVE'}</td>
                  <td style={{ color: '#22c55e' }} className="status-text">● {tx.status ? tx.status.toUpperCase() : 'COMPLETED'}</td>
                  <td className="heavy-text" style={{ color: '#111' }}>₱{Number(tx.amount_gross || 0).toLocaleString()}</td>
                  <td style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(tx.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TABELLA LEADS */}
      <section className="asset-section" style={{ marginBottom: '30px' }}>
        <h3 className="section-subtitle">BUILD_MODULE: LIVE_MATCHING_FEED</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>LEAD_ID</th><th>INTEREST</th><th>STATUS</th><th>EST_VALUE</th></tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={i}>
                  <td className="mono-id">{lead.id ? lead.id.split('-')[0].toUpperCase() : 'LEAD'}</td>
                  <td className="bold-text" style={{ color: '#111' }}>{lead.interest || 'SOLAR_INSTALL'}</td>
                  <td style={{ color: '#0ea5e9' }} className="status-text">● {i === 0 ? 'SUPPLIER_ASSIGNED' : 'ANALYZING_RANKING'}</td>
                  <td className="heavy-text" style={{ color: '#111' }}>₱{Number(lead.budget || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TABELLA ASSETS */}
      <section className="asset-section">
        <h3 className="section-subtitle">ENERGY_INFRASTRUCTURE_ASSETS</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>ASSET ID</th><th>LOCATION</th><th>ESG STATUS</th><th>LIVE OUTPUT</th></tr>
            </thead>
            <tbody>
              {[
                { id: "AZ-MNL-001", loc: "Manila Hub", status: "OFFSET_ACTIVE", output: "420.5 MW", color: "#22c55e" },
                { id: "AZ-CEB-042", loc: "Cebu Solar", status: "OPTIMIZING", output: "128.2 MW", color: "#0ea5e9" }
              ].map((row, i) => (
                <tr key={i}>
                  <td className="mono-id">{row.id}</td>
                  <td className="bold-text" style={{ color: '#111' }}>{row.loc}</td>
                  <td style={{ color: row.color }} className="status-text">● {row.status}</td>
                  <td className="heavy-text" style={{ color: '#111' }}>{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return (
    <div className="b2b-container">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap');
        body { margin: 0; background-color: #fdfbf7; color: #111; }
        .b2b-container { background-color: #fdfbf7; min-height: 100vh; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
        
        /* SIDEBAR DEFAULT DESKTOP */
        .sidebar { width: 280px; height: 100vh; border-right: 1px solid #e5e7eb; padding: 40px 24px; position: fixed; background-color: #fff; display: flex; flex-direction: column; z-index: 100; top: 0; left: 0; }
        .logo-wrapper { display: flex; align-items: center; gap: 12px; margin-bottom: 50px; text-decoration: none; }
        .sidebar-brand-img { height: 30px; width: auto; }
        .sidebar-logo-text { color: #0ea5e9; font-weight: 900; font-size: 22px; letter-spacing: 4px; }
        .nav-group { display: flex; flex-direction: column; gap: 8px; }
        .nav-btn { text-align: left; padding: 14px 18px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: 1px; transition: 0.2s; white-space: nowrap; }
        .nav-btn.active { background: #e0f2fe; color: #0ea5e9; }
        
        /* MAIN STAGE DEFAULT DESKTOP */
        .main-stage { margin-left: 280px; width: calc(100% - 280px); padding: 60px; box-sizing: border-box; }
        .main-header { margin-bottom: 50px; border-bottom: 1px solid #e2e8f0; padding-bottom: 30px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .main-title { font-size: 42px; font-weight: 900; margin: 0; color: #0ea5e9; letter-spacing: -1.5px; }
        
        .control-center-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .kpi-card { background-color: #fff; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; }
        .kpi-label { font-size: 10px; color: #94a3b8; font-weight: 800; letter-spacing: 1px; }
        .kpi-value { font-size: 26px; font-weight: 900; margin: 0; }
        .kpi-sub { margin: 5px 0 0 0; }
        .asset-section { background-color: #fff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 35px; }
        .section-subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 25px; font-weight: 900; letter-spacing: 2px; }
        
        /* TABELLE RESPONSIVE */
        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .asset-table { width: 100%; border-collapse: collapse; min-width: 500px; }
        .asset-table th { text-align: left; color: #cbd5e1; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; font-size: 10px; font-weight: 900; }
        .asset-table td { padding: 20px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #111; }
        .mono-id { font-family: monospace; font-size: 12px; color: #94a3b8; }
        .bold-text { font-weight: 700; color: #111; }
        .heavy-text { font-weight: 900; color: #111; }
        .status-text { font-weight: 700; font-size: 13px; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* RESPONSIVE LAYOUT PER TELEFONI (SOTTO I 768px) */
        @media (max-width: 768px) {
          .b2b-container { flex-direction: column; }
          
          /* Trasformiamo la sidebar in una barra superiore orizzontale */
          .sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid #e5e7eb; padding: 20px; box-sizing: border-box; }
          .logo-wrapper { margin-bottom: 20px; justify-content: center; }
          .nav-group { flex-direction: row !important; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; gap: 4px !important; }
          .nav-btn { padding: 10px 14px; font-size: 10px; }
          
          /* Spazio principale ridimensionato per mobile */
          .main-stage { margin-left: 0; width: 100%; padding: 24px; }
          .main-header { flex-direction: column; align-items: flex-start; gap: 20px; margin-bottom: 30px; }
          .main-title { font-size: 32px; }
          
          /* Griglie in colonna singola su mobile */
          .control-center-grid { grid-template-columns: 1fr; gap: 12px; }
          .kpi-grid { grid-template-columns: 1fr; gap: 16px; }
          .asset-section { padding: 20px; border-radius: 16px; }
        }
      `}</style>

      <aside className="sidebar">
        <Link href="/" className="logo-wrapper">
          <img src="/logo-azphur.avif" alt="Logo" className="sidebar-brand-img" />
          <span className="sidebar-logo-text">AZPHUR</span>
        </Link>
        <nav className="nav-group">
          {['Dashboard', 'ESG Reporting', 'Contracts', 'Support'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-btn ${activeTab === tab ? 'active' : ''}`}>
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-stage">
        <header className="main-header">
          <h1 className="main-title">{activeTab.toUpperCase()}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Link href="/" style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: '100px', fontSize: '10px', fontWeight: '900', textDecoration: 'none' }}>← HOME</Link>
            <div>
              <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '900', margin: 0 }}>LIVE_NETWORK_LOAD</p>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#111' }}>{realTimeMW} <span style={{fontSize: '14px', color: '#0ea5e9'}}>MW</span></div>
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && renderDashboard()}
      </main>
    </div>
  );
}