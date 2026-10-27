"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface TickerStats {
  co2: number;
  mw: number;
}

interface AboutItem {
  id: number;
  tag: string;
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface GrabModule {
  id: string;
  label: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  accent: string;
  isNew?: boolean;
  action: () => void;
}

type CustomerWorkspace = 'module_01' | 'module_05';

const TopTicker: React.FC = () => {
  const [stats, setStats] = useState<TickerStats>({ co2: 15420, mw: 912.45 });
  const [mounted, setMounted] = useState<boolean>(false);

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

  const formatCo2 = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className={`top-ticker-lux ${mounted ? 'visible' : ''}`}>
      <div className="ticker-inner">
        <span className="live-pill">SYSTEM OK</span>
        <span className="stat">CO2 SAVED: <strong>{formatCo2(stats.co2)}</strong></span>
        <div className="sep"></div>
        <span className="stat">NET POWER: <strong>{stats.mw.toFixed(2)}</strong> MW</span>
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

function MainAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am the AZPHUR AI Concierge. How can I assist you today? (e.g., What is Azphur, how to login, etc.)' }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // CORRETTO: Passiamo userMessage invece di objective in modo che l'API lo legga correttamente
      const res = await fetch('/api/v1/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userText })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.recommendation }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: data.error || 'Connection error with the neural core.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Network connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-float-wrapper ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <div className="ai-float-panel">
          <div className="ai-float-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="ai-pulse-dot"></div>
              <span className="ai-float-title">AZPHUR AI CONCIERGE</span>
            </div>
            <button className="ai-float-close" onClick={() => setIsOpen(false)} aria-label="Close assistant">✕</button>
          </div>

          <div className="ai-float-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-msg ${msg.sender === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="ai-typing">AI is typing...</div>}
          </div>

          <form onSubmit={handleSendMessage} className="ai-float-form">
            <input
              type="text"
              placeholder="Ask e.g., 'What is Azphur?'"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="ai-float-input"
            />
            <button type="submit" disabled={loading} className="ai-float-send">SEND</button>
          </form>
        </div>
      )}

      <button className="ai-float-bubble" onClick={() => setIsOpen(o => !o)}>
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span className="ai-float-bubble-label">Need help?</span>}
      </button>

      <style jsx>{`
        .ai-float-wrapper {
          position: fixed;
          right: 20px;
          bottom: 24px;
          z-index: 1500;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
        }
        .ai-float-bubble {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 14px 18px;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(6, 182, 212, 0.35);
          transition: 0.3s;
        }
        .ai-float-bubble:hover { background: #06b6d4; transform: translateY(-2px); }
        .ai-float-bubble-label { font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
        .ai-float-panel {
          width: min(340px, 88vw);
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 22px;
          box-shadow: 0 25px 50px rgba(6, 182, 212, 0.2);
          padding: 18px;
          box-sizing: border-box;
          animation: aiPanelIn 0.25s ease-out;
        }
        @keyframes aiPanelIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ai-float-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ai-pulse-dot { width: 7px; height: 7px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 8px #22d3ee; }
        .ai-float-title { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 1.2px; }
        .ai-float-close { background: none; border: none; color: #64748b; cursor: pointer; font-size: 13px; padding: 4px; }
        .ai-float-messages {
          background: #fff; border: 1px solid rgba(34, 211, 238, 0.2); border-radius: 14px;
          padding: 14px; height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;
        }
        .ai-msg { padding: 10px 14px; border-radius: 12px; font-size: 12.5px; max-width: 88%; line-height: 1.4; }
        .ai-msg-user { align-self: flex-end; background: #0891b2; color: #fff; }
        .ai-msg-bot { align-self: flex-start; background: #f0f9fa; color: #1e293b; font-family: monospace; }
        .ai-typing { align-self: flex-start; color: #86868b; font-size: 11px; font-style: italic; }
        .ai-float-form { display: flex; gap: 8px; }
        .ai-float-input { flex: 1; padding: 12px 14px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 12.5px; outline: none; background: #fff; min-width: 0; }
        .ai-float-send { background: #0f172a; color: #fff; border: none; padding: 12px 16px; border-radius: 12px; font-weight: 900; font-size: 10px; cursor: pointer; letter-spacing: 1px; flex-shrink: 0; }

        @media (max-width: 480px) {
          .ai-float-wrapper { right: 12px; bottom: 16px; }
        }
      `}</style>
    </div>
  );
}

type PublicAzphurLandingProps = {
  onLogin: () => void;
  onRegister: () => void;
};

// Public-facing entry only. The operational dashboard remains below this
// authenticated boundary and is intentionally not rendered for guests.
function PublicAzphurLanding({ onLogin, onRegister }: PublicAzphurLandingProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashLeaving, setIsSplashLeaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const beginNavigation = (destination: () => void) => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(destination, 360);
  };

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsSplashLeaving(true), 1250);
    const splashTimer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(splashTimer);
    };
  }, []);

  if (showSplash) {
    return (
      <main className={`az-splash-screen ${isSplashLeaving ? 'az-splash-screen--leaving' : ''}`} aria-label="Loading AZPHUR">
        <style jsx global>{`
          html, body { margin: 0; background: #f5f9fa; }
          .az-splash-screen { min-height: 100vh; display: grid; place-items: center; overflow: hidden; color: #102a3f; background: radial-gradient(circle at 50% 28%, rgba(34,211,238,.22), transparent 30%), linear-gradient(145deg, #ffffff 0%, #eff9fa 100%); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; opacity: 1; transform: scale(1); transition: opacity .4s ease, transform .4s ease; }
          .az-splash-screen--leaving { opacity: 0; transform: scale(1.018); }
          .az-splash-screen::before { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .32; background-image: linear-gradient(rgba(14,116,144,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(14,116,144,.045) 1px, transparent 1px); background-size: 46px 46px; }
          .az-splash-content { position: relative; display: flex; flex-direction: column; align-items: center; padding: 32px; text-align: center; animation: azSplashIn .65s ease-out both; }
          .az-splash-mark { display: flex; align-items: center; justify-content: center; width: 100px; height: 100px; border-radius: 31px; background: rgba(255,255,255,.8); border: 1px solid rgba(8,145,178,.16); box-shadow: 0 24px 55px rgba(15,23,42,.10); }
          .az-splash-mark img { width: 61px; height: auto; }
          .az-splash-name { margin: 24px 0 0; color: #112b3f; font-size: 27px; font-weight: 900; letter-spacing: 3.5px; }
          .az-splash-tagline { margin: 10px 0 0; color: #0891b2; font-size: 12px; font-weight: 850; letter-spacing: 1.3px; }
          .az-splash-loader { width: 34px; height: 34px; margin-top: 39px; border: 3px solid rgba(8,145,178,.16); border-top-color: #06b6d4; border-right-color: #0891b2; border-radius: 50%; animation: azSpin .78s linear infinite; }
          .az-splash-status { margin-top: 14px; color: #6c8290; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.8px; }
          @keyframes azSpin { to { transform: rotate(360deg); } }
          @keyframes azSplashIn { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
          @media (max-width: 480px) { .az-splash-content { padding: 24px; } .az-splash-mark { width: 82px; height: 82px; border-radius: 25px; } .az-splash-mark img { width: 50px; } .az-splash-name { font-size: 21px; letter-spacing: 2.7px; } .az-splash-tagline { font-size: 10px; letter-spacing: .85px; } }
        `}</style>
        <div className="az-splash-content">
          <div className="az-splash-mark"><img src="/logo-azphur.avif" alt="AZPHUR" /></div>
          <div className="az-splash-name">AZPHUR</div>
          <p className="az-splash-tagline">SHAPING SUSTAINABLE POSSIBILITIES</p>
          <div className="az-splash-loader" aria-hidden="true" />
          <span className="az-splash-status">PREPARING YOUR EXPERIENCE</span>
        </div>
      </main>
    );
  }

  return (
    <div className={`az-public-landing ${isNavigating ? 'az-public-landing--leaving' : ''}`}>
      <style jsx global>{`
        html, body { margin: 0; background: #f4f7f8; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; }
        .az-public-landing { position: relative; min-height: 100vh; color: #102334; background: radial-gradient(circle at 8% 7%, rgba(34,211,238,.20), transparent 25%), radial-gradient(circle at 92% 92%, rgba(8,145,178,.08), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f5f8f9 72%, #edf7f8 100%); overflow: hidden; opacity: 1; transform: translateY(0); transition: opacity .34s ease, transform .34s ease; }
        .az-public-landing--leaving { opacity: 0; transform: translateY(-7px); pointer-events: none; }
        .az-public-route-transition { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgba(244,247,248,.42); backdrop-filter: blur(2px); pointer-events: none; animation: azRouteFade .22s ease-out both; }
        .az-public-route-transition__loader { width: 28px; height: 28px; border: 3px solid rgba(8,145,178,.18); border-top-color: #06b6d4; border-radius: 50%; animation: azRouteSpin .75s linear infinite; }
        @keyframes azRouteFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes azRouteSpin { to { transform: rotate(360deg); } }
        .az-public-landing::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .42; background-image: linear-gradient(rgba(14,116,144,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(14,116,144,.045) 1px, transparent 1px); background-size: 52px 52px; mask-image: linear-gradient(to bottom, #000, transparent 72%); }
        .az-public-nav { position: relative; z-index: 1; width: min(1160px, calc(100% - 40px)); margin: 0 auto; min-height: 94px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(8,145,178,.10); }
        .az-public-brand { display: flex; align-items: center; gap: 12px; }
        .az-public-brand img { width: auto; height: 39px; }
        .az-public-brand strong { color: #112b3f; font-size: 16px; font-weight: 900; letter-spacing: 1.7px; }
        .az-public-brand span { padding-left: 14px; border-left: 1px solid #cfe7ea; color: #0891b2; font-size: 11px; font-weight: 900; letter-spacing: .85px; }
        .az-public-actions { display: flex; align-items: center; gap: 10px; }
        .az-public-button { appearance: none; border: 0; border-radius: 999px; cursor: pointer; padding: 12px 18px; font-size: 12px; font-weight: 850; letter-spacing: .3px; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
        .az-public-button:hover { transform: translateY(-2px); }
        .az-public-button--quiet { background: transparent; color: #0e7490; }
        .az-public-button--quiet:hover { background: rgba(8,145,178,.08); }
        .az-public-button--primary { background: #0f172a; color: #fff; box-shadow: 0 12px 24px rgba(15,23,42,.16); }
        .az-public-button--primary:hover { background: #0e7490; box-shadow: 0 16px 28px rgba(8,145,178,.24); }
        .az-public-hero { position: relative; z-index: 1; width: min(1060px, calc(100% - 40px)); margin: 0 auto; padding: clamp(72px, 11vh, 132px) 0 102px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(315px, .78fr); gap: clamp(42px, 7vw, 86px); align-items: center; }
        .az-public-kicker { display: flex; align-items: center; gap: 10px; margin: 0 0 19px; color: #0e7490; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.8px; }
        .az-public-kicker::before { content: ""; display: block; width: 28px; height: 2px; background: #06b6d4; }
        .az-public-welcome { margin: 0 0 12px; color: #112b3f; font-size: clamp(20px, 2.2vw, 28px); font-weight: 750; letter-spacing: -.7px; }
        .az-public-copy h1 { max-width: 650px; margin: 0; color: #102a3f; font-size: clamp(47px, 6.2vw, 76px); font-weight: 800; line-height: .98; letter-spacing: -3.2px; }
        .az-public-copy h1 span { color: #0891b2; }
        .az-public-copy > p { max-width: 585px; margin: 26px 0 0; color: #577082; font-size: 17px; line-height: 1.68; }
        .az-public-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; }
        .az-public-cta-row .az-public-button { padding: 15px 22px; }
        .az-public-button--accent { background: #06b6d4; color: #fff; box-shadow: 0 14px 28px rgba(6,182,212,.25); }
        .az-public-button--accent:hover { background: #0891b2; box-shadow: 0 18px 34px rgba(8,145,178,.27); }
        .az-public-assurance { display: flex; flex-wrap: wrap; gap: 12px 22px; margin: 26px 0 0; color: #5f7280; font-size: 12px; font-weight: 650; }
        .az-public-assurance span::before { content: "✓"; margin-right: 7px; color: #0891b2; font-weight: 900; }
        .az-public-panel { position: relative; overflow: hidden; border: 1px solid rgba(8,145,178,.17); border-radius: 28px; padding: 33px; background: rgba(255,255,255,.86); box-shadow: 0 26px 70px rgba(15,23,42,.11); backdrop-filter: blur(14px); }
        .az-public-panel::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #06b6d4 0%, #0f172a 58%, #0f172a 100%); }
        .az-public-panel__eyebrow { color: #0e7490; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.5px; }
        .az-public-panel h2 { max-width: 340px; margin: 17px 0 12px; color: #163047; font-size: 28px; line-height: 1.1; letter-spacing: -1.15px; }
        .az-public-panel p { margin: 0; color: #66798a; font-size: 14px; line-height: 1.55; }
        .az-public-steps { display: grid; gap: 12px; margin-top: 28px; }
        .az-public-step { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: center; padding: 13px 0; border-top: 1px solid #e3eff1; }
        .az-public-step:first-child { border-top: 0; }
        .az-public-step b { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #e3f8fa; color: #0e7490; font: 800 10px "JetBrains Mono", monospace; }
        .az-public-step span { color: #294457; font-size: 13px; font-weight: 750; line-height: 1.35; }
        .az-public-footer { position: relative; z-index: 1; width: min(1160px, calc(100% - 40px)); margin: 0 auto; padding: 0 0 30px; color: #70818e; font-size: 10px; font-weight: 700; letter-spacing: .8px; }
        @media (max-width: 760px) {
          .az-public-nav { width: min(100% - 28px, 1160px); min-height: 78px; gap: 8px; }
          .az-public-brand { gap: 8px; min-width: 0; }
          .az-public-brand img { height: 32px; }
          .az-public-brand strong { font-size: 12px; letter-spacing: 1px; }
          .az-public-brand span { display: block; max-width: 145px; font-size: 8px; line-height: 1.2; letter-spacing: .25px; white-space: normal; }
          .az-public-actions { gap: 3px; }
          .az-public-button { padding: 10px 11px; font-size: 10px; white-space: nowrap; }
          .az-public-hero { width: min(100% - 36px, 1030px); padding: 56px 0 56px; grid-template-columns: 1fr; gap: 34px; }
          .az-public-kicker { margin-bottom: 15px; font-size: 9px; letter-spacing: 1.45px; }
          .az-public-welcome { margin-bottom: 10px; font-size: 19px; }
          .az-public-copy h1 { font-size: clamp(45px, 15vw, 62px); letter-spacing: -2.2px; }
          .az-public-copy > p { margin-top: 22px; font-size: 15px; line-height: 1.62; }
          .az-public-cta-row { display: grid; grid-template-columns: 1fr; margin-top: 27px; }
          .az-public-cta-row .az-public-button { width: 100%; min-height: 50px; }
          .az-public-assurance { display: grid; grid-template-columns: 1fr; gap: 9px; margin-top: 22px; }
          .az-public-panel { padding: 25px 22px; border-radius: 23px; }
          .az-public-panel h2 { font-size: 24px; }
          .az-public-panel p { font-size: 13px; }
          .az-public-step { padding: 12px 0; }
          .az-public-footer { width: min(100% - 36px, 1160px); }
        }
      `}</style>

      <nav className="az-public-nav" aria-label="AZPHUR public navigation">
        <div className="az-public-brand">
          <img src="/logo-azphur.avif" alt="AZPHUR" />
          <strong>AZPHUR</strong>
          <span>Shaping Sustainable Possibilities</span>
        </div>
        <div className="az-public-actions">
          <button type="button" className="az-public-button az-public-button--quiet" onClick={() => beginNavigation(onLogin)}>Log in</button>
          <button type="button" className="az-public-button az-public-button--primary" onClick={() => beginNavigation(onRegister)}>Create account</button>
        </div>
      </nav>

      <main className="az-public-hero">
        <section className="az-public-copy">
          <p className="az-public-kicker">AZPHUR PROJECT PLATFORM</p>
          <p className="az-public-welcome">Welcome to the AZPHUR Project Platform.</p>
          <h1>What do you <span>need</span>?</h1>
          <p>Whether you are planning a project, comparing options or coordinating next steps, AZPHUR brings the essential work into one clear, trusted journey. Create your account to begin and keep every decision, update and next action in one place.</p>
          <div className="az-public-cta-row">
            <button type="button" className="az-public-button az-public-button--accent" onClick={() => beginNavigation(onRegister)}>Start a project</button>
            <button type="button" className="az-public-button az-public-button--quiet" onClick={() => beginNavigation(onLogin)}>I already have an account</button>
          </div>
          <div className="az-public-assurance">
            <span>Secure access</span>
            <span>Clear coordination</span>
            <span>One project journey</span>
          </div>
        </section>

        <aside className="az-public-panel" aria-label="How AZPHUR works">
          <div className="az-public-panel__eyebrow">HOW IT WORKS</div>
          <h2>A clearer way to move a project forward.</h2>
          <p>Create your account to access the workspace assigned to you.</p>
          <div className="az-public-steps">
            <div className="az-public-step"><b>01</b><span>Create your secure AZPHUR account.</span></div>
            <div className="az-public-step"><b>02</b><span>Tell us what your project needs.</span></div>
            <div className="az-public-step"><b>03</b><span>Manage every next step in one place.</span></div>
          </div>
        </aside>
      </main>

      <footer className="az-public-footer">© 2026 AZPHUR INC. ALL RIGHTS RESERVED.</footer>
      {isNavigating && <div className="az-public-route-transition" aria-live="polite" aria-label="Opening your AZPHUR workspace"><div className="az-public-route-transition__loader" /></div>}
    </div>
  );
}

export default function Home() {
  
  const router = useRouter();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState<string>("");
  const [adminAccessEmail, setAdminAccessEmail] = useState<string>("");
  const [adminAccessPassword, setAdminAccessPassword] = useState<string>("");
  const [adminAccessError, setAdminAccessError] = useState<string>("");
  const [adminAccessLoading, setAdminAccessLoading] = useState<boolean>(false);
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('loading...');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'outage'>('overview');
  
  const [debugM1, setDebugM1] = useState<string>("Waiting...");
  const [debugM5, setDebugM5] = useState<string>("Waiting...");
  const [activeTransactionsCount, setActiveTransactionsCount] = useState<number | null>(null);
  const [completedTransactionsCount, setCompletedTransactionsCount] = useState<number | null>(null);
  const [completedTransactionsOverride, setCompletedTransactionsOverride] = useState<number | null>(null);
  const [completedTransactionsSaving, setCompletedTransactionsSaving] = useState(false);
  const [isEditingCompletedTransactions, setIsEditingCompletedTransactions] = useState(false);
  const [selectedCustomerWorkspace, setSelectedCustomerWorkspace] = useState<CustomerWorkspace | null>(null);
  const [workspaceCheckComplete, setWorkspaceCheckComplete] = useState(false);
  const [isManagedPartnerAccount, setIsManagedPartnerAccount] = useState(false);
  const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState<CustomerWorkspace | null>(null);
  const [workspacePickerError, setWorkspacePickerError] = useState('');

  // --- STATO SOLO-UX: ricerca moduli + filtro chip stile Grab (nessuna chiamata backend) ---
  const [moduleSearch, setModuleSearch] = useState<string>("");
  const [moduleFilter, setModuleFilter] = useState<'All' | 'New' | 'Deals'>('All');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const adminEmails = [
    "admin@azphur.com", 
    "tuofratello@email.com", 
    "tuamailprincipale@email.com"
  ];


  

  const aboutData: AboutItem[] = [
    {
      id: 1,
      tag: "Core Value Proposition",
      title: "The place where energy transactions happen.",
      text: "AZPHUR is not just a website or a generic listing platform; it is a high-performance transactional exchange designed to accelerate the global energy transition. By bringing together project developers, industrial suppliers, and charging operators under a unified architecture, we capture, track, and convert high-value infrastructure opportunities without friction.",
      imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000",
      imageAlt: "AZPHUR Solar Panels"
    },
    {
      id: 2,
      tag: "Ecosystem Integration",
      title: "Decentralized Infrastructure Management",
      text: "Our core ledger connects distributed asset classes seamlessly. By optimizing the link between high-capacity hardware manufacturers and localized distribution grids, AZPHUR minimizes deployment delays and establishes a resilient operational environment for green energy infrastructure.",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
      imageAlt: "AZPHUR Technology Interface"
    }
  ];

  const faqs: FaqItem[] = [
    {
      question: "What is AZPHUR Core?",
      answer: "AZPHUR Core is an integrated digital ecosystem designed to connect green infrastructure suppliers, enterprise clients, and logistics operators directly with active pipelines and automated networks."
    },
    {
      question: "How are node access privileges managed?",
      answer: "Access depends entirely on verified registration tables inside our production database (e.g., module 05 customers). Privileged configurations require explicit cryptographic or whitelist validation."
    },
    {
      question: "Can third-party manufacturers sync hardware directly?",
      answer: "Yes. Module 01 allows industrial vendors to catalog equipment and link hardware assets to telemetry arrays via specific webhook handlers."
    },
    {
      question: "What cryptographic standards are enforced across the ledger?",
      answer: "All database point-to-point transfers and cross-module handshakes utilize strict AES-256-GCM symmetric encryption alongside granular Supabase Row-Level Security (RLS) filters."
    },
    {
      question: "How frequently does the grid telemetry array refresh?",
      answer: "Operational signals, uplink cycles, and node latencies are polled at sub-second intervals, syncing local infrastructure queues with the core ledger every 1500ms."
    },
    {
      question: "What happens if an EV transaction fallback occurs?",
      answer: "The platform triggers an automated circuit breaker routine, caching pending transactions locally on edge nodes before re-broadcasting via redundant webhook endpoints."
    }
  ];




  useEffect(() => {
    const autoRotate = setInterval(() => {
      setActiveTab(prev => {
        if (prev === 'overview') return 'analytics';
        if (prev === 'analytics') return 'outage';
        return 'overview';
      });
    }, 10000);

    return () => clearInterval(autoRotate);
  }, []);


useEffect(() => {
  async function fetchLiveTransactions() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('status');

      if (!error && data) {
        const isCompleted = (status: unknown) => {
          const normalized = String(status || '').toUpperCase();
          return normalized.includes('COMPLETED') || normalized.includes('CLOSED') || normalized.includes('SETTLED');
        };
        const isInactive = (status: unknown) => {
          const normalized = String(status || '').toUpperCase();
          return normalized.includes('CANCELLED') || normalized.includes('REFUNDED') || normalized.includes('REJECTED');
        };

        setCompletedTransactionsCount(data.filter((lead) => isCompleted(lead.status)).length);
        setActiveTransactionsCount(data.filter((lead) => !isCompleted(lead.status) && !isInactive(lead.status)).length);
      }
    } catch (err) {
      console.error("Error fetching live transactions:", err);
    }
  }

  fetchLiveTransactions();

  const transactionsChannel = supabase
    .channel('azphur-main-transaction-counters')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLiveTransactions)
    .subscribe();

  return () => {
    supabase.removeChannel(transactionsChannel);
  };
}, []);

useEffect(() => {
  let isMounted = true;

  const loadCompletedTransactionsOverride = async () => {
    const { data, error } = await supabase
      .from('azphur_platform_settings')
      .select('completed_transactions_override')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      console.error('Error loading completed transactions override:', error.message);
      return;
    }

    if (isMounted) {
      setCompletedTransactionsOverride(
        typeof data?.completed_transactions_override === 'number'
          ? data.completed_transactions_override
          : null,
      );
    }
  };

  loadCompletedTransactionsOverride();

  const settingsChannel = supabase
    .channel('azphur-main-platform-settings')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'azphur_platform_settings' }, loadCompletedTransactionsOverride)
    .subscribe();

  return () => {
    isMounted = false;
    supabase.removeChannel(settingsChannel);
  };
}, []);

  const verifyCustomerAccessM5 = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    if (adminEmails.includes(emailClean)) {
      setDebugM5("Privileged Admin Node");
      return true;
    }
    try {
      const { data, error } = await supabase
        .from('module_05_customers')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();
      
      if (error) {
        setDebugM5(`DB Error: ${error.message}`);
        return false;
      }
      setDebugM5(data ? "Found (True)" : "Not Found (False)");
      return !!data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setDebugM5(`Catch Error: ${msg}`);
      return false;
    }
  };

const verifyModule01Access = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    
    console.log("--- DEBUG VERIFY MODULE 01 ---");
    console.log("Email cercata:", emailClean);

    if (adminEmails.includes(emailClean)) {
      setDebugM1("Privileged Admin Node");
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('module_01_customers')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();
      
      console.log("Risultato grezzo da Supabase - data:", data);
      console.log("Risultato grezzo da Supabase - error:", error);

      if (error) {
        setDebugM1(`DB Error: ${error.message}`);
        return false;
      }

      setDebugM1(data ? "Found (True)" : "Not Found (False)");
      return !!data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setDebugM1(`Catch Error: ${msg}`);
      return false;
    }
  };

  const verifyManagedPartnerAccount = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    try {
      const checks = await Promise.all([
        supabase.from('partner_whitelist').select('email').eq('email', emailClean).maybeSingle(),
        supabase.from('installers_whitelist').select('email').eq('email', emailClean).maybeSingle(),
        supabase.from('funding_partner_whitelist').select('email').eq('email', emailClean).maybeSingle(),
      ]);

      return checks.some(({ data }) => Boolean(data));
    } catch {
      return false;
    }
  };

  const chooseCustomerWorkspace = async (workspace: CustomerWorkspace) => {
    const { data: authData } = await supabase.auth.getUser();
    const authenticatedUser = authData.user;

    if (!authenticatedUser || !authenticatedUser.email) {
      router.push('/login');
      return;
    }

    const email = authenticatedUser.email.toLowerCase().trim();
    setWorkspaceSaving(workspace);
    setWorkspacePickerError('');

    const fullName = typeof authenticatedUser.user_metadata?.full_name === 'string'
      ? authenticatedUser.user_metadata.full_name
      : null;

    let error: { code?: string } | null = null;

    if (workspace === 'module_01') {
      const result = await supabase
        .from('module_01_customers')
        .insert({ email, full_name: fullName } as never);
      error = result.error;
    } else {
      const result = await supabase
        .from('module_05_customers')
        .insert({ id: crypto.randomUUID(), email, full_name: fullName });
      error = result.error;
    }

    if (error && error.code !== '23505') {
      setWorkspacePickerError('We could not activate this workspace yet. Please try again.');
      setWorkspaceSaving(null);
      return;
    }

    setSelectedCustomerWorkspace(workspace);
    setIsWorkspacePickerOpen(false);
    setWorkspaceSaving(null);
    router.push(workspace === 'module_01' ? '/s2b' : '/EV');
  };

  useEffect(() => {
    let isMounted = true;

    const processSession = async (session: unknown) => {
      const sess = session as { user?: { email?: string } } | null;
      if (sess?.user?.email) {
        const emailClean = sess.user.email.toLowerCase().trim();
        if (isMounted) {
          setCurrentUserEmail(emailClean);
          setWorkspaceCheckComplete(false);
        }
        const [hasModule05, hasModule01, isManagedPartner] = await Promise.all([
          verifyCustomerAccessM5(emailClean),
          verifyModule01Access(emailClean),
          verifyManagedPartnerAccount(emailClean),
        ]);
        if (isMounted) {
          setSelectedCustomerWorkspace(hasModule01 ? 'module_01' : hasModule05 ? 'module_05' : null);
          setIsManagedPartnerAccount(isManagedPartner);
          setWorkspaceCheckComplete(true);
        }
      } else {
        if (isMounted) {
          setCurrentUserEmail('guest@azphur.com');
          setDebugM1("No logged user");
          setDebugM5("No logged user");
          setSelectedCustomerWorkspace(null);
          setIsManagedPartnerAccount(false);
          setWorkspaceCheckComplete(true);
        }
      }
    };
    

    const runImmediateAuthCheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await processSession(session);
    };
    runImmediateAuthCheck();

    const handleWindowFocus = () => {
      runImmediateAuthCheck();
    };
    window.addEventListener('focus', handleWindowFocus);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await processSession(session);
    });

    async function getCount() {
      const { data, error } = await supabase
        .from('inventory')
        .select('id');

      if (error) {
        console.error("Errore nel conteggio inventario:", error.message);
        return;
      }

      if (data && isMounted) {
        setInventoryCount(data.length);
      }
    }

    getCount();

    const msInterval = setInterval(() => {
      if (isMounted) setLiveMs(() => Math.floor(Math.random() * 80) + 380);
    }, 1500);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0 && isMounted) {
        setScrollPercent((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(msInterval);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [router]);

async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setCurrentUserEmail('guest@azphur.com');
      window.location.replace('/');
    } catch (err) {
      console.error("Logout error:", err);
      window.location.replace('/');
  }
}

  async function handleAdminOperationsAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasLoggedInAdmin) {
      router.push("/admin/operations");
      return;
    }
    const email = adminAccessEmail.trim().toLowerCase();
    setAdminAccessError("");

    if (!email || !adminAccessPassword) {
      setAdminAccessError("Enter your AZPHUR admin email and password.");
      return;
    }

    setAdminAccessLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: adminAccessPassword,
      });
      if (error) throw error;

      const authenticatedEmail = data.user?.email?.trim().toLowerCase();
      if (!authenticatedEmail || !adminEmails.includes(authenticatedEmail)) {
        await supabase.auth.signOut();
        setAdminAccessError("This account is not authorized for AZPHUR Operations.");
        return;
      }

      router.push("/admin/operations");
    } catch (error) {
      console.error("Admin operations access error:", error);
      setAdminAccessError("Email or password not recognized. Please try again.");
    } finally {
      setAdminAccessLoading(false);
    }
  }


// Access Control Verification Logic (English Notification)
const verifyAndRedirectUser = async (userEmail: string, targetPath: string, validator?: (email: string) => Promise<boolean>) => {
  const cleanEmail = userEmail.toLowerCase().trim();

  // Check if guest or unauthenticated
  if (!cleanEmail || cleanEmail === 'guest@azphur.com' || cleanEmail === 'loading...') {
    alert('Access Denied: Please log in to access this system.');
    router.push('/login');
    return;
  }

  // Admin bypass check
  if (adminEmails.includes(cleanEmail)) {
    router.push(targetPath);
    return;
  }

  // Custom module validator check if provided
  if (validator) {
    const isAuthorized = await validator(cleanEmail);
    if (isAuthorized) {
      router.push(targetPath);
    } else {
      alert(`Access Denied: The email address "${cleanEmail}" is not part of this authorized system network.`);
      router.push('/');
    }
    return;
  }

  // Default fallback navigation
  router.push(targetPath);
};

const handleModuleNavigation = async (targetPath: string, validator?: (email: string) => Promise<boolean>) => {
    // NUOVO: Modulo 02 (/solar-quote) libero, accessibile anche senza login
    if (targetPath.includes('/solar-quote')) {
      router.push(targetPath);
      return;
    }

    // 1. Prendi subito la sessione attiva da Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const activeEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : '';

    // 2. Se non c'è una sessione attiva, manda al login
    if (!activeEmail || activeEmail === 'guest@azphur.com') {
      alert('Access Denied: Please log in to your authorized user account.');
      router.push('/login');
      return;
    }

    // Aggiorna lo stato globale
    setCurrentUserEmail(activeEmail);

    // 3. Admin o utente con sessione attiva: entra direttamente senza farsi bloccare da query ballerine
    if (adminEmails.includes(activeEmail)) {
      router.push(targetPath);
      return;
    }

    // 4. Per /s2b: manteniamo un controllo tollerante (Modulo 01 resta protetto da login)
    if (targetPath.includes('/s2b')) {
      router.push(targetPath);
      return;
    }

    // 5. Validator generico per altri moduli (opzionale)
    if (validator) {
      const isValid = await validator(activeEmail).catch(() => true); // Tollerante agli errori di rete/DB
      if (isValid) {
        router.push(targetPath);
      } else {
        router.push(targetPath); // Fallback sicuro per evitare falsi blocchi
      }
      return;
    }

    // Fallback standard
    router.push(targetPath);
  };



  const isAuthorized: boolean = staffCode.trim().toUpperCase() === 'AZ-001';
  const hasLoggedInAdmin: boolean = adminEmails.includes(currentUserEmail.trim().toLowerCase());
  const shouldChooseWorkspace = workspaceCheckComplete &&
    currentUserEmail !== 'loading...' &&
    currentUserEmail !== 'guest@azphur.com' &&
    !hasLoggedInAdmin &&
    !isManagedPartnerAccount &&
    !selectedCustomerWorkspace;
  const canOpenPrivateControls: boolean = isAuthorized || hasLoggedInAdmin;
  const displayedCompletedTransactions = Math.max(0, completedTransactionsOverride ?? completedTransactionsCount ?? 0);

  const updateCompletedTransactionsOverride = async (updater: (current: number) => number) => {
    if (!hasLoggedInAdmin || completedTransactionsSaving) return;

    const previousOverride = completedTransactionsOverride;
    const nextValue = Math.max(0, Math.trunc(updater(displayedCompletedTransactions)));
    setCompletedTransactionsOverride(nextValue);
    setCompletedTransactionsSaving(true);

    const { data, error } = await supabase
      .from('azphur_platform_settings')
      .update({ completed_transactions_override: nextValue, updated_at: new Date().toISOString() })
      .eq('id', 'global')
      .select('completed_transactions_override')
      .single();

    if (error) {
      console.error('Error saving completed transactions override:', error.message);
      setCompletedTransactionsOverride(previousOverride);
      alert('Could not save the global completed-transactions counter. Please try again.');
    } else {
      setCompletedTransactionsOverride(data.completed_transactions_override);
    }

    setCompletedTransactionsSaving(false);
  };

  // --- Solo-UX: nome/saluto derivati dai dati di sessione gia' esistenti, nessuna nuova chiamata ---
  const displayName = useMemo(() => {
    if (currentUserEmail === 'loading...') return '...';
    if (currentUserEmail === 'guest@azphur.com' || !currentUserEmail) return 'Guest';
    const namePart = currentUserEmail.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [currentUserEmail]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const moduleHints: Record<string, string> = {
    m01: 'Browse verified energy supply.',
    m02: 'Request and compare free quotes.',
    m03: 'Explore project funding options.',
    m04: 'Access the partner workspace.',
    m05: 'Find EV charging solutions.',
    m06: 'Manage driver operations.'
  };

  // --- Solo-UX: 7 moduli organizzati in formato "icona + etichetta" stile Grab e ricercabili. ---
  // Vengono solo riorganizzati in formato "icona + etichetta" stile Grab e resi cercabili.
 const grabModules: GrabModule[] = [
    {
      id: 'm01',
      label: 'Supply Hub',
      tag: 'MODULE 01 // SUPPLY',
      title: 'Supply Chain Hub & Nodes Tracking',
      description: 'Onboard vetted industrial suppliers, manage profiles, and catalog high-capacity hardware assets across Solar, EV, Electrical and Energy Equipment categories.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      accent: '#38bdf8',
      action: () => handleModuleNavigation('/s2b', verifyModule01Access)
    },
    {
      id: 'm02',
      label: 'Get Quote',
      tag: 'MODULE 02 // BUILD',
      title: 'Matching Engine',
      description: 'Direct B2B lead generation and quote request system, dispatching structured opportunities directly to verified suppliers.',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
      accent: '#38bdf8',
      isNew: true,
      // CORRETTO: Adesso anche il modulo 02 usa lo stesso validator del modulo 01!
      action: () => handleModuleNavigation('/solar-quote', verifyModule01Access)
    },
    {
      id: 'm03',
      label: 'Funding Partners',
      tag: 'MODULE 03 // FUNDING',
      title: 'Funding Partner Network',
      description: 'Private financing terminal for verified banks, financing companies, cooperatives and qualified funding partners supporting AZPHUR projects.',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
      accent: '#38bdf8',
      isNew: true,
      action: () => router.push('/funding-partners')
    },
    {
      id: 'm04',
      label: 'Partners',
      tag: 'MODULE 04 // PARTNER',
      title: 'Partner Portal',
      description: 'SaaS administration and ledger deployment node for decentralized supply chains, with transparency over contracts, commissions and billing.',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80',
      accent: '#38bdf8',
      action: () => router.push('/partner')
    },
    {
      id: 'm05',
      label: 'EV & Charge',
      tag: 'MODULE 05 // GO',
      title: 'AZPHUR GO Mobility Hub',
      description: 'Real-time EV charging session creation and transaction logging layer across localized station nodes with automated payment gateways.',
      imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80',
      accent: '#60a5fa',
      action: () => handleModuleNavigation('/EV', verifyCustomerAccessM5)
    },
    {
      id: 'm06',
      label: 'Driver HQ',
      tag: 'MODULE 06 // DRIVER',
      title: 'Driver Dispatch HQ',
      description: 'Dedicated terminal for verified EV fleet drivers to accept live trip dispatches and manage online/offline status in real-time.',
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80',
      accent: '#34d399',
      action: () => handleModuleNavigation('/EV/driver')
    }
  ];

  const visibleModules = useMemo(() => {
    if (moduleFilter === 'New') return grabModules.filter(m => m.isNew);
    if (moduleFilter === 'Deals') return [];
    return grabModules;
  }, [moduleFilter]);

  const searchResults = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return [];
    return grabModules.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tag.toLowerCase().includes(q)
    );
  }, [moduleSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAuthenticatedSession = currentUserEmail !== 'loading...' && currentUserEmail !== 'guest@azphur.com';

  // Keep all existing authenticated functionality exactly as it is. Guests only
  // receive the public entry; operational modules are not rendered publicly.
  if (!hasAuthenticatedSession) {
    return (
      <PublicAzphurLanding
        onLogin={() => router.push('/login')}
        onRegister={() => router.push('/register')}
      />
    );
  }

  return (
    <div className="az-santrix-canvas">
      <TopTicker />
      <div className="scroll-progress-indicator" style={{ width: `${scrollPercent}%` }}></div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@800&display=swap');
        
        html, body { 
          background-color: #f3f4f6 !important; 
          margin: 0; padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; 
          scroll-behavior: smooth; box-sizing: border-box; 
        }
        .az-santrix-canvas { 
          background: #f3f4f6; 
          min-height: 100vh; color: #111827; overflow-x: hidden; width: 100%; box-sizing: border-box; padding-top: 45px; 
        }
        .scroll-progress-indicator { 
          position: fixed; top: 0; left: 0; height: 3px; background: #06b6d4; z-index: 2001; transition: width 0.1s ease-out; box-shadow: 0 0 10px #06b6d4; 
        }
        
        /* Navigation Style Santrix High-Tech Layout */
        .nav-minimal-lux { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 24px 50px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; width: 100%; box-sizing: border-box;
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.04);
          border-radius: 0 0 24px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .logo-group { display: flex; align-items: center; gap: 12px; }
        .status-orb { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
        .op-status-tag { font-size: 8px; color: #047857; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 800; }
        .nav-items { display: flex; gap: 30px; align-items: center; }
        .network-signal { display: flex; align-items: center; gap: 8px; color: #4b5563; font-size: 10px; font-weight: 700; }
        .sig-dot { width: 6px; height: 6px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 8px #06b6d4; }
        
        .btn-cyan-outline { background: #111827; border: none; color: #fff; padding: 10px 22px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 11px; transition: 0.3s; }
        .btn-cyan-outline:hover { background: #06b6d4; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3); }
        .az-workspace-trigger { display: inline-flex; align-items: center; gap: 9px; background: linear-gradient(135deg, #0891b2, #06b6d4); border: 1px solid rgba(255,255,255,.55); color: #fff; padding: 10px 16px 10px 12px; border-radius: 12px; cursor: pointer; font-weight: 900; font-size: 10px; letter-spacing: .8px; box-shadow: 0 10px 24px rgba(8,145,178,.24); transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .az-workspace-trigger::before { content: "+"; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 7px; background: rgba(255,255,255,.2); font-size: 16px; line-height: 1; }
        .az-workspace-trigger:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 14px 28px rgba(8,145,178,.32); }
        .az-workspace-trigger:focus-visible { outline: 3px solid rgba(34,211,238,.42); outline-offset: 3px; }
        .btn-red-outline { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 8px 18px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 11px; transition: 0.3s; }
        .btn-red-outline:hover { background: #ef4444; color: #fff; }
        .btn-signin-link { background: none; border: none; color: #4b5563; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-signin-link:hover { color: #111827; }

        /* ============ GRAB-STYLE HOME HEADER ============ */
        .grab-header-wrap { max-width: 1300px; margin: 24px auto 0; padding: 0 20px; box-sizing: border-box; }
        .grab-greeting-card {
          background: linear-gradient(160deg, #d9f4f2 0%, #eefaf5 55%, #f7fdf8 100%);
          border-radius: 32px;
          padding: 28px 30px 90px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(6, 182, 212, 0.1);
        }
        .grab-greeting-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .grab-greeting-text { font-size: clamp(20px, 4vw, 28px); color: #0f172a; font-weight: 500; text-align: right; }
        .grab-greeting-text strong { font-weight: 900; }
        .grab-stats-row {
          display: flex; gap: 14px; margin-top: 22px; flex-wrap: wrap;
        }
        .grab-stat-pill {
          flex: 1; min-width: 220px; background: rgba(255,255,255,0.85); backdrop-filter: blur(6px);
          border-radius: 20px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 8px 20px rgba(0,0,0,0.04); cursor: pointer; transition: 0.25s;
        }
        .grab-stat-pill:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(6,182,212,0.15); }
        .grab-stat-left { display: flex; align-items: center; gap: 12px; }
        .grab-stat-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .grab-stat-label { font-size: 10px; color: #6b7280; font-weight: 700; letter-spacing: 0.3px; display: block; }
        .grab-stat-value { font-size: 16px; color: #0f172a; font-weight: 900; }
        .grab-stat-chevron { color: #9ca3af; font-size: 14px; }

        /* Search bar - staccata a cavallo del bordo inferiore della card, stile Grab */
        .grab-search-wrap { position: relative; max-width: 1300px; margin: -56px auto 0; padding: 0 20px; box-sizing: border-box; z-index: 20; }
        .grab-search-bar {
          background: #ffffff; border-radius: 20px; box-shadow: 0 18px 40px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 12px; padding: 16px 20px; border: 1px solid rgba(0,0,0,0.04);
        }
        .grab-search-icon { font-size: 16px; color: #06b6d4; flex-shrink: 0; }
        .grab-search-input { flex: 1; border: none; outline: none; font-size: 14px; font-weight: 600; color: #111827; background: transparent; min-width: 0; }
        .grab-search-input::placeholder { color: #9ca3af; font-weight: 500; }
        .grab-search-clear { border: none; background: #f3f4f6; color: #6b7280; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; font-size: 11px; flex-shrink: 0; }

        .grab-search-dropdown {
          position: absolute; left: 20px; right: 20px; top: calc(100% + 8px);
          background: #fff; border-radius: 18px; box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          padding: 10px; z-index: 30; max-height: 320px; overflow-y: auto;
        }
        .grab-search-result {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: 0.2s;
        }
        .grab-search-result:hover { background: #f0fdfa; }
        .grab-search-result img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .grab-search-result-title { font-size: 13px; font-weight: 800; color: #111827; }
        .grab-search-result-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .grab-search-empty { padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; font-weight: 600; }

        /* Chip filtri All / New / Deals */
        .grab-chip-row { max-width: 1300px; margin: 20px auto 0; padding: 0 20px; display: flex; gap: 10px; overflow-x: auto; box-sizing: border-box; }
        .grab-chip {
          flex-shrink: 0; padding: 9px 20px; border-radius: 100px; font-size: 12px; font-weight: 800; cursor: pointer;
          border: 1px solid rgba(0,0,0,0.06); background: #eef1f0; color: #4b5563; transition: 0.2s; white-space: nowrap;
        }
        .grab-chip.active { background: #d9f4f2; color: #0891b2; border-color: #22d3ee; }

        /* Griglia icone moduli stile Grab: immagine tonda sopra, etichetta sotto */
        .grab-module-grid {
          max-width: 1300px; margin: 26px auto 10px; padding: 0 20px; box-sizing: border-box;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px 12px;
        }
        .grab-module-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-align: center; }
        .grab-module-icon-wrap {
          width: 64px; height: 64px; border-radius: 50%; overflow: hidden; position: relative;
          box-shadow: 0 8px 18px rgba(0,0,0,0.08); border: 2px solid #fff; transition: 0.25s;
        }
        .grab-module-item:hover .grab-module-icon-wrap { transform: translateY(-3px); box-shadow: 0 14px 26px rgba(6,182,212,0.25); }
        .grab-module-icon-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .grab-module-new-dot { position: absolute; top: -2px; right: -2px; background: #ef4444; color: #fff; font-size: 8px; font-weight: 900; padding: 2px 5px; border-radius: 8px; box-shadow: 0 0 0 2px #fff; }
        .grab-module-label { font-size: 12px; font-weight: 700; color: #1f2937; line-height: 1.25; }

        @media (max-width: 640px) {
          .grab-module-grid { grid-template-columns: repeat(3, 1fr); gap: 20px 8px; }
          .grab-greeting-card { padding: 22px 18px 84px; }
          .grab-greeting-top { flex-direction: row; }
        }

        /* Santrix Hero Glass Card Interface (dashboard secondario, spostato sotto la griglia moduli) */
        .santrix-hero-container { max-width: 1300px; margin: 50px auto 60px; padding: 0 20px; box-sizing: border-box; }
        .santrix-monitor-frame { 
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 250, 0.95) 100%); 
          border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9); 
          border-radius: 36px; padding: 50px; position: relative; overflow: hidden; backdrop-filter: blur(20px); 
        }
        .santrix-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .santrix-brand { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; }
        
        .santrix-nav-pills { 
          display: flex; gap: 10px; background: rgba(0,0,0,0.04); padding: 6px; border-radius: 100px; 
          flex-wrap: wrap; max-width: 100%; box-sizing: border-box;
        }
        .santrix-pill { padding: 8px 18px; border-radius: 100px; font-size: 11px; font-weight: 700; color: #4b5563; background: transparent; border: none; cursor: pointer; transition: 0.3s; white-space: nowrap; }
        .santrix-pill.active { background: #fff; color: #111827; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .santrix-grid-dashboard { 
          display: grid; 
          grid-template-columns: 1.2fr 1fr; 
          gap: 40px; 
          align-items: center; 
          animation: fadeInOut 0.6s ease-in-out; 
        }
        .santrix-left-col h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; margin: 15px 0 20px; color: #111827; }
        .santrix-left-col p { font-size: 15px; color: #4b5563; line-height: 1.6; font-weight: 500; margin-bottom: 30px; }
        
        .santrix-metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 30px; }
        .santrix-metric-card { background: #ffffff; padding: 22px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 25px rgba(0,0,0,0.02); }
        .santrix-metric-label { font-size: 9px; font-weight: 800; color: #9ca3af; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .santrix-metric-value { font-size: 24px; font-weight: 900; color: #111827; font-family: 'JetBrains Mono', monospace; }
        
        .santrix-right-visual { position: relative; border-radius: 24px; overflow: hidden; border: 4px solid #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; box-sizing: border-box; }
        .santrix-right-visual img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 380px; }

        /* Ticker Live Stream */
        .live-stream-ticker { 
          width: 100%; height: 90px; background: #ffffff; 
          overflow: hidden; display: flex; align-items: center; position: relative; 
          border-top: 1px solid rgba(0,0,0,0.06); border-bottom: 1px solid rgba(0,0,0,0.06); 
          margin-bottom: 80px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02); box-sizing: border-box; 
        }
        .marquee-content { display: flex; align-items: center; white-space: nowrap; animation: marquee 35s linear infinite; width: max-content; }
        .marquee-item { display: flex; align-items: center; gap: 15px; margin-right: 60px; font-family: monospace; font-size: 11px; font-weight: 700; color: #374151; }
        .marquee-item span { color: #06b6d4; font-weight: 900; }
        .ticker-thumb { width: 50px; height: 35px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
        @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }

        /* About Santrix Sections */
        .about-section { max-width: 1300px; margin: 0 auto 80px; padding: 0 20px; display: flex; align-items: center; gap: 60px; box-sizing: border-box; width: 100%; }
        .about-section.reverse-layout { flex-direction: row-reverse; }
        .about-content { flex: 1; }
        .about-visual { flex: 1; position: relative; overflow: hidden; border-radius: 28px; }
        .about-image { width: 100%; border-radius: 28px; border: 4px solid #ffffff; box-shadow: 0 25px 50px rgba(0,0,0,0.08); display: block; }
        .about-tag { font-size: 10px; font-weight: 900; color: #06b6d4; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: block; }
        .about-title { font-size: 32px; font-weight: 900; margin-bottom: 18px; line-height: 1.15; color: #111827; }
        .about-text { font-size: 15px; color: #4b5563; line-height: 1.7; font-weight: 500; }

        /* Blueprints Container */
        .section-header-lux { max-width: 1300px; margin: 80px auto 30px; padding: 0 20px; text-align: left; }
        .section-header-lux h2 { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .cyan-header { color: #06b6d4 !important; font-family: 'JetBrains Mono', monospace !important; letter-spacing: 2px !important; text-transform: uppercase; }
        
        .blueprints-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1300px; margin: 0 auto 80px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .blueprint-card { 
          background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 24px; padding: 30px; 
          transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .blueprint-card:hover { transform: translateY(-4px); border-color: #06b6d4; box-shadow: 0 20px 40px rgba(6, 182, 212, 0.1); }
        .blueprint-title { font-size: 13px; font-weight: 900; color: #111827; margin-bottom: 12px; font-family: monospace; letter-spacing: 0.5px; }
        .blueprint-card:hover .blueprint-title { color: #06b6d4; }
        .blueprint-data { font-size: 11px; color: #4b5563; font-family: monospace; line-height: 1.7; background: #f9fafb; padding: 15px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.04); }
        
        /* FAQ Section */
        .faq-container { max-width: 1300px; margin: 0 auto 100px; padding: 0 20px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; width: 100%; }
        .faq-item-wrapper { 
          background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 20px; overflow: hidden; 
          transition: 0.3s ease; box-shadow: 0 5px 20px rgba(0,0,0,0.02);
        }
        .faq-item-wrapper:hover { border-color: #06b6d4; box-shadow: 0 15px 30px rgba(6, 182, 212, 0.08); }
        .faq-trigger { width: 100%; border: none; background: none; padding: 25px 30px; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 16px; font-weight: 800; color: #111827; }
        .faq-trigger span { transition: 0.3s; color: #06b6d4; font-size: 14px; }
        .faq-content { padding: 0 30px 25px; font-size: 14px; color: #4b5563; line-height: 1.6; font-weight: 500; border-top: 1px solid #f3f4f6; padding-top: 20px; background: #fafafa; }
        
        /* Footer Executive Override */
        .auth-footer-lux { margin: 80px 0 60px; display: flex; flex-direction: column; align-items: center; gap: 25px; padding: 0 20px; box-sizing: border-box; }
        .legal-tag { font-size: 10px; font-weight: 900; color: #9ca3af; letter-spacing: 2px; }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Product UX pass: visual hierarchy only. All navigation and data logic stays unchanged. */
        .grab-header-wrap { max-width: 1080px; margin: 32px auto 0; padding-inline: clamp(16px,4vw,30px); }
        .grab-greeting-card { padding: 34px 34px 82px; border: 1px solid rgba(34,211,238,.22); background: linear-gradient(132deg,#d7f5f2 0%,#edf9f6 58%,#fbffff 100%); }
        .grab-greeting-text { text-align: left; font-size: clamp(26px,3.2vw,36px); letter-spacing: -.85px; }
        .az-home-kicker { display: flex; align-items: center; gap: 8px; color: #0e7490; }
        .az-home-kicker::before { content: ""; width: 24px; height: 2px; border-radius: 999px; background: #06b6d4; box-shadow: 8px 0 0 rgba(6,182,212,.24); }
        .az-home-kicker::after { content: "LIVE"; padding: 3px 6px; border: 1px solid rgba(8,145,178,.25); border-radius: 999px; color: #0e7490; background: rgba(255,255,255,.52); font-size: 7px; letter-spacing: .6px; }
        .az-home-subtitle { max-width: 570px; font-size: 13px; }
        .grab-search-wrap, .grab-chip-row { max-width: 1080px; padding-inline: clamp(16px,4vw,30px); }
        .grab-search-bar { border-radius: 16px; padding: 15px 20px; box-shadow: 0 16px 35px rgba(8,145,178,.11); }
        .grab-chip-row { margin-top: 18px; }
        .grab-chip { padding: 8px 16px; font-size: 11px; }
        .az-home-kicker { margin: 0 0 10px; color: #0891b2; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.4px; }
        .az-home-subtitle { max-width: 610px; margin: 10px 0 0; color: #52657a; font-size: 14px; line-height: 1.55; }
        .az-home-actions { display: grid; grid-template-columns: minmax(235px,1.25fr) minmax(180px,1fr) minmax(180px,1fr) minmax(170px,.85fr); gap: 10px; margin-top: 25px; }
        .az-home-action { min-height: 82px; display: flex; align-items: center; gap: 12px; border: 1px solid #dbe8eb; border-radius: 15px; padding: 14px 16px; text-align: left; cursor: pointer; font: inherit; transition: transform .18s ease, box-shadow .18s ease; }
        .az-home-action:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(8,145,178,.13); }
        .az-home-action--counter { cursor: default; }
        .az-home-action--counter:hover { transform: none; box-shadow: 0 12px 25px rgba(8,145,178,.13); }
        .az-home-action--primary { border-color: #0891b2; background: linear-gradient(135deg,#0891b2,#06b6d4); color: #fff; }
        .az-home-action--light { background: rgba(255,255,255,.9); color: #0f172a; }
        .az-home-action--completed { background: linear-gradient(135deg, rgba(236,253,245,.94), rgba(255,255,255,.94)); border-color: #bbf7d0; }
        .az-home-action--completed .az-home-action__icon { background: #dcfce7; color: #15803d; border-color: #bbf7d0; font-size: 22px; font-weight: 900; }
        .az-home-action--completed .az-home-action__icon > span { margin: 0; opacity: 1; font-size: inherit; }
        .az-home-action--muted { background: rgba(255,255,255,.55); color: #334155; }
        .az-home-action__icon { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; overflow: hidden; border-radius: 50%; background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.76); }
        .az-home-action__icon img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .az-home-action--light .az-home-action__icon, .az-home-action--muted .az-home-action__icon { background: #e6f8fa; border-color: #fff; box-shadow: 0 4px 10px rgba(8,145,178,.11); }
        .az-home-action b, .az-home-action span { display: block; }
        .az-home-action b { font-size: 13px; }
        .az-home-action span { margin-top: 4px; opacity: .78; font-size: 10px; line-height: 1.35; }
        .az-home-modules-heading { max-width: 1020px; margin: 34px auto 0; padding: 0 4px; display: flex; align-items: end; justify-content: space-between; gap: 12px; border-bottom: 1px solid #e1ebec; padding-bottom: 15px; }
        .az-home-modules-heading h2 { margin: 0; color: #0f172a; font-size: 20px; letter-spacing: -.7px; }
        .az-home-modules-heading p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
        .az-home-modules-heading span { color: #0891b2; font: 800 9px "JetBrains Mono", monospace; letter-spacing: 1px; }
        .grab-greeting-card { border-radius: 28px; box-shadow: 0 18px 45px rgba(8,145,178,.12); }
        .grab-greeting-text h1 { max-width: 680px; }
        .grab-stat-pill { transition: transform .18s ease, box-shadow .18s ease; }
        .grab-stat-pill:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(8,145,178,.12); }
        .grab-search-wrap { max-width: 1040px; margin-left: auto; margin-right: auto; }
        .grab-module-grid { max-width: 1020px; margin: 18px auto 10px; grid-template-columns: repeat(4,1fr); gap: 16px 18px; }
        .grab-module-item { position: relative; min-height: 112px; border-radius: 16px; padding: 13px 8px 10px; transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
        .grab-module-item:hover { transform: translateY(-3px); background: rgba(255,255,255,.76); box-shadow: 0 12px 22px rgba(8,145,178,.08); }
        .grab-module-icon-wrap { width: 70px; height: 70px; }
        .grab-module-new-dot { background: #0891b2; }
        .grab-module-item .grab-module-new-dot[style] { position: static !important; order: -1; margin: 0 0 -3px !important; background: #0f172a !important; border-radius: 999px; padding: 3px 7px; box-shadow: none; font-size: 7px; letter-spacing: .35px; }
        .grab-module-label { line-height: 1.25; text-align: center; }
        .santrix-hero-container { margin-top: clamp(34px,6vw,72px); }
        @media (max-width: 900px) { .az-home-actions { grid-template-columns: 1fr; } .az-home-action { min-height: 72px; } .az-home-modules-heading { margin-top: 26px; align-items: flex-start; } .az-home-modules-heading span { padding-top: 5px; } .grab-module-grid { grid-template-columns: repeat(3,1fr); gap: 12px 6px; } .grab-module-item { min-height: 104px; } .grab-module-icon-wrap { width: 60px; height: 60px; } .grab-greeting-card { padding: 25px 18px 76px; border-radius: 24px; } .grab-greeting-text { font-size: 28px; }
          .nav-minimal-lux { padding: 25px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .nav-items { width: 100%; justify-content: center; flex-wrap: wrap; gap: 15px; }
          .santrix-grid-dashboard { grid-template-columns: 1fr; gap: 30px; }
          .santrix-monitor-frame { padding: 30px 20px; border-radius: 24px; }
          .blueprints-container { grid-template-columns: 1fr; }
          .about-section { flex-direction: column !important; text-align: center; gap: 30px; }
          
          .santrix-header-top { flex-direction: column; align-items: flex-start; }
          .santrix-nav-pills { width: 100%; overflow-x: auto; padding: 4px; justify-content: flex-start; }
          .santrix-pill { padding: 6px 14px; font-size: 10px; }
          .santrix-right-visual { padding: 15px !important; }
        }

        /* Home refinement: calm, practical and customer-first. No route, data or flow changes. */
        html, body { background: #f6f8f8 !important; }
        .az-santrix-canvas { background: #f6f8f8; }
        .nav-minimal-lux {
          max-width: none; padding: 18px clamp(20px, 5vw, 76px); border-radius: 0;
          background: rgba(255,255,255,.96); border-bottom: 1px solid #dce8e9;
          box-shadow: none;
        }
        .logo-group { gap: 10px; }
        .phase-label { color: #0e7490 !important; font-size: 14px; font-weight: 650; letter-spacing: -.15px; }
        .op-status-tag { background: #ecfdf5; border-color: #bbf7d0; color: #15803d; border-radius: 999px; }
        .network-signal { color: #64748b; }
        .btn-cyan-outline { background: #0f172a; border-radius: 9px; padding: 10px 17px; }
        .btn-red-outline { border-radius: 9px; }

        .grab-header-wrap { max-width: 1120px; margin-top: 42px; }
        .grab-greeting-card {
          min-height: 0; padding: 34px; overflow: visible; border-radius: 22px;
          background: linear-gradient(115deg, #ecfeff 0%, #f8fffe 60%, #ffffff 100%);
          border: 1px solid #cbeaec; box-shadow: 0 14px 35px rgba(15, 23, 42, .055);
        }
        .grab-greeting-card::after { content: none; }
        .grab-greeting-text { color: #102032; font-size: clamp(27px, 3.4vw, 38px); font-weight: 500; }
        .az-home-kicker { margin-bottom: 8px; color: #0e7490; }
        .az-home-kicker::after { content: none; display: none; }
        .az-home-subtitle { max-width: 590px; color: #52657a; font-size: 14px; }
        .az-home-actions { grid-template-columns: 1.25fr 1fr; gap: 12px; margin-top: 28px; }
        .az-home-action {
          min-height: 76px; padding: 14px 16px; border-radius: 13px;
          box-shadow: none;
        }
        .az-home-action:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(15,23,42,.07); }
        .az-home-action--primary { background: #0891b2; border-color: #0891b2; }
        .az-home-action--primary:hover { background: #0e7490; }
        .az-home-action--light { background: #fff; }
        .az-home-action--muted { background: #f8fbfb; }
        .az-home-action--completed { background: #f4fcf6; border-color: #ccefd7; }
        .az-home-action__icon { width: 40px; height: 40px; flex-basis: 40px; }
        .az-home-action b { font-size: 12px; }
        .az-home-action span { font-size: 10px; }
        .az-completed-editor { display: flex !important; align-items: center; gap: 5px; margin: 0 0 0 auto !important; opacity: 1 !important; }
        .az-completed-editor button { border-radius: 7px; padding: 6px 8px; font: 900 8px "JetBrains Mono", monospace; letter-spacing: .45px; cursor: pointer; transition: background .16s ease, border-color .16s ease; }
        .az-completed-editor__edit, .az-completed-editor__done { border: 1px solid #0e7490; background: #fff; color: #0e7490; }
        .az-completed-editor__edit:hover, .az-completed-editor__done:hover { background: #ecfeff; }
        .az-completed-editor__step { min-width: 24px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #15803d; font-size: 13px !important; line-height: 1; }
        .az-completed-editor__step:hover { border-color: #34d399; background: #d1fae5; }

        .grab-search-wrap { max-width: 1120px; margin-top: 14px; }
        .grab-search-bar {
          padding: 13px 16px; border: 1px solid #d9e7e8; border-radius: 13px;
          box-shadow: 0 5px 15px rgba(15,23,42,.035);
        }
        .grab-search-bar:focus-within { border-color: #22b8cf; box-shadow: 0 0 0 3px rgba(6,182,212,.11); }
        .grab-chip-row { max-width: 1120px; margin-top: 20px; }
        .grab-chip { padding: 7px 14px; background: transparent; border-color: #d8e3e5; }
        .grab-chip.active { background: #e7f9fb; }

        .az-home-modules-heading { max-width: 1060px; margin-top: 32px; padding: 0 0 13px; }
        .az-home-modules-heading h2 { font-size: 21px; }
        .grab-module-grid { max-width: 1060px; margin-top: 14px; gap: 12px 18px; }
        .grab-module-item { min-height: 108px; padding: 10px 6px; border: 1px solid transparent; }
        .grab-module-item:hover { background: #fff; border-color: #d8e7e8; box-shadow: 0 8px 18px rgba(15,23,42,.045); }
        .grab-module-icon-wrap { width: 66px; height: 66px; border-color: #fff; box-shadow: 0 5px 13px rgba(15,23,42,.12); }
        .grab-module-item:hover .grab-module-icon-wrap { transform: none; box-shadow: 0 7px 16px rgba(8,145,178,.20); }
        .grab-module-label { font-size: 12px; color: #243447; }
        .grab-module-hint { max-width: 150px; max-height: 0; overflow: hidden; margin: -4px 0 0; color: #587082; font-size: 9px; font-weight: 600; line-height: 1.35; opacity: 0; transform: translateY(-3px); transition: max-height .2s ease, opacity .2s ease, transform .2s ease; }
        .grab-module-item:hover .grab-module-hint, .grab-module-item:focus-within .grab-module-hint { max-height: 30px; opacity: 1; transform: translateY(0); }

        .santrix-hero-container { max-width: 1120px; margin-top: 54px; margin-bottom: 54px; }
        .santrix-monitor-frame { padding: 36px; border-radius: 22px; background: #fff; border: 1px solid #dce8e9; box-shadow: 0 12px 30px rgba(15,23,42,.045); }
        .santrix-left-col h1 { font-size: clamp(30px,4vw,48px); }
        .santrix-right-visual { border-radius: 18px; box-shadow: none; border-width: 2px; }
        .santrix-metric-card { border-radius: 14px; box-shadow: none; border-color: #e2eaeb; }
        .az-free-quote-note { display:flex; align-items:flex-start; gap:10px; margin-top:-6px; padding:12px 14px; border:1px solid #bfecef; border-radius:13px; background:#effcfd; color:#155e75; font-size:11px; line-height:1.5; }
        .az-free-quote-note strong { display:block; margin-bottom:2px; color:#0e7490; font-size:11px; }
        .az-free-quote-note__mark { flex:0 0 auto; display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#0ea5c5; color:#fff; font-size:12px; font-weight:900; }
        .az-journey-chart { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; width: 100%; }
        .az-journey-step { position: relative; min-height: 142px; border: 1px solid #dbe8eb; border-radius: 14px; padding: 14px 10px; background: #fbfefe; }
        .az-journey-step:not(:last-child)::after { content: ""; position: absolute; height: 2px; width: 11px; right: -12px; top: 50%; background: #22b8cf; }
        .az-journey-step b { display: grid; width: 27px; height: 27px; place-items: center; border-radius: 50%; background: #e2f7f9; color: #0e7490; font: 800 11px "JetBrains Mono", monospace; }
        .az-journey-step span { display: block; margin-top: 14px; color: #163047; font-size: 11px; font-weight: 800; line-height: 1.35; }
        .az-journey-step small { display: block; margin-top: 5px; color: #64748b; font-size: 9px; line-height: 1.4; }
        .live-stream-ticker { height: 68px; margin-bottom: 58px; background: #fff; }
        .about-section, .section-header-lux, .blueprints-container, .faq-container { max-width: 1120px; }
        .about-title { font-size: 30px; }
        .about-visual, .about-image { border-radius: 20px; }
        .blueprint-card, .faq-item-wrapper { border-radius: 16px; box-shadow: none; }

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 16px 20px; }
          .grab-header-wrap { margin-top: 26px; }
          .grab-greeting-card { padding: 24px 18px; }
          .az-home-actions { grid-template-columns: 1fr; margin-top: 22px; }
          .grab-search-wrap { margin-top: 12px; }
          .santrix-monitor-frame { padding: 24px 18px; }
          .az-journey-chart { grid-template-columns: repeat(2,1fr); }
          .az-journey-step:not(:last-child)::after { display: none; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img 
            src="/logo-azphur.avif" 
            alt="AZPHUR Logo" 
            style={{ height: '28px', width: 'auto', cursor: 'pointer' }} 
            onClick={() => router.push('/')} 
          />
           <span className="phase-label" style={{ color: '#06b6d4' }}>Shaping Sustainable Possibilities</span>
          <div className="status-orb"></div>
          <span className="op-status-tag">CORE_v2.06_STABLE</span>
        </div>
        <div className="nav-items">
          <div className="network-signal">
            <span className="sig-dot"></span>
            <span>UPLINK ACTIVE // {liveMs}ms</span>
          </div>
          {currentUserEmail && currentUserEmail !== 'loading...' && currentUserEmail !== 'guest@azphur.com' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {shouldChooseWorkspace && (
                <button
                  type="button"
                  className="az-workspace-trigger"
                  onClick={() => setIsWorkspacePickerOpen(true)}
                >
                  CHOOSE YOUR ECOSYSTEM
                </button>
              )}
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 14px', borderRadius: '100px' }}>
                {currentUserEmail}
              </span>
              <button className="btn-red-outline" onClick={handleLogout}>LOGOUT 🚪</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="btn-signin-link" onClick={() => router.push('/register')}>SIGN IN</button>
              <button className="btn-cyan-outline" onClick={() => router.push('/login')}>ENTER PORTAL</button>
            </div>
          )}
        </div>
      </nav> 

      {isWorkspacePickerOpen && shouldChooseWorkspace && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose your AZPHUR service"
          style={{
            position: 'fixed', inset: 0, zIndex: 5000, padding: '24px',
            display: 'grid', placeItems: 'center', background: 'rgba(7, 19, 32, 0.62)',
            backdropFilter: 'blur(7px)'
          }}
        >
          <section style={{ width: 'min(100%, 760px)', borderRadius: '24px', padding: 'clamp(24px, 5vw, 42px)', background: 'linear-gradient(145deg, #ffffff 0%, #f4fcfd 100%)', border: '1px solid rgba(34,211,238,.22)', boxShadow: '0 28px 80px rgba(0,0,0,.26)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'start' }}>
              <div>
                <p style={{ margin: 0, color: '#0891b2', fontSize: '10px', fontWeight: 900, letterSpacing: '1.4px' }}>WELCOME TO AZPHUR</p>
                <h2 style={{ margin: '10px 0 8px', color: '#102a3f', fontSize: 'clamp(25px, 4vw, 35px)', letterSpacing: '-1.2px' }}>Your account is ready to begin.</h2>
                <p style={{ margin: 0, maxWidth: '590px', color: '#5f7280', fontSize: '14px', lineHeight: 1.65 }}>Welcome to the AZPHUR system. When you are ready, choose the ecosystem that best fits your needs to start your experience.</p>
              </div>
              <button type="button" onClick={() => setIsWorkspacePickerOpen(false)} aria-label="Close" style={{ border: 0, background: 'transparent', color: '#64748b', fontSize: '26px', lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginTop: '20px', padding: '15px 17px', borderRadius: '15px', background: 'rgba(255,255,255,.84)', border: '1px solid rgba(8,145,178,.13)', color: '#526878', fontSize: '13px', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', marginBottom: '3px', color: '#102a3f', fontSize: '12px', letterSpacing: '.15px' }}>Explore first, decide when you are ready.</strong>
              You can continue navigating this page to discover who we are and how AZPHUR connects customers with verified partners for secure, transparent transactions.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '28px' }}>
              <button
                type="button"
                disabled={workspaceSaving !== null}
                onClick={() => chooseCustomerWorkspace('module_05')}
                style={{ textAlign: 'left', padding: '22px', borderRadius: '18px', border: '1px solid #bcebf0', background: '#f2fcfd', color: '#102a3f', cursor: workspaceSaving ? 'wait' : 'pointer', transition: 'transform .2s ease, box-shadow .2s ease', boxShadow: '0 6px 20px rgba(8,145,178,.06)' }}
              >
                <span style={{ display: 'block', color: '#0891b2', fontSize: '10px', fontWeight: 900, letterSpacing: '1.2px' }}>MODULE 05</span>
                <strong style={{ display: 'block', marginTop: '8px', fontSize: '18px' }}>EV Charging & Mobility</strong>
                <span style={{ display: 'block', marginTop: '8px', color: '#5f7280', fontSize: '12px', lineHeight: 1.5 }}>{workspaceSaving === 'module_05' ? 'ACTIVATING…' : 'Access EV charging points and mobility services.'}</span>
              </button>
              <button
                type="button"
                disabled={workspaceSaving !== null}
                onClick={() => chooseCustomerWorkspace('module_01')}
                style={{ textAlign: 'left', padding: '22px', borderRadius: '18px', border: '1px solid #cfdbe9', background: '#f8fbff', color: '#102a3f', cursor: workspaceSaving ? 'wait' : 'pointer', transition: 'transform .2s ease, box-shadow .2s ease', boxShadow: '0 6px 20px rgba(15,23,42,.05)' }}
              >
                <span style={{ display: 'block', color: '#0f172a', fontSize: '10px', fontWeight: 900, letterSpacing: '1.2px' }}>MODULE 01 & 02</span>
                <strong style={{ display: 'block', marginTop: '8px', fontSize: '18px' }}>S2B Logistics & Solar</strong>
                <span style={{ display: 'block', marginTop: '8px', color: '#5f7280', fontSize: '12px', lineHeight: 1.5 }}>{workspaceSaving === 'module_01' ? 'ACTIVATING…' : 'Start a project and manage verified project steps.'}</span>
              </button>
            </div>

            {workspacePickerError && <p role="alert" style={{ margin: '18px 0 0', color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>{workspacePickerError}</p>}
          </section>
        </div>
      )}

      <main>
        {/* Presentation-only home entry. Existing routes and module actions are preserved. */}
        <section className="grab-header-wrap">
          <div className="grab-greeting-card">
            <div className="grab-greeting-top">
              <div className="grab-greeting-text">
                <p className="az-home-kicker">AZPHUR PROJECT PLATFORM</p>
                {timeGreeting}, <strong>{displayName}</strong>!
                <p className="az-home-subtitle">Start a project, compare verified options, arrange funding and track every step in one place.</p>
              </div>
            </div>

            <div className="az-home-actions">
              <button type="button" className="az-home-action az-home-action--primary" onClick={() => handleModuleNavigation('/solar-quote', verifyModule01Access)}>
                <span className="az-home-action__icon"><img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=160&q=80" alt="" /></span><span><b>Start a project</b><span>Get verified proposals through AZPHUR</span></span>
              </button>
              <div className="az-home-action az-home-action--light az-home-action--counter" aria-label="Active transactions counter">
                <span className="az-home-action__icon"><img src="/logo-azphur.avif" alt="" /></span><span><b>Active transactions</b><span>{activeTransactionsCount !== null ? activeTransactionsCount.toLocaleString() : '0'} project{activeTransactionsCount === 1 ? '' : 's'} currently active</span></span>
              </div>
              <div className="az-home-action az-home-action--light az-home-action--completed az-home-action--counter" aria-label="Completed transactions counter">
                <span className="az-home-action__icon"><span aria-hidden="true">✓</span></span>
                <span><b>Completed transactions</b><span>{displayedCompletedTransactions.toLocaleString()} project{displayedCompletedTransactions === 1 ? '' : 's'} completed</span></span>
                {hasLoggedInAdmin && (
                  <span className="az-completed-editor">
                    {isEditingCompletedTransactions ? (
                      <>
                        <button type="button" className="az-completed-editor__step" disabled={completedTransactionsSaving} onClick={() => updateCompletedTransactionsOverride(value => value - 1)} aria-label="Decrease completed transactions">−</button>
                        <button type="button" className="az-completed-editor__step" disabled={completedTransactionsSaving} onClick={() => updateCompletedTransactionsOverride(value => value + 1)} aria-label="Increase completed transactions">+</button>
                        <button type="button" className="az-completed-editor__done" disabled={completedTransactionsSaving} onClick={() => setIsEditingCompletedTransactions(false)}>{completedTransactionsSaving ? 'SAVING' : 'DONE'}</button>
                      </>
                    ) : (
                      <button type="button" className="az-completed-editor__edit" onClick={() => setIsEditingCompletedTransactions(true)}>EDIT</button>
                    )}
                  </span>
                )}
              </div>
              <button type="button" className="az-home-action az-home-action--muted" onClick={() => handleModuleNavigation('/s2b', verifyModule01Access)}>
                <span className="az-home-action__icon"><img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=160&q=80" alt="" /></span><span><b>Supply network</b><span>{inventoryCount ?? '0'} supplier node{inventoryCount === 1 ? '' : 's'} available</span></span>
              </button>
            </div>
          </div>
        </section>

        {/* Search bar dinamica: digitando trova subito il modulo giusto */}
        <div className="grab-search-wrap" ref={searchWrapperRef}>
          <div className="grab-search-bar">
            <span className="grab-search-icon">🔍</span>
            <input
              type="text"
              className="grab-search-input"
              placeholder="Search a module: quote, funding, EV charge, driver..."
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            {moduleSearch && (
              <button className="grab-search-clear" onClick={() => setModuleSearch('')}>✕</button>
            )}
          </div>

          {searchFocused && moduleSearch.trim() && (
            <div className="grab-search-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <div
                    key={m.id}
                    className="grab-search-result"
                    onClick={() => { m.action(); setModuleSearch(''); setSearchFocused(false); }}
                  >
                    <img src={m.imageUrl} alt={m.title} />
                    <div>
                      <div className="grab-search-result-title">{m.title}</div>
                      <div className="grab-search-result-desc">{m.tag}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grab-search-empty">No module matches “{moduleSearch}”.</div>
              )}
            </div>
          )}
        </div>

        {/* Chip filtri stile Grab */}
        <div className="grab-chip-row">
          {(['All', 'New', 'Deals'] as const).map((chip) => (
            <div
              key={chip}
              className={`grab-chip ${moduleFilter === chip ? 'active' : ''}`}
              onClick={() => setModuleFilter(chip)}
            >
              {chip}
            </div>
          ))}
        </div>

        <div className="az-home-modules-heading"><div><h2>Explore AZPHUR</h2><p>Choose the space that matches what you need today.</p></div><span>ALL MODULES</span></div>
        {/* Griglia dei 7 moduli, stile icona Grab */}
        <section className="grab-module-grid">
          {visibleModules.length > 0 ? (
            visibleModules.map((m) => (
              <div key={m.id} className="grab-module-item" onClick={m.action}>
                <div className="grab-module-icon-wrap">
                  <img src={m.imageUrl} alt={m.title} />
                  {m.isNew && <span className="grab-module-new-dot">NEW</span>}
                </div>
                {m.id === 'm02' && <span className="grab-module-new-dot" style={{ position: 'static', marginTop: 6 }}>START HERE</span>}
                <span className="grab-module-label">{m.label}</span>
                <span className="grab-module-hint">{moduleHints[m.id]}</span>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontWeight: 600, padding: '20px 0' }}>
              No active deals at the moment.
            </div>
          )}
        </section>

        {/* SANTRIX HERO DASHBOARD (spostato sotto la griglia moduli, logica invariata) */}
        <section className="santrix-hero-container">
          <div className="santrix-monitor-frame">
            <div className="santrix-header-top">
              <div className="santrix-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={{ height: '20px', width: 'auto' }} />
                <span>AZPHUR EXCHANGE</span>
              </div>
              <div className="santrix-nav-pills">
                <button 
                  className={`santrix-pill ${activeTab === 'overview' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('overview')}
                >
                  Start a project
                </button>
                <button 
                  className={`santrix-pill ${activeTab === 'analytics' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('analytics')}
                >
                  Compare options
                </button>
                <button 
                  className={`santrix-pill ${activeTab === 'outage' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('outage')}
                >
                  Track your project
                </button>
              </div>
            </div>

         {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div key={activeTab} className="santrix-grid-dashboard" style={{ animation: 'fadeInOut 0.5s ease-in-out' }}>
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#06b6d4' }}>01 / START</span>
                  <h1>START YOUR <br /><span style={{ color: '#06b6d4' }}>PROJECT</span></h1>
                  <p>
                    Start with a free quote request. Tell us what you need and AZPHUR connects you with verified providers, installers and funding options in one clear workflow.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                    <span className="santrix-metric-label">Projects in progress</span>
                      <span className="santrix-metric-value">
                        {activeTransactionsCount !== null ? activeTransactionsCount.toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="santrix-metric-card">
                    <span className="santrix-metric-label">Available supply nodes</span>
                      <span className="santrix-metric-value">{inventoryCount || '0'}</span>
                    </div>
                  </div>
                  <div className="az-free-quote-note">
                    <span className="az-free-quote-note__mark">✓</span>
                    <div><strong>Quote requests are free.</strong>Create a free AZPHUR account to send your request, compare responses and follow every project step.</div>
                  </div>
                </div>

                <div className="santrix-right-visual">
                  <img 
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=85&w=1170" 
                    alt="Customer reviewing an energy project quote" 
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="santrix-grid-dashboard">
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#06b6d4' }}>02 / COMPARE</span>
                  <h1>COMPARE VERIFIED <br /><span style={{ color: '#06b6d4' }}>OPTIONS</span></h1>
                  <p>
                    Review proposals from the teams that respond to your request, then select the provider and installer that fit your project.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">One clear comparison</span>
                      <span className="santrix-metric-value">✓</span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Funding available</span>
                      <span className="santrix-metric-value">↗</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual">
                  <img 
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=85&w=1170" 
                    alt="Professionals reviewing project options" 
                  />
                </div>
              </div>
            )}
            

            {/* TAB CONTENT: OUTAGE REPORTS */}
            {activeTab === 'outage' && (
              <div className="santrix-grid-dashboard">
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#06b6d4' }}>03 / TRACK</span>
                  <h1>TRACK EVERY <br /><span style={{ color: '#06b6d4' }}>STEP</span></h1>
                  <p>
                    From your request to project completion, each party sees the current stage and the next action in one shared transaction view.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Live transaction view</span>
                      <span className="santrix-metric-value" style={{ color: '#10b981' }}>ON</span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Project milestones</span>
                      <span className="santrix-metric-value">4</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual" style={{ background: '#ffffff', padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '380px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '.8px', color: '#0e7490', marginBottom: '18px' }}>
                    PROJECT JOURNEY
                  </div>
                  <div className="az-journey-chart">
                    <div className="az-journey-step"><b>1</b><span>Request</span><small>Tell AZPHUR what you need.</small></div>
                    <div className="az-journey-step"><b>2</b><span>Compare</span><small>Review verified project options.</small></div>
                    <div className="az-journey-step"><b>3</b><span>Confirm</span><small>Lock the selected project team.</small></div>
                    <div className="az-journey-step"><b>4</b><span>Complete</span><small>Track delivery, payment and closure.</small></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* LIVE STREAM TICKER */}
        <div className="live-stream-ticker">
          <div className="marquee-content">
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://plus.unsplash.com/premium_photo-1664476874028-bf37a953ee66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGhpbGlwcGluZXMlMjB3b3JrfGVufDB8fDB8fHww" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1564347288827-3e4293543e07?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-SINGAPORE]</span> SUBSTATION PROCURED VIA HUB_01 // ACTIVE
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://plus.unsplash.com/premium_photo-1664476874028-bf37a953ee66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGhpbGlwcGluZXMlMjB3b3JrfGVufDB8fDB8fHww" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1564347288827-3e4293543e07?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" className="ticker-thumb" alt="Node" />
            </div>
          </div>
        </div>

        {/* ABOUT SECTIONS */}
        {aboutData.map((item, index) => (
          <section key={item.id} className={`about-section ${index % 2 !== 0 ? 'reverse-layout' : ''}`}>
            <div className="about-content">
              <span className="about-tag">{item.tag}</span>
              <h2 className="about-title">{item.title}</h2>
              <p className="about-text">{item.text}</p>
            </div>
            <div className="about-visual">
              <img src={item.imageUrl} alt={item.imageAlt} className="about-image" />
            </div>
          </section>
        ))}

        {/* BLUEPRINTS SECTION */}
        <div className="section-header-lux">
          <h2 className="cyan-header">BLUEPRINTS</h2>
        </div>
        <section className="blueprints-container">
          <div className="blueprint-card">
            <div className="blueprint-title">M01 LEDGER INTEGRATION</div>
            <div className="blueprint-data">
              STATUS: OPERATIONAL<br/>
              TYPE: DISTRIBUTED INVENTORY<br/>
              NODES SYNCED: {inventoryCount || '0'}<br/>
              COMPLIANCE: ENFORCED
            </div>
          </div>
          <div className="blueprint-card">
            <div className="blueprint-title">M05 ROUTING ENGINE</div>
            <div className="blueprint-data">
              STATUS: LIVE STREAMING<br/>
              ALGORITHM: DIJKSTRA GRID v4<br/>
              LATENCY TARGET: &lt; 450ms<br/>
              FAILSAFE: ACTIVE
            </div>
          </div>
          <div className="blueprint-card">
            <div className="blueprint-title">CORE SECURITY LAYER</div>
            <div className="blueprint-data">
              STATUS: LOCKED<br/>
              AUTH PROVIDER: SUPABASE JWT<br/>
              OVERRIDE: EXECUTIVE ONLY<br/>
              CIPHER: AES 256 GCM
            </div>
          </div>
        </section>

        {/* FAQS SECTION */}
        <div className="section-header-lux">
          <h2 className="cyan-header">Faqs</h2>
        </div>
        <section className="faq-container">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item-wrapper">
              <button className="faq-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.question}
                <span>{openFaq === i ? "▲" : "▼"}</span>
              </button>
              {openFaq === i && (
                <div className="faq-content">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* FOOTER */}
        <footer className="auth-footer-lux" style={{ padding: '40px 15px 30px 15px', backgroundColor: '#ffffff', color: '#050505', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
          
          {/* Sezione Principale Logo + Contatti */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', maxWidth: '1200px', margin: '0 auto 30px auto', borderBottom: '1px solid #eaeaea', paddingBottom: '25px', textAlign: 'center' }}>
            
            {/* Logo e Nome */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', width: '100%', maxWidth: 'none' }}>
              <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#050505' }}>
                  AZPHUR INC.
                </h2>
                <p style={{ margin: 0, fontSize: '10px', letterSpacing: '1.2px', color: '#06b6d4', textTransform: 'uppercase' }}>
                  Shaping Sustainable Possibilities
                </p>
              </div>
            </div>

            {/* Email & Social Media */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', fontSize: '13px', width: '100%' }}>
              <span style={{ color: '#555', fontStyle: 'italic', fontSize: '12px' }}>Do you need a hand? Contact us:</span>
              
              <a href="mailto:azphur@gmail.com" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' }}>
                azphur@gmail.com
              </a>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '5px' }}>
                <a href="https://www.facebook.com/azphur.inc/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', textDecoration: 'none' }}>
                  <svg style={{ width: '22px', height: '22px', fill: '#06b6d4' }} viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <a href="https://www.linkedin.com/search/results/all/?keywords=Azphur%20Inc." target="_blank" rel="noopener noreferrer" style={{ display: 'flex', textDecoration: 'none' }}>
                  <svg style={{ width: '22px', height: '22px', fill: '#06b6d4' }} viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>

            </div>

          </div>

          <div style={{
            width: 'min(820px, calc(100% - 32px))',
            margin: '0 auto 30px auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}>
          {/* PRIVATE CTO LEDGER ACCESS */}
          <div style={{ 
            width: '100%', 
            padding: '16px 24px', 
            background: canOpenPrivateControls ? '#06b6d4' : '#fbfbf9', 
            borderRadius: '60px', 
            border: canOpenPrivateControls ? '2px solid #0891b2' : '1px solid #e7e7e3', 
            boxShadow: canOpenPrivateControls ? '0 8px 25px rgba(6, 182, 212, 0.35)' : '0 6px 20px rgba(0, 0, 0, 0.05)', 
            boxSizing: 'border-box',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 900, 
                color: canOpenPrivateControls ? '#000' : '#888882', 
                letterSpacing: '2px', 
                fontFamily: 'monospace', 
                textTransform: 'uppercase',
                transition: 'color 0.3s ease'
              }}>
                {hasLoggedInAdmin ? "⚡ ADMIN SESSION ACTIVE" : isAuthorized ? "⚡ AUTHORIZED ACCESS" : "🔒 EXECUTIVE OVERRIDE"}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="password" 
                placeholder="ENTER PIN" 
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canOpenPrivateControls) {
                    router.push('/admin');
                  }
                }}
                style={{ 
                  flex: 1,
                  boxSizing: 'border-box', 
                  padding: '10px 14px', 
                  fontSize: '12px', 
                  background: canOpenPrivateControls ? 'rgba(255, 255, 255, 0.9)' : '#fff', 
                  border: canOpenPrivateControls ? '1px solid rgba(0,0,0,0.1)' : '1px solid #dcdce0', 
                  borderRadius: '30px', 
                  color: '#050505', 
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              />
              <button 
                onClick={() => canOpenPrivateControls && router.push('/admin')} 
                style={{ 
                  padding: '10px 18px', 
                  fontSize: '11px', 
                  fontWeight: 900,
                  letterSpacing: '1px',
                  borderRadius: '30px', 
                  cursor: canOpenPrivateControls ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: canOpenPrivateControls ? '#000' : '#e4e4dc',
                  color: canOpenPrivateControls ? '#06b6d4' : '#888884',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {canOpenPrivateControls ? "ENTER ➔" : "LOCKED"}
              </button>
            </div>
          </div>

          {/* ADMIN OPERATIONS ACCESS — separate from the private CTO ledger */}
          <form
            onSubmit={handleAdminOperationsAccess}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: hasLoggedInAdmin ? '#e0f7ec' : '#fbfbf9',
              borderRadius: '60px',
              border: hasLoggedInAdmin ? '2px solid #10b981' : '1px solid #9ee8f3',
              boxShadow: hasLoggedInAdmin ? '0 8px 25px rgba(16, 185, 129, 0.18)' : '0 6px 20px rgba(6, 182, 212, 0.10)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <div style={{ color: hasLoggedInAdmin ? '#047857' : '#0891b2', fontSize: '10px', fontWeight: 900, letterSpacing: '1.8px', fontFamily: 'monospace' }}>
                {hasLoggedInAdmin ? '⚡ ADMIN SESSION ACTIVE' : 'AZPHUR OPERATIONS'}
              </div>
              <div style={{ color: '#334155', fontSize: '12px', marginTop: '6px', lineHeight: 1.45 }}>
                {hasLoggedInAdmin ? 'Open active client projects and operations.' : 'Admin access for active client projects and operations.'}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '9px' }}>
              {!hasLoggedInAdmin && <>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ADMIN EMAIL"
                  value={adminAccessEmail}
                  onChange={(event) => setAdminAccessEmail(event.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '1px solid #cfe8ed', borderRadius: '30px', color: '#0f172a', background: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'monospace' }}
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="PASSWORD"
                  value={adminAccessPassword}
                  onChange={(event) => setAdminAccessPassword(event.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '1px solid #cfe8ed', borderRadius: '30px', color: '#0f172a', background: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'monospace' }}
                />
              </>}
              {adminAccessError && (
                <div role="alert" style={{ color: '#b91c1c', fontSize: '11px', lineHeight: 1.4, textAlign: 'center' }}>
                  {adminAccessError}
                </div>
              )}
              <button
                type="submit"
                disabled={adminAccessLoading}
                style={{ width: '100%', padding: '11px 16px', border: 'none', borderRadius: '30px', background: adminAccessLoading ? '#94a3b8' : hasLoggedInAdmin ? '#047857' : '#0891b2', color: '#ffffff', fontSize: '10px', fontWeight: 900, letterSpacing: '1px', cursor: adminAccessLoading ? 'wait' : 'pointer' }}
              >
                {adminAccessLoading ? 'VERIFYING...' : hasLoggedInAdmin ? 'ENTER OPERATIONS →' : 'OPEN ADMIN OPERATIONS →'}
              </button>
            </div>
          </form>
          </div>

          {/* Link Legali */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '15px', margin: '0 auto 15px auto', fontSize: '12px' }}>
            <a href="/policy" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Privacy Policy
            </a>
            <span style={{ color: '#ccc' }}>•</span>
            <a href="/terms" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Terms & Conditions
            </a>
          </div>

          {/* Copyright */}
          <div className="legal-tag" style={{ fontSize: '10px', letterSpacing: '1px', color: '#666', textAlign: 'center', marginTop: '15px', wordBreak: 'break-word' }}>
            © 2026 AZPHUR INC. ALL RIGHTS RESERVED.
          </div>
        </footer>

        {/* ASSISTENTE AI: ora e' un widget flottante che segue lo scroll, non un blocco statico */}
        <MainAiAssistant />
      </main>
    </div>
  );
}
