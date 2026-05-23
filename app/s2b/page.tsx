"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function S2BCombinedPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Inventory' | 'Shipments' | 'Providers'>('Shipments');
  const [shipments, setShipments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [newOrder, setNewOrder] = useState({
    customer_email: "", provider: "", origin: "", destination: "", type: "", price: ""
  });

  const statusCycle = ['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'ON_HOLD'];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const adminEmails = ['admin@azphur.com', 'tuofratello@email.com']; 
        const userEmail = session.user.email || '';
        const role = adminEmails.includes(userEmail) ? 'ADMIN' : 'CUSTOMER';
        setUserRole(role);
        fetchCloudShipments(role, userEmail);
      }
    };
    checkAuth();
  }, [router]);

  const fetchCloudShipments = async (role: string, email: string) => {
    setLoading(true);
    try {
      let query = supabase.from('inventory').select('*');
      if (role !== 'ADMIN') query = query.eq('customer_email', email);
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data) {
        setShipments(data.map((item: any) => ({
          realId: item.id,
          id: item.id.toString(),
          provider: item.provider || 'Global Supplier',
          origin: item.origin || 'Intl Port',
          destination: item.destination || 'Manila Hub',
          type: item.name,
          status: item.status || 'PROCESSING',
          price: item.price || 0
        })));
      }
    } catch (err) {
      console.error("Errore fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipId: string, currentStatus: string) => {
    if (userRole !== 'ADMIN') return;
    const currentIndex = statusCycle.indexOf(currentStatus.toUpperCase());
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];
    setShipments(prev => prev.map(s => s.id === shipId ? { ...s, status: nextStatus } : s));
    const { error } = await supabase.from('inventory').update({ status: nextStatus }).match({ id: shipId });
    if (error) {
      const { data: { session } } = await supabase.auth.getSession();
      fetchCloudShipments(userRole, session?.user?.email || '');
      alert("Errore nel salvataggio dello stato.");
    }
  };

  const filteredData = shipments.filter(item => {
    const cleanSearch = searchTerm.toLowerCase().replace('az-', '');
    return (
      item.id.toLowerCase().includes(cleanSearch) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newOrder.type,
      price: parseFloat(newOrder.price) || 0,
      quantity: 1,
      status: 'PROCESSING',
      provider: newOrder.provider,
      origin: newOrder.origin,
      destination: newOrder.destination,
      customer_email: newOrder.customer_email
    };
    const { error } = await supabase.from('inventory').insert([payload]);
    if (!error) {
      setIsModalOpen(false);
      setNewOrder({ customer_email: "", provider: "", origin: "", destination: "", type: "", price: "" });
      const { data: { session } } = await supabase.auth.getSession();
      fetchCloudShipments(userRole, session?.user?.email || '');
    }
  };

  return (
    <div className="portal-container">
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="logo-group" onClick={() => router.push('/')}>
            <img src="/logo-azphur.avif" alt="AZPHUR" className="main-logo" />
            <div className="status-orb"></div>
          </div>
          <nav className="nav-links">
            {['Shipments', 'Inventory', 'Providers'].map(item => (
              <div key={item} onClick={() => setActiveTab(item as any)}
                className={`nav-item ${activeTab === item ? 'active' : ''}`}>
                <span className="nav-dot">•</span> {item.toUpperCase()}
              </div>
            ))}
          </nav>
          <button onClick={() => router.push('/')} className="back-btn">EXIT_HQ</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="header-wrapper">
          <div className="title-section">
            <span className="phase-label">OPERATIONAL_CORE_v2.06</span>
            <h1 className="main-title-cyan">LOGISTICS GATEWAY</h1>
          </div>
          <div className="actions-section">
            <div className="search-container">
              <input 
                placeholder="Search AZ-Ref (es. AZ-6)..." 
                className="smooth-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {userRole === 'ADMIN' && (
              <button onClick={() => setIsModalOpen(true)} className="modern-add-btn">
                + REGISTER_NEW_CARGO
              </button>
            )}
          </div>
        </div>

        {activeTab === 'Shipments' && (
          <div className="data-container">
            <div className="desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>REF / ASSET_INFO</th>
                    <th>LOGISTICS_ROUTE</th>
                    <th>STATUS {userRole === 'ADMIN' && "(CLICK TO CHANGE)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredData.map((ship, index) => (
                    <tr key={index}>
                      <td className="ref-id-cell">
                        <div className="ref-id">AZ-{ship.id}</div>
                        <div className="asset-sub-info">
                          <span className="sub-type">{ship.type}</span>
                          <span className="sub-price">₱{Number(ship.price).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="route-text">{ship.origin} → {ship.destination}</div>
                        <div className="provider-text">{ship.provider}</div>
                      </td>
                      <td>
                        <span 
                          onClick={() => handleStatusUpdate(ship.id, ship.status)}
                          className={`status-badge st-${ship.status.toLowerCase().replace(' ', '_')} ${userRole === 'ADMIN' ? 'clickable' : 'readonly'}`}
                        >
                          {ship.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && !loading && <div className="empty-state">NO_ASSETS_FOUND</div>}
            </div>
          </div>
        )}

        {(activeTab === 'Inventory' || activeTab === 'Providers') && (
            <div className="info-card">
              <h3>{activeTab.toUpperCase()}</h3>
              <p>Database node sync active...</p>
            </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">REGISTER_NEW_CARGO</h2>
              <p className="modal-subtitle">Initialize asset deployment in the logistics grid.</p>
            </div>
            <form onSubmit={handleCloudSubmit} className="modern-form">
              <div className="form-group">
                <label>CUSTOMER_EMAIL</label>
                <input required type="email" placeholder="client@access.com" value={newOrder.customer_email} onChange={e => setNewOrder({...newOrder, customer_email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>PROVIDER</label>
                <input required type="text" placeholder="Supplier Node ID" value={newOrder.provider} onChange={e => setNewOrder({...newOrder, provider: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ORIGIN</label>
                  <input required type="text" placeholder="Loading Point" value={newOrder.origin} onChange={e => setNewOrder({...newOrder, origin: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>DESTINATION</label>
                  <input required type="text" placeholder="Target Hub" value={newOrder.destination} onChange={e => setNewOrder({...newOrder, destination: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>HARDWARE_DESCRIPTION</label>
                <input required type="text" placeholder="Asset Item Name" value={newOrder.type} onChange={e => setNewOrder({...newOrder, type: e.target.value})} />
              </div>
              <div className="form-group">
                <label>VALUE (PHP)</label>
                <input required type="number" placeholder="0.00" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="execute-btn">EXECUTE_DEPLOYMENT</button>
                <button type="button" className="abort-btn" onClick={() => setIsModalOpen(false)}>ABORT_MISSION</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* TABLE INFO STYLING */
        .ref-id-cell { display: flex; flex-direction: column; gap: 4px; }
        .asset-sub-info { display: flex; flex-direction: column; font-size: 10px; font-family: 'JetBrains Mono', monospace; }
        .sub-type { color: #64748b; font-weight: 700; text-transform: uppercase; }
        .sub-price { color: #0ea5e9; font-weight: 800; }

        /* MODAL STYLING */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #e2e8f0; box-sizing: border-box; }
        .modal-header { margin-bottom: 24px; }
        .modal-title { font-size: 20px; font-weight: 900; color: #111; letter-spacing: -0.5px; margin: 0; }
        .modal-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; }
        
        .modern-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; }
        .form-group input { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
        .form-group input:focus { border-color: #22d3ee; background: #fff; box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.1); }
        
        .modal-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .execute-btn { background: #111; color: #22d3ee; border: 1px solid #22d3ee; padding: 16px; border-radius: 12px; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.2s; width: 100%; }
        .execute-btn:hover { background: #22d3ee; color: #111; }
        .abort-btn { background: transparent; color: #94a3b8; border: none; padding: 10px; font-weight: 800; font-size: 11px; cursor: pointer; }
        .abort-btn:hover { color: #ef4444; }

        /* BADGES */
        .status-badge { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 1px; transition: 0.2s; display: inline-block; min-width: 100px; text-align: center; box-sizing: border-box; }
        .status-badge.clickable { cursor: pointer; }
        .st-processing { background: #fff7ed; color: #f97316; border: 1px solid #ffedd5; }
        .st-in_transit { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; }
        .st-delivered { background: #f0fdf4; color: #22c55e; border: 1px solid #dcfce7; }
        .st-on_hold { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }

        .portal-container { background: #fcfdfe; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
        .sidebar { background: #fff; border-bottom: 1px solid #eef2f6; padding: 15px 30px; box-sizing: border-box; }
        .sidebar-content { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .logo-group { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .main-logo { height: 42px; width: auto; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 8px rgba(34, 211, 238, 0.6); }
        .nav-links { display: flex; gap: 25px; }
        .nav-item { font-size: 13px; font-weight: 800; color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; }
        .nav-item.active { color: #111; }
        .nav-dot { color: #22d3ee; }
        .back-btn { padding: 8px 16px; background: #f1f5f9; border-radius: 10px; font-weight: 800; cursor: pointer; border: none; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
        
        .main-content { padding: 30px 20px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .header-wrapper { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
        .phase-label { font-size: 10px; color: #94a3b8; letter-spacing: 2px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        .main-title-cyan { font-size: 32px; font-weight: 900; color: #111; letter-spacing: -1px; margin: 5px 0 0 0; }
        
        .actions-section { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; width: 100%; }
        .search-container { flex: 1; min-width: 200px; }
        .smooth-search { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 14px 20px; border-radius: 14px; width: 100%; outline: none; font-size: 13px; font-weight: 600; box-sizing: border-box; }
        .smooth-search:focus { border-color: #22d3ee; background: #fff; }
        .modern-add-btn { background: #111; color: #22d3ee; border: 1px solid #22d3ee; padding: 14px 24px; border-radius: 14px; font-weight: 800; cursor: pointer; font-size: 12px; letter-spacing: 0.5px; box-sizing: border-box; width: 100%; }
        
        .data-container { width: 100%; }
        .desktop-table { background: #fff; border-radius: 20px; border: 1px solid #eef2f6; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02); width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 600px; }
        th { padding: 20px; text-align: left; font-size: 11px; color: #94a3b8; font-weight: 800; background: #fafafa; border-bottom: 1px solid #eef2f6; letter-spacing: 1px; }
        td { padding: 20px; border-bottom: 1px solid #f8fafc; color: #111; vertical-align: middle; }
        .ref-id { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0891b2; font-size: 15px; }
        .route-text { font-weight: 700; font-size: 14px; color: #111; }
        .provider-text { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
        .empty-state { padding: 40px; text-align: center; color: #94a3b8; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
        .info-card { background: #fff; border: 1px solid #eef2f6; padding: 30px; border-radius: 20px; }

        /* VIEWPORT REGOLE DESKTOP */
        @media (min-width: 768px) {
          .portal-container { flex-direction: row; }
          .sidebar { width: 280px; height: 100vh; border-right: 1px solid #eef2f6; border-bottom: none; position: sticky; top: 0; }
          .sidebar-content { flex-direction: column; height: 100%; padding: 40px 30px; align-items: flex-start; justify-content: flex-start; }
          .nav-links { flex-direction: column; width: 100%; margin: 60px 0; gap: 20px; }
          .back-btn { margin-top: auto; width: 100%; padding: 12px; text-align: center; }
          .main-content { padding: 50px 40px; }
          .header-wrapper { flex-direction: row; justify-content: space-between; align-items: flex-end; }
          .main-title-cyan { font-size: 38px; }
          .actions-section { width: auto; justify-content: flex-end; }
          .smooth-search { width: 280px; }
          .modern-add-btn { width: auto; }
        }

        @media (max-width: 768px) {
          .sidebar-content { padding: 10px 0; }
          .nav-links { gap: 15px; }
          .nav-item { font-size: 11px; }
          .main-logo { height: 32px; }
          
          /* TRASFORMAZIONE TABELLA MOBILE RESPONSIVE COERENTE */
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tr { margin-bottom: 15px; border: 1px solid #eef2f6; border-radius: 16px; background: #fff; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.01); }
          td { padding: 8px 0; border: none; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; }
          td:not(:last-child) { border-bottom: 1px dashed #f1f5f9; }
          .ref-id-cell { align-items: flex-start; }
          .asset-sub-info { align-items: flex-end; text-align: right; }
          .route-text { font-size: 13px; text-align: right; }
          .provider-text { text-align: right; }
          .form-row { grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>
    </div>
  );
}