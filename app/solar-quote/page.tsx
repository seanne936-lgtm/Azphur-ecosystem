"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SolarQuotePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Request Form States (Public) - AGGIORNATI CON BLUEPRINT V1.0 (TESTO LIBERO PER OBJECTIVE)
  const [fullName, setFullName] = useState('');
  const [emailForm, setEmailForm] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [roofType, setRoofType] = useState('Flat');
  const [objective, setObjective] = useState(''); // Testo libero per l'obiettivo energetico
  const [address, setAddress] = useState('');            
  const [loadingForm, setLoadingForm] = useState(false);
  const [successForm, setSuccessForm] = useState(false);

  // Private Area Authentication States
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Private Customer History States
  const [myQuotes, setMyQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isAuthorizedCustomer, setIsAuthorizedCustomer] = useState<boolean>(false);
  const [debugSolar, setDebugSolar] = useState<string>("Waiting...");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Lista degli admin (Bypass whitelist + Supervisor Write Access)
  const adminEmails = [
    "admin@azphur.com", 
    "tuofratello@email.com", 
    "tuamailprincipale@email.com"
  ];

  useEffect(() => {
    setMounted(true);
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        const emailClean = session.user.email.toLowerCase().trim();
        setIsAdmin(adminEmails.includes(emailClean));
        await verifySolarAccess(emailClean);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        const emailClean = session.user.email.toLowerCase().trim();
        setIsAdmin(adminEmails.includes(emailClean));
        await verifySolarAccess(emailClean);
      } else {
        setMyQuotes([]);
        setIsAuthorizedCustomer(false);
        setIsAdmin(false);
        setDebugSolar("No logged user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifySolarAccess = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    setLoadingQuotes(true);
    
    try {
      const response = await fetch(`/api/v1/solar-leads?email=${encodeURIComponent(emailClean)}`);
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        setDebugSolar(adminEmails.includes(emailClean) ? "Privileged Admin Node" : `Found - Total: ${resData.quotations?.length || 0}`);
        setIsAuthorizedCustomer(true);
        setMyQuotes(resData.quotations || []);
        return true;
      } else {
        setDebugSolar("Not Found (False)");
        setIsAuthorizedCustomer(false);
        setMyQuotes([]);
        return false;
      }
    } catch (err: any) {
      setDebugSolar(`Catch Error: ${err.message}`);
      setIsAuthorizedCustomer(false);
      return false;
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Funzione per aggiornare lo stato con un click dall'interfaccia Supervisor
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          new_status: newStatus,
          admin_email: session.user.email
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setMyQuotes(prev => 
          prev.map(q => q.id === leadId ? { ...q, status: newStatus.toUpperCase() } : q)
        );
      } else {
        alert("STATUS_UPDATE_FAILED: " + (resData.error || "Unknown Error"));
      }
    } catch (err) {
      alert("SYSTEM_ERROR_ON_STATUS_PATCH");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    const submittedEmail = emailForm.toLowerCase().trim();

    try {
      const response = await fetch('/api/v1/solar-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: submittedEmail,
          phone: phone,
          monthly_bill: monthlyBill,
          roof_type: roofType,
          objective: objective, 
          address: address,     
          user_id: session?.user?.id || null
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessForm(true);
        setFullName('');
        setEmailForm('');
        setPhone('');
        setMonthlyBill('');
        setObjective('');
        setAddress('');
        
        // ALLINEAMENTO LOGICA: Siccome il backend ha fatto l'auto-whitelist, dichiariamo il client autorizzato
        setIsAuthorizedCustomer(true);
        
        // Se l'utente era già loggato, aggiorniamo la lista dei suoi preventivi in real-time
        if (session?.user?.email) {
          await verifySolarAccess(session.user.email);
        }
      } else {
        alert("UPLOAD_FAILED: " + (data.error || "Network error"));
      }
    } catch (err) {
      alert("SYSTEM_ERROR_LEAD_SUBMIT");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.toLowerCase().trim(),
        password: authPassword
      });

      if (error) {
        alert("ACCESS_DENIED: " + error.message);
      } else if (data.session?.user?.email) {
        setShowLogin(false);
        setAuthEmail('');
        setAuthPassword('');
        await verifySolarAccess(data.session.user.email);
      }
    } catch (err) {
      alert("AUTH_CRASH");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMyQuotes([]);
    setIsAuthorizedCustomer(false);
    setIsAdmin(false);
  };

  if (!mounted) return null;

  return (
    <div className="az-premium-canvas quote-screen">
      <style jsx global>{`
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }
      `}</style>

      <div className="glow-sphere"></div>

      {/* NAV BAR */}
      <nav className="nav-minimal-lux">
        <div className="logo-group">
          <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={{ height: '32px', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div className="status-orb"></div>
          <span className="op-status-tag">{isAdmin ? "SUPERVISOR_MODE_v3" : "SOLAR_GATEWAY_v3"}</span>
          <span style={{ fontSize: '7px', color: '#0891b2', marginLeft: '10px', fontFamily: 'monospace' }}>[NODE_STATUS: {debugSolar}]</span>
        </div>
        
        <div className="nav-items">
          {session ? (
            <div className="user-badge-zone">
              <span className="user-email-tag">{session.user.email}</span>
              <button onClick={handleLogout} className="btn-cyan-outline btn-logout">DISCONNECT</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(!showLogin)} className="btn-cyan-outline">
              {showLogin ? "CLOSE LOGIN" : "ACCESS PRIVATE UPLINK"}
            </button>
          )}
          <Link href="/" className="exit-btn-lux">EXIT</Link>
        </div>
      </nav>

      <div className="center-content">
        {/* PRIVATE LOGIN INTERFACE */}
        {showLogin && !session && (
          <div className="login-box-premium fade-in">
            <span className="phase-label">SECURE_CLIENT_LOGIN</span>
            <h3 className="text-cyan">Private Terminal</h3>
            <p className="login-desc">Enter your credentials to monitor the live status of your structural quotes.</p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>CLIENT_EMAIL</label>
                <input type="email" required placeholder="name@domain.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>SECURITY_PASSWORD</label>
                <input type="password" required placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loadingAuth} className="login-btn-premium">
                {loadingAuth ? 'INITIALIZING...' : 'CONNECT TO MY QUOTES'}
              </button>
            </form>
          </div>
        )}

        {/* PRIVATE QUOTATIONS HISTORY / ADMIN OVERVIEW */}
        {session && (
          <div className="login-box-premium dashboard-box fade-in">
            <span className="phase-label">{isAdmin ? "SYSTEM_SUPERVISOR_FEED // WRITE_ACCESS" : "SECURE_DATA_FEED // ENCRYPTED"}</span>
            <h2 className="text-cyan">{isAdmin ? "All Platform Leads" : "Your Solar Quotations"}</h2>
            
            {!isAuthorizedCustomer ? (
              <div className="no-records" style={{ borderColor: '#ef4444', color: '#ef4444', marginTop: '15px' }}>
                ACCESS_DENIED: Your account email is not whitelisted in the Solar Database System. Please contact support or submit a new inquiry below.
              </div>
            ) : loadingQuotes ? (
              <div className="system-ops-label">RETRIEVING_DATA_STREAM...</div>
            ) : myQuotes.length === 0 ? (
              <div className="no-records">No corporate quotations found. Complete the intake form below to submit a new request.</div>
            ) : (
              <>
                <p className="login-desc">
                  {isAdmin ? "Global list of system leads. Use the custom dropdown selectors to change real-time state configurations inside Supabase." : "Real-time status updates of structural estimates managed by AZPHUR HQ."}
                </p>
                <div className="quotes-table-wrapper">
                  <table className="quotes-table">
                    <thead>
                      <tr>
                        <th>TX_HASH</th>
                        <th>{isAdmin ? "CUSTOMER / CONTACT" : "SYSTEM_TYPE"}</th>
                        <th>VALUE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myQuotes.map(q => (
                        <tr key={q.id}>
                          <td className="mono">{q.id?.split('-')[0].toUpperCase()}_AZP</td>
                          <td>
                            {isAdmin ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 800 }}>{q.customer_name || 'N/A'}</span>
                                <span style={{ fontSize: '10px', color: '#5c5e62', fontFamily: 'monospace' }}>{q.customer_email}</span>
                              </div>
                            ) : (
                              q.quote_details?.roof_type ? `${q.quote_details.roof_type} Roof System` : (q.product_name || 'Solar Energy System')
                            )}
                          </td>
                          <td className="mono">
                            ₱{Number(q.deal_value || q.quote_details?.monthly_bill || 0).toLocaleString()}
                          </td>
                          <td>
                            {isAdmin ? (
                              <select 
                                value={q.status?.toUpperCase() || 'NEW'} 
                                onChange={(e) => handleStatusChange(q.id, e.target.value)}
                                className="select-table-status"
                              >
                                <option value="NEW">NEW</option>
                                <option value="QUOTED">QUOTED</option>
                                <option value="CONTACTED">CONTACTED</option>
                                <option value="CLOSED">CLOSED</option>
                              </select>
                            ) : (
                              <span className={`status-tag ${q.status?.toLowerCase() || 'new'}`}>
                                {q.status || 'NEW'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* LEAD INTAKE FORM (PUBLIC) */}
        <div className="login-box-premium form-inflow-box">
          <div className="login-header">
            <span className="phase-label">PUBLIC_INFLOW_INTERFACE</span>
            <h2 className="text-cyan">Request Solar Quotation</h2>
            <p className="login-desc">Submit structural architectural parameters. Our processing matrix will dispatch the official corporate quote.</p>
          </div>

          {successForm ? (
            <div className="success-panel fade-in">
              <span className="phase-label success-tag">REQUEST_COMMITTED</span>
              <p>Data successfully transmitted to the Transaction Control Center.</p>
              <button onClick={() => setSuccessForm(false)} className="login-btn-premium">SUBMIT NEW INITIAL REQUEST</button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="login-form">
              <div className="input-group">
                <label>FULL_NAME / COMPANY</label>
                <input type="text" placeholder="Full Name or Enterprise Entity" required value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>EMAIL_ADDRESS</label>
                <input type="email" placeholder="example@domain.com" required value={emailForm} onChange={e => setEmailForm(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>MOBILE_PHONE</label>
                <input type="tel" placeholder="+63 9XX XXX XXXX" required value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>INSTALLATION_ADDRESS</label>
                <input type="text" placeholder="Street, City, Province" required value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>AVERAGE_MONTHLY_BILL (PHP)</label>
                <input type="number" placeholder="Average monthly utility expenses" required value={monthlyBill} onChange={e => setMonthlyBill(e.target.value)} />
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>ENERGY_OBJECTIVE</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lower bills, Power backup, Grid independence" 
                  required 
                  value={objective} 
                  onChange={e => setObjective(e.target.value)} 
                />
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>ROOF_STRUCTURE</label>
                <select value={roofType} onChange={e => setRoofType(e.target.value)} className="select-lux">
                  <option value="Flat">Flat Roof</option>
                  <option value="Pitched">Pitched Roof</option>
                  <option value="Industrial">Industrial Envelope Coverage</option>
                </select>
              </div>
              <button type="submit" disabled={loadingForm} className="login-btn-premium">
                {loadingForm ? 'SENDING_STREAM...' : 'SUBMIT_QUOTATION_REQUEST'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .glow-sphere { position: fixed; top: 10%; left: 50%; transform: translateX(-50%); width: 80vw; height: 40vw; background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%); z-index: 0; pointer-events: none; }
        
        .nav-minimal-lux { display: flex; justify-content: space-between; align-items: center; padding: 40px 60px 20px; max-width: 1400px; width: 100%; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; gap: 15px; }
        .logo-group { display: flex; align-items: center; }
        .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 10px #22d3ee; flex-shrink: 0; }
        .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 15px; font-weight: 900; white-space: nowrap; }
        .nav-items { display: flex; align-items: center; gap: 15px; }
        
        .btn-cyan-outline { background: none; border: 1px solid #22d3ee; color: #0891b2; padding: 8px 20px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; letter-spacing: 1px; white-space: nowrap; }
        .btn-cyan-outline:hover { background: #22d3ee; color: #fff; box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2); }
        .exit-btn-lux { font-size: 10px; color: #1d1d1f; font-weight: 900; text-decoration: none; border: 4px solid #1d1d1f; padding: 6px 16px; border-radius: 8px; background: #fff; text-transform: uppercase; letter-spacing: 1px; }
        
        .user-badge-zone { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.9); border: 1px solid rgba(34,211,238,0.3); padding: 4px 12px; border-radius: 50px; flex-wrap: wrap; justify-content: center; }
        .user-email-tag { font-size: 11px; font-weight: 700; color: #0891b2; font-family: monospace; }
        .btn-logout { border-color: #f87171; color: #ef4444; padding: 4px 10px; }
        .btn-logout:hover { background: #ef4444; color: #fff; box-shadow: none; }

        .center-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; z-index: 1; width: 100%; box-sizing: border-box; gap: 30px; }
        .login-box-premium { background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); padding: 40px; border-radius: 24px; border: 4px solid #1d1d1f; width: 100%; max-width: 480px; text-align: left; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.08); box-sizing: border-box; }
        .dashboard-box { max-width: 760px !important; width: 100%; }
        
        .phase-label { font-size: 9px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 15px; display: block; }
        .text-cyan { color: #0891b2 !important; font-size: 24px; font-weight: 800; margin: 0; }
        .login-desc { font-size: 13px; color: #5c5e62; margin: 10px 0 25px; line-height: 1.5; font-weight: 500; }

        .input-group label { font-size: 9px; color: #0891b2; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 8px; }
        .input-group input, .select-lux { width: 100%; padding: 14px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 12px; color: #1d1d1f; font-size: 13px; font-weight: 600; box-sizing: border-box; }
        .select-lux { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%230891b2' d='M0 0l5 5 5-5z'/></svg>"); background-repeat: no-repeat; background-position: right 15px center; }

        .select-table-status { padding: 4px 24px 4px 8px; background-color: #fff; border: 2px solid #1d1d1f; border-radius: 6px; font-size: 11px; font-weight: 800; color: #1d1d1f; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><path fill='%231d1d1f' d='M0 0l4 4 4-4z'/></svg>"); background-repeat: no-repeat; background-position: right 8px center; }

        .login-btn-premium { background: #1d1d1f; color: white; padding: 16px; border-radius: 12px; font-weight: 900; border: none; cursor: pointer; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; width: 100%; margin-top: 20px; box-sizing: border-box; }
        .login-btn-premium:hover { background: #22d3ee; color: #1d1d1f; transform: translateY(-1px); }

        .quotes-table-wrapper { width: 100%; overflow-x: auto; background: #fff; border: 2px solid #1d1d1f; border-radius: 12px; margin-top: 15px; -webkit-overflow-scrolling: touch; }
        .quotes-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; min-width: 500px; }
        .quotes-table th { background: #f0f9fa; padding: 14px 12px; font-weight: 900; color: #0891b2; border-bottom: 2px solid #1d1d1f; letter-spacing: 1px; font-size: 10px; }
        .quotes-table td { padding: 14px 12px; border-bottom: 1px solid #e6f7f9; font-weight: 700; white-space: nowrap; }
        .mono { font-family: monospace; font-size: 12px; }
        
        .status-tag { font-size: 9px; padding: 3px 8px; border-radius: 4px; font-weight: 900; text-transform: uppercase; display: inline-block; }
        .status-tag.new { background: #dcfce7; color: #166534; }
        .status-tag.quoted { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .status-tag.contacted { background: #fef9c3; color: #854d0e; }
        .status-tag.closed { background: #f1f5f9; color: #475569; }
        
        .no-records { padding: 20px; text-align: center; font-weight: 700; color: #86868b; background: #fff; border-radius: 12px; border: 1px solid #e6f7f9; }
        .system-ops-label { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 2px; text-align: center; margin: 20px 0; }
        .success-panel { text-align: center; padding: 10px 0; font-weight: 600; }
        .success-tag { color: #0891b2 !important; font-weight: 900; }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .nav-minimal-lux { padding: 20px; flex-direction: column; align-items: stretch; gap: 15px; }
          .logo-group { justify-content: space-between; width: 100%; }
          .nav-items { width: 100%; justify-content: space-between; gap: 10px; }
          .btn-cyan-outline { padding: 6px 14px; font-size: 9px; flex: 1; text-align: center; }
          .exit-btn-lux { padding: 6px 14px; font-size: 9px; text-align: center; }
          .user-badge-zone { width: 100%; padding: 6px; border-radius: 12px; gap: 8px; }
          .user-email-tag { font-size: 10px; width: 100%; text-align: center; display: block; text-overflow: ellipsis; overflow: hidden; }
          
          .center-content { padding: 15px 12px; gap: 20px; }
          .login-box-premium { padding: 25px 20px; border-width: 3px; border-radius: 16px; }
          .text-cyan { font-size: 20px; }
          .login-desc { font-size: 12px; margin-bottom: 18px; }
          
          .quotes-table th, .quotes-table td { padding: 10px 8px; font-size: 11px; }
        }
      `}</style>
    </div>
  );
}