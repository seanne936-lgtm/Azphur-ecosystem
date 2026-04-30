"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
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

      if (error) {
        console.error("Error syncing with Supabase:", error.message);
      } else if (data) {
        setShipments(data);
        const total = data.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 0)), 0);
        setTotalRevenue(total);
      }
    } catch (err) {
      console.error("Link Failure:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    if (!newItem.name) return alert("INPUT REQUIRED: Asset Name missing.");
    const { error } = await supabase.from('inventory').insert([newItem]);
    if (error) {
      alert("SYSTEM ERROR: " + error.message);
    } else {
      setNewItem({ name: '', quantity: 0, price: 0, status: 'IN STOCK' });
      syncHqData();
    }
  }

  async function deleteAsset(id) {
    if (!confirm("CONFIRM TERMINATION: Delete this asset record?")) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) alert("ERROR: " + error.message);
    else syncHqData();
  }

  if (!mounted) return null;

  return (
    <div className="admin-container">
      
      {/* TOP BAR */}
      <div className="top-bar">
         <Link href="/" className="exit-link">← EXIT TERMINAL</Link>
         <span className={`status-indicator ${loading ? 'syncing' : 'active'}`}>
           ● {loading ? 'SYNCING...' : 'LIVE'}
         </span>
      </div>

      {/* HERO HEADER */}
      <header className="admin-header">
        <p className="header-sub">Azphur Global Operations</p>
        <h1 className="header-main">COMMAND <span style={{ color: '#06b6d4' }}>HQ.</span></h1>
      </header>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">ESTIMATED ASSET VALUE</p>
          <p className="kpi-value">₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">ACTIVE ASSETS</p>
          <p className="kpi-value" style={{ color: '#06b6d4' }}>{shipments.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">CO2 OFFSET (TONS)</p>
          <p className="kpi-value">{co2Saved.toFixed(2)}</p>
        </div>
      </div>

      {/* MAIN OPERATIONS GRID */}
      <div className="operations-grid">
        
        {/* LEFT COLUMN: Map & Form */}
        <div className="ops-column">
          <div className="map-card">
            <h3 className="section-title">ARCHIPELAGO GRID STATUS</h3>
            <div className="map-container">
               <div className="map-wrapper">
                  <div className="dot-luzon"><span className="dot-label" style={{ color: '#06b6d4' }}>LUZON</span></div>
                  <div className="dot-visayas"><span className="dot-label" style={{ color: '#22c55e' }}>VISAYAS</span></div>
                  <div className="dot-mindanao"><span className="dot-label" style={{ color: '#eab308' }}>MINDANAO</span></div>
               </div>
            </div>
          </div>

          <div className="form-card">
            <h3 className="section-title">INITIALIZE ASSET INFLOW</h3>
            <form onSubmit={handleAddAsset} className="asset-form">
              <input 
                required className="full-width"
                placeholder="ASSET NAME"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <input 
                type="number" required
                placeholder="QTY"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
              />
              <input 
                type="number" required
                placeholder="PRICE (PHP)"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
              />
              <button type="submit" className="submit-btn">EXECUTE INFLOW</button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Database */}
        <div className="db-card">
            <h3 className="section-title" style={{ color: '#fff' }}>LIVE INVENTORY DATABASE</h3>
            <div className="inventory-list">
                {shipments.length > 0 ? (
                    shipments.map((s) => (
                        <div key={s.id} className="inventory-item">
                            <div className="item-header">
                                <span className="item-name">{s.name}</span>
                                <span className="item-status">{s.status}</span>
                            </div>
                            <div className="item-footer">
                              <div className="item-details">
                                <p>Qty: {s.quantity} | Value: ₱{(s.price * s.quantity).toLocaleString()}</p>
                                <p className="item-id">ID: {s.id}</p>
                              </div>
                              <button onClick={() => deleteAsset(s.id)} className="terminate-btn">TERM</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="loading-msg">{loading ? 'Initializing Satellite Link...' : 'No records.'}</p>
                )}
            </div>
        </div>
      </div>

      <footer className="admin-footer">
        AZPHUR ARCHIPELAGO OS V.2.1 // 2026
      </footer>

      <style jsx>{`
        .admin-container { background-color: #020202; color: #fff; min-height: 100vh; padding: 20px; font-family: sans-serif; }
        
        .top-bar { max-width: 1200px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
        .exit-link { color: #06b6d4; text-decoration: none; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
        .status-indicator { font-size: 9px; font-weight: bold; }
        .status-indicator.active { color: #22c55e; }
        .status-indicator.syncing { color: #eab308; }

        .admin-header { text-align: center; padding: 40px 20px; background: radial-gradient(circle, #083344 0%, #020202 100%); border-radius: 30px; margin-bottom: 30px; border: 1px solid #111; }
        .header-sub { color: #06b6d4; font-weight: bold; letter-spacing: 3px; font-size: 9px; text-transform: uppercase; margin: 0; }
        .header-main { font-size: 32px; font-weight: 900; margin: 10px 0; letter-spacing: -1px; font-style: italic; }

        .kpi-grid { display: grid; grid-template-columns: 1fr; gap: 15px; max-width: 1200px; margin: 0 auto 30px; }
        .kpi-card { background-color: #050505; border: 1px solid #111; padding: 20px; border-radius: 20px; }
        .kpi-label { color: #444; font-size: 9px; font-weight: bold; margin: 0; }
        .kpi-value { font-size: 28px; font-weight: 900; margin: 5px 0; }

        .operations-grid { display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 1200px; margin: 0 auto; }
        .ops-column { display: flex; flexDirection: column; gap: 20px; }
        
        .map-card { background: radial-gradient(circle at center, #08334422 0%, #050505 100%); border: 1px solid #111; padding: 20px; border-radius: 25px; }
        .map-container { height: 250px; display: flex; justify-content: center; align-items: center; }
        .map-wrapper { position: relative; width: 150px; height: 200px; }
        
        .section-title { font-size: 10px; font-weight: 900; margin-bottom: 20px; color: #06b6d4; letter-spacing: 2px; text-transform: uppercase; }

        .dot-luzon, .dot-visayas, .dot-mindanao { width: 8px; height: 8px; border-radius: 50%; position: absolute; animation: p 2s infinite; }
        .dot-luzon { background: #06b6d4; top: 10%; left: 30%; box-shadow: 0 0 10px #06b6d4; }
        .dot-visayas { background: #22c55e; top: 45%; left: 60%; box-shadow: 0 0 10px #22c55e; }
        .dot-mindanao { background: #eab308; bottom: 15%; left: 40%; box-shadow: 0 0 10px #eab308; }
        .dot-label { font-size: 7px; position: absolute; top: 12px; left: -10px; width: 50px; font-weight: bold; }

        .form-card { background-color: #050505; border: 1px solid #111; padding: 25px; border-radius: 25px; }
        .asset-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .asset-form input { background: #000; border: 1px solid #111; padding: 12px; border-radius: 10px; color: #fff; font-size: 11px; }
        .full-width { grid-column: span 2; }
        .submit-btn { grid-column: span 2; padding: 15px; background: #fff; color: #000; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; font-size: 11px; margin-top: 5px; }

        .db-card { background-color: #050505; border: 1px solid #111; padding: 25px; border-radius: 25px; max-height: 500px; overflow: hidden; display: flex; flex-direction: column; }
        .inventory-list { flex: 1; overflow-y: auto; padding-right: 5px; }
        .inventory-item { border-bottom: 1px solid #111; padding: 15px 0; }
        .item-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .item-name { font-size: 11px; font-weight: bold; color: #06b6d4; }
        .item-status { font-size: 9px; color: #22c55e; font-weight: bold; }
        .item-footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .item-details p { font-size: 10px; color: #fff; margin: 0; }
        .item-id { font-size: 7px; color: #333; margin-top: 3px; font-family: monospace; }
        .terminate-btn { background: none; border: 1px solid #300; color: #991b1b; font-size: 8px; padding: 4px 8px; border-radius: 4px; font-weight: bold; }

        .admin-footer { text-align: center; padding: 40px 0; opacity: 0.2; font-size: 8px; letter-spacing: 2px; }

        @keyframes p {
          0%, 100% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        @media (min-width: 768px) {
          .admin-container { padding: 40px; }
          .header-main { font-size: 50px; }
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
          .operations-grid { grid-template-columns: 1.2fr 1fr; }
          .map-container { height: 300px; }
          .map-wrapper { width: 200px; height: 300px; }
          .db-card { max-height: 700px; }
        }

        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: #222; }
      `}</style>
    </div>
  );
}