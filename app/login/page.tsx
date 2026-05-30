"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Stato per sbloccare la scelta dei pannelli all'admin
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailNormalized = email.toLowerCase().trim();

      // Inizializza l'accesso con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailNormalized, 
        password 
      });

      if (error) {
        alert("ACCESS_DENIED: " + error.message);
        setLoading(false);
        return;
      } 
      
      if (data.session && data.user) {
        const user = data.user;
        const userEmail = user.email ? user.email.toLowerCase().trim() : '';

        // ========================================================
        // 1. RAMIFICAZIONE SUPER ADMIN (INSERISCI LA TUA MAIL QUI)
        // ========================================================
        // Modifica 'admin@azphur.com' inserendo la tua mail amministratore esatta!
        if (userEmail === "admin@azphur.com" || userEmail === "tuofratello@email.com") {
          setIsAdmin(true);
          setLoading(false);
          return; // FONDAMENTALE: blocca qui il codice e mostra i due tasti di scelta!
        }

        // ========================================================
        // 2. RAMIFICAZIONE BUSINESSMAN (Controllo sulla tabella nuova)
        // ========================================================
        const { data: isPartner, error: partnerError } = await supabase
          .from('allowed_partners')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle(); // Usa maybeSingle per evitare l'eccezione se non trova record

        if (isPartner) {
          router.push('/b2b'); // È un partner autorizzato, dritto alle Filippine!
        } else {
          // ========================================================
          // 3. RAMIFICAZIONE CUSTOMER / S2B LOGISTICS STANDARD
          // ========================================================
          router.push('/s2b'); // Utente normale, va alla logistica
        }
        
        router.refresh(); 
      }
    } catch (err) {
      alert("SYSTEM_ERROR_LOGIN");
      setLoading(false);
    }
  };

  return (
    <div className="app-canvas login-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        body, html { background-color: #f0f9fa !important; margin: 0; padding: 0; }
        .app-canvas { background-color: #f0f9fa !important; min-height: 100vh; display: flex; flex-direction: column; }
      `}} />

      <div className="glow-sphere"></div>

      <nav className="nav-minimal">
        <div className="logo-group">
          <img 
            src="/logo-azphur.avif" 
            alt="AZPHUR" 
            className="main-logo"
            onClick={() => router.push('/')} 
          />
          <div className="status-orb"></div>
          <span className="op-status-tag">UNIVERSAL_GATEWAY_v3</span>
        </div>
        
        <div className="nav-items">
          <Link href="/" className="exit-btn-container">
            <span className="exit-icon">←</span>
            <span className="exit-text">EXIT_TO_INTERFACE</span>
            <div className="exit-shimmer"></div>
          </Link>
        </div>
      </nav>

      <div className="center-content">
        <div className="login-box">
          <div className="login-header">
            <span className="phase-label">SYSTEM_AUTHENTICATION</span>
            <h2 className="text-cyan">AZPHUR Universal Portal</h2>
            <p className="login-desc">Enter authorization credentials to initialize your ecosystem profile uplink.</p>
          </div>

          {isAdmin ? (
            <div className="admin-routing-panel fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <span className="phase-label" style={{ color: '#0891b2', fontWeight: '900' }}>⚠️ ADMIN_ACCESS_GRANTED // SELECT_DESTINATION</span>
              
              <button 
                onClick={() => { router.push('/b2b'); router.refresh(); }} 
                className="login-btn" 
                style={{ background: '#1d1d1f', color: '#fff', border: '2px solid #22d3ee', width: '100%' }}
              >
                GO TO B2B ENTERPRISE ⚡
              </button>

              <button 
                onClick={() => { router.push('/s2b'); router.refresh(); }} 
                className="login-btn" 
                style={{ background: '#22d3ee', color: '#1d1d1f', width: '100%', marginTop: '0px' }}
              >
                GO TO S2B LOGISTICS →
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>ACCOUNT_EMAIL</label>
                <input 
                  type="email" 
                  placeholder="operator@azphur.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>SECURITY_CODE</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="login-btn" style={{ width: '100%', marginTop: '25px' }}>
                {loading ? 'VERIFYING...' : 'INITIALIZE_SESSION →'}
              </button>
            </form>
          )}
          
          <div className="system-ops-label" style={{ marginTop: '30px', marginBottom: 0 }}>
             ENCRYPTION: AES-256 // STATUS: {mounted ? 'LINK_ACTIVE' : 'READY'}
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-screen { position: relative; overflow: hidden; color: #1d1d1f; }
        
        .glow-sphere { 
          position: fixed; top: 10%; left: 50%; transform: translateX(-50%); 
          width: 60vw; height: 30vw; 
          background: radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%); 
          z-index: 0; pointer-events: none; 
        }

        .nav-minimal { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 40px 60px; max-width: 1400px; width: 100%; margin: 0 auto; 
          position: relative; z-index: 10; 
        }

        .main-logo { height: 35px; width: auto; cursor: pointer; }
        .logo-group { display: flex; align-items: center; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 10px; box-shadow: 0 0 10px #22d3ee; }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 15px; font-weight: 900; }

        .exit-btn-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
          text-decoration: none;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(5px);
        }

        .exit-icon { font-size: 14px; color: #0891b2; transition: transform 0.3s ease; }
        .exit-text { font-size: 9px; font-weight: 900; color: #5c5e62; letter-spacing: 2px; }

        .exit-shimmer {
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.2), transparent);
          transition: 0.5s;
        }

        .exit-btn-container:hover {
          border-color: #22d3ee;
          background: white;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.15);
        }

        .exit-btn-container:hover .exit-icon { transform: translateX(-4px); color: #22d3ee; }
        .exit-btn-container:hover .exit-text { color: #1d1d1f; }
        .exit-btn-container:hover .exit-shimmer { left: 100%; }

        .center-content { flex: 1; display: flex; justify-content: center; align-items: center; padding: 40px 20px; z-index: 1; }

        .login-box {
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); 
          padding: 50px 40px; border-radius: 12px; border: 4px solid #1d1d1f; 
          width: 100%; max-width: 450px; text-align: left;
          box-shadow: 0 10px 40px rgba(34, 211, 238, 0.15);
        }

        .phase-label { font-size: 8px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 12px; display: block; }
        .text-cyan { color: #22d3ee !important; font-size: 26px; font-weight: 800; margin: 0; }
        .login-desc { font-size: 13px; color: #5c5e62; margin-top: 10px; line-height: 1.5; }

        .input-group label { font-size: 9px; color: #0891b2; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 8px; }
        .input-group input {
          width: 100%; padding: 15px; background: white; border: 2px solid #e5e7eb;
          border-radius: 8px; color: #1d1d1f; font-size: 14px; transition: 0.3s;
        }
        .input-group input:focus { border-color: #22d3ee; box-shadow: 0 0 15px rgba(34, 211, 238, 0.1); outline: none; }

        .login-btn {
          background: #22d3ee; color: #1d1d1f; padding: 18px; border-radius: 8px; 
          font-weight: 900; border: 2px solid #1d1d1f; cursor: pointer;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          transition: 0.3s; margin-top: 10px;
        }
        .login-btn:hover { background: #0891b2; color: white; transform: translateY(-2px); }

        .system-ops-label { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 2px; text-align: center; }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .nav-minimal { padding: 30px; }
          .login-box { padding: 40px 25px; }
        }
      `}</style>
    </div>
  );
}