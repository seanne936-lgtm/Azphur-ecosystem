"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PartnerDashboard() {
  const [shipments, setShipments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Stato per evitare flash visivi durante il controllo sessione

  // DATI DI EMERGENZA (HARDCODED PER IL PITCH)
  const demoInventory = [
    { id: 'AZ-INV-001', name: 'Tier-1 Solar Panel 550W', quantity: 42, status: 'ARRIVED', image_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=200' },
    { id: 'AZ-INV-002', name: 'Hybrid Inverter 10kW', quantity: 12, status: 'IN_TRANSIT', image_url: 'https://images.unsplash.com/photo-1620055375841-866a8365673d?w=200' },
    { id: 'AZ-INV-003', name: 'EV Fast Charger Station', quantity: 5, status: 'PROCESSING', image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200' }
  ];

  useEffect(() => {
    setMounted(true);
    checkActiveSession();
  }, []);

  // CONTROLLO SESSIONE PROTETTA AUTOMATICA
  async function checkActiveSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Recupera il ruolo o nodo assegnato all'utente loggato dalla tabella user_profiles
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role_or_node')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          // Se l'utente non è un admin globale, carica direttamente la dashboard del suo nodo
          if (profile.role_or_node !== 'ADMIN') {
            setSelectedPartner(profile.role_or_node);
            fetchPartnerCargo(profile.role_or_node);
            setCheckingAuth(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Auth session check error:", err);
    }
    
    // Se non c'è sessione o l'utente è ADMIN, carica la lista dei provider per la selezione manuale (fallback)
    fetchProviders();
    setCheckingAuth(false);
  }

  async function fetchProviders() {
    const { data, error } = await supabase.from('providers').select('name');
    if (error || !data || data.length === 0) {
      // Se il DB fallisce, mostriamo questi nodi pronti all'uso
      setProviders([{ name: 'LUZON_LOGISTICS_HUB' }, { name: 'VISAYAS_ENERGY_NODE' }]);
    } else {
      setProviders(data);
    }
  }

  async function fetchPartnerCargo(name) {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('provider', name);
    
    // Se il database è vuoto o dà errore, carichiamo i dati Demo
    if (error || !data || data.length === 0) {
      setTimeout(() => {
        setShipments(demoInventory);
        setLoading(false);
      }, 800); // Piccolo delay per simulare il caricamento reale
    } else {
      setShipments(data);
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    // Aggiornamento locale per velocità durante il pitch
    const updated = shipments.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setShipments(updated);
    
    // Prova ad aggiornare anche DB, ma non blocca l'interfaccia
    await supabase.from('inventory').update({ status: newStatus }).eq('id', id);
  }

  // LOGOUT DALLA SESSIONE
  async function handleLogout() {
    await supabase.auth.signOut();
    setSelectedPartner('');
    fetchProviders();
  }

  if (!mounted) return null;
  if (checkingAuth) return <div style={{ backgroundColor: '#f0f9fa', minHeight: '100vh', fontFamily: 'monospace', padding: '40px', fontSize: '12px' }}>VERIFYING_SECURE_UPLINK...</div>;

  return (
    <div className="partner-canvas">
      <style jsx global>{`
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        .partner-canvas { background-color: #f0f9fa !important; min-height: 100vh; color: #1d1d1f; }
        .nav-partner { display: flex; justify-content: space-between; align-items: center; padding: 40px 60px; max-width: 1400px; margin: 0 auto; }
        .main-logo { height: 38px; cursor: pointer; }
        .btn-back { font-size: 10px; font-weight: 900; color: #0891b2; text-decoration: none; letter-spacing: 1px; border: 1px solid #22d3ee; padding: 8px 16px; border-radius: 4px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 40px 100px; }
        .auth-card { max-width: 450px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; border: 4px solid #1d1d1f; box-shadow: 0 10px 30px rgba(34, 211, 238, 0.1); }
        .phase-label { font-size: 8px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 12px; display: block; text-transform: uppercase; }
        .title-cyan { color: #22d3ee; font-weight: 900; font-size: 24px; margin-bottom: 20px; letter-spacing: -1px; }
        .partner-select { width: 100%; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; font-family: monospace; font-weight: 600; outline: none; margin-bottom: 20px; cursor: pointer; }
        .model-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
        .info-card { background: #fff; border: 1px solid rgba(34, 211, 238, 0.3); padding: 20px; border-radius: 12px; }
        .info-card h4 { font-size: 11px; font-weight: 900; color: #1d1d1f; margin: 0 0 10px; border-bottom: 1px solid #f0f9fa; padding-bottom: 8px; }
        .info-card ul { list-style: none; padding: 0; margin: 0; }
        .info-card li { font-size: 10px; color: #5c5e62; padding: 4px 0; display: flex; align-items: center; gap: 6px; }
        .info-card li::before { content: "•"; color: #22d3ee; font-size: 10px; }
        .cargo-card { background: #fff; border: 4px solid #1d1d1f; padding: 25px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .status-select { background: #1d1d1f; color: #fff; border: none; padding: 10px; border-radius: 6px; font-size: 10px; font-weight: 800; font-family: monospace; cursor: pointer; }
      `}</style>

      <nav className="nav-partner">
        <img src="/logo-azphur.avif" alt="AZPHUR" className="main-logo" onClick={() => window.location.href='/'} />
        <Link href="/" className="btn-back">← BACK_TO_HQ</Link>
      </nav>

      <div className="container">
        {!selectedPartner ? (
          <div className="auth-card">
            <span className="phase-label">MODULE_04 // PARTNER_ACCESS</span>
            <h2 className="title-cyan">NODE_TERMINAL</h2>
            <select className="partner-select" onChange={(e) => {
              if(e.target.value) {
                setSelectedPartner(e.target.value);
                fetchPartnerCargo(e.target.value);
              }
            }}>
              <option value="">-- IDENTIFY_NODE --</option>
              {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <div style={{marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px'}}>
               <span className="phase-label">ECOSYSTEM_INFO</span>
               <p style={{fontSize: '11px', color: '#5c5e62'}}>
                 Access real-time inventory tracking for your assigned energy node.
               </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-content">
            <div style={{textAlign: 'center', marginBottom: '50px'}}>
              <span className="phase-label">NODE_ACTIVE</span>
              <h1 style={{fontSize: '40px', fontWeight: 900, margin: '10px 0'}}>
                {selectedPartner.replace('_', ' ')} <span style={{color: '#22d3ee'}}>_DASHBOARD</span>
              </h1>
            </div>

            <div className="model-info-grid">
              <div className="info-card">
                <h4>PHASE_01 // IMMEDIATE_REVENUE</h4>
                <ul>
                  <li>Lead generation engine</li>
                  <li>Supplier subscription model</li>
                  <li>Commission per closed deal</li>
                </ul>
              </div>
              <div className="info-card">
                <h4>PHASE_02 // SCALABLE_REVENUE</h4>
                <ul>
                  <li>EV charging transaction fees</li>
                  <li>SaaS dashboard for partners</li>
                  <li>Blockchain-verified credits</li>
                </ul>
              </div>
            </div>

            <div className="cargo-list">
              <span className="phase-label" style={{marginBottom: '20px'}}>LIVE_ASSET_INVENTORY</span>
              {loading ? (
                <p style={{fontFamily: 'monospace', fontSize: '12px'}}>SYNCING_NODE_DATA...</p>
              ) : (
                shipments.map(s => (
                  <div key={s.id} className="cargo-card">
                    <div style={{display: 'flex', gap: '25px', alignItems: 'center'}}>
                      <img src={s.image_url} style={{width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee'}} />
                      <div>
                        <h3 style={{margin: 0, fontSize: '18px', fontWeight: 900}}>{s.name}</h3>
                        <p style={{margin: '5px 0 0', fontSize: '10px', color: '#86868b', fontFamily: 'monospace'}}>SKU: {s.id}</p>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <p style={{fontSize: '14px', fontWeight: 900, margin: '0 0 10px'}}>QTY: {s.quantity}</p>
                      <select className="status-select" value={s.status} onChange={(e) => handleStatusChange(s.id, e.target.value)}>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="ARRIVED">ARRIVED</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{textAlign: 'center', marginTop: '40px'}}>
                <button onClick={handleLogout} style={{background: 'none', border: 'none', color: '#86868b', fontSize: '10px', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline'}}>
                  TERMINATE_SESSION
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}