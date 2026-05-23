"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TitanStore() {
  const [activeSection, setActiveSection] = useState<'TITAN' | 'SYSTEMS' | 'SUPPORT'>('TITAN');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Lead Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    loadData();
  }, []);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. SALVATAGGIO SU SUPABASE (ESECUZIONE PROTOCOLLO)
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
      // 2. NOTIFICA ESTERNA (MAKE.COM / WEBHOOK)
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

      // 3. ISTRUZIONI BONIFICO
      alert(`✅ STRATEGIC LEAD CAPTURED!
      
PAYMENT PROTOCOL:
To confirm the order of ${selectedProduct?.name}, make the bank transfer.

send the recip of the transavtion at azphur@gmail.com

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

  return (
    <div className="titan-store">
      <nav className="tesla-nav">
        <Link href="/" className="tesla-brand-wrapper">
          <img src="/logo-azphur.avif" alt="Logo" className="tesla-brand-img" />
          <span className="tesla-logo">AZPHUR</span>
        </Link>
        <div className="nav-center">
          {['TITAN', 'SYSTEMS', 'SUPPORT'].map((item: any) => (
            <span 
              key={item} 
              className={`nav-link ${activeSection === item ? 'active' : ''}`}
              onClick={() => setActiveSection(item)}
            >
              {item}
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
        
        .content-wrapper { padding-top: 100px; box-sizing: border-box; }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .store-hero { padding: 60px 20px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; }
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
        .support-card p { font-size: 14px; color: #aaae group; line-height: 1.5; margin: 0 0 20px 0; color: #cccccc; }
        .secondary-btn { background: #fff; border: none; padding: 12px 24px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer; width: fit-content; align-self: flex-start; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); padding: 20px; box-sizing: border-box; }
        .modal-content { background: #fff; padding: 40px 30px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); box-sizing: border-box; }
        .modal-title { font-size: 24px; font-weight: 800; margin-bottom: 10px; letter-spacing: -1px; }
        .modal-desc { font-size: 14px; color: #666; margin-bottom: 25px; line-height: 1.4; }
        .modal-content input { width: 100%; padding: 14px; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 14px; box-sizing: border-box; }
        .close-btn { width: 100%; background: transparent; border: none; margin-top: 15px; cursor: pointer; font-size: 11px; font-weight: 700; color: #999; letter-spacing: 1px; box-sizing: border-box; }

        /* RESPONSIVE MEDIA QUERIES PER TELEFONI E TABLET */
        @media (max-width: 768px) {
          .tesla-nav { padding: 15px 20px; flex-direction: row; flex-wrap: wrap; gap: 10px; }
          .tesla-brand-wrapper { flex: none; }
          .nav-center { order: 3; flex: 1 1 100%; justify-content: space-between; margin-top: 5px; background: rgba(0,0,0,0.02); padding: 4px; border-radius: 8px; }
          .nav-link { font-size: 11px; padding: 6px 12px; text-align: center; flex: 1; }
          .nav-right { flex: none; order: 2; }
          .cart-pill { margin-right: 0; font-size: 9px; }
          .content-wrapper { padding-top: 130px; }
          .products-section { padding: 20px; }
          .grid-container { grid-template-columns: 1fr; gap: 20px; }
          .tesla-card { padding: 30px 20px; }
          .tech-grid, .support-cards { gap: 25px; margin: 20px auto; padding: 0 10px; }
          .support-card { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
}