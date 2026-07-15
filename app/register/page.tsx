"use client";

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Safe standard browser client
import Link from 'next/link';

// Initialize the client using public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('modulo_05'); // Defaults to EV Mobility
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Pass the role inside metadata for the SQL Trigger to read
          data: { role: role },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Registration initiated! Please check your email to verify your account and activate your whitelist access.'
      });
      
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred during registration.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // Clean light platform background
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff', // Clean white card background
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
            AZPHUR <span style={{ color: '#0891b2' }}>Ecosystem</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Create your unified corporate account</p>
        </div>

        {message && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Corporate Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* Portal Selection Dropdown (MODIFIED: Reduced to 3 options) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Select Access Portal</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <option value="modulo_05">🚗 EV Mobility (Module 5)</option>
              <option value="business">💼 Allowed Partners (Module 2 / Investors)</option>
              {/* ACCORPATI: Solar e S2B Logistics (Module 1) in un'unica opzione "solar_logistic" */}
              <option value="solar_logistic">☀️ Solar & S2B Logistics (Portal & Module 1)</option>
            </select>
          </div>

          {/* Cyan Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#22d3ee', // Official Cyan
              color: '#0f172a',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '10px'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#06b6d4')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#22d3ee')}
          >
            {loading ? 'PROCESSING REGISTRATION...' : 'REQUEST AUTOMATIC ACCESS'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: '#64748b' }}>Already have an account? </span>
          <Link href="/EV" style={{ color: '#0891b2', fontWeight: 'bold', textDecoration: 'none' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}