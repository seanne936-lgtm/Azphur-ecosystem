"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dichiariamo window.turnstile e il callback globale per TypeScript
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, any>) => string;
      reset: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('modulo_05');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Inserimento dello script di Cloudflare Turnstile con chiave di test per localhost
  useEffect(() => {
    const scriptId = 'cloudflare-turnstile-script';
    
    const renderWidget = () => {
      if (window.turnstile) {
       window.turnstile.render('#turnstile-container', {
  sitekey: '0x4AAAAAAEO-yMYoMp05tpFf', // La tua chiave ufficiale di Cloudflare
  callback: (token: string) => setCaptchaToken(token),
  'expired-callback': () => setCaptchaToken(null),
});
      }
    }; 

    window.onloadTurnstileCallback = renderWidget;

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else {
      renderWidget();
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setMessage({ type: 'error', text: 'Please complete the human verification challenge.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            role: role,
            full_name: fullName 
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Registration completed successfully! Your account is active. Click Log In to access your dashboard.'
      });
      
      setFullName('');
      setEmail('');
      setPassword('');
      setCaptchaToken(null);
    } catch (err: unknown) {
      let errorText = 'An error occurred during registration.';

      if (err instanceof Error) {
        errorText = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const potentialMsg = (err as any).message || (err as any).error_description;
        if (typeof potentialMsg === 'string' && potentialMsg.trim() !== '') {
          errorText = potentialMsg;
        }
      } else if (typeof err === 'string') {
        errorText = err;
      }

      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '32px 24px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '450px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ color: '#1e293b', fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            AZPHUR <span style={{ color: '#0891b2' }}>Ecosystem</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Create your unified corporate account</p>
        </div>

        {message && message.text && typeof message.text === 'string' && message.text !== '{}' && (
          <div style={{
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                style={{
                  padding: '12px 42px 12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#64748b'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Access Portal</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <option value="modulo_05">⚡ EV Charging Points & EV Mobility 🚗 (Module 5)</option>
              <option value="solar_logistic">📦 S2B Logistics & Solar B2B ☀️ (Module 1 & Module 2)</option>
            </select>
          </div>

          {/* Cloudflare Turnstile Widget Container */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
            <div id="turnstile-container"></div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#22d3ee', 
              color: '#0f172a',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '2px',
              boxShadow: '0 4px 12px rgba(34, 211, 238, 0.2)'
            }}
          >
            {loading ? 'PROCESSING REGISTRATION...' : 'REQUEST AUTOMATIC ACCESS'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <span style={{ color: '#64748b' }}>Already have an account? </span>
          <Link href="/login" style={{ color: '#0891b2', fontWeight: 'bold', textDecoration: 'none' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}