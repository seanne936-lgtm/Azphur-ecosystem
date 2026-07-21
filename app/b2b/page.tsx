"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Interfacce Rigorose
interface Lead {
  id: string;
  interest: string;
  budget: string | number;
  created_at: string;
  matching_status?: string;
  customer_email?: string;
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [realTimeMW, setRealTimeMW] = useState<number>(842.15);
  const [mounted, setMounted] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // Nuovi stati per il form di espansione infrastruttura
  const [newInterest, setNewInterest] = useState<string>('SOLAR_INSTALL');
  const [newBudget, setNewBudget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const checkProtection = async () => {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        router.push('/login');
        return;
      }

      const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : '';
      setCurrentUserEmail(userEmail);

      if (userEmail === 'admin@azphur.com') {
        setMounted(true);
        initData(userEmail, true);
        setAuthLoading(false);
        return;
      }

      const { data: isPartner } = await supabase
        .from('allowed_partners')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle();

      if (isPartner) {
        setMounted(true);
        initData(userEmail, false);
        setAuthLoading(false);
      } else {
        router.push('/login');
      }
    };

    const initData = (email: string, isAdmin: boolean) => {
      fetchLeads(email, isAdmin);
      fetchStations();
      fetchRealTransactions();
    };

    checkProtection();

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
  }, [currentUserEmail]);

  async function fetchRealTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setRealTransactions(data as Transaction[]);
        const total = data.reduce((acc, curr) => acc + (Number(curr.amount_gross) || 0), 0);
        setTotalRevenue(total);
      }
    } catch (err) { console.log("Fin sync offline"); }
  }

  async function fetchLeads(email = currentUserEmail, isAdmin = currentUserEmail === 'admin@azphur.com') {
    try {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5);
      if (!isAdmin && email) {
        query = query.eq('customer_email', email);
      }
      const { data, error } = await query;
      if (!error && data) setLeads(data as Lead[]);
    } catch (err) { console.log("Lead sync offline"); }
  }

  async function fetchStations() {
    try {
      const { data, error } = await supabase.from('charging_stations').select('*');
      if (!error && data) setStations(data as Station[]);
    } catch (err) { console.log("Map sync offline"); }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newBudget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            interest: newInterest,
            budget: Number(newBudget) || 0,
            created_at: new Date().toISOString(),
            customer_email: currentUserEmail
          }
        ]);

      if (!error) {
        setNewBudget('');
        const isAdmin = currentUserEmail === 'admin@azphur.com';
        await fetchLeads(currentUserEmail, isAdmin);
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Funzione nativa JS per scaricare al volo il CSV delle transazioni/report
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funzione Centralizzata per scaricare i file dal Bucket "b2b-documents" di Supabase
  const handleDownloadFile = (folder: string, fileName: string) => {
    const { data } = supabase.storage
      .from('b2b-documents')
      .getPublicUrl(`${folder}/${fileName}`);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfbf7', fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: '2px', color: '#0ea5e9' }}>
        SECURE_GATEWAY: VERIFYING_AUTH_CREDENTIALS...
      </div>
    );
  }

  if (!mounted) return null;

  // ==========================================
  // VIEW: 1. DASHBOARD PRINCIPALE
  // ==========================================
  const renderDashboard = () => (
    <div className="fade-in">
      {/* FORM: REQUEST INFRASTRUCTURE EXPANSION */}
      <div className="asset-section" style={{ marginBottom: '40px', borderLeft: '8px solid #0ea5e9' }}>
        <h3 className="section-subtitle">REQUEST INFRASTRUCTURE EXPANSION</h3>
        <form onSubmit={handleCreateLead} className="control-center-grid" style={{ alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>HARDWARE_EXPANSION_TYPE</label>
            <select 
              value={newInterest} 
              onChange={(e) => setNewInterest(e.target.value)}
              style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#111', outline: 'none' }}
            >
              <option value="SOLAR_INSTALL">ADDITIONAL_SOLAR_ARRAY</option>
              <option value="WIND_TURBINE_HUB">WIND_TURBINE_EXTENSION</option>
              <option value="EV_CHARGING_STATION">COMMERCIAL_EV_STATION</option>
              <option value="MICROGRID_SETUP">INDUSTRIAL_BATTERY_STORAGE</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>ALLOCATED_BUDGET (PHP)</label>
            <input 
              type="number" 
              placeholder="e.g. 500000"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#111', outline: 'none' }}
              required
            />
          </div>
          <div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ width: '100%', padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', transition: '0.2s', opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? 'DISPATCHING PROPOSAL...' : 'REQUEST EXPANSION ⚡'}
            </button>
          </div>
        </form>
      </div>

      {/* MAPPA */}
      <section className="asset-section" style={{ marginBottom: '40px' }}>
        <h3 className="section-subtitle">ARCHIPELAGO_GRID_VISUALIZER (DATA_CONTROL)</h3>
        <div className="map-viz-container" style={{ height: '350px', background: '#f8fafc', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '250px', height: '300px', position: 'relative' }}>
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

      {/* EXPANSION FEED */}
      <section className="asset-section" style={{ marginBottom: '30px' }}>
        <h3 className="section-subtitle">ACTIVE_EXPANSION_REQUESTS</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>REQUEST_ID</th><th>HARDWARE_TYPE</th><th>STATUS</th><th>EST_BUDGET</th></tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={i}>
                  <td className="mono-id">{lead.id ? lead.id.split('-')[0].toUpperCase() : `REQ-${100 + i}`}</td>
                  <td className="bold-text" style={{ color: '#111' }}>{lead.interest || 'SOLAR_INSTALL'}</td>
                  <td style={{ color: '#0ea5e9' }} className="status-text">● {i === 0 ? 'ENGINEERING_REVIEW' : 'PIPELINE_QUEUED'}</td>
                  <td className="heavy-text" style={{ color: '#111' }}>₱{Number(lead.budget || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ENERGY ASSETS */}
      <section className="asset-section">
        <h3 className="section-subtitle">CONNECTED_INFRASTRUCTURE_ASSETS</h3>
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

  // ==========================================
  // VIEW: 2. ESG REPORTING
  // ==========================================
  const renderESG = () => (
    <div className="fade-in">
      <div className="kpi-grid">
        {[
          { label: "CO2 AVOIDED (ESG TOTAL)", value: "42.8 Tons", color: "#10b981", sub: "Verified Carbon Offset" },
          { label: "CLEAN ENERGY GENERATED", value: "1,240,850 kWh", color: "#0ea5e9", sub: "Total Lifetime Production" },
          { label: "COMPLIANCE SCORE", value: "100%", color: "#111", sub: "DENR Standards Met" }
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <h3 className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</h3>
            <p className="kpi-sub">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="asset-section" style={{ borderLeft: '8px solid #10b981' }}>
        <h3 className="section-subtitle">TAX & SUSTAINABILITY REPORTING</h3>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
          Download the official verified corporate report by AZPHUR to append to your company financial statements for environmental sustainability credits and tax incentives.
        </p>
        <button 
          onClick={() => handleDownloadFile('esg', `esg_report_${currentUserEmail}.pdf`)}
          style={{ padding: '14px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer', marginTop: '10px' }}
        >
          GENERATE OFFICIAL ESG CERTIFICATE 🌿
        </button>
      </div>
    </div>
  );

  // ==========================================
  // VIEW: 3. CONTRACTS & SLA
  // ==========================================
  const renderContracts = () => (
    <div className="fade-in">
      <div className="control-center-grid" style={{ marginBottom: '40px' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <p className="kpi-label">GUARANTEED_SLA_UPTIME</p>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#10b981', margin: '5px 0' }}>99.9%</p>
          <span style={{ fontSize: '11px', padding: '3px 8px', background: '#e0f2fe', color: '#0ea5e9', borderRadius: '6px', fontWeight: '700' }}>CONTRACTUAL_MAX_LIABILITY</span>
        </div>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <p className="kpi-label">PPA TARIFF RATE</p>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#111', margin: '5px 0' }}>₱5.80 <span style={{fontSize:'14px'}}>/kWh</span></p>
          <span style={{ fontSize: '11px', padding: '3px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontWeight: '700' }}>FIXED TIER-1 RATE</span>
        </div>
      </div>

      <section className="asset-section">
        <h3 className="section-subtitle">ACTIVE LEGAL AGREEMENTS</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>DOCUMENT NAME</th><th>TYPE</th><th>STATUS</th><th>ACTION</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="bold-text">Power Purchase Agreement (PPA) 2026</td>
                <td className="mono-id">ENERGY_SUPPLY</td>
                <td style={{ color: '#10b981' }} className="status-text">● ACTIVE</td>
                <td><button onClick={() => handleDownloadFile('contracts', `ppa_${currentUserEmail}.pdf`)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>DOWNLOAD PDF</button></td>
              </tr>
              <tr>
                <td className="bold-text">Infrastructure SLA & Maintenance Covenant</td>
                <td className="mono-id">HARDWARE_SLA</td>
                <td style={{ color: '#10b981' }} className="status-text">● ACTIVE</td>
                <td><button onClick={() => handleDownloadFile('contracts', `sla_${currentUserEmail}.pdf`)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>DOWNLOAD PDF</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  // ==========================================
  // VIEW: 4. BILLING & INVOICES
  // ==========================================
  const renderBilling = () => (
    <div className="fade-in">
      <div className="main-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '20px' }}>
        <div>
          <p className="kpi-label">TOTAL LIVE VOLUME TRANSACTION</p>
          <h2 style={{ fontSize: '36px', fontWeight: '900', margin: 0, color: '#0ea5e9' }}>₱{totalRevenue.toLocaleString()}</h2>
        </div>
        <button 
          onClick={() => exportToCSV(realTransactions, `AZPHUR_B2B_Billing_Report`)}
          style={{ background: '#111', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          EXPORT REPORT (CSV) 📊
        </button>
      </div>

      <section className="asset-section">
        <h3 className="section-subtitle">TRANSACTION HISTORY & INVOICING</h3>
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr><th>TX_ID</th><th>STATUS</th><th>AMOUNT</th><th>TIMESTAMP</th><th>INVOICE</th></tr>
            </thead>
            <tbody>
              {realTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="mono-id">{tx.id ? tx.id.split('-')[0].toUpperCase() : 'TX_LIVE'}</td>
                  <td style={{ color: '#22c55e' }} className="status-text">● {tx.status ? tx.status.toUpperCase() : 'COMPLETED'}</td>
                  <td className="heavy-text" style={{ color: '#111' }}>₱{Number(tx.amount_gross || 0).toLocaleString()}</td>
                  <td style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDownloadFile('invoices', `invoice_${tx.id}.pdf`)}
                      style={{ background: '#e0f2fe', border: 'none', color: '#0ea5e9', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
                    >
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  // ==========================================
  // VIEW: 5. CORPORATE SUPPORT
  // ==========================================
  const renderSupport = () => (
    <div className="fade-in" style={{ maxWidth: '600px' }}>
      <section className="asset-section" style={{ borderLeft: '8px solid #0ea5e9' }}>
        <h3 className="section-subtitle">YOUR DEDICATED KEY ACCOUNT MANAGER</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '24px' }}>
            AZ
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Sacha Operations Team</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Key Account Executive Manager</p>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
          For any network expansion requests, extraordinary asset technical support in the Philippines, or accounting clarifications, you have a dedicated direct line with zero waiting times.
        </p>
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <a href="mailto:support@azphur.com" style={{ display: 'inline-block', textDecoration: 'none', background: '#111', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>
            CONTACT VIA EMAIL
          </a>
          <button onClick={() => alert('Opening Secure Video Call Bridge...')} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#111', padding: '12px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
            SCHEDULE CALL
          </button>
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
        
        .sidebar { width: 280px; height: 100vh; border-right: 1px solid #e5e7eb; padding: 40px 24px; position: fixed; background-color: #fff; display: flex; flex-direction: column; z-index: 100; top: 0; left: 0; }
        .logo-wrapper { display: flex; align-items: center; gap: 12px; margin-bottom: 50px; text-decoration: none; }
        .sidebar-brand-img { height: 30px; width: auto; }
        .sidebar-logo-text { color: #0ea5e9; font-weight: 900; font-size: 22px; letter-spacing: 4px; }
        .nav-group { display: flex; flex-direction: column; gap: 8px; }
        .nav-btn { text-align: left; padding: 14px 18px; border-radius: 12px; border: none; cursor: pointer; background: transparent; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: 1px; transition: 0.2s; white-space: nowrap; }
        .nav-btn.active { background: #e0f2fe; color: #0ea5e9; }
        
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

        @media (max-width: 768px) {
          .b2b-container { flex-direction: column; }
          .sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid #e5e7eb; padding: 20px; box-sizing: border-box; }
          .logo-wrapper { margin-bottom: 20px; justify-content: center; }
          .nav-group { flex-direction: row !important; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; gap: 4px !important; }
          .nav-btn { padding: 10px 14px; font-size: 10px; }
          .main-stage { margin-left: 0; width: 100%; padding: 24px; }
          .main-header { flex-direction: column; align-items: flex-start; gap: 20px; margin-bottom: 30px; }
          .main-title { font-size: 32px; }
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
          {[
            { id: 'Dashboard', label: 'Dashboard' },
            { id: 'ESG Reporting', label: 'ESG Reporting' },
            { id: 'Contracts & SLA', label: 'Contracts & SLA' },
            { id: 'Billing & Invoices', label: 'Billing & Invoices' },
            { id: 'Corporate Support', label: 'Corporate Support' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.label.toUpperCase()}
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
        {activeTab === 'ESG Reporting' && renderESG()}
        {activeTab === 'Contracts & SLA' && renderContracts()}
        {activeTab === 'Billing & Invoices' && renderBilling()}
        {activeTab === 'Corporate Support' && renderSupport()}
      </main>
    </div>
  );
}