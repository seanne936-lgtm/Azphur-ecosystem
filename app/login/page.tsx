"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TopTicker: React.FC = () => {
  const [stats, setStats] = useState({ co2: 15420, mw: 912.45 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setStats(prev => ({
        co2: prev.co2 + Math.floor(Math.random() * 3),
        mw: +(prev.mw + (Math.random() * 0.05)).toFixed(2)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`top-ticker-lux ${mounted ? 'visible' : ''}`}>
      <div className="ticker-inner">
        <span className="live-pill">SYSTEM_OK</span>
        <span className="stat">CO2_SAVED: <strong>{new Intl.NumberFormat('en-US').format(stats.co2)}</strong></span>
        <div className="sep"></div>
        <span className="stat">NET_POWER: <strong>{stats.mw.toFixed(2)}</strong> MW</span>
      </div>
      <style jsx>{`
        .top-ticker-lux { 
          position: fixed; top: 0; left: 0; width: 100%; height: 45px; 
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); 
          z-index: 2000; border-bottom: 1px solid rgba(34, 211, 238, 0.2); 
          display: flex; align-items: center; justify-content: center; 
          opacity: 0; transition: 0.8s; box-sizing: border-box; padding: 0 15px;
        }
        .top-ticker-lux.visible { opacity: 1; }
        .ticker-inner { display: flex; align-items: center; justify-content: center; gap: 30px; font-size: 9px; letter-spacing: 1px; font-weight: 700; color: #1d1d1f; flex-wrap: wrap; }
        .live-pill { background: #22d3ee; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 8px; flex-shrink: 0; }
        .stat { flex-shrink: 0; }
        .stat strong { color: #0891b2; }
        .sep { width: 1px; height: 10px; background: rgba(34, 211, 238, 0.3); }
        @media (max-width: 480px) { .ticker-inner { gap: 12px; } .sep { display: none; } }
      `}</style>
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  
  // Stato per gestire la scelta multipla del cliente (Solar + S2B)
  const [isDualCustomer, setIsDualCustomer] = useState(false);
  
  // Stati per la gestione del Password Recovery integrato
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const router = useRouter();

  const adminEmails = [
    "admin@azphur.com", 
    "tuofratello@email.com", 
    "tuamailprincipale@email.com" 
  ];

  useEffect(() => {
    setMounted(true);

    const cleanCorruptedSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (error?.message?.includes("Refresh Token") || error?.message?.includes("not found")) {
            await supabase.auth.signOut();
            window.location.reload();
          }
        } else if (data.session?.user?.email) {
          const currentEmail = data.session.user.email.toLowerCase().trim();
          if (adminEmails.includes(currentEmail)) {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error("Session verification bypass", e);
      }
    };

    cleanCorruptedSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailNormalized = email.toLowerCase().trim();
      const isAnAdminUser = adminEmails.includes(emailNormalized);

      if (isAnAdminUser) {
        if (typeof window !== 'undefined') {
          (window as any).IS_ADMIN_LOGGING_IN = true;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailNormalized, 
        password 
      });

      if (error) {
        alert("ACCESS_DENIED: " + error.message);
        if (typeof window !== 'undefined') {
          (window as any).IS_ADMIN_LOGGING_IN = false;
        }
        setLoading(false);
        return;
      } 
      
      if (data.session && data.user) {
        if (isAnAdminUser) {
          setIsAdmin(true);
          setLoading(false);
          router.refresh();
          return; 
        }

        if (typeof window !== 'undefined') {
          (window as any).IS_ADMIN_LOGGING_IN = false;
        }

        const user = data.user;
        const userEmail = user.email ? user.email.toLowerCase().trim() : '';

        // CHECK FUNDING PARTNER: access is verified server-side against
        // funding_partner_whitelist before opening the private portal.
        try {
          const fundingPartnerResponse = await fetch('/api/v1/funding-engine?scope=partner', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          });
          const fundingPartnerContentType = fundingPartnerResponse.headers.get('content-type') || '';

          if (!fundingPartnerContentType.includes('application/json')) {
            console.error(
              `Funding partner access check returned a non-JSON response (${fundingPartnerResponse.status}). ` +
              'Verify that app/api/v1/funding-engine/route.ts exists.'
            );
          } else {
            const fundingPartnerData = await fundingPartnerResponse.json();

            if (fundingPartnerResponse.ok && fundingPartnerData.success && fundingPartnerData.partner) {
              router.push('/funding-partners');
              return;
            }
          }
        } catch (fundingPartnerCheckError) {
          console.error('Funding partner access check failed:', fundingPartnerCheckError);
        }

        // 1. VERIFICA SE IL CLIENTE È PRESENTE IN ENTRAMBE LE TABELLE (solar_leads & module_01_customers)
        const [solarCheck, mod1Check] = await Promise.all([
          supabase.from('solar_allowed_customers').select('email').eq('email', userEmail).maybeSingle(),
          supabase.from('module_01_customers').select('email').eq('email', userEmail).maybeSingle()
        ]);

        if (solarCheck.data && mod1Check.data) {
          setIsDualCustomer(true);
          setLoading(false);
          return;
        }

        // 2. CHECK INSTALLER IN INSTALLERS_WHITELIST (Modulo 4 - Installatori)
        const { data: isInstaller } = await supabase
          .from('installers_whitelist')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle();

        if (isInstaller) {
          router.push('/partner'); // Reindirizza al modulo condiviso dei partner/installatori
          return;
        }

        // 3. CHECK PARTNER IN PARTNER_WHITELIST (Modulo 4 - Provider)
        const { data: isPartner } = await supabase
          .from('partner_whitelist')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle(); 

        if (isPartner) {
          router.push('/partner'); 
          return;
        }

        // 4. CHECK DRIVER IN DRIVER_PROFILES
        const { data: isDriver } = await supabase
          .from('driver_profiles')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle();

        if (isDriver) {
          router.push('/EV/driver');
          return;
        }

        // 5. CHECK EV CUSTOMER
        const { data: isEvCustomer } = await supabase
          .from('module_05_customers')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle();

        if (isEvCustomer) {
          router.push('/EV'); 
          return;
        }

    

        // 7. CHECK SOLO SOLAR (solar_leads)
        if (solarCheck.data) {
          router.push('/solar-quote');
          return;
        }

        // 8. CHECK SOLO MODULO 1 (module_01_customers)
        if (mod1Check.data) {
          router.push('/s2b');
          return;
        }

        alert("ACCESS_DENIED: Profile not configured for AZPHUR ecosystem modules.");
        await supabase.auth.signOut();
        setLoading(false);
      }
    } catch (err) {
      alert("SYSTEM_ERROR_LOGIN");
      if (typeof window !== 'undefined') {
        (window as any).IS_ADMIN_LOGGING_IN = false;
      }
      setLoading(false);
    }
  };

  // Funzione per gestire la richiesta di Reset Password tramite Supabase + Resend
  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecoveryMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.toLowerCase().trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined,
      });

      if (error) throw error;

      setRecoveryMessage({
        type: 'success',
        text: 'RESET_LINK_SENT: Check your corporate email inbox to update credentials.'
      });
      setRecoveryEmail('');
    } catch (err: any) {
      setRecoveryMessage({
        type: 'error',
        text: err.message || 'RECOVERY_ERROR: Unable to process link generation.'
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToModule = async (path: string) => {
    if (typeof window !== 'undefined') {
      (window as any).IS_ADMIN_LOGGING_IN = false;
    }
    await supabase.auth.getSession();
    router.push(path);
  };

  return (
    <div className="az-premium-canvas login-screen">
      <TopTicker />
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; scroll-behavior: smooth; box-sizing: border-box; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; overflow-x: hidden; width: 100%; box-sizing: border-box; padding-top: 45px; display: flex; flex-direction: column; }
      `}</style>

      <div className="glow-sphere"></div>

      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img 
            src="/logo-azphur.avif" 
            alt="AZPHUR Logo" 
            className="main-logo" 
            style={{ height: '35px', cursor: 'pointer' }} 
            onClick={() => router.push('/')} 
          />
          <div className="status-orb"></div>
          <span className="op-status-tag">UNIVERSAL_GATEWAY_v3</span>
        </div>
        
        <div className="nav-items">
          <Link href="/" className="btn-cyan-outline exit-btn-lux">
            <span>← EXIT</span>
          </Link>
        </div>
      </nav>

      <div className="center-content">
        <div className="login-box-premium">
          <div className="login-header">
            <span className="phase-label">SYSTEM_AUTHENTICATION</span>
            <h2 className="text-cyan">
              {isAdmin 
                ? 'Admin Access Portal' 
                : isDualCustomer 
                ? 'Select Destination Module' 
                : showRecovery 
                ? 'Account Recovery' 
                : 'AZPHUR Universal Portal'}
            </h2>
            <p className="login-desc">
              {isAdmin 
                ? 'Select destination gateway for administrative privileges.' 
                : isDualCustomer 
                ? 'Your profile is authorized for multiple sectors. Choose where you want to go:' 
                : showRecovery 
                ? 'Provide your registered corporate email to generate a secure credential override uplink.' 
                : 'Enter authorization credentials to initialize your ecosystem profile uplink.'}
            </p>
          </div>

          {isAdmin ? (
            <div className="admin-routing-panel fade-in">
              <span className="phase-label admin-alert-tag">⚠️ ADMIN_ACCESS_GRANTED // SELECT_DESTINATION</span>
              
              <button onClick={() => navigateToModule('/partner')} className="login-btn-premium btn-admin-partner">
                GO TO PARTNER & INSTALLERS PORTAL (MOD_04) 🌐
              </button>

              <button onClick={() => navigateToModule('/solar-quote')} className="login-btn-premium btn-admin-dark">
                GO TO B2B ENTERPRISE ⚡
              </button>

              <button onClick={() => navigateToModule('/EV')} className="login-btn-premium btn-admin-blue">
                GO TO EV MOBILITY (MOD_05) 🔋
              </button>

              <button onClick={() => navigateToModule('/EV/driver')} className="login-btn-premium btn-admin-green">
                GO TO DRIVER HQ 🚗
              </button>

              <button onClick={() => navigateToModule('/s2b')} className="login-btn-premium btn-admin-cyan">
                GO TO S2B LOGISTICS →
              </button>
            </div>
          ) : isDualCustomer ? (
            <div className="admin-routing-panel fade-in">
              <span className="phase-label admin-alert-tag">⚡ DUAL_PROFILE_DETECTED // CHOOSE_DESTINATION</span>
              
              <button onClick={() => navigateToModule('/solar-quote')} className="login-btn-premium btn-admin-partner">
                GO TO SOLAR QUOTATIONS (MODULE 2 / SOLAR) ☀️
              </button>

              <button onClick={() => navigateToModule('/s2b')} className="login-btn-premium btn-admin-dark">
                GO TO S2B LOGISTICS (MODULE 01 CUSTOMERS) 📦
              </button>
            </div>
          ) : showRecovery ? (
            <form onSubmit={handleRecoveryRequest} className="login-form fade-in">
              {recoveryMessage && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  backgroundColor: recoveryMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: recoveryMessage.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${recoveryMessage.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
                }}>
                  {recoveryMessage.text}
                </div>
              )}

              <div className="input-group">
                <label>REGISTERED_EMAIL</label>
                <input 
                  type="email" 
                  placeholder="operator@azphur.com" 
                  required 
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="login-btn-premium">
                {loading ? 'GENERATING LINK...' : 'SEND RESET LINK →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowRecovery(false); setRecoveryMessage(null); }}
                  style={{ background: 'none', border: 'none', color: '#0891b2', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' }}
                >
                  ← BACK TO LOG IN
                </button>
              </div>
            </form>
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
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>SECURITY_CODE</label>
                  <button 
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    style={{ background: 'none', border: 'none', color: '#86868b', fontSize: '8px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Forgot security code?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#0891b2', fontSize: '16px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                  >
                    {showPassword ? '◉' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn-premium">
                {loading ? 'VERIFYING...' : 'INITIALIZE_SESSION →'}
              </button>
            </form>
          )}
          
          <div className="system-ops-label">
             ENCRYPTION: AES-256 // STATUS: {mounted ? 'LINK_ACTIVE' : 'READY'}
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-screen { position: relative; }
        
        .glow-sphere { 
          position: fixed; top: 10%; left: 50%; transform: translateX(-50%); 
          width: 80vw; height: 40vw; 
          background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%); 
          z-index: 0; pointer-events: none; 
        }

        .nav-minimal-lux { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 60px 60px 20px; max-width: 1400px; width: 100%; margin: 0 auto; 
          position: relative; z-index: 10; box-sizing: border-box;
        }

        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 10px #22d3ee; flex-shrink: 0; }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 15px; font-weight: 900; white-space: nowrap; }
        .nav-items { display: flex; align-items: center; }
        
        .btn-cyan-outline { 
          background: none; border: 1px solid #22d3ee; color: #0891b2; padding: 8px 20px; 
          border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; 
          transition: 0.3s; flex-shrink: 0; text-decoration: none; letter-spacing: 1px;
        }
        .btn-cyan-outline:hover { background: #22d3ee; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2); }

        .center-content { flex: 1; display: flex; justify-content: center; align-items: center; padding: 60px 20px; z-index: 1; width: 100%; box-sizing: border-box; }

        .login-box-premium {
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); 
          padding: 50px 40px; border-radius: 24px; border: 4px solid #1d1d1f; 
          width: 100%; max-width: 460px; text-align: left;
          transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 20px 40px rgba(34, 211, 238, 0.08);
          box-sizing: border-box;
        }
        .login-box-premium:hover { border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }

        .phase-label { font-size: 9px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 15px; display: block; }
        .text-cyan { color: #0891b2 !important; font-size: 24px; font-weight: 800; margin: 0; transition: color 0.3s; }
        .login-box-premium:hover .text-cyan { color: #22d3ee !important; }
        .login-desc { font-size: 14px; color: #5c5e62; margin: 15px 0 25px; line-height: 1.5; font-weight: 500; }

        .input-group label { font-size: 9px; color: #0891b2; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 8px; }
        .input-group input {
          width: 100%; padding: 15px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 12px; color: #1d1d1f; font-size: 13px; font-family: monospace; font-weight: 600; transition: 0.3s;
          box-sizing: border-box;
        }
        .input-group input:focus { border-color: #22d3ee; box-shadow: 0 0 15px rgba(34, 211, 238, 0.1); outline: none; background: #fff; }

        .login-btn-premium {
          background: #1d1d1f; color: white; padding: 16px; border-radius: 12px; 
          font-weight: 900; border: none; cursor: pointer;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          transition: 0.3s; margin-top: 25px; width: 100%; box-sizing: border-box;
        }
        .login-box-premium:hover .login-btn-premium { background: #22d3ee; color: #1d1d1f; }
        .login-btn-premium:hover { transform: translateY(-2px); filter: brightness(1.05); }

        .admin-routing-panel { display: flex; flex-direction: column; gap: 14px; margin-top: 15px; }
        .admin-alert-tag { color: #0891b2 !important; font-weight: 900; margin-bottom: 5px; }
        
        .btn-admin-partner { background: #0891b2 !important; color: #fff !important; border: 2px solid #1d1d1f !important; }
        .btn-admin-dark { background: #1d1d1f !important; color: #fff !important; border: 2px solid #22d3ee !important; }
        .btn-admin-blue { background: #3e6ae1 !important; color: #fff !important; border: 2px solid #1d1d1f !important; }
        .btn-admin-green { background: #10b981 !important; color: #fff !important; border: 2px solid #1d1d1f !important; }
        .btn-admin-cyan { background: #22d3ee !important; color: #1d1d1f !important; border: 2px solid #1d1d1f !important; }

        .system-ops-label { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 2px; text-align: center; margin-top: 35px; }

        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 40px 20px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .logo-group { width: 100%; justify-content: center; }
          .nav-items { width: 100%; justify-content: center; }
          .exit-btn-lux { width: 100%; text-align: center; max-width: 200px; }
          .center-content { padding: 30px 16px; }
          .login-box-premium { padding: 35px 20px; border-width: 4px; }
          .text-cyan { font-size: 22px; }
          .login-desc { font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
