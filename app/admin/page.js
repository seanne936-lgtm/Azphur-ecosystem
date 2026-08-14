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
  const [pipelineValue, setPipelineValue] = useState(0); 
  const [mounted, setMounted] = useState(false);
  const [co2Saved, setCo2Saved] = useState(14200.45);
  const [loading, setLoading] = useState(true);
  
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newAllowedEmail, setNewAllowedEmail] = useState('');

  // STATO PER IL ROLLER/SLIDER E VALORI PREVENTIVO (PER LEAD ID)


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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allowed_partners' }, () => syncHqData()) 
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

      const { data: partnerData } = await supabase
        .from('allowed_partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (partnerData) setAllowedEmails(partnerData);

      const { data: leadData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadData) {
        setLeads(leadData);
        
        const realRevenue = leadData
          .filter(l => l.status === 'CLOSED')
          .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
        setTotalRevenue(realRevenue);

        const commissionRate = 0.10;
        const profit = leadData
          .filter(l => l.status === 'CLOSED')
          .reduce((sum, l) => sum + (Number(l.deal_value) * commissionRate), 0);
        setNetProfit(profit);

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

  async function handleAllowPartner(e) {
    e.preventDefault();
    if (!newAllowedEmail) return;
    try {
      const { error } = await supabase
        .from('allowed_partners')
        .insert([{ email: newAllowedEmail.toLowerCase().trim() }]);
      
      if (!error) {
        setNewAllowedEmail('');
        syncHqData();
      } else {
        alert("PROVISIONING_ERROR: " + error.message);
      }
    } catch (err) {
      console.error("Whitelist Error:", err);
    }
  }


  async function toggleBalanceUnlock(leadId, currentUnlockedState) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ balance_unlocked: !currentUnlockedState })
        .eq('id', leadId);

      if (!error) {
        syncHqData();
      } else {
        alert("DATABASE_ERROR: " + error.message);
      }
    } catch (err) {
      console.error("Unlock Error:", err);
    }
  }

  async function updateCargoStatus(id, newStatus) {
    try {
      const { error } = await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
      if (!error) syncHqData();
    } catch (err) { console.error("Cargo Status Error:", err); }
  }

  // AGGIORNAMENTO STATO LEAD (INCLUSI CANCELLED E REFUNDED)
  async function updateLeadStatus(id, newStatus) {
    const sanitizedStatus = newStatus ? newStatus.toUpperCase() : '';
    if (!sanitizedStatus) return;
    
    // Conferma di sicurezza per operatore Admin
    if (sanitizedStatus === 'REFUNDED' && !confirm("CONFIRM FULL REFUND ISSUANCE? This will nullify transactions and lock the deal for customer.")) {
      return;
    }
    if (sanitizedStatus === 'CANCELLED' && !confirm("CANCEL THIS TRANSACTION RECORD? Customer UI will be locked.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: sanitizedStatus })
        .eq('id', id);

      if (!error) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: sanitizedStatus } : l));
        syncHqData();
      } else {
        console.error("Supabase Error on Status Update:", error);
        alert("DATABASE_ERROR: " + error.message);
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
        .hq-wrapper { background-color: #fdfbf7; background-image: radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 600px); color: #111; min-height: 100vh; padding: 0 0 50px 0; font-family: 'Inter', sans-serif; box-sizing: border-box; }
        
        .hq-nav { height: 70px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; border-bottom: 1px solid #e2e8f0; background: #fff; position: sticky; top: 0; z-index: 100; box-sizing: border-box; }
        .nav-left { display: flex; align-items: center; gap: 25px; }
        .hq-logo { height: 32px; width: auto; cursor: pointer; }
        .exit-terminal { color: #64748b; text-decoration: none; font-size: 11px; font-weight: 800; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
        .sys-status { font-size: 10px; color: #059669; display: flex; align-items: center; gap: 8px; font-weight: 800; }
        .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: blink 2s infinite; }
        
        .hq-hero { padding: 60px 40px 40px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
        .hero-tag { font-size: 10px; color: #0ea5e9; letter-spacing: 4px; margin-bottom: 10px; font-weight: 900; }
        .hero-title { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin: 0; word-break: break-word; }
        .cyan-cursor { color: #0ea5e9; animation: blink 1s infinite; }
        
        .kpi-layer { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto 40px; padding: 0 40px; box-sizing: border-box; }
        .kpi-box { background: #fff; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; position: relative; box-sizing: border-box; }
        .kpi-label { font-size: 10px; color: #94a3b8; letter-spacing: 2px; margin-bottom: 10px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; }
        .kpi-data { font-size: 28px; font-weight: 900; word-break: break-all; }
        .reset-rev { font-size: 8px; color: #f87171; cursor: pointer; border: 1px solid #fecaca; padding: 2px 5px; border-radius: 4px; }
        .reset-rev:hover { background: #fee2e2; }
        
        .hq-console { display: grid; grid-template-columns: 1fr; gap: 40px; max-width: 1400px; margin: 0 auto; padding: 0 40px; box-sizing: border-box; }
        .card-title { font-size: 12px; color: #94a3b8; margin-bottom: 25px; letter-spacing: 2px; font-weight: 900; display: flex; justify-content: space-between; align-items: center; }
        .sub-card { background: #fff; border: 1px solid #e2e8f0; padding: 35px; border-radius: 24px; margin-bottom: 25px; box-sizing: border-box; }
        
        .map-viz { height: 300px; background: #f8fafc; border-radius: 20px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; border: 1px solid #e2e8f0; }
        .modern-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1px; }
        .input-group input, .input-group select { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; color: #111; font-size: 13px; outline: none; border-radius: 12px; font-family: 'JetBrains Mono', monospace; transition: 0.2s; width: 100%; box-sizing: border-box; }
        
        .price-wrapper { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-sizing: border-box; width: 100%; }
        .price-symbol { padding-left: 15px; color: #0ea5e9; font-weight: 900; }
        .price-wrapper input { background: transparent; border: none; width: 100%; }
        
        .exec-btn { background: #111; color: #0ea5e9; border: 1px solid #0ea5e9; padding: 18px; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.3s; border-radius: 15px; letter-spacing: 2px; margin-top: 10px; width: 100%; box-sizing: border-box; }
        .feed { background: #fff; border: 1px solid #e2e8f0; padding: 35px; border-radius: 24px; box-sizing: border-box; }
        .feed-item { padding: 20px 0; border-bottom: 1px solid #f1f5f9; transition: 0.2s; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; box-sizing: border-box; width: 100%; }
        .item-name { font-weight: 900; font-size: 14px; }
        .img-thumb { width: 45px; height: 45px; border-radius: 8px; object-fit: cover; background: #f1f5f9; flex-shrink: 0; }
        
        .lead-badge { font-size: 9px; padding: 4px 8px; border-radius: 6px; font-weight: 900; text-transform: uppercase; }
        .status-new { background: #dcfce7; color: #166534; }
        .status-quoted { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .status-contacted { background: #fef9c3; color: #854d0e; }
        .status-closed { background: #f1f5f9; color: #475569; }
        .status-cancelled { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
        .status-refunded { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        
        .control-btn { border: 1px solid #e2e8f0; background: #fff; padding: 5px 10px; border-radius: 6px; font-size: 9px; font-weight: 800; cursor: pointer; }
        .control-btn:hover { border-color: #0ea5e9; color: #0ea5e9; }
        .term-btn { background: #fee2e2; border: none; color: #991b1b; padding: 6px 12px; font-size: 10px; font-weight: 900; cursor: pointer; border-radius: 8px; }

        .pct-roller { width: 100%; accent-color: #0ea5e9; cursor: pointer; height: 6px; border-radius: 4px; background: #e2e8f0; }
        
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @media (min-width: 1024px) { .hq-console { grid-template-columns: 1.2fr 0.8fr; } }

        @media (max-width: 768px) {
          .hq-nav { padding: 0 20px; }
          .exit-terminal { font-size: 9px; }
          .hq-hero { padding: 40px 20px 20px; }
          .hero-title { font-size: 32px; }
          .kpi-layer { padding: 0 20px; gap: 15px; }
          .kpi-box { padding: 20px; }
          .hq-console { padding: 0 20px; gap: 25px; }
          .sub-card, .feed { padding: 20px; border-radius: 16px; }
          .form-row { grid-template-columns: 1fr; gap: 15px; }
          .feed-item > div { flex-wrap: wrap; gap: 10px; }
        }
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

          <div className="sub-card" style={{ borderLeft: '6px solid #0ea5e9' }}>
            <h3 className="card-title">
              ADMIN_PARTNER_PROVISIONING 
              <span style={{ color: '#0ea5e9' }}>[{allowedEmails.length}]</span>
            </h3>
            <form onSubmit={handleAllowPartner} className="modern-form">
              <div className="input-group">
                <label>BUSINESS_MAN_EMAIL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="email" 
                    placeholder="partner@manilaenterprise.com" 
                    value={newAllowedEmail} 
                    onChange={e => setNewAllowedEmail(e.target.value)} 
                    required 
                  />
                  <button type="submit" className="control-btn" style={{ background: '#0ea5e9', color: '#fff', borderColor: '#0ea5e9', padding: '0 20px', height: '48px', borderRadius: '12px', fontWeight: '900' }}>
                    AUTHORIZE
                  </button>
                </div>
              </div>
            </form>
            
            <div style={{ marginTop: '25px' }}>
              <label style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>
                ACTIVE_BUSINESS_WHITELIST
              </label>
              <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {allowedEmails.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>NO_PARTNERS_AUTHORIZED_YET</span>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allowedEmails.map((partner) => (
                      <li key={partner.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>
                        <span style={{ color: '#166534' }}>●</span> &nbsp; {partner.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hq-panel feed">
            <h3 className="card-title">LIVE_TRANSACTION_STATUS <span style={{color: '#0ea5e9'}}>[{leads.length}]</span></h3>
            <div style={{marginBottom: '40px', maxHeight: '550px', overflowY: 'auto'}}>
                {leads.map(lead => {
                  return (
                    <div key={lead.id} className="feed-item" style={{
                      borderLeft: lead.accepted_by_name ? '4px solid #10b981' : '4px solid #0ea5e9', 
                      paddingLeft: '15px', 
                      marginBottom: '10px'
                    }}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', width: '100%', flexWrap: 'wrap', gap: '5px'}}>
                            <span className="item-name">{lead.full_name || lead.customer_name}</span>
                            <span className={`lead-badge ${lead.accepted_by_name ? 'status-closed' : 'status-new'}`}>
                              {lead.status || (lead.accepted_by_name ? 'LOCKED' : 'NEW_REQUEST')}
                            </span>
                        </div>
                        
                        <div style={{fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono', width: '100%', wordBreak: 'break-word', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div>Address: {lead.address} | Monthly Bill: ₱{lead.monthly_bill}</div>
                            <div style={{color: '#0ea5e9', fontWeight: 'bold'}}>
                              Locked By Partner/Installer: {lead.accepted_by_name || 'PENDING ASSIGNMENT (Not taken yet)'}
                            </div>
                            <div style={{color: '#94a3b8'}}>TX_HASH: {lead.id?.split('-')[0].toUpperCase()}_AZP</div>
                        </div>
                    </div>
                  );
                })}
            </div>
        </div>
      </div>
    </div>
  );
}