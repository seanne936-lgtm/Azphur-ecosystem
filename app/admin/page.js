"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [shipments, setShipments] = useState([]);
  const [leads, setLeads] = useState([]); 
  const [providers, setProviders] = useState([]); 
  const [stations, setStations] = useState([]); 
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netProfit, setNetProfit] = useState(0); 
  const [pipelineValue, setPipelineValue] = useState(0); // Tracciamento preventivi emessi pendenti
  const [mounted, setMounted] = useState(false);
  const [co2Saved, setCo2Saved] = useState(14200.45);
  const [loading, setLoading] = useState(true);
  
  const [newItem, setNewItem] = useState({ 
    name: '', 
    quantity: 1, 
    price: 0, 
    status: 'PROCESSING',
    provider: '',
    origin: '',
    destination: '',
    image_url: '', 
    customer_email: ''
  });

  useEffect(() => {
    setMounted(true);
    syncHqData();
    
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => syncHqData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => syncHqData()) 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => syncHqData()) 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_stations' }, () => syncHqData())
      .subscribe();

    const interval = setInterval(() => setCo2Saved(p => p + 0.01), 3000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

async function syncHqData() {
    if (!supabase) return; 
    setLoading(true);
    try {
      const { data: invData } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (invData) {
        setShipments(invData);
        const totalUnits = invData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const dynamicCo2 = 14200.45 + (totalUnits * 0.5);
        setCo2Saved(dynamicCo2);
      }

      const { data: provData } = await supabase
        .from('providers')
        .select('*')
        .order('name', { ascending: true });
      
      if (provData) setProviders(provData);

      const { data: stationData } = await supabase
        .from('charging_stations')
        .select('*');
      if (stationData) setStations(stationData);

      const { data: leadData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadData) {
        setLeads(leadData);
        
        // Calcolo Real Revenue sui contratti chiusi
        const realRevenue = leadData
          .filter(l => l.status === 'CLOSED')
          .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
        setTotalRevenue(realRevenue);

        // Calcolo Commissioni (10%)
        const commissionRate = 0.10;
        const profit = leadData
          .filter(l => l.status === 'CLOSED')
          .reduce((sum, l) => sum + (Number(l.deal_value) * commissionRate), 0);
        setNetProfit(profit);

        // Calcolo Pipeline Preventivi Emessi (Stato QUOTED)
        const quotedPipeline = leadData
          .filter(l => l.status === 'QUOTED')
          .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
        setPipelineValue(quotedPipeline);
      }

    } catch (err) {
      console.error("Link Terminal Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // LOGICA DI EMISSIONE PREVENTIVO (QUOTE) CON IVA AL 12%
  async function generateQuote(leadId, baseValue, productName) {
    if (!baseValue || baseValue <= 0) return alert("ENTER A VALID ASSET VALUE");
    
    const vatAmount = baseValue * 0.12;
    const finalDealValue = baseValue + vatAmount;
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: 'QUOTED',
          deal_value: finalDealValue,
          quote_details: {
            items: [{ name: productName, qty: 1, base: baseValue }],
            base_price: baseValue,
            vat: vatAmount,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', leadId);

      if (!error) {
        syncHqData();
      }
    } catch (err) {
      console.error("Quote Generation Error:", err);
    }
  }

  async function updateCargoStatus(id, newStatus) {
    try {
      const { error } = await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
      if (!error) syncHqData();
    } catch (err) { console.error("Cargo Status Error:", err); }
  }

  async function updateLeadStatus(id, newStatus) {
    try {
      const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', id);
      if (!error) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        syncHqData();
      }
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  }

  async function deleteLead(id) {
    if (!confirm("PERMANENTLY DELETE THIS TRANSACTION RECORD?")) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) syncHqData();
    } catch (err) {
      console.error("Deletion Error:", err);
    }
  }

  async function dispatchToProvider(leadId, providerName) {
    if(!providerName) return;
    alert(`DISPATCH_ORDER: Executing routing to ${providerName}...`);
    await updateLeadStatus(leadId, 'CONTACTED');
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('inventory').insert([newItem]);
      if (!error) {
        setNewItem({ 
          name: '', quantity: 1, price: 0, status: 'PROCESSING',
          provider: '', origin: '', destination: '', image_url: '', customer_email: ''
        });
        syncHqData();
      }
    } catch (err) {
      console.error("Inflow Error:", err);
    }
  }

  async function deleteAsset(id) {
    if (!confirm("CONFIRM TERMINATION?")) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (!error) syncHqData();
    } catch (err) {
      console.error("Termination Error:", err);
    }
  }

  const resetRevenueDisplay = () => {
    if(confirm("RESET REVENUE DISPLAY? (Note: Refreshing will restore values unless deals are deleted)")) {
      setTotalRevenue(0);
      setNetProfit(0);
      setPipelineValue(0);
    }
  };

  if (!mounted) return null;

  return (
    <div className="hq-wrapper">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@500;800&display=swap');
        body { margin: 0; background-color: #fdfbf7; color: #111; }
        .hq-wrapper { background-color: #fdfbf7; background-image: radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 600px); color: #111; min-height: 100vh; padding: 0 0 50px 0; font-family: 'Inter', sans-serif; }
        .hq-nav { height: 70px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; border-bottom: 1px solid #e2e8f0; background: #fff; position: sticky; top: 0; z-index: 100; }
        .nav-left { display: flex; align-items: center; gap: 25px; }
        .hq-logo { height: 32px; width: auto; cursor: pointer; }
        .exit-terminal { color: #64748b; text-decoration: none; font-size: 11px; font-weight: 800; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
        .sys-status { font-size: 10px; color: #059669; display: flex; align-items: center; gap: 8px; font-weight: 800; }
        .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: blink 2s infinite; }
        .hq-hero { padding: 80px 40px 40px; max-width: 1400px; margin: 0 auto; }
        .hero-tag { font-size: 10px; color: #0ea5e9; letter-spacing: 4px; margin-bottom: 10px; font-weight: 900; }
        .hero-title { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin: 0; }
        .cyan-cursor { color: #0ea5e9; animation: blink 1s infinite; }
        .kpi-layer { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto 40px; padding: 0 40px; }
        .kpi-box { background: #fff; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; position: relative; }
        .kpi-label { font-size: 10px; color: #94a3b8; letter-spacing: 2px; margin-bottom: 10px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; }
        .kpi-data { font-size: 28px; font-weight: 900; }
        .reset-rev { font-size: 8px; color: #f87171; cursor: pointer; border: 1px solid #fecaca; padding: 2px 5px; border-radius: 4px; }
        .reset-rev:hover { background: #fee2e2; }
        .hq-console { display: grid; grid-template-columns: 1fr; gap: 40px; max-width: 1400px; margin: 0 auto; padding: 0 40px; }
        .card-title { font-size: 12px; color: #94a3b8; margin-bottom: 25px; letter-spacing: 2px; font-weight: 900; display: flex; justify-content: space-between; align-items: center; }
        .sub-card { background: #fff; border: 1px solid #e2e8f0; padding: 35px; border-radius: 24px; margin-bottom: 25px; }
        .map-viz { height: 300px; background: #f8fafc; border-radius: 20px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; border: 1px solid #e2e8f0; }
        .modern-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1px; }
        .input-group input, .input-group select { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; color: #111; font-size: 13px; outline: none; border-radius: 12px; font-family: 'JetBrains Mono', monospace; transition: 0.2s; }
        .price-wrapper { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .price-symbol { padding-left: 15px; color: #0ea5e9; font-weight: 900; }
        .price-wrapper input { background: transparent; border: none; width: 100%; }
        .exec-btn { background: #111; color: #0ea5e9; border: 1px solid #0ea5e9; padding: 18px; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.3s; border-radius: 15px; letter-spacing: 2px; margin-top: 10px; }
        .feed { background: #fff; border: 1px solid #e2e8f0; padding: 35px; border-radius: 24px; }
        .feed-item { padding: 20px 0; border-bottom: 1px solid #f1f5f9; transition: 0.2s; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
        .item-name { font-weight: 900; font-size: 14px; }
        .img-thumb { width: 45px; height: 45px; border-radius: 8px; object-fit: cover; background: #f1f5f9; }
        .lead-badge { font-size: 9px; padding: 4px 8px; border-radius: 6px; font-weight: 900; text-transform: uppercase; }
        .status-new { background: #dcfce7; color: #166534; }
        .status-quoted { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .status-contacted { background: #fef9c3; color: #854d0e; }
        .status-closed { background: #f1f5f9; color: #475569; }
        .control-btn { border: 1px solid #e2e8f0; background: #fff; padding: 5px 10px; border-radius: 6px; font-size: 9px; font-weight: 800; cursor: pointer; }
        .control-btn:hover { border-color: #0ea5e9; color: #0ea5e9; }
        .term-btn { background: #fee2e2; border: none; color: #991b1b; padding: 6px 12px; font-size: 10px; font-weight: 900; cursor: pointer; border-radius: 8px; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @media (min-width: 1024px) { .hq-console { grid-template-columns: 1.2fr 0.8fr; } }
      `}</style>

      <nav className="hq-nav">
        <div className="nav-left">
          <img src="/logo-azphur.avif" alt="AZPHUR" className="hq-logo" onClick={() => window.location.href = '/'} />
          <Link href="/" className="exit-terminal">← EXIT TO CORE_TERMINAL</Link>
        </div>
        <div className="nav-right">
          <div className="sys-status">
            <span className="pulse-dot"></span>
            {loading ? "SYNCING..." : "OS_LINK_ESTABLISHED"}
          </div>
        </div>
      </nav>

      <header className="hq-hero">
        <p className="hero-tag">AZPHUR HQ // COMMAND CENTER</p>
        <h1 className="hero-title">HQ_OPERATIONS<span className="cyan-cursor">.</span></h1>
      </header>

      <div className="kpi-layer">
        <div className="kpi-box">
          <span className="kpi-label">GROSS_TRANSACTION_VALUE <span className="reset-rev" onClick={resetRevenueDisplay}>RESET_VAL</span></span>
          <span className="kpi-data">₱{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="kpi-box" style={{borderLeft: '4px solid #10b981'}}>
          <span className="kpi-label" style={{color: '#10b981'}}>AZPHUR_NET_PROFIT (10%)</span>
          <span className="kpi-data" style={{color: '#065f46'}}>₱{netProfit.toLocaleString()}</span>
        </div>
        <div className="kpi-box" style={{borderLeft: '4px solid #0ea5e9'}}>
          <span className="kpi-label" style={{color: '#0ea5e9'}}>QUOTED_PIPELINE_VALUE</span>
          <span className="kpi-data" style={{color: '#0369a1'}}>₱{pipelineValue.toLocaleString()}</span>
        </div>
        <div className="kpi-box" style={{borderColor: '#e2e8f0'}}>
          <span className="kpi-label" style={{color: '#64748b'}}>ACTIVE_PARTNERS</span>
          <span className="kpi-data">{providers?.length || 0}</span>
        </div>
      </div>

      <div className="hq-console">
        <div className="hq-panel">
          <div className="sub-card">
             <h3 className="card-title">ARCHIPELAGO_GRID_VISUALIZER</h3>
             <div className="map-viz">
                <div style={{width: '200px', height: '300px', position: 'relative'}}>
                  <svg style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.15}} viewBox="0 0 200 300">
                    <line x1="60" y1="60" x2="120" y2="135" stroke="#111" strokeWidth="1" />
                    <line x1="120" y1="135" x2="80" y2="240" stroke="#111" strokeWidth="1" />
                  </svg>
                  
                  <div style={{position:'absolute', top:'20%', left:'30%', width:'8px', height:'8px', background:'#ef4444', borderRadius:'50%', boxShadow:'0 0 15px rgba(239,68,68,0.5)'}}>
                    <span style={{position:'absolute', left:'15px', top:'-5px', fontSize:'9px', fontWeight:'800', color:'#64748b'}}>LUZON</span>
                  </div>
                  <div style={{position:'absolute', top:'45%', left:'60%', width:'8px', height:'8px', background:'#10b981', borderRadius:'50%', boxShadow:'0 0 15px rgba(16,185,129,0.5)'}}>
                    <span style={{position:'absolute', left:'15px', top:'-5px', fontSize:'9px', fontWeight:'800', color:'#64748b'}}>VISAYAS</span>
                  </div>
                  <div style={{position:'absolute', bottom:'20%', left:'40%', width:'8px', height:'8px', background:'#f59e0b', borderRadius:'50%', boxShadow:'0 0 15px rgba(245,158,11,0.5)'}}>
                    <span style={{position:'absolute', left:'15px', top:'-5px', fontSize:'9px', fontWeight:'800', color:'#64748b'}}>MINDANAO</span>
                  </div>

                  {stations.map((st) => {
                    const topPos = ((19 - (st.location_lat || 14)) / (19 - 5)) * 100;
                    const leftPos = (((st.location_long || 121) - 117) / (127 - 117)) * 100;
                    return (
                      <div
                        key={st.id}
                        style={{
                          position: 'absolute',
                          top: `${topPos}%`,
                          left: `${leftPos}%`,
                          width: '10px',
                          height: '10px',
                          background: '#0ea5e9',
                          borderRadius: '50%',
                          boxShadow: '0 0 12px rgba(14,165,233,0.6)',
                          zIndex: 10
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          left: '14px',
                          top: '-4px',
                          fontSize: '8px',
                          fontWeight: '900',
                          color: '#111',
                          whiteSpace: 'nowrap',
                          background: 'rgba(255,255,255,0.9)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {st.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
          <div className="sub-card">
            <h3 className="card-title">INITIALIZE_ASSET_INFLOW</h3>
            <form onSubmit={handleAddAsset} className="modern-form">
              <div className="form-row">
                <div className="input-group"><label>CUSTOMER_EMAIL</label><input required placeholder="client@access.com" value={newItem.customer_email} onChange={e => setNewItem({...newItem, customer_email: e.target.value})} /></div>
                <div className="input-group"><label>ASSIGN_PROVIDER</label>
                  <select required value={newItem.provider} onChange={e => setNewItem({...newItem, provider: e.target.value})}>
                    <option value="">SELECT_PARTNER</option>
                    {providers.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="input-group"><label>REAL_PRODUCT_IMAGE_URL</label><input placeholder="https://..." value={newItem.image_url} onChange={e => setNewItem({...newItem, image_url: e.target.value})} /></div>
              <div className="input-group"><label>CARGO_DESCRIPTION</label><input required placeholder="Asset Details" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
              <div className="form-row">
                <div className="input-group"><label>UNIT_QUANTITY</label><input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} /></div>
                <div className="input-group"><label>ASSET_VALUE (PHP)</label><div className="price-wrapper"><span className="price-symbol">₱</span><input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} /></div></div>
              </div>
              <button type="submit" className="exec-btn">EXECUTE_DEPLOYMENT</button>
            </form>
          </div>
        </div>

        <div className="hq-panel feed">
            <h3 className="card-title">TRANSACTION_CONTROL_CENTER <span style={{color: '#0ea5e9'}}>[{leads.length}]</span></h3>
            <div style={{marginBottom: '40px', maxHeight: '450px', overflowY: 'auto', borderBottom: '2px solid #f1f5f9'}}>
                {leads.map(lead => (
                    <div key={lead.id} className="feed-item" style={{borderLeft: lead.status === 'CLOSED' ? '4px solid #94a3b8' : lead.status === 'QUOTED' ? '4px solid #0ea5e9' : '4px solid #10b981', paddingLeft: '15px', marginBottom: '10px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', width: '100%'}}>
                            <span className="item-name">{lead.customer_name}</span>
                            <span className={`lead-badge ${lead.status === 'NEW' ? 'status-new' : lead.status === 'QUOTED' ? 'status-quoted' : lead.status === 'CONTACTED' ? 'status-contacted' : 'status-closed'}`}>{lead.status}</span>
                        </div>
                        <div style={{fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono', width: '100%'}}>
                            ASSET: {lead.product_name} | VALUE: ₱{Number(lead.deal_value).toLocaleString()}
                            <div style={{color: '#94a3b8', marginTop: '4px'}}>TX_HASH: {lead.id?.split('-')[0].toUpperCase()}_AZP</div>
                        </div>
                        
                        {/* WIDGET DI EMISSIONE PREVENTIVO (QUOTE) */}
                        {(lead.status === 'NEW' || lead.status === 'CONTACTED') && (
                          <div style={{marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box'}}>
                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#0ea5e9', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>GENERATE_OFFICIAL_QUOTE (12% VAT INCLUDED)</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="number" 
                                placeholder="Base Price (PHP)" 
                                style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, fontFamily: 'monospace' }}
                                id={`quote-input-${lead.id}`}
                              />
                              <button 
                                onClick={() => {
                                  const baseVal = parseFloat(document.getElementById(`quote-input-${lead.id}`).value);
                                  generateQuote(lead.id, baseVal, lead.product_name);
                                }}
                                className="control-btn"
                                style={{ background: '#0ea5e9', color: '#fff', borderColor: '#0ea5e9' }}
                              >
                                EMIT_QUOTE_V2
                              </button>
                            </div>
                          </div>
                        )}

                        {lead.status !== 'CLOSED' ? (
                          <div style={{marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                              <select className="control-btn" style={{padding: '5px', width: '130px'}} onChange={(e) => dispatchToProvider(lead.id, e.target.value)} value={lead.status === 'CONTACTED' ? 'CONTACTED' : ''}>
                                  <option value="">DISPATCH_TO...</option>
                                  {providers.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                              </select>
                              <button onClick={() => { if(confirm("CONFIRM TRANSACTION COMPLETION?")) updateLeadStatus(lead.id, 'CLOSED'); }} className="control-btn" style={{background: '#10b981', color: '#fff', borderColor: '#10b981'}}>CLOSE_DEAL</button>
                          </div>
                        ) : (
                          <div style={{marginTop: '10px'}}><button onClick={() => deleteLead(lead.id)} className="term-btn" style={{background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0'}}>DELETE_RECORD</button></div>
                        )}
                    </div>
                ))}
            </div>
            
            <h3 className="card-title">LIVE_INVENTORY_DATABASE</h3>
            <div className="feed-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                {shipments.map((s) => (
                    <div key={s.id} className="feed-item">
                        <div style={{display: 'flex', gap: '15px', alignItems: 'center', width: '100%'}}>
                          <img src={s.image_url || 'https://via.placeholder.com/45'} className="img-thumb" alt="asset" />
                          <div style={{flex: 1}}>
                            <div style={{display:'flex', justifyBetween:'space-between', alignItems:'center', marginBottom:'4px', width: '100%'}}>
                                <span className="item-name">{s.name}</span>
                                <select style={{fontSize: '8px', border: '1px solid #e2e8f0', borderRadius: '4px'}} value={s.status} onChange={(e) => updateCargoStatus(s.id, e.target.value)}>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                  <option value="ARRIVED">ARRIVED</option>
                                </select>
                            </div>
                            <div style={{fontSize: '10px', color: '#94a3b8', marginBottom: '8px'}}>NODE: {s.provider || 'CENTRAL_HUB'}</div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', width: '100%'}}>
                                <div className="specs" style={{fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono'}}><span>QTY: {s.quantity}</span> | <span>VAL: ₱{(s.price * s.quantity).toLocaleString()}</span></div>
                                <button onClick={() => deleteAsset(s.id)} className="term-btn">TERM</button>
                            </div>
                          </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}