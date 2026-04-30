"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: number; 
  name: string;
  price: number;
  quantity: number;
  status: string;
  provider?: string;
  type?: string;
  eta?: string;
  origin?: string;
  destination?: string;
  created_at?: string;
  customer_email?: string;
}

interface Shipment {
  realId: number; 
  id: string;
  provider: string;
  origin: string;
  destination: string;
  type: string;
  weight: string;
  status: 'Processing' | 'In Transit' | 'Delivered' | 'On Hold';
  eta: string;
  progress: number;
  price: string;
}

export default function S2BCombinedPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Inventory' | 'Shipments' | 'Providers'>('Shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [newOrder, setNewOrder] = useState({
    id: "", provider: "", origin: "", destination: "", type: "", weight: "", eta: "", price: "", customer_email: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const adminEmails = ['admin@azphur.com', 'tuofratello@email.com']; 
        const userEmail = session.user.email || '';
        if (adminEmails.includes(userEmail)) {
          setUserRole('ADMIN');
          fetchCloudShipments('ADMIN', userEmail);
        } else {
          setUserRole('CUSTOMER');
          fetchCloudShipments('CUSTOMER', userEmail);
        }
      }
    };
    checkAuth();
  }, [router]);

  const fetchCloudShipments = async (role: 'ADMIN' | 'CUSTOMER', email: string) => {
    setLoading(true);
    try {
      let query = supabase.from('inventory').select('*');
      if (role !== 'ADMIN') {
        query = query.eq('customer_email', email);
      }
      const { data } = await query.order('created_at', { ascending: false });

      if (data) {
        const mappedData: Shipment[] = data.map((item: InventoryItem) => {
          let portalStatus: Shipment['status'] = 'Processing';
          const dbStatus = item.status?.toUpperCase().replace('_', ' ');
          if (dbStatus === 'DELIVERED') portalStatus = 'Delivered';
          else if (dbStatus === 'IN TRANSIT') portalStatus = 'In Transit';
          else if (dbStatus === 'ON HOLD') portalStatus = 'On Hold';

          return {
            realId: item.id,
            id: item.id.toString().slice(-6),
            provider: item.provider || 'Global Supplier',
            origin: item.origin || 'International Port',
            destination: item.destination || 'Manila Hub',
            type: item.name,
            weight: 'TBD',
            status: portalStatus,
            eta: item.eta || 'TBD',
            progress: 0,
            price: item.price?.toString() || "0"
          };
        });
        setShipments(mappedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCargoStatus = async (realId: number, currentStatus: string) => {
    if (userRole !== 'ADMIN') return;
    const states: Shipment['status'][] = ['Processing', 'In Transit', 'Delivered', 'On Hold'];
    const currentIndex = states.indexOf(currentStatus as any);
    const nextStatus = states[(currentIndex + 1) % states.length];
    await supabase.from('inventory').update({ status: nextStatus.toUpperCase().replace(' ', '_') }).eq('id', realId);
    const { data: { session } } = await supabase.auth.getSession();
    fetchCloudShipments(userRole, session?.user?.email || '');
  };

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
      eta: newOrder.eta,
      customer_email: newOrder.customer_email
    };
    const { error } = await supabase.from('inventory').insert([payload]);
    if (!error) {
      setIsModalOpen(false);
      setNewOrder({ id: "", provider: "", origin: "", destination: "", type: "", weight: "", eta: "", price: "", customer_email: "" });
      const { data: { session } } = await supabase.auth.getSession();
      fetchCloudShipments('ADMIN', session?.user?.email || '');
    }
  };

  const filteredShipments = shipments.filter(ship => 
    ship.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ship.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return { bg: '#00ff8810', text: '#00ff88', border: '#00ff8820' };
      case 'In Transit': return { bg: '#22d3ee10', text: '#22d3ee', border: '#22d3ee20' };
      case 'On Hold': return { bg: '#ef444410', text: '#ef4444', border: '#ef444420' };
      case 'Processing': return { bg: '#eab30810', text: '#eab308', border: '#eab30820' };
      default: return { bg: '#333', text: '#fff', border: '#444' };
    }
  };

  return (
    <div className="portal-container">
      
      {/* SIDEBAR - Adattiva */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <button onClick={() => router.push('/')} className="back-btn">&larr; HOME</button>
          <div className="logo-section">
            <span className="logo-text">AZPHUR</span>
            <span className="logo-subtext">LOGISTICS</span>
          </div>
          <nav className="nav-links">
            {['Shipments', 'Inventory', 'Providers'].map(item => (
              <div key={item} onClick={() => setActiveTab(item as any)}
                className={`nav-item ${activeTab === item ? 'active' : ''}`}>
                {item.toUpperCase()}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <div className="header-section">
          <div>
            <h1 className="main-title">S2B <span style={{ color: '#22d3ee' }}>GATEWAY</span></h1>
            <p className="access-label">
                MODE: <span style={{color: userRole === 'ADMIN' ? '#22d3ee' : '#eab308'}}>{userRole}</span>
            </p>
          </div>
          {userRole === 'ADMIN' && (
            <button onClick={() => setIsModalOpen(true)} className="add-cargo-btn">+ NEW</button>
          )}
        </div>

        <input 
          placeholder="Search cargo..." 
          className="search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="data-container">
          {/* VIEW PER DESKTOP (Tabella) */}
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Cargo Ref</th>
                  <th>Route</th>
                  <th>Valuation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredShipments.map((ship, index) => {
                  const colors = getStatusColor(ship.status);
                  return (
                    <tr key={index}>
                      <td>
                        <div className="ref-id">AZ-{ship.id}</div>
                        <div className="item-type">{ship.type}</div>
                      </td>
                      <td>
                        <div className="route-text">{ship.origin} &rarr; {ship.destination}</div>
                        <div className="provider-text">{ship.provider}</div>
                      </td>
                      <td className="price-text">₱{Number(ship.price).toLocaleString()}</td>
                      <td>
                        <div onClick={() => updateCargoStatus(ship.realId, ship.status)}
                          className="status-badge" style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          {ship.status.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VIEW PER MOBILE (Cards) */}
          <div className="mobile-list">
            {loading ? <p className="loading-text">SYNCING...</p> : filteredShipments.map((ship, index) => {
               const colors = getStatusColor(ship.status);
               return (
                 <div key={index} className="mobile-card">
                   <div className="card-header">
                     <span className="ref-id">AZ-{ship.id}</span>
                     <div onClick={() => updateCargoStatus(ship.realId, ship.status)}
                          className="status-badge" style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          {ship.status.toUpperCase()}
                     </div>
                   </div>
                   <div className="card-body">
                     <p><strong>Item:</strong> {ship.type}</p>
                     <p><strong>Route:</strong> {ship.origin} &rarr; {ship.destination}</p>
                     <p><strong>Price:</strong> ₱{Number(ship.price).toLocaleString()}</p>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>REGISTER CARGO</h3>
            <form onSubmit={handleCloudSubmit}>
              <input placeholder="Customer Email" required onChange={e => setNewOrder({...newOrder, customer_email: e.target.value})} />
              <input placeholder="Provider" required onChange={e => setNewOrder({...newOrder, provider: e.target.value})} />
              <input placeholder="Origin" required onChange={e => setNewOrder({...newOrder, origin: e.target.value})} />
              <input placeholder="Destination" required onChange={e => setNewOrder({...newOrder, destination: e.target.value})} />
              <input placeholder="Hardware Description" required onChange={e => setNewOrder({...newOrder, type: e.target.value})} />
              <input type="number" placeholder="Value (PHP)" required onChange={e => setNewOrder({...newOrder, price: e.target.value})} />
              <button type="submit" className="submit-btn">PUSH TO HQ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="abort-btn">ABORT</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .portal-container { background-color: #050505; min-height: 100vh; color: #fff; display: flex; flex-direction: column; }
        .sidebar { width: 100%; background-color: #0a0a0a; border-bottom: 1px solid #111; padding: 15px; }
        .sidebar-content { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }
        .back-btn { background: none; border: 1px solid #1a1a1a; color: #555; padding: 8px; border-radius: 8px; font-size: 10px; cursor: pointer; }
        .logo-section { display: none; }
        .nav-links { display: flex; gap: 10px; }
        .nav-item { padding: 8px 12px; border-radius: 8px; font-size: 10px; cursor: pointer; color: #444; }
        .nav-item.active { background: #22d3ee10; color: #22d3ee; }

        .main-content { padding: 20px; width: 100%; }
        .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .main-title { font-size: 24px; font-weight: 900; font-style: italic; }
        .access-label { font-size: 9px; color: #444; }
        .add-cargo-btn { background: #fff; color: #000; padding: 10px 15px; border-radius: 10px; font-weight: bold; font-size: 12px; border: none; }
        .search-input { width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 10px; color: #fff; margin-bottom: 20px; }

        .desktop-table { display: none; }
        .mobile-list { display: flex; flex-direction: column; gap: 15px; }
        .mobile-card { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 15px; border-radius: 15px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .card-body p { font-size: 12px; color: #888; margin: 5px 0; }
        .card-body strong { color: #fff; }
        .ref-id { color: #22d3ee; font-weight: 900; }
        .status-badge { padding: 5px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; padding: 20px; z-index: 100; }
        .modal-content { background: #0a0a0a; padding: 25px; border-radius: 20px; border: 1px solid #22d3ee; width: 100%; max-width: 400px; }
        .modal-content input { width: 100%; padding: 12px; background: #000; border: 1px solid #1a1a1a; border-radius: 8px; color: #fff; margin-bottom: 10px; }
        .submit-btn { width: 100%; padding: 15px; background: #22d3ee; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; }
        .abort-btn { width: 100%; background: none; border: none; color: #444; margin-top: 10px; cursor: pointer; }

        @media (min-width: 768px) {
          .portal-container { flex-direction: row; }
          .sidebar { width: 260px; height: 100vh; position: fixed; border-right: 1px solid #111; border-bottom: none; }
          .sidebar-content { flex-direction: column; align-items: flex-start; justify-content: flex-start; height: 100%; }
          .logo-section { display: block; margin: 30px 0; }
          .nav-links { flex-direction: column; width: 100%; }
          .main-content { margin-left: 260px; padding: 50px; }
          .desktop-table { display: block; background: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a; overflow: hidden; }
          .mobile-list { display: none; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f0f0f; padding: 20px; text-align: left; font-size: 10px; color: #444; }
          td { padding: 20px; border-bottom: 1px solid #111; }
          .main-title { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}