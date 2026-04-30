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

  const validateCard = (num: string) => {
    const value = num.replace(/\D/g, "");
    return value.length === 16; 
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard(cardData.number)) {
      alert("❌ SECURITY ALERT: Invalid card number format.");
      return;
    }
    setCartCount(prev => prev + 1);
    setIsPaying(false);
    alert("✅ TRANSACTION VERIFIED: Your Titan System is now being prepared.");
  };

  if (!mounted) return null;

  return (
    <div style={{ backgroundColor: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav className="store-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" className="logo">AZPHUR</Link>
            <span className="nav-divider">/</span>
            <span className="nav-subtitle">TITAN RETAIL</span>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="cart-badge">CART: {cartCount}</div>
            <Link href="/" className="exit-link">EXIT</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="store-hero">
        <h3 className="hero-sub">PHASE 03: HOUSEHOLD INDEPENDENCE</h3>
        <h1 className="hero-main">TITAN <span style={{ color: '#22d3ee' }}>SERIES.</span></h1>
        <p className="hero-desc">
          {loading ? "INITIALIZING PRODUCT DATABASE..." : "Stop buying energy. Start owning the source."}
        </p>
      </div>

      {/* DYNAMIC GRID */}
      <div className="products-grid">
        {products.map(kit => (
          <div key={kit.id} className="product-card">
            <div className="bg-letter">{kit.tier?.[0] || 'T'}</div>
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="tier-tag">{kit.tier || 'TITAN'}</span>
                <h3 className="product-name">{kit.name}</h3>
                <p className="product-desc">{kit.desc}</p>
                
                <div className="savings-box">
                    <div className="savings-label">ESTIMATED SAVINGS</div>
                    <div className="savings-value">₱{kit.savings}<span style={{ fontSize: '12px', color: '#444' }}> / mo</span></div>
                </div>

                <div className="specs-list">
                    • {kit.specs} <br />
                    • AI Grid Synchronization <br />
                    • 10 Year Titan Warranty
                </div>

                <div className="card-footer">
                    <div>
                        <div className="footer-label">FULL DEPLOYMENT</div>
                        <div className="footer-price">₱{Number(kit.price).toLocaleString()}</div>
                    </div>
                    <button 
                        onClick={() => { setSelectedProduct(kit); setIsPaying(true); }}
                        className={`order-btn ${kit.tier === 'PREMIUM' ? 'premium' : ''}`}
                    >
                        ORDER
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAYMENT MODAL */}
      {isPaying && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">SECURE GATEWAY</h2>
            <p className="modal-subtitle">UNIT: {selectedProduct?.name.toUpperCase()}</p>
            
            <form onSubmit={handlePayment} className="payment-form">
              <div className="input-group">
                  <label>CREDIT CARD NUMBER</label>
                  <input 
                    required placeholder="0000 0000 0000 0000" maxLength={16}
                    onChange={e => setCardData({...cardData, number: e.target.value})}
                  />
              </div>
              <button type="submit" className="auth-btn">
                AUTHORIZE ₱{Number(selectedProduct?.price).toLocaleString()}
              </button>
              <button type="button" onClick={() => setIsPaying(false)} className="abort-btn">ABORT TRANSACTION</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .store-nav { padding: 20px; display: flex; justify-content: space-between; alignItems: center; border-bottom: 1px solid #111; }
        .logo { text-decoration: none; color: #22d3ee; font-weight: 900; font-size: 18px; letter-spacing: 2px; }
        .nav-divider { color: #333; font-size: 18px; }
        .nav-subtitle { font-size: 9px; font-weight: bold; color: #fff; letter-spacing: 1px; }
        .cart-badge { font-size: 9px; font-weight: bold; border: 1px solid #22d3ee; color: #22d3ee; padding: 6px 12px; border-radius: 30px; }
        .exit-link { text-decoration: none; color: #444; font-size: 9px; font-weight: bold; }

        .store-hero { padding: 60px 20px; textAlign: center; background: radial-gradient(circle at center, #0a0a0a 0%, #020202 100%); }
        .hero-sub { color: #22d3ee; fontSize: 9px; letter-spacing: 4px; font-weight: bold; margin-bottom: 15px; }
        .hero-main { font-size: 38px; font-weight: 900; margin: 0; letter-spacing: -1px; font-style: italic; line-height: 1; }
        .hero-desc { color: #555; max-width: 500px; margin: 20px auto; fontSize: 14px; line-height: 1.6; }

        .products-grid { display: grid; grid-template-columns: 1fr; gap: 20px; padding: 0 20px 60px; max-width: 1400px; margin: 0 auto; }
        .product-card { background-color: #050505; border-radius: 30px; border: 1px solid #111; padding: 30px; position: relative; overflow: hidden; transition: 0.3s; }
        .bg-letter { position: absolute; top: 10px; right: 20px; color: #111; font-size: 60px; font-weight: 900; z-index: 0; opacity: 0.3; }
        .tier-tag { font-size: 9px; font-weight: bold; color: #22d3ee; letter-spacing: 2px; }
        .product-name { font-size: 24px; font-weight: 900; margin: 10px 0; }
        .product-desc { color: #555; font-size: 13px; margin-bottom: 20px; line-height: 1.5; }
        .savings-box { background-color: #000; padding: 15px; border-radius: 15px; margin-bottom: 20px; border: 1px solid #0f0f0f; }
        .savings-label { font-size: 9px; color: #22d3ee; margin-bottom: 5px; font-weight: bold; }
        .savings-value { font-size: 20px; font-weight: 900; }
        .specs-list { font-size: 12px; color: #888; margin-bottom: 30px; line-height: 1.8; }
        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .footer-label { font-size: 8px; color: #444; font-weight: bold; }
        .footer-price { font-size: 18px; font-weight: 900; }
        .order-btn { background: #fff; color: #000; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 900; cursor: pointer; font-size: 11px; }
        .order-btn.premium { background: #22d3ee; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; backdrop-filter: blur(10px); }
        .modal-content { background: #000; padding: 30px; border-radius: 30px; border: 1px solid #22d3ee; width: 100%; max-width: 400px; }
        .modal-title { text-align: center; font-size: 18px; font-weight: 900; font-style: italic; margin-bottom: 5px; }
        .modal-subtitle { text-align: center; font-size: 9px; color: #444; margin-bottom: 25px; }
        .payment-form { display: flex; flex-direction: column; gap: 15px; }
        .input-group label { font-size: 8px; color: #22d3ee; font-weight: bold; display: block; margin-bottom: 5px; }
        .input-group input { width: 100%; padding: 15px; background: #050505; border: 1px solid #111; border-radius: 12px; color: #fff; letter-spacing: 2px; text-align: center; font-size: 14px; }
        .auth-btn { background: #22d3ee; color: #000; padding: 15px; border-radius: 15px; font-weight: 900; cursor: pointer; border: none; font-size: 13px; }
        .abort-btn { background: none; border: none; color: #444; cursor: pointer; font-size: 10px; font-weight: bold; margin-top: 5px; }

        @media (min-width: 768px) {
          .store-nav { padding: 30px 50px; }
          .logo { font-size: 20px; }
          .nav-subtitle { font-size: 10px; }
          .hero-main { font-size: 64px; letter-spacing: -3px; }
          .hero-desc { font-size: 16px; }
          .products-grid { grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; padding: 0 50px 100px; }
          .product-name { font-size: 30px; }
          .modal-content { padding: 50px; }
          .modal-title { font-size: 22px; }
          .order-btn { padding: 15px 35px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}