"use client";

import React, { useState, useEffect } from 'react';
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
        <span className="live-pill">SYSTEM_OK</span>
        <span className="stat">CO2_SAVED: <strong>{formatCo2(stats.co2)}</strong></span>
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

export default function Home() {
  const router = useRouter();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState<string>("");
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('loading...s');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [debugM1, setDebugM1] = useState<string>("Waiting...");
  const [debugM5, setDebugM5] = useState<string>("Waiting...");

  // Array unificato degli amministratori di sistema (coerente con la LoginPage)
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
      answer: "Access depends entirely on verified registration tables inside our production database (e.g., module_05_customers). Privileged configurations require explicit cryptographic or whitelist validation."
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
    } catch (err: any) {
      setDebugM5(`Catch Error: ${err.message}`);
      return false;
    }
  };

  const verifyModule01Access = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
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
      
      if (error) {
        setDebugM1(`DB Error: ${error.message}`);
        return false;
      }
      setDebugM1(data ? "Found (True)" : "Not Found (False)");
      return !!data;
    } catch (err: any) {
      setDebugM1(`Catch Error: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    async function checkUserSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const emailClean = session.user.email.toLowerCase().trim();
        setCurrentUserEmail(emailClean);
        await verifyCustomerAccessM5(emailClean);
        await verifyModule01Access(emailClean);
      } else {
        setCurrentUserEmail('guest@azphur.com');
        setDebugM1("No logged user");
        setDebugM5("No logged user");
      }
    }
    checkUserSession();

    async function getCount() {
      const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
      if (count !== null) setInventoryCount(count);
    }
    getCount();

    const msInterval = setInterval(() => {
      setLiveMs(() => Math.floor(Math.random() * 80) + 380);
    }, 1500);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollPercent((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(msInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [router]);

  const handleModuleNavigation = async (path: string, validator?: (email: string) => Promise<boolean>) => {
    if (currentUserEmail === 'guest@azphur.com' || currentUserEmail === 'loading...') {
      router.push('/login');
      return;
    }

    if (adminEmails.includes(currentUserEmail)) {
      router.push('/login'); 
      return;
    }

    if (validator) {
      const isAllowed = await validator(currentUserEmail);
      if (isAllowed) {
        router.push(path);
      } else {
        alert(`Access Denied: The email ${currentUserEmail} is not registered for this structural module.`);
      }
    } else {
      router.push(path);
    }
  };

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

  const isAuthorized: boolean = staffCode.trim().toUpperCase() === 'AZ-001';

  return (
    <div className="az-premium-canvas">
      <TopTicker />
      <div className="scroll-progress-indicator" style={{ width: `${scrollPercent}%` }}></div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght=300;400;500;600;700;800;900&display=swap');
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; scroll-behavior: smooth; box-sizing: border-box; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; overflow-x: hidden; width: 100%; box-sizing: border-box; padding-top: 45px; }
        .scroll-progress-indicator { position: fixed; top: 0; left: 0; height: 3px; background: #22d3ee; z-index: 2001; transition: width 0.1s ease-out; box-shadow: 0 0 8px #22d3ee; }
        .nav-minimal-lux { display: flex; justify-content: space-between; align-items: center; padding: 60px 60px 20px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; width: 100%; }
        .logo-group { display: flex; align-items: center; }
        .az-brand-label { color: #1d1d1f; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 10px #22d3ee; }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 15px; font-weight: 900; flex-shrink: 0; }
        .nav-items { display: flex; gap: 40px; align-items: center; }
        .network-signal { display: flex; align-items: center; gap: 8px; color: #0891b2; font-size: 8px; font-weight: 800; letter-spacing: 1px; flex-shrink: 0; }
        .sig-dot { width: 4px; height: 4px; background: #22d3ee; border-radius: 50%; }
        .btn-cyan-outline { background: none; border: 1px solid #22d3ee; color: #0891b2; padding: 8px 20px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; flex-shrink: 0; }
        .btn-cyan-outline:hover { background: #22d3ee; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2); }
        .btn-red-outline { background: none; border: 1px solid #ef4444; color: #ef4444; padding: 8px 20px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; flex-shrink: 0; }
        .btn-red-outline:hover { background: #ef4444; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
        
        /* LIVE TICKER CON EFFETTO LUCE CYAN E MARQUEE CONTINUO */
        .live-stream-ticker { 
          width: 100%; height: 120px; 
          background: linear-gradient(90deg, rgba(253, 251, 247, 0.75) 0%, rgba(255, 254, 252, 0.85) 50%, rgba(253, 251, 247, 0.75) 100%); 
          backdrop-filter: blur(25px); overflow: hidden; display: flex; align-items: center; position: relative; 
          border-top: 1px solid rgba(34, 211, 238, 0.35); border-bottom: 1px solid rgba(34, 211, 238, 0.35); 
          margin-bottom: 80px; box-shadow: inset 0 0 30px rgba(34, 211, 238, 0.03), 0 10px 30px rgba(0, 0, 0, 0.02); box-sizing: border-box; 
        }
        .live-stream-ticker::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.08) 50%, transparent 100%);
          background-size: 200% 100%; animation: cyan-glow-sweep 8s linear infinite; pointer-events: none; z-index: 1;
        }
        .marquee-content { display: flex; align-items: center; white-space: nowrap; animation: marquee 30s linear infinite; z-index: 2; width: max-content; }
        .marquee-item { display: flex; align-items: center; gap: 15px; margin-right: 80px; font-family: monospace; font-size: 11px; font-weight: 800; color: #1d1d1f; letter-spacing: 1px; }
        .marquee-item span { color: #0891b2; font-weight: 900; }
        .ticker-thumb { width: 70px; height: 45px; object-fit: cover; border-radius: 8px; border: 2px solid #1d1d1f; box-shadow: 4px 4px 0px #22d3ee; }
        
        @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        @keyframes cyan-glow-sweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        
        .about-section { max-width: 1100px; margin: 60px auto 100px; padding: 0 20px; display: flex; align-items: center; gap: 60px; text-align: left; box-sizing: border-box; width: 100%; }
        .about-section.reverse-layout { flex-direction: row-reverse; }
        .about-content { flex: 1; }
        .about-visual { flex: 1; position: relative; overflow: hidden; border-radius: 24px; width: 100%; }
        .about-image { width: 100%; border-radius: 24px; border: 4px solid #1d1d1f; box-shadow: 20px 20px 0px #22d3ee; box-sizing: border-box; }
        .about-tag { font-size: 9px; font-weight: 900; color: #22d3ee; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; display: block; }
        .about-title { font-size: 32px; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
        .about-text { font-size: 16px; color: #5c5e62; line-height: 1.6; font-weight: 500; }
        
        .modular-grid-apple { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto 100px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .quad-card-premium { background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); border: 4px solid #1d1d1f; border-radius: 24px; padding: 40px; text-align: left; transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 280px; position: relative; overflow: hidden; box-sizing: border-box; }
        .phase-label { font-size: 9px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 15px; display: block; }
        .text-cyan { color: #0891b2 !important; font-size: 24px; font-weight: 800; margin: 0; transition: color 0.3s; }
        .quad-card-premium p { font-size: 14px; color: #5c5e62; margin: 15px 0; line-height: 1.5; font-weight: 500; }
        .action-text { font-size: 11px; font-weight: 900; color: #1d1d1f; letter-spacing: 1px; margin-top: auto; transition: color 0.3s; }
        
        .quad-card-premium:hover { transform: translateY(-4px); border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }
        .quad-card-premium:hover .text-cyan { color: #22d3ee !important; }
        .quad-card-premium:hover .action-text { color: #22d3ee; }
        
        .card-m5:hover { border-color: #3e6ae1 !important; box-shadow: 0 20px 40px rgba(62, 106, 225, 0.15) !important; }
        .card-m5:hover .text-m5 { color: #3e6ae1 !important; }
        .card-m5:hover .action-m5 { color: #3e6ae1 !important; }

        .section-header-lux { max-width: 1100px; margin: 80px auto 40px; padding: 0 20px; text-align: left; }
        .section-header-lux h2 { font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -1px; }
        
        .blueprints-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto 80px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .blueprint-card { 
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); 
          border: 4px solid #1d1d1f; border-radius: 24px; padding: 30px; 
          transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: none;
        }
        .blueprint-card:hover { transform: translateY(-4px); border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }
        .blueprint-title { font-size: 14px; font-weight: 900; color: #1d1d1f; margin-bottom: 12px; font-family: monospace; letter-spacing: 0.5px; }
        .blueprint-card:hover .blueprint-title { color: #22d3ee; }
        .blueprint-data { font-size: 11px; color: #5c5e62; font-family: monospace; line-height: 1.6; background: rgba(255, 255, 255, 0.6); padding: 15px; border-radius: 14px; border: 1px solid rgba(34, 211, 238, 0.2); }
        
        .faq-container { max-width: 1100px; margin: 0 auto 100px; padding: 0 20px; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; width: 100%; }
        .faq-item-wrapper { 
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); 
          border: 4px solid #1d1d1f; border-radius: 24px; overflow: hidden; 
          transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .faq-item-wrapper:hover { transform: translateY(-4px); border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }
        .faq-trigger { width: 100%; border: none; background: none; padding: 30px; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 18px; font-weight: 800; color: #1d1d1f; }
        .faq-trigger span { transition: 0.3s; color: #0891b2; font-size: 14px; }
        .faq-item-wrapper:hover .faq-trigger { color: #22d3ee; }
        .faq-item-wrapper:hover .faq-trigger span { color: #22d3ee; }
        .faq-content { padding: 0 30px 30px; font-size: 14px; color: #5c5e62; line-height: 1.6; font-weight: 500; border-top: 1px solid rgba(34, 211, 238, 0.15); padding-top: 20px; background: rgba(255,255,255,0.4); }
        
        .auth-footer-lux { margin: 80px 0 50px; display: flex; flex-direction: column; align-items: center; gap: 30px; padding: 0 20px; box-sizing: border-box; }
        .staff-box-lux { 
          background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); 
          border: 4px solid #1d1d1f; padding: 35px; border-radius: 24px; 
          width: 400px; max-width: 100%; transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: none; box-sizing: border-box; 
        }
        .staff-box-lux:hover { transform: translateY(-4px); border-color: #22d3ee; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.15); }
        .staff-box-lux:hover .phase-label { color: #22d3ee; }
        .auth-container { display: flex; gap: 12px; margin-top: 16px; }
        .auth-container input { flex: 1; border: 1px solid rgba(34, 211, 238, 0.3); padding: 12px; border-radius: 12px; font-family: monospace; font-size: 12px; outline: none; background: rgba(255, 255, 255, 0.8); min-width: 0; color: #1d1d1f; font-weight: 600; }
        .auth-container button { background: #1d1d1f; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 10px; font-weight: 900; cursor: pointer; flex-shrink: 0; transition: 0.3s; }
        .staff-box-lux:hover .auth-container button { background: #22d3ee; }
        .legal-tag { font-size: 9px; font-weight: 900; color: #22d3ee; letter-spacing: 1.5px; }
        
        .hero-apple-style { padding: 100px 20px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; width: 100%; }
        .shaping-text { color: #22d3ee; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px; }
        .hero-title { font-size: clamp(36px, 8vw, 85px); font-weight: 900; line-height: 0.95; letter-spacing: -0.05em; margin: 0; word-break: break-word; max-width: 100%; }
        .cyan-glitch { color: #22d3ee; text-shadow: 0 0 30px rgba(34, 211, 238, 0.2); }
        .hero-desc { font-size: clamp(14px, 2vw, 19px); color: #5c5e62; margin: 30px 0; font-weight: 500; max-width: 700px; line-height: 1.5; padding: 0 10px; box-sizing: border-box; }
        
        .monitor-grid-apple { display: flex; gap: 60px; margin: 40px auto; padding: 25px 50px; background: rgba(255,255,255,0.5); border-radius: 20px; border: 1px solid rgba(34, 211, 238, 0.2); backdrop-filter: blur(10px); box-sizing: border-box; max-width: 100%; }
        .monitor-item { display: flex; flex-direction: column; align-items: center; }
        .m-label { font-size: 8px; font-weight: 900; color: #86868b; letter-spacing: 1px; margin-bottom: 8px; }
        .m-value { font-size: 20px; font-weight: 900; color: #1d1d1f; font-family: monospace; }
        .m-value-green { font-size: 20px; font-weight: 900; color: #0891b2; font-family: monospace; }

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 40px 20px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .nav-items { width: 100%; justify-content: space-between; gap: 15px; }
          .hero-apple-style { padding: 60px 20px 40px; }
          .monitor-grid-apple { gap: 20px; padding: 20px; flex-wrap: wrap; justify-content: center; margin: 20px auto; }
          .modular-grid-apple { grid-template-columns: 1fr; gap: 20px; margin-bottom: 60px; }
          .quad-card-premium { padding: 25px; min-height: auto; }
          .about-section { flex-direction: column !important; text-align: center; gap: 30px; margin-bottom: 60px; }
          .blueprints-container { grid-template-columns: 1fr; gap: 15px; }
        }
      `}</style>

      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img 
  src="/logo-azphur.avif" 
  alt="AZPHUR Logo" 
  style={{ height: '26px', width: 'auto', cursor: 'pointer' }} 
  onClick={() => router.push('/')} 
/>
          <div className="status-orb"></div>
          <span className="op-status-tag">CORE_v2.06_STABLE</span>
        </div>
        <div className="nav-items">
          <div className="network-signal">
            <span className="sig-dot"></span>
            <span>UPLINK_ACTIVE // {liveMs}ms</span>
          </div>
          {currentUserEmail && currentUserEmail !== 'loading...' && currentUserEmail !== 'guest@azphur.com' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0891b2', background: 'rgba(34, 211, 238, 0.1)', padding: '6px 12px', borderRadius: '100px' }}>
                {currentUserEmail}
              </span>
              <button className="btn-red-outline" onClick={handleLogout}>LOGOUT 🚪</button>
            </div>
          ) : (
            <button className="btn-cyan-outline" onClick={() => router.push('/login')}>ENTER_PORTAL</button>
          )}
        </div>
      </nav>

      <main>
        <section className="hero-apple-style">
          <div className="shaping-text">Shaping Sustainable Possibilities</div>
          <h1 className="hero-title">
            THE ENERGY <br /><span className="cyan-glitch">EXCHANGE</span>
          </h1>
          <p className="hero-desc">
            The transactional nervous system for Energy, EV, and Infrastructure operations.<br/>
            We enforce complete control over leads, transactions, and critical infrastructure data.
          </p>

          <div className="monitor-grid-apple">
            <div className="monitor-item">
              <span className="m-label">ACTIVE_TRANSACTIONS</span>
              <span className="m-value">1,402.00</span>
            </div>
            <div className="monitor-item">
              <span className="m-label">SUPPLIER_NODES</span>
              <span className="m-value">{inventoryCount || '0'}</span>
            </div>
            <div className="monitor-item">
              <span className="m-label">REVENUE_FLOW</span>
              <span className="m-value-green">ENFORCED</span>
            </div>
          </div>
        </section>

        <div className="live-stream-ticker">
          <div className="marquee-content">
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-SINGAPORE]</span> SUBSTATION PROCURED VIA HUB_01 // ACTIVE
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-SINGAPORE]</span> SUBSTATION PROCURED VIA HUB_01 // ACTIVE
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node Visual" />
            </div>
          </div>
        </div>

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

        <section className="modular-grid-apple">
          <div onClick={() => handleModuleNavigation('/s2b', verifyModule01Access)} className="quad-card-premium">
            <div>
              <span className="phase-label">MODULE_01 // SUPPLY</span>
              <h3 className="text-cyan">Supply Chain Hub & Nodes Tracking</h3>
              <p>Onboard vetted industrial suppliers, manage profiles, and catalog high-capacity hardware assets across Solar Installation, EV Infrastructure, Electrical Works, and Energy Equipment categories.</p>
            </div>
            <div className="action-text">MANAGE_LISTINGS →</div>
          </div>

          <div onClick={() => handleModuleNavigation('/b2b')} className="quad-card-premium">
            <div>
              <span className="phase-label">MODULE_02 // BUILD</span>
              <h3 className="text-cyan">Matching Engine</h3>
              <p>Direct B2B lead generation and quote request system. Captures utility-scale project demands and dispatches structured opportunities directly to high-ranking verified suppliers.</p>
            </div>
            <div className="action-text">TRACK_LEADS →</div>
          </div>

          <div onClick={() => handleModuleNavigation('/b2c')} className="quad-card-premium">
            <div>
              <span className="phase-label">MODULE_03 // CHARGE</span>
              <h3 className="text-cyan">Charge Network</h3>
              <p>Real-time EV charging session creation and transaction logging layer. Built to map localized station nodes and scale recurring revenue streams through automated payment gateways.</p>
            </div>
            <div className="action-text">INITIALIZE_NODE →</div>
          </div>

          <div onClick={() => handleModuleNavigation('/partner')} className="quad-card-premium">
            <div>
              <span className="phase-label">MODULE_04 // PARTNER</span>
              <h3 className="text-cyan">Partner Portal</h3>
              <p>SaaS administration and ledger deployment node for decentralized supply chains, providing absolute transparency over contract parameters, commission tracking, and billing operations.</p>
            </div>
            <div className="action-text">NODE_LOGIN →</div>
          </div>

          <div 
            onClick={() => handleModuleNavigation('/EV', verifyCustomerAccessM5)} 
            className="quad-card-premium card-m5" 
            style={{ border: '4px solid #1d1d1f' }}
          >
            <div>
              <span className="phase-label" style={{ color: '#3e6ae1' }}>MODULE_05 // GO</span>
              <h3 className="text-cyan text-m5" style={{ color: '#3e6ae1' }}>AZPHUR GO Mobility Hub</h3>
              <p>On-demand EV routing layer matching local transport logistics with hardware nodes. Access terminal management pipelines for high-frequency dispatch execution directly across regional grids.</p>
            </div>
            <div className="action-text action-m5" style={{ color: '#3e6ae1' }}>LAUNCH_TERMINAL →</div>
          </div>
        </section>

        <div className="section-header-lux">
          <h2>SYSTEM_BLUEPRINTS</h2>
        </div>
        <section className="blueprints-container">
          <div className="blueprint-card">
            <div className="blueprint-title">M01_LEDGER_INTEGRATION</div>
            <div className="blueprint-data">
              STATUS: OPERATIONAL<br/>
              TYPE: DISTRIBUTED_INVENTORY<br/>
              NODES_SYNCED: {inventoryCount || '0'}<br/>
              COMPLIANCE: ENFORCED
            </div>
          </div>
          <div className="blueprint-card">
            <div className="blueprint-title">M05_ROUTING_ENGINE</div>
            <div className="blueprint-data">
              STATUS: LIVE_STREAMING<br/>
              ALGORITHM: DIJKSTRA_GRID_v4<br/>
              LATENCY_TARGET: &lt; 450ms<br/>
              FAILSAFE: ACTIVE
            </div>
          </div>
          <div className="blueprint-card">
            <div className="blueprint-title">CORE_SECURITY_LAYER</div>
            <div className="blueprint-data">
              STATUS: LOCKED<br/>
              AUTH_PROVIDER: SUPABASE_JWT<br/>
              OVERRIDE: EXECUTIVE_ONLY<br/>
              CIPHER: AES_256_GCM
            </div>
          </div>
        </section>

        <div className="section-header-lux">
          <h2>FREQUENT_QUESTIONS</h2>
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

        <footer className="auth-footer-lux">
          <div className="staff-box-lux">
            <span className="phase-label">EXECUTIVE_OVERRIDE</span>
            <div className="auth-container">
              <input 
                type="password" 
                placeholder="CTO_ACCESS_KEY" 
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
              />
              <button 
                onClick={() => isAuthorized && router.push('/admin')} 
                className={isAuthorized ? 'active' : ''}
              >
                {isAuthorized ? "GO_TO_CORE" : "LOCKED"}
              </button>
            </div>
          </div>
          <div className="legal-tag">2026. ALL RIGHTS RESERVED</div>
        </footer>
      </main>
    </div>
  );
}