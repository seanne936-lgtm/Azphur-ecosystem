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
    </div>
  );
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [tokenError, setTokenError] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDescription = hashParams.get('error_description');
      if (errorDescription) {
        setTokenError(true);
        setMessage({
          type: 'error',
          text: `TOKEN_EXPIRED: ${errorDescription.replace(/\+/g, ' ')}`
        });
      }
    }
  }, []);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = calculateStrength(password);
  
  const getStrengthLabel = () => {
    if (!password) return { label: 'EMPTY', color: '#86868b', width: '0%' };
    if (strengthScore <= 2) return { label: 'WEAK_KEY', color: '#ef4444', width: '33%' };
    if (strengthScore <= 4) return { label: 'MEDIUM_KEY', color: '#f59e0b', width: '66%' };
    return { label: 'SECURE_KEY', color: '#10b981', width: '100%' };
  };

  const strengthInfo = getStrengthLabel();
  const isMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const isFormValid = password.length >= 6 && isMatch && !tokenError;

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'CREDENTIALS_UPDATED: Secure override complete. Redirecting to gateway...'
      });
      
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'UPDATE_ERROR: Unable to apply new security credentials.';
      setMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="az-premium-canvas reset-screen">
      <TopTicker />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; scroll-behavior: smooth; box-sizing: border-box; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; overflow-x: hidden; width: 100%; box-sizing: border-box; padding-top: 45px; display: flex; flex-direction: column; }
        
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

        .reset-screen { position: relative; }
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
        .logo-group { display: flex; align-items: center; }
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
        
        .input-group label { font-size: 9px; color: #0891b2; font-weight: 900; letter-spacing: 1.5px; display: flex; justify-content: space-between; margin-bottom: 8px; }
        .input-wrapper { position: relative; width: 100%; }
        .input-group input {
          width: 100%; padding: 15px 45px 15px 15px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 12px; color: #1d1d1f; font-size: 13px; font-family: monospace; font-weight: 600; transition: 0.3s;
          box-sizing: border-box;
        }
        .input-group input:focus { border-color: #22d3ee; box-shadow: 0 0 15px rgba(34, 211, 238, 0.1); outline: none; background: #fff; }
        
        .toggle-password-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; cursor: pointer; color: #0891b2;
          display: flex; align-items: center; justify-content: center; padding: 4px;
          transition: color 0.2s;
        }
        .toggle-password-btn:hover { color: #22d3ee; }

        .strength-bar-bg { width: 100%; height: 4px; background: rgba(0,0,0,0.06); border-radius: 10px; margin-top: 8px; overflow: hidden; }
        .strength-bar-fill { height: 100%; transition: width 0.3s ease, background-color 0.3s ease; }
        .match-badge { font-size: 8px; font-weight: 800; letter-spacing: 0.5px; }

        .login-btn-premium {
          background: #1d1d1f; color: white; padding: 16px; border-radius: 12px; 
          font-weight: 900; border: none; cursor: pointer;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          transition: 0.3s; margin-top: 25px; width: 100%; box-sizing: border-box;
        }
        .login-btn-premium:not(:disabled):hover { background: #22d3ee; color: #1d1d1f; transform: translateY(-2px); filter: brightness(1.05); }
        .login-btn-premium:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; transform: none; }
        
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
      ` }} />

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
          <Link href="/login" className="btn-cyan-outline exit-btn-lux">
            <span>← CANCEL</span>
          </Link>
        </div>
      </nav>

      <div className="center-content">
        <div className="login-box-premium">
          <div className="login-header">
            <span className="phase-label">SECURE_CREDENTIAL_OVERRIDE</span>
            <h2 className="text-cyan">Update Security Code</h2>
            <p className="login-desc">Establish a new top-tier authentication key to restore your platform session.</p>
          </div>

          {tokenError ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                padding: '16px', borderRadius: '12px', backgroundColor: '#fef2f2',
                color: '#991b1b', border: '1px solid #fca5a5', fontSize: '12px',
                fontFamily: 'monospace', fontWeight: 'bold', lineHeight: '1.6', marginBottom: '20px'
              }}>
                ⚠️ SECURE_LINK_EXPIRED: This recovery link has expired or has already been used. Please request a new one.
              </div>
              <Link href="/login" className="login-btn-premium" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                REQUEST NEW RESET LINK →
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="login-form fade-in">
              {message && typeof message === 'object' && message !== null && typeof message.text === 'string' && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
                }}>
                  {message.text}
                </div>
              )}

              <div className="input-group">
                <label>
                  <span>NEW_PASSWORD</span>
                  {password && <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>}
                </label>
                <div className="input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="strength-bar-bg">
                  <div className="strength-bar-fill" style={{ width: strengthInfo.width, backgroundColor: strengthInfo.color }}></div>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>
                  <span>CONFIRM_PASSWORD</span>
                  {confirmPassword && (
                    <span className="match-badge" style={{ color: isMatch ? '#10b981' : '#ef4444' }}>
                      {isMatch ? '✓ MATCHED' : '✕ NO_MATCH'}
                    </span>
                  )}
                </label>
                <div className="input-wrapper">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !isFormValid} 
                className="login-btn-premium"
              >
                {loading ? 'APPLYING CHANGES...' : 'CONFIRM NEW CREDENTIALS →'}
              </button>
            </form>
          )}
          
          <div className="system-ops-label">
             ENCRYPTION: AES-256 // OVERRIDE: {mounted ? 'READY' : 'WAITING'}
          </div>
        </div>
      </div>
    </div>
  );
}