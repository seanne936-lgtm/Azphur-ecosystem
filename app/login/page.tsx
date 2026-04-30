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
        router.push('/s2b');
        router.refresh(); 
      }
    } catch (err) {
      alert("System Error during login");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* TASTO TORNA ALLA HOME */}
      <div className="back-home-container">
        <Link href="/" className="back-link">
          <span>←</span> EXIT TO PUBLIC SITE
        </Link>
      </div>

      <div className="login-box">
        <div className="login-header">
          <span className="logo-text">AZPHUR</span>
          <span className="sub-logo">S2B LOGISTICS PORTAL</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Client Email</label>
            <input 
              type="email" 
              placeholder="operator@company.com" 
              required 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Security Code</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            onMouseOver={() => setIsHovered(true)}
            onMouseOut={() => setIsHovered(false)}
            className={`login-btn ${isHovered ? 'hovered' : ''}`}
          >
            {loading ? 'VERIFYING...' : 'ENTER LOGISTICS PORTAL'}
          </button>
        </form>
        
        <p className="footer-tag">
          SECURE ENCRYPTED SESSION
        </p>
      </div>

      <style jsx>{`
        .login-container {
          background-color: #050505;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: sans-serif;
          padding: 20px;
        }

        .back-home-container {
          position: absolute;
          top: 30px;
          left: 20px;
        }

        .back-link {
          text-decoration: none;
          color: #444;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 1px;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: #22d3ee;
        }

        .login-box {
          background-color: #0a0a0a;
          padding: 40px 30px;
          border-radius: 30px;
          border: 1px solid #22d3ee;
          width: 100%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.1);
        }

        .login-header {
          margin-bottom: 35px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 900;
          color: #22d3ee;
          font-style: italic;
          letter-spacing: -1px;
        }

        .sub-logo {
          display: block;
          font-size: 10px;
          color: #444;
          letter-spacing: 3px;
          margin-top: 8px;
          text-transform: uppercase;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          text-align: left;
        }

        .input-group label {
          font-size: 9px;
          color: #333;
          font-weight: bold;
          margin-left: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .input-group input {
          width: 100%;
          margin-top: 6px;
          padding: 16px;
          background-color: #000;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          color: #fff;
          outline: none;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .input-group input:focus {
          border-color: #22d3ee;
        }

        .login-btn {
          background-color: #22d3ee;
          color: #000;
          padding: 16px;
          border-radius: 12px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          font-size: 13px;
          transition: 0.3s;
          margin-top: 10px;
          letter-spacing: 0.5px;
        }

        .login-btn.hovered {
          background-color: #fff;
          box-shadow: 0 0 20px rgba(255,255,255,0.2);
        }

        .footer-tag {
          color: #222;
          font-size: 9px;
          margin-top: 35px;
          letter-spacing: 2px;
          font-weight: bold;
        }

        @media (min-width: 768px) {
          .login-box {
            padding: 50px;
          }
          .back-home-container {
            top: 40px;
            left: 40px;
          }
          .logo-text {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}