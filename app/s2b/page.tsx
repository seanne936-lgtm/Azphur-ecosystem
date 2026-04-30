"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// ... (Le interfacce restano identiche)
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
  const [filterStatus, setFilterStatus] = useState("ALL");
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
        // --- ADMIN EMAIL CONFIGURATION ---
        // Aggiungi qui le email che devono avere i poteri da Admin
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
    } else {
      alert("Error: " + error.message);
    }
  };

  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = ship.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ship.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ship.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "ALL" || ship.status.toUpperCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', display: 'flex' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#0a0a0a', borderRight: '1px solid #111', padding: '20px', position: 'fixed', height: '100vh', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ marginBottom: '25px' }}>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              backgroundColor: 'transparent', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '10px', color: '#555',
              fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', width: '100%', fontWeight: 'bold', letterSpacing: '1px', transition: '0.3s'
            }}
          >
            &larr; BACK TO MAIN PAGE
          </button>
        </div>

        <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#22d3ee', fontStyle: 'italic' }}>AZPHUR</span>
            <span style={{ display: 'block', fontSize: '10px', color: '#444', letterSpacing: '2px' }}>LOGISTICS</span>
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {['Shipments', 'Inventory', 'Providers'].map(item => (
            <div key={item} onClick={() => setActiveTab(item as any)}
              style={{ 
                padding: '12px', borderRadius: '10px', fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold',
                color: activeTab === item ? '#22d3ee' : '#444', 
                backgroundColor: activeTab === item ? '#22d3ee10' : 'transparent', 
                cursor: 'pointer', transition: '0.2s' 
              }}>
              {item.toUpperCase()}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: '260px', padding: '50px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', fontStyle: 'italic' }}>S2B <span style={{ color: '#22d3ee' }}>GATEWAY</span></h1>
            <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                ACCESS MODE: <span style={{color: userRole === 'ADMIN' ? '#22d3ee' : '#eab308'}}>{userRole}</span>
            </p>
          </div>
          {userRole === 'ADMIN' && (
            <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,255,255,0.1)' }}>
              + REGISTER CARGO
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <input 
            placeholder="Search by ID, Provider or Hardware..." 
            style={{ flex: 2, padding: '15px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', color: '#fff', fontSize: '14px' }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ backgroundColor: '#0a0a0a', borderRadius: '20px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#0f0f0f' }}>
              <tr style={{ textAlign: 'left', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Cargo Ref / Item</th>
                <th style={{ padding: '20px' }}>Logistics Route</th>
                <th style={{ padding: '20px' }}>Valuation</th>
                <th style={{ padding: '20px' }}>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ color: '#22d3ee', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>
                      SYNCHRONIZING WITH GLOBAL NODES...
                    </div>
                  </td>
                </tr>
              ) : filteredShipments.length > 0 ? (
                filteredShipments.map((ship, index) => {
                  const colors = getStatusColor(ship.status);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #111', transition: '0.3s' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ color: '#22d3ee', fontWeight: '900', fontSize: '14px' }}>AZ-{ship.id}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{ship.type}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#fff' }}>{ship.origin} &rarr; {ship.destination}</div>
                        <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>Provider: {ship.provider}</div>
                      </td>
                      <td style={{ padding: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                        ₱{Number(ship.price).toLocaleString()}
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div 
                          onClick={() => updateCargoStatus(ship.realId, ship.status)}
                          style={{ 
                            display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', 
                            cursor: userRole === 'ADMIN' ? 'pointer' : 'default',
                            backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                            letterSpacing: '1px'
                          }}>
                          {ship.status.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '15px', fontSize: '40px' }}>📡</div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      NO ACTIVE SHIPMENTS FOUND
                    </div>
                    <div style={{ color: '#444', fontSize: '12px', maxWidth: '300px', margin: '0 auto', lineHeight: '1.6' }}>
                      Your radar is currently clear. Please contact <span style={{color: '#22d3ee'}}>Azphur Command HQ</span> to register and track your first cargo.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ADMIN MODAL */}
      {isModalOpen && userRole === 'ADMIN' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(10px)' }}>
          <div style={{ backgroundColor: '#0a0a0a', padding: '40px', borderRadius: '25px', border: '1px solid #22d3ee', width: '450px', boxShadow: '0 0 50px rgba(34, 211, 238, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px', color: '#fff', fontStyle: 'italic' }}>REGISTER NEW CARGO</h2>
            <form onSubmit={handleCloudSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '9px', color: '#22d3ee', fontWeight: 'bold', letterSpacing: '1px' }}>ASSIGN TO CUSTOMER (EMAIL)</label>
                <input placeholder="customer@email.com" required style={{ padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, customer_email: e.target.value})} />
              </div>
              <input placeholder="Provider Name" required style={{ padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, provider: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Origin" required style={{ flex: 1, padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, origin: e.target.value})} />
                <input placeholder="Dest." required style={{ flex: 1, padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, destination: e.target.value})} />
              </div>
              <input placeholder="Hardware Description (eg. Solar Kit X-1)" required style={{ padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, type: e.target.value})} />
              <input type="number" placeholder="Total Value (PHP)" required style={{ padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, price: e.target.value})} />
              <input type="date" style={{ padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', color: '#fff' }} onChange={e => setNewOrder({...newOrder, eta: e.target.value})} />
              <button type="submit" style={{ backgroundColor: '#22d3ee', color: '#000', padding: '15px', borderRadius: '10px', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px' }}>PUSH TO COMMAND HQ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>ABORT OPERATION</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}