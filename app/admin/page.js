"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [shipments, setShipments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [co2Saved, setCo2Saved] = useState(14200.45);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, price: 0, status: 'IN STOCK' });

  useEffect(() => {
    setMounted(true);
    syncHqData();
    const interval = setInterval(() => setCo2Saved(p => p + 0.01), 3000);
    return () => clearInterval(interval);
  }, []);

  async function syncHqData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setShipments(data);
        const total = data.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 0)), 0);
        setTotalRevenue(total);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    const { error } = await supabase.from('inventory').insert([newItem]);
    if (!error) {
      setNewItem({ name: '', quantity: 0, price: 0, status: 'IN STOCK' });
      syncHqData();
    }
  }

  async function deleteAsset(id) {
    if (!confirm("CONFIRM TERMINATION?")) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) syncHqData();
  }

  if (!mounted) return null;

  return (
    <div className="hq-wrapper">
      
      {/* HEADER NAV - RIPRISTINATO DESIGN ORIGINALE */}
      <nav className="hq-nav">
        <div className="nav-left">
          <Link href="/" className="exit-terminal">
            <span className="arrow">←</span> EXIT TO CORE_TERMINAL
          </Link>
        </div>
        <div className="nav-right">
          <div className="sys-status">
            <span className="pulse-dot"></span>
            {loading ? "SYNCING_SATELLITE..." : "OS_LINK_ESTABLISHED"}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hq-hero">
        <div className="hero-content">
          <p className="hero-tag">AZPHUR ECOSYSTEM // COMMAND CENTER</p>
          <h1 className="hero-title">HQ_OPERATIONS<span className="cyan-cursor">.</span></h1>
        </div>
      </header>

      {/* KPI LAYER */}
      <div className="kpi-layer">
        <div className="kpi-box">
          <span className="kpi-label">TOTAL_ASSET_VALUE</span>
          <span className="kpi-data">₱{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="kpi-box cyan">
          <span className="kpi-label">ACTIVE_UNITS</span>
          <span className="kpi-data">{shipments.length}</span>
        </div>
        <div className="kpi-box">
          <span className="kpi-label">CO2_OFFSET_TONS</span>
          <span className="kpi-data">{co2Saved.toFixed(2)}</span>
        </div>
      </div>

      {/* MAIN CONSOLE */}
      <div className="hq-console">
        
        {/* LEFT PANEL: COMMANDS & GRID */}
        <div className="hq-panel">
          <div className="sub-card">
             <h3 className="card-title">ARCHIPELAGO_GRID_VISUALIZER</h3>
             <div className="map-viz">
                <div className="viz-placeholder">
                  <div className="node n1"><span className="label">LUZON</span></div>
                  <div className="node n2"><span className="label">VISAYAS</span></div>
                  <div className="node n3"><span className="label">MINDANAO</span></div>
                  <svg className="svg-lines" viewBox="0 0 200 300">
                    <line x1="60" y1="50" x2="120" y2="135" stroke="#111" strokeWidth="0.5" />
                    <line x1="120" y1="135" x2="80" y2="255" stroke="#111" strokeWidth="0.5" />
                  </svg>
                </div>
             </div>
          </div>

          <div className="sub-card">
            <h3 className="card-title">INITIALIZE_ASSET_INFLOW</h3>
            <form onSubmit={handleAddAsset} className="hq-form">
              <input 
                required className="wide" placeholder="ASSET_IDENTIFIER"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <div className="input-row">
                <input type="number" placeholder="QTY" onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}/>
                <input type="number" placeholder="UNIT_VALUE" onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}/>
              </div>
              <button type="submit" className="exec-btn">EXECUTE_INFLOW</button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE FEED */}
        <div className="hq-panel feed">
            <h3 className="card-title">LIVE_INVENTORY_DATABASE</h3>
            <div className="feed-container">
                {shipments.map((s) => (
                    <div key={s.id} className="feed-item">
                        <div className="item-main">
                            <span className="item-name">{s.name}</span>
                            <span className="item-status">ONLINE</span>
                        </div>
                        <div className="item-sub">
                            <div className="specs">
                              <span>VOL: {s.quantity}</span> | <span>VAL: ₱{(s.price * s.quantity).toLocaleString()}</span>
                              <div className="id-tag">REF_{s.id.slice(0,8)}</div>
                            </div>
                            <button onClick={() => deleteAsset(s.id)} className="term-btn">TERM</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <style jsx>{`
        .hq-wrapper { background-color: #000; color: #fff; min-height: 100vh; padding: 0 0 50px 0; font-family: 'JetBrains Mono', monospace, sans-serif; }
        
        /* HEADER NAV */
        .hq-nav { height: 70px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; border-bottom: 1px solid #111; background: #000; position: sticky; top: 0; z-index: 100; }
        .exit-terminal { color: #555; text-decoration: none; font-size: 10px; font-weight: bold; letter-spacing: 2px; transition: 0.3s; }
        .exit-terminal:hover { color: #06b6d4; }
        .sys-status { font-size: 10px; color: #22c55e; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
        .pulse-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; animation: blink 2s infinite; }

        /* HERO */
        .hq-hero { padding: 80px 40px 40px; max-width: 1400px; margin: 0 auto; }
        .hero-tag { font-size: 10px; color: #06b6d4; letter-spacing: 5px; margin-bottom: 10px; }
        .hero-title { font-size: 48px; font-weight: 900; letter-spacing: -2px; font-style: italic; margin: 0; }
        .cyan-cursor { color: #06b6d4; animation: blink 1s infinite; }

        /* KPI LAYER */
        .kpi-layer { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2px; background: #111; max-width: 1400px; margin: 0 auto 40px; border: 1px solid #111; }
        .kpi-box { background: #000; padding: 30px; display: flex; flex-direction: column; }
        .kpi-label { font-size: 9px; color: #444; letter-spacing: 2px; margin-bottom: 10px; }
        .kpi-data { font-size: 24px; font-weight: 900; }
        .kpi-box.cyan .kpi-data { color: #06b6d4; }

        /* CONSOLE GRID */
        .hq-console { display: grid; grid-template-columns: 1fr; gap: 40px; max-width: 1400px; margin: 0 auto; padding: 0 40px; }
        .card-title { font-size: 11px; color: #333; margin-bottom: 25px; letter-spacing: 2px; }

        /* PANELS */
        .sub-card { background: #050505; border: 1px solid #111; padding: 30px; border-radius: 4px; margin-bottom: 20px; }
        .map-viz { height: 300px; background: radial-gradient(circle, #08334411 0%, #050505 100%); display: flex; justify-content: center; align-items: center; position: relative; }
        .viz-placeholder { width: 200px; height: 300px; position: relative; }
        .node { position: absolute; width: 6px; height: 6px; border-radius: 50%; }
        .n1 { top: 20%; left: 30%; background: #06b6d4; box-shadow: 0 0 15px #06b6d4; }
        .n2 { top: 45%; left: 60%; background: #22c55e; box-shadow: 0 0 15px #22c55e; }
        .n3 { bottom: 20%; left: 40%; background: #eab308; box-shadow: 0 0 15px #eab308; }
        .node .label { position: absolute; left: 15px; top: -5px; font-size: 8px; font-weight: 900; color: #444; }
        .svg-lines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.2; }

        /* FORM */
        .hq-form { display: flex; flex-direction: column; gap: 10px; }
        .hq-form input { background: #000; border: 1px solid #111; padding: 15px; color: #fff; font-size: 11px; outline: none; }
        .hq-form input:focus { border-color: #06b6d4; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .exec-btn { background: #06b6d4; color: #000; border: none; padding: 18px; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .exec-btn:hover { background: #fff; }

        /* DATABASE FEED */
        .feed { background: #050505; border: 1px solid #111; padding: 30px; border-radius: 4px; }
        .feed-container { max-height: 800px; overflow-y: auto; padding-right: 15px; }
        .feed-item { padding: 20px 0; border-bottom: 1px solid #111; transition: 0.3s; }
        .feed-item:hover { background: #080808; }
        .item-main { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .item-name { font-weight: 900; font-size: 12px; color: #fff; }
        .item-status { font-size: 8px; color: #22c55e; font-weight: 900; border: 1px solid #22c55e44; padding: 2px 6px; }
        .item-sub { display: flex; justify-content: space-between; align-items: flex-end; }
        .specs { font-size: 10px; color: #444; }
        .id-tag { font-size: 8px; color: #111; margin-top: 5px; }
        .term-btn { background: none; border: 1px solid #300; color: #400; padding: 4px 10px; font-size: 9px; font-weight: 900; cursor: pointer; }
        .term-btn:hover { border-color: #f00; color: #f00; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        @media (min-width: 1024px) {
          .hq-console { grid-template-columns: 1fr 1fr; }
          .hero-title { font-size: 64px; }
          .kpi-layer { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
          .hq-nav { padding: 0 20px; }
          .hq-hero { padding: 40px 20px; }
          .hero-title { font-size: 32px; }
          .hq-console { padding: 0 20px; }
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #111; }
      `}</style>
    </div>
  );
}