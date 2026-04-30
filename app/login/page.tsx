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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="login-screen">
      
      {/* TASTO EXIT - POSIZIONATO PER NON RUBARE SPAZIO AL CENTRO */}
      <nav className="top-nav">
        <Link href="/" className="back-link">
          <span className="arrow">←</span> EXIT TO PUBLIC SITE
        </Link>
      </nav>

      <div className="center-content">
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
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`login-btn ${isHovered ? 'hovered' : ''}`}
            >
              {loading ? 'VERIFYING...' : 'ENTER LOGISTICS PORTAL'}
            </button>
          </form>
          
          <p className="footer-tag">SECURE ENCRYPTED SESSION</p>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          background-color: #050505;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          font-family: sans-serif;
          position: relative;
          overflow: hidden;
        }

        .top-nav {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          padding: 30px;
          z-index: 10;
        }

        .back-link {
          text-decoration: none;
          color: #333;
          font-size: 10px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 2px;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #22d3ee;
        }

        .center-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          z-index: 1;
        }

        .login-box {
          background-color: #0a0a0a;
          padding: 40px 30px;
          border-radius: 30px;
          border: 1px solid #22d3ee;
          width: 100%;
          max-width: 400px;
          /* Assicura che il box non si sposti */
          margin: auto; 
          text-align: center;
          box-shadow: 0 0 40px rgba(34, 211, 238, 0.08);
          transition: transform 0.3s ease;
        }

        .login-header {
          margin-bottom: 40px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 900;
          color: #22d3ee;
          font-style: italic;
          letter-spacing: -1px;
          display: block;
        }

        .sub-logo {
          display: block;
          font-size: 9px;
          color: #444;
          letter-spacing: 4px;
          margin-top: 10px;
          text-transform: uppercase;
          font-weight: bold;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .input-group {
          text-align: left;
        }

        .input-group label {
          font-size: 9px;
          color: #333;
          font-weight: 800;
          margin-left: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: block;
          margin-bottom: 8px;
        }

        .input-group input {
          width: 100%;
          padding: 18px;
          background-color: #000;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          color: #fff;
          outline: none;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .input-group input:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
        }

        .login-btn {
          background-color: #22d3ee;
          color: #000;
          padding: 18px;
          border-radius: 14px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .login-btn.hovered {
          background-color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(255, 255, 255, 0.1);
        }

        .footer-tag {
          color: #1a1a1a;
          font-size: 9px;
          margin-top: 40px;
          letter-spacing: 3px;
          font-weight: 800;
          text-transform: uppercase;
        }

        @media (min-width: 768px) {
          .login-box {
            padding: 60px 50px;
          }
          .top-nav {
            padding: 40px;
          }
        }

        /* Correzione per schermi molto piccoli */
        @media (max-width: 380px) {
          .login-box {
            padding: 30px 20px;
            border-radius: 24px;
          }
          .logo-text {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}