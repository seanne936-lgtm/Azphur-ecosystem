"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Access Denied: " + error.message);
        setLoading(false);
      } else if (data.session) {
        // Forza il refresh per aggiornare gli stati di auth globali
        router.push('/s2b');
        router.refresh(); 
      }
    } catch (err) {
      alert("System Error during login");
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* TASTO TORNA ALLA HOME */}
      <div style={{ position: 'absolute', top: '40px', left: '40px' }}>
        <Link href="/" style={{ 
          textDecoration: 'none', 
          color: '#444', 
          fontSize: '12px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          letterSpacing: '1px',
          transition: 'color 0.3s'
        }}>
          <span>←</span> EXIT TO PUBLIC SITE
        </Link>
      </div>

      <div style={{ 
        backgroundColor: '#0a0a0a', 
        padding: '50px', 
        borderRadius: '30px', 
        border: '1px solid #22d3ee', 
        width: '400px', 
        textAlign: 'center', 
        boxShadow: '0 0 30px rgba(34, 211, 238, 0.1)' 
      }}>
        <div style={{ marginBottom: '30px' }}>
          <span style={{ fontSize: '28px', fontWeight: '900', color: '#22d3ee', fontStyle: 'italic' }}>AZPHUR</span>
          <span style={{ display: 'block', fontSize: '12px', color: '#444', letterSpacing: '4px', marginTop: '5px' }}>S2B LOGISTICS PORTAL</span>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', marginLeft: '10px', textTransform: 'uppercase' }}>Client Email</label>
            <input 
              type="email" 
              placeholder="operator@company.com" 
              required 
              style={{ width: '100%', marginTop: '5px', padding: '15px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '12px', color: '#fff', outline: 'none' }}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', marginLeft: '10px', textTransform: 'uppercase' }}>Security Code</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              style={{ width: '100%', marginTop: '5px', padding: '15px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '12px', color: '#fff', outline: 'none' }}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            onMouseOver={() => setIsHovered(true)}
            onMouseOut={() => setIsHovered(false)}
            style={{ 
              backgroundColor: isHovered ? '#fff' : '#22d3ee', 
              color: '#000', 
              padding: '15px', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              border: 'none', 
              cursor: isHovered ? 'pointer' : 'default', 
              fontSize: '14px', 
              transition: '0.3s',
              marginTop: '10px',
              boxShadow: isHovered ? '0 0 20px rgba(255,255,255,0.2)' : 'none'
            }}
          >
            {loading ? 'VERIFYING...' : 'ENTER LOGISTICS PORTAL'}
          </button>
        </form>
        
        <p style={{ color: '#222', fontSize: '9px', marginTop: '30px', letterSpacing: '2px', fontWeight: 'bold' }}>
          SECURE ENCRYPTED SESSION
        </p>
      </div>
    </div>
  );
}