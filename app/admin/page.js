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
        // Calcolo corretto: Prezzo x Quantità
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
    <div style={{ backgroundColor: '#020202', color: '#fff', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
           ← EXIT TERMINAL
         </Link>
         <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ color: loading ? '#eab308' : '#22c55e', fontSize: '10px', fontWeight: 'bold' }}>
              ● {loading ? 'SYNCING...' : 'LIVE DATA SYNC ACTIVE'}
            </span>
         </div>
      </div>

      <header style={{ textAlign: 'center', padding: '60px 0', background: 'radial-gradient(circle, #083344 0%, #020202 100%)', borderRadius: '40px', marginBottom: '40px', border: '1px solid #111' }}>
        <p style={{ color: '#06b6d4', fontWeight: 'bold', letterSpacing: '5px', fontSize: '10px', textTransform: 'uppercase' }}>Azphur Global Operations</p>
        <h1 style={{ fontSize: '50px', fontWeight: '900', margin: '10px 0', letterSpacing: '-2px', fontStyle: 'italic' }}>COMMAND <span style={{ color: '#06b6d4' }}>HQ.</span></h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto 40px' }}>
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '25px' }}>
          <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold' }}>ESTIMATED ASSET VALUE</p>
          <p style={{ fontSize: '36px', fontWeight: '900', margin: '10px 0' }}>₱{totalRevenue.toLocaleString()}</p>
        </div>
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '25px' }}>
          <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold' }}>ACTIVE ASSETS</p>
          <p style={{ fontSize: '36px', fontWeight: '900', margin: '10px 0', color: '#06b6d4' }}>{shipments.length}</p>
        </div>
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '25px' }}>
          <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold' }}>CO2 OFFSET (TONS)</p>
          <p style={{ fontSize: '36px', fontWeight: '900', margin: '10px 0' }}>{co2Saved.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '40px', borderRadius: '30px', background: 'radial-gradient(circle at center, #08334422 0%, #050505 100%)', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', marginBottom: '30px', color: '#06b6d4', letterSpacing: '2px' }}>ARCHIPELAGO GRID STATUS</h3>
            <div style={{ position: 'relative', height: '300px', display: 'flex', justifyContent: 'center' }}>
               <div style={{ position: 'relative', width: '200px', height: '300px' }}>
                  <div style={{ position: 'absolute', top: '10%', left: '30%' }} className="pulse-dot"><span style={{ fontSize: '8px', color: '#06b6d4', position: 'absolute', top: '15px', left: '-20px', width: '80px', fontWeight: 'bold' }}>LUZON HUB</span></div>
                  <div style={{ position: 'absolute', top: '45%', left: '60%' }} className="pulse-dot-green"><span style={{ fontSize: '8px', color: '#22c55e', position: 'absolute', top: '15px', left: '-20px', width: '80px', fontWeight: 'bold' }}>VISAYAS</span></div>
                  <div style={{ position: 'absolute', bottom: '15%', left: '40%' }} className="pulse-dot-yellow"><span style={{ fontSize: '8px', color: '#eab308', position: 'absolute', top: '15px', left: '-20px', width: '80px', fontWeight: 'bold' }}>MINDANAO</span></div>
               </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '30px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', marginBottom: '20px', color: '#06b6d4', letterSpacing: '2px' }}>INITIALIZE NEW ASSET INFLOW</h3>
            <form onSubmit={handleAddAsset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input 
                required
                style={{ gridColumn: 'span 2', backgroundColor: '#000', border: '1px solid #111', padding: '15px', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                placeholder="ASSET NAME (e.g. TITAN PV-580W)"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <input 
                type="number" required
                style={{ backgroundColor: '#000', border: '1px solid #111', padding: '15px', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                placeholder="QUANTITY"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
              />
              <input 
                type="number" required
                style={{ backgroundColor: '#000', border: '1px solid #111', padding: '15px', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                placeholder="PRICE (PHP)"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
              />
              <button 
                type="submit"
                style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }}
              >
                EXECUTE INFLOW PROTOCOL
              </button>
            </form>
          </div>
        </div>

        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '30px', borderRadius: '30px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', marginBottom: '20px', color: '#fff', letterSpacing: '2px' }}>LIVE INVENTORY DATABASE</h3>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '600px', paddingRight: '10px' }}>
                {shipments.length > 0 ? (
                    shipments.map((s) => (
                        <div key={s.id} style={{ borderBottom: '1px solid #111', paddingBottom: '15px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#06b6d4' }}>{s.name}</span>
                                <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>{s.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <p style={{ fontSize: '10px', color: '#fff', margin: 0 }}>Qty: {s.quantity} | Value: ₱{(s.price * s.quantity).toLocaleString()}</p>
                                <p style={{ fontSize: '8px', color: '#444', margin: '5px 0 0 0', fontFamily: 'monospace' }}>ID: {s.id}</p>
                              </div>
                              <button 
                                onClick={() => deleteAsset(s.id)}
                                style={{ background: 'none', border: '1px solid #300', color: '#991b1b', fontSize: '8px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                TERMINATE
                              </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#444', fontSize: '11px' }}>{loading ? 'Initializing Satellite Link...' : 'No records in database.'}</p>
                )}
            </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '60px 0', opacity: 0.2, fontSize: '9px', letterSpacing: '2px' }}>
        AZPHUR ARCHIPELAGO OS V.2.1 // 2026 // SHAPING SUSTAINABLE POSSIBILITIES
      </footer>

      <style jsx>{`
        .pulse-dot { width: 10px; height: 10px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 15px #06b6d4; animation: p 2s infinite; }
        .pulse-dot-green { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 15px #22c55e; animation: p 2s infinite; }
        .pulse-dot-yellow { width: 9px; height: 9px; background: #eab308; border-radius: 50%; box-shadow: 0 0 15px #eab308; animation: p 2s infinite; }
        @keyframes p {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: #222; }
      `}</style>
    </div>
  );
}