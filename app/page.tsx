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

const tabsList = ['overview', 'analytics', 'outage'] as const;

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

  const router = useRouter();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState<string>("");
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('loading...');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // STATO PER I TAB DELLA HERO DASHBOARD RICHIESTI
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'outage'>('overview');
  
  const [debugM1, setDebugM1] = useState<string>("Waiting...");
  const [debugM5, setDebugM5] = useState<string>("Waiting...");

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setDebugM5(`Catch Error: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setDebugM1(`Catch Error: ${msg}`);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const processSession = async (session: unknown) => {
      const sess = session as { user?: { email?: string } } | null;
      if (sess?.user?.email) {
        const emailClean = sess.user.email.toLowerCase().trim();
        if (isMounted) setCurrentUserEmail(emailClean);
        await verifyCustomerAccessM5(emailClean);
        await verifyModule01Access(emailClean);
      } else {
        if (isMounted) {
          setCurrentUserEmail('guest@azphur.com');
          setDebugM1("No logged user");
          setDebugM5("No logged user");
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

  const handleModuleNavigation = async (path: string, validator?: (email: string) => Promise<boolean>) => {
    if (currentUserEmail === 'guest@azphur.com' || currentUserEmail === 'loading...') {
      router.push('/login');
      return;
    }

    if (adminEmails.includes(currentUserEmail)) {
      router.push(path); 
      return;
    }

    if (!validator) {
      router.push(path);
      return;
    }

    router.push(path);
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
        
        /* Navigation Style Santrix */
        .nav-minimal-lux { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 30px 50px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; width: 100%; box-sizing: border-box; 
        }
        .logo-group { display: flex; align-items: center; gap: 12px; }
        .status-orb { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
        .op-status-tag { font-size: 8px; color: #047857; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 800; }
        .nav-items { display: flex; gap: 30px; align-items: center; }
        .network-signal { display: flex; align-items: center; gap: 8px; color: #4b5563; font-size: 10px; font-weight: 700; }
        .sig-dot { width: 6px; height: 6px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 8px #06b6d4; }
        
        .btn-cyan-outline { background: #111827; border: none; color: #fff; padding: 10px 22px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 11px; transition: 0.3s; }
        .btn-cyan-outline:hover { background: #06b6d4; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6, 182, 212, 0.3); }
        .btn-red-outline { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 8px 18px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 11px; transition: 0.3s; }
        .btn-red-outline:hover { background: #ef4444; color: #fff; }
        .btn-signin-link { background: none; border: none; color: #4b5563; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-signin-link:hover { color: #111827; }

        /* Santrix Hero Glass Card Interface */
        .santrix-hero-container { max-width: 1300px; margin: 20px auto 60px; padding: 0 20px; box-sizing: border-box; }
        .santrix-monitor-frame { 
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 253, 250, 0.9) 100%); 
          border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.8); 
          border-radius: 36px; padding: 50px; position: relative; overflow: hidden; backdrop-filter: blur(20px); 
        }
        .santrix-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .santrix-brand { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; }
        
        /* Modificata la barra dei tab per adattarsi fluidamente agli schermi piccoli */
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

        /* Quick Action Bar */
        .quick-access-zone { max-width: 1300px; margin: 0 auto 50px; padding: 0 20px; display: flex; justify-content: flex-start; box-sizing: border-box; }
        .btn-quotation-lux { 
          background: #0f172a; border: none; color: #fff; padding: 16px 28px; 
          border-radius: 16px; cursor: pointer; font-weight: 800; font-size: 12px; 
          transition: 0.3s; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2); display: flex; align-items: center; gap: 12px;
        }
        .btn-quotation-lux:hover { background: #06b6d4; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(6, 182, 212, 0.3); color: #fff; }
        .blink { animation: blink-ani 1.5s infinite; color: #22d3ee; }
        @keyframes blink-ani { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

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

        /* Modular Grid Cards */
        .modular-grid-apple { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 1300px; margin: 0 auto 100px; padding: 0 20px; box-sizing: border-box; width: 100%; }
        .quad-card-premium { 
          background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 28px; padding: 40px; 
          transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 300px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.02); position: relative; overflow: hidden; box-sizing: border-box;
        }
        .phase-label { font-size: 10px; font-weight: 900; color: #9ca3af; letter-spacing: 1.5px; margin-bottom: 15px; display: block; }
        .text-cyan { color: #0891b2 !important; font-size: 24px; font-weight: 900; margin: 0; transition: color 0.3s; }
        .quad-card-premium p { font-size: 14px; color: #4b5563; margin: 15px 0; line-height: 1.6; font-weight: 500; }
        .action-text { font-size: 11px; font-weight: 900; color: #111827; letter-spacing: 1px; margin-top: auto; transition: color 0.3s; display: flex; align-items: center; gap: 6px; }
        
        .quad-card-premium:hover { transform: translateY(-6px); border-color: #06b6d4; box-shadow: 0 25px 50px rgba(6, 182, 212, 0.12); }
        .quad-card-premium:hover .text-cyan { color: #06b6d4 !important; }
        .quad-card-premium:hover .action-text { color: #06b6d4; }
        
        .card-m5:hover { border-color: #3e6ae1 !important; box-shadow: 0 25px 50px rgba(62, 106, 225, 0.12) !important; }
        .card-m5:hover .text-m5 { color: #3e6ae1 !important; }
        .card-m5:hover .action-m5 { color: #3e6ae1 !important; }

        .card-driver:hover { border-color: #10b981 !important; box-shadow: 0 25px 50px rgba(16, 185, 129, 0.12) !important; }
        .card-driver:hover .text-driver { color: #10b981 !important; }
        .card-driver:hover .action-driver { color: #10b981 !important; }

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
        .staff-box-lux { 
          background: #ffffff; border: 1px solid rgba(0,0,0,0.08); padding: 35px; border-radius: 24px; 
          width: 420px; max-width: 100%; transition: 0.4s; box-shadow: 0 15px 35px rgba(0,0,0,0.04); box-sizing: border-box; 
        }
        .staff-box-lux:hover { border-color: #06b6d4; box-shadow: 0 20px 40px rgba(6, 182, 212, 0.1); }
        .auth-container { display: flex; gap: 10px; margin-top: 15px; }
        .auth-container input { flex: 1; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 12px; font-family: monospace; font-size: 12px; outline: none; background: #f9fafb; color: #111827; font-weight: 600; }
        .auth-container input:focus { border-color: #06b6d4; background: #fff; }
        .auth-container button { background: #111827; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-size: 10px; font-weight: 900; cursor: pointer; transition: 0.3s; }
        .auth-container button.active { background: #06b6d4; }
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

        @media (max-width: 900px) {
          .nav-minimal-lux { padding: 25px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .nav-items { width: 100%; justify-content: center; flex-wrap: wrap; gap: 15px; }
          .santrix-grid-dashboard { grid-template-columns: 1fr; gap: 30px; }
          .santrix-monitor-frame { padding: 30px 20px; border-radius: 24px; }
          .modular-grid-apple { grid-template-columns: 1fr; }
          .blueprints-container { grid-template-columns: 1fr; }
          .about-section { flex-direction: column !important; text-align: center; gap: 30px; }
          
          /* Correzione specifica per non tagliare i tab e il grafico su mobile */
          .santrix-header-top { flex-direction: column; align-items: flex-start; }
          .santrix-nav-pills { width: 100%; overflow-x: auto; padding: 4px; justify-content: flex-start; }
          .santrix-pill { padding: 6px 14px; font-size: 10px; }
          .santrix-right-visual { padding: 15px !important; }
        }        }
        
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
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 14px', borderRadius: '100px' }}>
                {currentUserEmail}
              </span>
              <button className="btn-red-outline" onClick={handleLogout}>LOGOUT 🚪</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="btn-signin-link" onClick={() => router.push('/register')}>SIGN_IN</button>
              <button className="btn-cyan-outline" onClick={() => router.push('/login')}>ENTER_PORTAL</button>
            </div>
          )}
        </div>
      </nav> 

      <main>
        {/* SANTRIX HERO DASHBOARD CONTAINER */}
        <section className="santrix-hero-container">
          <div className="santrix-monitor-frame">
            <div className="santrix-header-top">
              <div className="santrix-brand">
                <span style={{ color: '#06b6d4' }}>⚡</span> AZPHUR_EXCHANGE
              </div>
              <div className="santrix-nav-pills">
                <button 
                  className={`santrix-pill ${activeTab === 'overview' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`santrix-pill ${activeTab === 'analytics' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </button>
                <button 
                  className={`santrix-pill ${activeTab === 'outage' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('outage')}
                >
                  Outage Reports
                </button>
              </div>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div key={activeTab} className="santrix-grid-dashboard" style={{ animation: 'fadeInOut 0.5s ease-in-out' }}>
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#06b6d4' }}>SHAPING SUSTAINABLE POSSIBILITIES</span>
                  <h1>THE ENERGY <br /><span style={{ color: '#06b6d4' }}>EXCHANGE</span></h1>
                  <p>
                    The transactional nervous system for Energy, EV, and Infrastructure operations. 
                    We enforce complete control over leads, transactions, and critical infrastructure data.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Active Transactions</span>
                      <span className="santrix-metric-value">1,402.00</span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Supplier Nodes</span>
                      <span className="santrix-metric-value">{inventoryCount || '0'}</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual">
                  <img 
                    src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000" 
                    alt="AZPHUR Energy Grid Infrastructure" 
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS (Grafico e statistiche generali in inglese) */}
            {activeTab === 'analytics' && (
              <div className="santrix-grid-dashboard">
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#06b6d4' }}>PERFORMANCE METRICS & TELEMETRY</span>
                  <h1>GLOBAL GRID <br /><span style={{ color: '#06b6d4' }}>ANALYTICS</span></h1>
                  <p>
                    Real-time computational analysis of distributed energy resources, load balancing performance, 
                    and cryptographic transaction throughput across active continental nodes.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Peak Efficiency</span>
                      <span className="santrix-metric-value">99.4%</span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Avg Latency</span>
                      <span className="santrix-metric-value">{liveMs} ms</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual" style={{ background: '#ffffff', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '380px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'monospace', color: '#111827', marginBottom: '15px' }}>
                    [SYSTEM_LOAD_DISTRIBUTION_CHART]
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
                    <div style={{ flex: 1, background: '#06b6d4', height: '65%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#0891b2', height: '85%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#22d3ee', height: '45%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#0f172a', height: '95%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#06b6d4', height: '75%', borderRadius: '6px 6px 0 0' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', marginTop: '10px' }}>
                    <span>NODE_01</span>
                    <span>NODE_02</span>
                    <span>NODE_03</span>
                    <span>NODE_04</span>
                    <span>NODE_05</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: OUTAGE REPORTS (Reportistica outage e anomalie in inglese) */}
            {activeTab === 'outage' && (
              <div className="santrix-grid-dashboard">
                <div className="santrix-left-col">
                  <span className="phase-label" style={{ color: '#ef4444' }}>FAILSAFE & INCIDENT LOGS</span>
                  <h1>SYSTEM OUTAGE <br /><span style={{ color: '#ef4444' }}>REPORTS</span></h1>
                  <p>
                    Automated circuit breaker diagnostics, node exception logs, and uninterrupted failover records 
                    tracking grid stability and emergency recovery protocols.
                  </p>

                  <div className="santrix-metrics-grid">
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Active Incidents</span>
                      <span className="santrix-metric-value" style={{ color: '#10b981' }}>00 (Stable)</span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Failover Readiness</span>
                      <span className="santrix-metric-value">100%</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual" style={{ background: '#ffffff', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '380px', fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#111827', marginBottom: '15px' }}>
                    [RECENT_LOG_ENTRIES]
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#4b5563' }}>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                      <strong style={{ color: '#111827' }}>[2026-07-30 14:00]</strong> All regional grid substations operating within normal parameters.
                    </div>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #06b6d4' }}>
                      <strong style={{ color: '#111827' }}>[2026-07-30 11:15]</strong> Scheduled micro-inverter sync completed successfully.
                    </div>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                      <strong style={{ color: '#111827' }}>[2026-07-30 08:30]</strong> Redundant webhook fallback verified across European nodes.
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* QUICK ACCESS ZONE */}
        <div className="quick-access-zone">
          <button onClick={() => router.push('/solar-quote')} className="btn-quotation-lux">
             <span className="blink">⚡</span> [ DX_LINK // SOLAR_QUOTATION ]
          </button>
        </div>

        {/* LIVE STREAM TICKER */}
        <div className="live-stream-ticker">
          <div className="marquee-content">
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-SINGAPORE]</span> SUBSTATION PROCURED VIA HUB_01 // ACTIVE
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-PHILIPPINES]</span> SOLAR ARRAY ALLOCATION SECURED // CONFIRMED
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
            </div>
            <div className="marquee-item">
              <span>[NODE-GERMANY]</span> EV CHARGE EXPANSION CONTRACT // INGESTED
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=120" className="ticker-thumb" alt="Node" />
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

        {/* MODULAR GRID (ALL 6 MODULES) */}
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

          <div onClick={() => router.push('/b2c')} className="quad-card-premium">
            <div>
              <span className="phase-label">MODULE_03 // STORE</span>
              <h3 className="text-cyan">Merchant Layer</h3>
              <p>Unified product commercialization and automated fulfillment layer. Built to map global inventory SKUs and scale recurring retail revenue through integrated checkout pipelines.</p>
            </div>
            <div className="action-text">INITIALIZE_NODE →</div>
          </div>

          <div onClick={() => router.push('/partner')} className="quad-card-premium">
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
          >
            <div>
              <span className="phase-label" style={{ color: '#3e6ae1' }}>MODULE_05 // GO</span>
              <h3 className="text-cyan text-m5" style={{ color: '#3e6ae1' }}>AZPHUR GO Mobility Hub</h3>
              <p>Real-time EV charging session creation and transaction logging layer. Built to map localized station nodes and scale recurring revenue streams through automated payment gateways.</p>
            </div>
            <div className="action-text action-m5" style={{ color: '#3e6ae1' }}>LAUNCH_TERMINAL →</div>
          </div>

          <div 
            onClick={() => handleModuleNavigation('/EV/driver')} 
            className="quad-card-premium card-driver" 
          >
            <div>
              <span className="phase-label" style={{ color: '#10b981' }}>MODULE_06 // DRIVER</span>
              <h3 className="text-cyan text-driver" style={{ color: '#10b981' }}>Driver Dispatch HQ</h3>
              <p>Dedicated terminal for verified EV fleet drivers. Accept live trip dispatches, track passenger GPS coordinates, and manage online/offline status in real-time.</p>
            </div>
            <div className="action-text action-driver" style={{ color: '#10b981' }}>DRIVER_HQ →</div>
          </div>
        </section>

        {/* BLUEPRINTS SECTION */}
        <div className="section-header-lux">
          <h2 className="cyan-header">BLUEPRINTS</h2>
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