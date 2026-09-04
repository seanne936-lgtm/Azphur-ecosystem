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

export default function Home() {
  
  const router = useRouter();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [staffCode, setStaffCode] = useState<string>("");
  const [liveMs, setLiveMs] = useState<number>(421);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('loading...');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'outage'>('overview');
  
  const [debugM1, setDebugM1] = useState<string>("Waiting...");
  const [debugM5, setDebugM5] = useState<string>("Waiting...");
  const [activeTransactionsCount, setActiveTransactionsCount] = useState<number | null>(null);

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
      // Conta i record presenti nella tabella 'leads' o 'transactions'
      const { count, error } = await supabase
        .from('leads') // Oppure la tabella dei pagamenti/transazioni
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setActiveTransactionsCount(count);
      }
    } catch (err) {
      console.error("Error fetching live transactions:", err);
    }
  }

  fetchLiveTransactions();
}, []);

  const verifyCustomerAccessM5 = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    if (adminEmails.includes(emailClean)) {
      setDebugM5("Privileged Admin Node");
      return true;
    }
    try {
      const { data, error } = await supabase
        .from('module 05 customers')
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
        .from('module 01 customers')
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
    },
    {
      id: 'm07',
      label: 'Shop',
      tag: 'MODULE 07 // STORE',
      title: 'Merchant Layer',
      description: 'Unified product commercialization and automated fulfillment layer, mapping global inventory SKUs through integrated checkout pipelines.',
      imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
      accent: '#38bdf8',
      action: () => router.push('/b2c')
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
        .grab-pay-chip {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          border: 1.5px dashed #0f172a; border-radius: 14px; padding: 8px 12px;
          font-size: 10px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; cursor: pointer; background: rgba(255,255,255,0.5);
        }
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

        @media (max-width: 900px) {
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

      <main>
        {/* ============ GRAB-STYLE GREETING HEADER ============ */}
        <section className="grab-header-wrap">
          <div className="grab-greeting-card">
            <div className="grab-greeting-top">
              <div className="grab-pay-chip" onClick={() => handleModuleNavigation('/EV', verifyCustomerAccessM5)}>
                <span style={{ fontSize: '16px' }}>⧉</span>
                <span>Pay</span>
              </div>
              <div className="grab-greeting-text">
                {timeGreeting}, <strong>{displayName}</strong>!
              </div>
            </div>

            <div className="grab-stats-row">
             <div className="grab-stat-pill" onClick={() => router.push('/partner')}>
  <div className="grab-stat-left">
    <div className="grab-stat-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>⚡</div>
    <div>
      <span className="grab-stat-label">Active Transactions</span>
      <span className="grab-stat-value">
        {activeTransactionsCount !== null ? activeTransactionsCount.toLocaleString() : '0'}
      </span>
    </div>
  </div>
  <span className="grab-stat-chevron">›</span>
</div>
              <div className="grab-stat-pill" onClick={() => handleModuleNavigation('/s2b', verifyModule01Access)}>
                <div className="grab-stat-left">
                  <div className="grab-stat-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>👑</div>
                  <div>
                    <span className="grab-stat-label">Supplier Nodes</span>
                    <span className="grab-stat-value">{inventoryCount ?? '0'}</span>
                  </div>
                </div>
                <span className="grab-stat-chevron">›</span>
              </div>
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
              placeholder="Search a module: quote, funding, EV charge, driver, shop..."
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

        {/* Griglia dei 7 moduli, stile icona Grab */}
        <section className="grab-module-grid">
          {visibleModules.length > 0 ? (
            visibleModules.map((m) => (
              <div key={m.id} className="grab-module-item" onClick={m.action}>
                <div className="grab-module-icon-wrap">
                  <img src={m.imageUrl} alt={m.title} />
                  {m.isNew && <span className="grab-module-new-dot">NEW</span>}
                </div>
                <span className="grab-module-label">{m.label}</span>
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
                      <span className="santrix-metric-value">
                        {activeTransactionsCount !== null ? activeTransactionsCount.toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="santrix-metric-card">
                      <span className="santrix-metric-label">Supplier Nodes</span>
                      <span className="santrix-metric-value">{inventoryCount || '0'}</span>
                    </div>
                  </div>
                </div>

                <div className="santrix-right-visual">
                  <img 
                    src="https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="AZPHUR Energy Grid Infrastructure" 
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
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
                    [SYSTEM LOAD DISTRIBUTION CHART]
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
                    <div style={{ flex: 1, background: '#06b6d4', height: '65%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#0891b2', height: '85%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#22d3ee', height: '45%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#0f172a', height: '95%', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ flex: 1, background: '#06b6d4', height: '75%', borderRadius: '6px 6px 0 0' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#9ca3af', marginTop: '10px' }}>
                    <span>NODE 01</span>
                    <span>NODE 02</span>
                    <span>NODE 03</span>
                    <span>NODE 04</span>
                    <span>NODE 05</span>
                  </div>
                </div>
              </div>
            )}
            

            {/* TAB CONTENT: OUTAGE REPORTS */}
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
                    [RECENT LOG ENTRIES]
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

          {/* EXECUTIVE OVERRIDE */}
          <div style={{ 
            maxWidth: '380px', 
            margin: '0 auto 30px auto', 
            padding: '16px 24px', 
            background: isAuthorized ? '#06b6d4' : '#fbfbf9', 
            borderRadius: '60px', 
            border: isAuthorized ? '2px solid #0891b2' : '1px solid #e7e7e3', 
            boxShadow: isAuthorized ? '0 8px 25px rgba(6, 182, 212, 0.35)' : '0 6px 20px rgba(0, 0, 0, 0.05)', 
            boxSizing: 'border-box',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 900, 
                color: isAuthorized ? '#000' : '#888882', 
                letterSpacing: '2px', 
                fontFamily: 'monospace', 
                textTransform: 'uppercase',
                transition: 'color 0.3s ease'
              }}>
                {isAuthorized ? "⚡ AUTHORIZED ACCESS" : "🔒 EXECUTIVE OVERRIDE"}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="password" 
                placeholder="ENTER PIN" 
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isAuthorized) {
                    router.push('/admin');
                  }
                }}
                style={{ 
                  flex: 1,
                  boxSizing: 'border-box', 
                  padding: '10px 14px', 
                  fontSize: '12px', 
                  background: isAuthorized ? 'rgba(255, 255, 255, 0.9)' : '#fff', 
                  border: isAuthorized ? '1px solid rgba(0,0,0,0.1)' : '1px solid #dcdce0', 
                  borderRadius: '30px', 
                  color: '#050505', 
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              />
              <button 
                onClick={() => isAuthorized && router.push('/admin')} 
                style={{ 
                  padding: '10px 18px', 
                  fontSize: '11px', 
                  fontWeight: 900,
                  letterSpacing: '1px',
                  borderRadius: '30px', 
                  cursor: isAuthorized ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: isAuthorized ? '#000' : '#e4e4dc',
                  color: isAuthorized ? '#06b6d4' : '#888884',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {isAuthorized ? "GO ➔" : "LOCKED"}
              </button>
            </div>
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
