"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TitanStore() {
  // Aggiunto il tab EV_HUB richiesto dal Sir
  const [activeSection, setActiveSection] = useState<'TITAN' | 'SYSTEMS' | 'SUPPORT' | 'EV_HUB'>('TITAN');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // STATI LIVE HUB DI RICARICA (COLLEGATI A SUPABASE REALTIME DALLA TABELLA REALE)
  const [selectedHubNode, setSelectedHubNode] = useState<string>('LUZON_LOGISTICS_HUB'); // <--- STATO MANCANTE AGGIUNTO QUI
  const [livePower, setLivePower] = useState(142.5);
  const [connectedVehicles, setConnectedVehicles] = useState(4);
  const [revenueToday, setRevenueToday] = useState(8450);
  
  // NUOVI STATI DI CAPACITÀ INTEGRATI PER OGNI HUB
  const [totalChargers, setTotalChargers] = useState(10);
  const [occupiedChargers, setOccupiedChargers] = useState(4);
  
  // Stato per salvare tutte le stazioni caricate dal DB da mostrare sulla mappa
  const [stations, setStations] = useState<any[]>([]);

  // Lead Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Micro-oscillazione per l'effetto marketing real-time sul display
  const [ticker, setTicker] = useState(0);

  const fallbackKits = [
    { 
      id: "KIT-01", name: "TITAN CORE", tier: "ESSENTIAL", price: 185000, 
      specs: ["5.2kW PV", "5kWh Storage", "AI Sync"],
      desc: "Autonomy for residential properties."
    },
    { 
      id: "KIT-02", name: "TITAN ULTRA", tier: "PREMIUM", price: 420000, 
      specs: ["12.0kW PV", "20kWh Storage", "Full Backup"],
      desc: "Zero-grid reliance for luxury estates."
    }
  ];

  // Loop di simulazione millisecondi per rendere i contatori graficamente mobili
  useEffect(() => {
    if (activeSection !== 'EV_HUB') return;
    const interval = setInterval(() => {
      setTicker((prev) => (prev > 100 ? 0 : prev + Math.random() * 0.05));
    }, 400);
    return () => clearInterval(interval);
  }, [activeSection]);

  // Caricamento iniziale prodotti e stazioni totali per la mappa
  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (data && data.length > 0 && !error) setProducts(data);
        else setProducts(fallbackKits);
      } catch (e) { setProducts(fallbackKits); }
      finally { setLoading(false); }
    }
    
    async function loadStations() {
      try {
        const { data } = await supabase.from('charging_stations').select('*');
        if (data) setStations(data);
      } catch (e) { console.error("Errore caricamento stazioni mappa:", e); }
    }

    loadData();
    loadStations();
  }, []);

  // FUNZIONE PER IL CARICAMENTO DEI DATI TELEMETRICI REALI DAL NODO SELEZIONATO
  async function fetchHubTelemetry(nodeName: string) {
    try {
      const { data, error } = await supabase
        .from('charging_stations')
        .select('name, power_kw, status, active_sessions, revenue_today, total_chargers, occupied_chargers')
        .eq('name', nodeName)
        .single();

      if (data && !error) {
        const maxPower = Number(data.power_kw) || 0;
        const realSessions = Number(data.active_sessions) || 0;
        const realRevenue = Number(data.revenue_today) || 0;

        setLivePower(maxPower);
        setConnectedVehicles(realSessions);
        setRevenueToday(realRevenue);
        setTotalChargers(Number(data.total_chargers) || 0);
        setOccupiedChargers(Number(data.occupied_chargers) || 0);
      } else if (error) {
        console.error("Dati non trovati o errore nella query su Supabase:", error.message);
      }
    } catch (err) {
      console.error("Errore fetch telemetria:", err);
    }
  }

  // SOTTOSCRIZIONE REALTIME SULLA TABELLA REALE
  useEffect(() => {
    if (activeSection !== 'EV_HUB') return;

    fetchHubTelemetry(selectedHubNode);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'charging_stations',
          filter: `name=eq.${selectedHubNode}`
        },
        (payload) => {
          if (payload.new) {
            const maxPower = Number(payload.new.power_kw) || 0;
            const realSessions = Number(payload.new.active_sessions) || 0;
            const realRevenue = Number(payload.new.revenue_today) || 0;

            setLivePower(maxPower);
            setConnectedVehicles(realSessions);
            setRevenueToday(realRevenue);
            setTotalChargers(Number(payload.new.total_chargers) || 0);
            setOccupiedChargers(Number(payload.new.occupied_chargers) || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSection, selectedHubNode]);

  // Gestione cambio nodo hub per diversificare i dati mostrati calcolati dal DB reale
  const handleHubNodeChange = (nodeName: string) => {
    setSelectedHubNode(nodeName);
    fetchHubTelemetry(nodeName);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('leads').insert([
      {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        product_name: selectedProduct?.name || 'TITAN_GENERIC',
        deal_value: Number(selectedProduct?.price) || 0,
        status: 'NEW'
      }
    ]);

    if (!error) {
      fetch('https://hook.eu1.make.com/udkzyhx9od1e1o4k7wfwvxa3bsesgafn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: formData.name,
          email: formData.email,
          phone: formData.phone,
          product: selectedProduct?.name,
          value: selectedProduct?.price,
          timestamp: new Date().toISOString()
        })
      }).catch(err => console.error("Errore notifica Make:", err));

      alert(`✅ STRATEGIC LEAD CAPTURED!
      
PAYMENT PROTOCOL:
To confirm the order of ${selectedProduct?.name}, make the bank transfer.

Send the receipt of the transaction at azphur@gmail.com

We will verify the credit and update the status on your Dashboard.`);

      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '' });
    } else {
      console.error("Supabase Error:", error);
      alert(`Error capturing lead: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  if (!mounted) return null;

  // Calcolo matematico reattivo per le colonnine libere
  const availableChargers = Math.max(0, totalChargers - occupiedChargers);

  // LOGICA E CALCOLI DI MARKETING ECOLOGICO CON MICRO-OSCILLAZIONE VISIVA "LIVE"
  const dynamicPowerDisplay = (livePower + (ticker % 0.4) - 0.2).toFixed(1);
  const co2SavedToday = (Number(dynamicPowerDisplay) * 0.42 * (revenueToday / 1000 || 1) + ticker).toFixed(2); 
  const greenEnergyPercentage = livePower > 130 ? 100 : livePower > 100 ? 94 : 88;

  return (
    <div className="titan-store">
      <nav className="tesla-nav">
        <Link href="/" className="tesla-brand-wrapper">
          <img src="/logo-azphur.avif" alt="Logo" className="tesla-brand-img" />
          <span className="tesla-logo">AZPHUR</span>
        </Link>
        <div className="nav-center">
          {['TITAN', 'SYSTEMS', 'SUPPORT', 'EV_HUB'].map((item: any) => (
            <span 
              key={item} 
              className={`nav-link ${activeSection === item ? 'active' : ''} ${item === 'EV_HUB' ? 'ev-link-highlight' : ''}`}
              onClick={() => setActiveSection(item)}
            >
              {item === 'EV_HUB' ? '⚡ EV_HUB' : item}
            </span>
          ))}
        </div>
        <div className="nav-right">
          <div className="cart-pill">SECURE_LAYER_ACTIVE</div>
        </div>
      </nav>

      <main className="content-wrapper">
        {activeSection === 'TITAN' && (
          <div className="fade-in">
            <section className="store-hero">
              <h1 className="main-heading">TITAN <span className="thin">SERIES</span></h1>
              <p className="sub-heading">Next-generation solar infrastructure.</p>
            </section>
            
            <section className="products-section">
              <div className="grid-container">
                {products.map(kit => (
                  <div key={kit.id} className="tesla-card">
                    <div className="card-header">
                      <h2 className="product-title">{kit.name}</h2>
                      <p className="product-subtitle">{kit.tier}</p>
                    </div>
                    <div className="product-visual" style={{ backgroundImage: `url(${kit.image_url || ''})` }}></div>
                    <div className="price-box">
                        <span className="currency">₱</span>
                        <span className="amount">{Number(kit.price).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => { setSelectedProduct(kit); setIsModalOpen(true); }} 
                      className="tesla-btn-primary"
                    >
                      ORDER NOW
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === 'SYSTEMS' && (
          <div className="fade-in system-page">
            <section className="tech-hero">
              <h1 className="section-title">ENGINEERED FOR <br/><span className="blue-text">PERFORMANCE</span></h1>
              <div className="tech-grid">
                <div className="tech-item">
                  <h3>CRYSTALLINE_PV</h3>
                  <p>Highest efficiency solar cells designed for tropical irradiance levels.</p>
                </div>
                <div className="tech-item">
                  <h3>LFP_STORAGE</h3>
                  <p>Lithium Iron Phosphate nodes with 10,000+ cycle life expectancy.</p>
                </div>
                <div className="tech-item">
                  <h3>AZ_OS_GENESIS</h3>
                  <p>AI-driven management system that predicts weather patterns to optimize discharge.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'SUPPORT' && (
          <div className="fade-in support-page">
            <section className="support-hero">
              <h1 className="section-title">24/7 MISSION <br/><span className="thin">CONTROL</span></h1>
              <div className="support-cards">
                <div className="support-card">
                  <h4>REMOTE_DIAGNOSTICS</h4>
                  <p>Real-time monitoring of every Titan node worldwide.</p>
                  <button className="secondary-btn">OPEN TICKET</button>
                </div>
                <div className="support-card">
                  <h4>INSTALLATION_HUB</h4>
                  <p>Find certified Azphur engineers in your sector.</p>
                  <button className="secondary-btn">LOCATE HUB</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'EV_HUB' && (
          <div className="fade-in ev-hub-page">
            <section className="hub-hero">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="live-badge">● LIVE MICROGRID TELEMETRY</span>
                <span className="live-badge" style={{ background: '#d1fae5', color: '#065f46' }}>☀️ 100% SOLAR POWERED INFRASTRUCTURE</span>
              </div>
              <h1 className="main-heading">SOLAR <span className="thin">CHARGING</span> HUB</h1>
              <p className="sub-heading">Phase-02 continuous transaction infrastructure grid ecosystem.</p>
              
              <select 
                className="hub-node-select" 
                value={selectedHubNode} 
                onChange={(e) => handleHubNodeChange(e.target.value)}
              >
                <option value="LUZON_LOGISTICS_HUB">LUZON LOGISTICS HUB (STATION 01)</option>
                <option value="VISAYAS_ENERGY_NODE">VISAYAS ENERGY NODE (STATION 02)</option>
                <option value="MINDANAO_ENERGY_CORE">MINDANAO ENERGY CORE (STATION 03)</option>
              </select>
            </section>

            <section className="telemetry-dashboard">
              <div className="telemetry-grid">
                <div className="telemetry-card highlight-cyan">
                  <span className="card-lbl">CURRENT_SOLAR_OUTPUT</span>
                  <div className="big-stat">{dynamicPowerDisplay} <span className="stat-unit">kW</span></div>
                  <div className="stat-footer">Pure Solar-to-Vehicle Generation</div>
                </div>

                <div className="telemetry-card">
                  <span className="card-lbl">ACTIVE_SESSIONS</span>
                  <div className="big-stat">{connectedVehicles} <span className="stat-unit">EVs</span></div>
                  <div className="stat-footer">Connected to Fast Charging Nodes</div>
                </div>

                <div className="telemetry-card">
                  <span className="card-lbl">REVENUE_GENERATION_24H</span>
                  <div className="big-stat">₱{revenueToday.toLocaleString()}</div>
                  <div className="stat-footer">Micro-transactions Blockchain Verified</div>
                </div>
              </div>

              {/* SEZIONE COMPONENTI AGGIUNTIVI PER IL MARKETING ENERGETICO */}
              <section className="marketing-esg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '30px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.8, letterSpacing: '1.5px', display: 'block', marginBottom: '10px' }}>TOTAL_CO2_AVOIDED</span>
                  <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' }}>{co2SavedToday} <span style={{ fontSize: '16px', fontWeight: '300' }}>KG</span></div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Net environmental impact metric relative to fossil alternative grid assets.</p>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '1.5px', display: 'block', marginBottom: '10px' }}>RENEWABLE_ENERGY_MIX</span>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', letterSpacing: '-1px' }}>{greenEnergyPercentage}% <span style={{ fontSize: '16px', fontWeight: '400', color: '#64748b' }}>PURE GREEN</span></div>
                  <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${greenEnergyPercentage}%`, background: '#10b981', height: '100%', borderRadius: '3px', transition: 'width 0.5s ease-in-out' }}></div>
                  </div>
                </div>
              </section>

              <section className="asset-section" style={{ marginBottom: '30px' }}>
                <h3 className="section-subtitle" style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '15px' }}>ARCHIPELAGO_GRID_VISUALIZER (DATA_CONTROL)</h3>
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

              <section className="station-capacity-section" style={{ marginBottom: '40px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', color: '#171a20' }}>
                      {selectedHubNode.replace(/_/g, ' ')} BAY STATUS
                    </h4>
                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Real-time hardware utilization analytics per selected sector.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', letterSpacing: '0.5px' }}>CHARGERS IN USE</span>
                       <span style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{occupiedChargers}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}> / {totalChargers}</span>
                     </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '30px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', letterSpacing: '0.5px' }}>AVAILABLE CHARGERS</span>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{availableChargers}</span>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}> FREE</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="hub-architecture-box">
                <div className="arch-header">SYSTEM_SPECIFICATIONS // SOLAR_CHARGING_HUB</div>
                <div className="arch-body-grid">
                  <div className="arch-column">
                    <strong>INTEGRATED PV CAPACITY</strong>
                    <p>150kW Peak Crystalline Canopy Structure.</p>
                  </div>
                  <div className="arch-column">
                    <strong>BATTERY ENERGY STORAGE (BESS)</strong>
                    <p>300kWh Lithium Iron Phosphate (LFP) buffer core for night operations.</p>
                  </div>
                  <div className="arch-column">
                    <strong>GRID COUPLING</strong>
                    <p>Bi-directional intelligent net-metering managed by AZ_OS_GENESIS.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">RESERVE {selectedProduct?.name}</h3>
            <p className="modal-desc">Enter your details to initiate the transaction protocol.</p>
            <form onSubmit={handleLeadSubmit}>
              <input 
                type="text" placeholder="Full Name" required 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="email" placeholder="Corporate Email" required 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="tel" placeholder="Phone Number" required 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <button type="submit" disabled={isSubmitting} className="tesla-btn-primary">
                {isSubmitting ? 'PROCESSING...' : 'CONFIRM RESERVATION'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="close-btn">CANCEL</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;900&display=swap');
        .titan-store { background: #fff; color: #171a20; min-height: 100vh; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; box-sizing: border-box; }
        
        .tesla-nav { position: fixed; top: 0; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; z-index: 100; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); box-sizing: border-box; }
        .tesla-brand-wrapper { display: flex; align-items: center; gap: 12px; text-decoration: none; flex: 1; }
        .tesla-brand-img { height: 28px; width: auto; }
        .tesla-logo { font-weight: 900; letter-spacing: 6px; color: #000; font-size: 14px; }
        .nav-center { display: flex; gap: 5px; flex: 2; justify-content: center; }
        .nav-right { flex: 1; display: flex; justify-content: flex-end; }
        .cart-pill { font-size: 10px; font-weight: 800; letter-spacing: 1px; white-space: nowrap; }
        .nav-link { font-size: 12px; font-weight: 600; cursor: pointer; padding: 8px 16px; border-radius: 4px; transition: 0.2s; letter-spacing: 1px; color: #393c41; }
        .nav-link.active { color: #000; background: rgba(0,0,0,0.05); }
        .ev-link-highlight { border: 1px dashed #3e6ae1; color: #3e6ae1 !important; }
        .ev-link-highlight.active { background: rgba(62, 106, 225, 0.1) !important; font-weight: 800; }
        
        .content-wrapper { padding-top: 100px; box-sizing: border-box; }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .store-hero, .hub-hero { padding: 60px 20px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; }
        .main-heading { font-size: clamp(40px, 8vw, 80px); font-weight: 700; letter-spacing: -4px; margin: 0; line-height: 0.9; }
        .thin { font-weight: 100; }
        .sub-heading { font-size: clamp(14px, 2vw, 18px); color: #393c41; margin-top: 10px; }
        
        .products-section { padding: 40px; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; width: 100%; box-sizing: border-box; }
        .tesla-card { background: #f4f4f4; border-radius: 12px; padding: 40px 30px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
        .product-visual { height: 200px; margin: 30px 0; background-size: contain; background-repeat: no-repeat; background-position: center; width: 100%; }
        
        .price-box { display: flex; align-items: center; justify-content: center; gap: 2px; margin-bottom: 20px; }
        .currency { font-size: 20px; font-weight: 700; }
        .amount { font-size: 24px; font-weight: 700; display: inline-block; }
        
        .tesla-btn-primary { width: 100%; background: #3e6ae1; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; box-sizing: border-box; }
        .tesla-btn-primary:hover { background: #171a20; }
        
        .tech-hero, .support-hero { padding: 60px 20px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; }
        .section-title { font-size: clamp(30px, 5vw, 50px); font-weight: 800; letter-spacing: -2px; line-height: 1.1; margin: 0; }
        .blue-text { color: #3e6ae1; }
        
        .tech-grid, .support-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 40px; max-width: 1000px; margin: 40px auto; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .tech-item { padding: 20px 10px; }
        .tech-item h3 { font-size: 16px; font-weight: 700; margin-bottom: 10px; letter-spacing: 1px; }
        .tech-item p { font-size: 14px; color: #393c41; line-height: 1.5; margin: 0; }
        
        .support-card { background: #171a20; color: #fff; padding: 40px; border-radius: 12px; text-align: left; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
        .support-card h4 { font-size: 16px; margin: 0 0 10px 0; letter-spacing: 1px; }
        .support-card p { font-size: 14px; color: #cccccc; line-height: 1.5; margin: 0 0 20px 0; }
        .secondary-btn { background: #fff; border: none; padding: 12px 24px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer; width: fit-content; align-self: flex-start; }
        
        .ev-hub-page { padding: 0 20px 100px; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .live-badge { font-size: 10px; font-weight: 900; background: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 20px; display: inline-block; }
        .hub-node-select { margin-top: 25px; padding: 12px 24px; border-radius: 8px; border: 2px solid #171a20; font-family: monospace; font-size: 12px; font-weight: 700; background: #fff; cursor: pointer; outline: none; }
        .telemetry-dashboard { margin-top: 50px; }
        .telemetry-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .telemetry-card { background: #f4f4f4; border: 1px solid #e5e7eb; padding: 35px 25px; border-radius: 16px; text-align: left; box-sizing: border-box; }
        .telemetry-card.highlight-cyan { background: #171a20; color: #fff; border: none; box-shadow: 0 15px 30px rgba(62, 106, 225, 0.15); }
        .card-lbl { font-size: 10px; font-weight: 800; color: #86868b; letter-spacing: 1.5px; display: block; margin-bottom: 15px; }
        .telemetry-card.highlight-cyan .card-lbl { color: #3e6ae1; }
        .big-stat { font-size: 44px; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 10px; }
        .stat-unit { font-size: 18px; font-weight: 300; letter-spacing: 0; color: #86868b; }
        .stat-footer { font-size: 12px; color: #5c5e62; font-weight: 500; }
        .telemetry-card.highlight-cyan .stat-footer { color: #aaae; }
        .hub-architecture-box { background: #fff; border: 1px solid #171a20; border-radius: 12px; padding: 30px; text-align: left; margin-top: 20px; }
        .arch-header { font-size: 11px; font-weight: 900; letter-spacing: 1.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
        .arch-body-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 25px; }
        .arch-column strong { font-size: 12px; font-weight: 800; display: block; margin-bottom: 5px; }
        .arch-column p { font-size: 13px; color: #5c5e62; margin: 0; line-height: 1.4; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); padding: 20px; box-sizing: border-box; }
        .modal-content { background: #fff; padding: 40px 30px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); box-sizing: border-box; }
        .modal-title { font-size: 24px; font-weight: 800; margin-bottom: 10px; letter-spacing: -1px; }
        .modal-desc { font-size: 14px; color: #666; margin-bottom: 25px; line-height: 1.4; }
        .modal-content input { width: 100%; padding: 14px; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 14px; box-sizing: border-box; }
        .close-btn { width: 100%; background: transparent; border: none; margin-top: 15px; cursor: pointer; font-size: 11px; font-weight: 700; color: #999; letter-spacing: 1px; box-sizing: border-box; }

        @media (max-width: 768px) {
          .tesla-nav { padding: 15px 20px; flex-direction: row; flex-wrap: wrap; gap: 10px; }
          .tesla-brand-wrapper { flex: none; }
          .nav-center { order: 3; flex: 1 1 100%; justify-content: space-between; margin-top: 5px; background: rgba(0,0,0,0.02); padding: 4px; border-radius: 8px; gap: 2px; }
          .nav-link { font-size: 10px; padding: 6px 8px; text-align: center; flex: 1; letter-spacing: 0px; }
          .nav-right { flex: none; order: 2; }
          .cart-pill { margin-right: 0; font-size: 9px; }
          .content-wrapper { padding-top: 150px; }
          .products-section { padding: 20px; }
          .grid-container { grid-template-columns: 1fr; gap: 20px; }
          .tesla-card { padding: 30px 20px; }
          .tech-grid, .support-cards { gap: 25px; margin: 20px auto; padding: 0 10px; }
          .support-card { padding: 30px 20px; }
          
          .telemetry-grid { grid-template-columns: 1fr; gap: 15px; }
          .telemetry-card { padding: 25px 20px; }
          .big-stat { font-size: 36px; }
          .arch-body-grid { grid-template-columns: 1fr; gap: 15px; }
          .hub-architecture-box { padding: 20px; }
        }
      `}</style>
    </div>
  );
}