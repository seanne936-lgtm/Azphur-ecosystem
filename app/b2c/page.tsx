"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 

export default function TitanStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "" });
  const [mounted, setMounted] = useState(false);

  // Dati di fallback (Perfetti per la demo del Sir)
  const fallbackKits = [
    { 
      id: "KIT-RES-1", 
      name: "Titan Home Core", 
      tier: "ESSENTIAL",
      price: 185000, 
      savings: "4,500",
      specs: "5.2kW Generation + 5kWh Storage",
      desc: "Perfect for independent households looking to eliminate monthly bills."
    },
    { 
      id: "KIT-ULTRA", 
      name: "Titan Ultra Max", 
      tier: "PREMIUM",
      price: 420000, 
      savings: "12,000",
      specs: "12kW Generation + 20kWh Storage",
      desc: "Full estate independence with zero-grid reliance and AI management."
    }
  ];

  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
      try {
        // Tentativo di caricamento da Supabase (se la tabella esiste)
        const { data, error } = await supabase.from('products').select('*');
        
        if (data && data.length > 0 && !error) {
          setProducts(data);
        } else {
          setProducts(fallbackKits);
        }
      } catch (e) {
        setProducts(fallbackKits);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Algoritmo di Luhn semplice per validare la carta nella demo
  const validateCard = (num: string) => {
    const value = num.replace(/\D/g, "");
    if (value.length !== 16) return false;
    let check = 0; let bEven = false;
    for (let n = value.length - 1; n >= 0; n--) {
      let nDigit = parseInt(value.charAt(n), 10);
      if (bEven && (nDigit *= 2) > 9) nDigit -= 9;
      check += nDigit; bEven = !bEven;
    }
    return (check % 10) === 0;
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard(cardData.number)) {
      alert("❌ SECURITY ALERT: Invalid transaction signature. Check card numbers.");
      return;
    }
    setCartCount(prev => prev + 1);
    setIsPaying(false);
    alert("✅ TRANSACTION VERIFIED: Your Titan System is now being prepared for deployment.");
  };

  if (!mounted) return null;

  return (
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: '30px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#22d3ee', fontWeight: '900', fontSize: '20px', letterSpacing: '2px' }}>AZPHUR</Link>
            <span style={{ color: '#333', fontSize: '18px' }}>/</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>TITAN RETAIL</span>
        </div>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', border: '1px solid #22d3ee', color: '#22d3ee', padding: '8px 20px', borderRadius: '30px' }}>
                CART: {cartCount} ITEMS
            </div>
            <Link href="/" style={{ textDecoration: 'none', color: '#444', fontSize: '11px', fontWeight: 'bold' }}>EXIT STORE</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '100px 20px', textAlign: 'center', background: 'radial-gradient(circle at center, #0a0a0a 0%, #020202 100%)' }}>
        <h3 style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '6px', fontWeight: 'bold', marginBottom: '20px' }}>PHASE 03: HOUSEHOLD INDEPENDENCE</h3>
        <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0', letterSpacing: '-3px', fontStyle: 'italic' }}>TITAN <span style={{ color: '#22d3ee' }}>SERIES.</span></h1>
        <p style={{ color: '#555', maxWidth: '600px', margin: '30px auto', fontSize: '16px', lineHeight: '1.6' }}>
          {loading ? "INITIALIZING PRODUCT DATABASE..." : "Stop buying energy. Start owning the source."}
        </p>
      </div>

      {/* DYNAMIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', padding: '0 50px 100px', maxWidth: '1400px', margin: '0 auto' }}>
        {products.map(kit => (
          <div key={kit.id} style={{ backgroundColor: '#050505', borderRadius: '40px', border: '1px solid #111', padding: '40px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: '0.3s' }}>
            <div style={{ position: 'absolute', top: '20px', right: '40px', color: '#111', fontSize: '80px', fontWeight: '900', zIndex: 0, opacity: 0.3 }}>{kit.tier?.[0] || 'T'}</div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#22d3ee', letterSpacing: '2px' }}>{kit.tier || 'TITAN'}</span>
                <h3 style={{ fontSize: '30px', fontWeight: '900', margin: '15px 0' }}>{kit.name}</h3>
                <p style={{ color: '#555', fontSize: '14px', marginBottom: '30px', minHeight: '42px', lineHeight: '1.5' }}>{kit.desc}</p>
                
                <div style={{ backgroundColor: '#000', padding: '20px', borderRadius: '20px', marginBottom: '30px', border: '1px solid #0f0f0f' }}>
                    <div style={{ fontSize: '10px', color: '#22d3ee', marginBottom: '5px', fontWeight: 'bold', letterSpacing: '1px' }}>ESTIMATED SAVINGS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900' }}>₱{kit.savings}<span style={{ fontSize: '12px', color: '#444' }}> / month</span></div>
                </div>

                <div style={{ fontSize: '13px', color: '#888', marginBottom: '40px', lineHeight: '2' }}>
                    • {kit.specs} <br />
                    • AI Grid Synchronization <br />
                    • 10 Year Titan Warranty
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '9px', color: '#444', fontWeight: 'bold' }}>FULL DEPLOYMENT</div>
                        <div style={{ fontSize: '22px', fontWeight: '900' }}>₱{Number(kit.price).toLocaleString()}</div>
                    </div>
                    <button 
                        onClick={() => { setSelectedProduct(kit); setIsPaying(true); }}
                        style={{ backgroundColor: kit.tier === 'PREMIUM' ? '#22d3ee' : '#fff', color: '#000', border: 'none', padding: '15px 35px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}
                    >
                        ORDER NOW
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAYMENT MODAL */}
      {isPaying && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ backgroundColor: '#000', padding: '50px', borderRadius: '40px', border: '1px solid #22d3ee', width: '100%', maxWidth: '450px', boxShadow: '0 0 50px rgba(34, 211, 238, 0.1)' }}>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '900', fontStyle: 'italic' }}>SECURE GATEWAY</h2>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', marginBottom: '30px' }}>UNIT: {selectedProduct?.name.toUpperCase()}</p>
            
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '9px', color: '#22d3ee', fontWeight: 'bold' }}>CREDIT CARD NUMBER</label>
                  <input 
                    required placeholder="0000 0000 0000 0000" maxLength={16}
                    style={{ width: '100%', padding: '18px', backgroundColor: '#050505', border: '1px solid #111', borderRadius: '15px', color: '#fff', letterSpacing: '4px', textAlign: 'center' }}
                    onChange={e => setCardData({...cardData, number: e.target.value})}
                  />
              </div>
              <button type="submit" style={{ backgroundColor: '#22d3ee', color: '#000', padding: '20px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' }}>
                AUTHORIZE ₱{Number(selectedProduct?.price).toLocaleString()}
              </button>
              <button type="button" onClick={() => setIsPaying(false)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>ABORT TRANSACTION</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}