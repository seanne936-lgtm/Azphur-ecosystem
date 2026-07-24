"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SolarQuotePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Public Form (Inflow Request)
  const [fullName, setFullName] = useState('');
  const [emailForm, setEmailForm] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [roofType, setRoofType] = useState('Flat');
  const [objective, setObjective] = useState('');
  const [address, setAddress] = useState('');            
  const [loadingForm, setLoadingForm] = useState(false);
  const [successForm, setSuccessForm] = useState(false);

  // Auth States
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Private Data States
  const [myQuotes, setMyQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isAuthorizedCustomer, setIsAuthorizedCustomer] = useState<boolean>(false);
  const [debugSolar, setDebugSolar] = useState<string>("Waiting...");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Admin Quote Emission & Deposit Slider
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<string | null>(null);
  const [quoteBasePrice, setQuoteBasePrice] = useState<string>('');
  const [quoteDepositPct, setQuoteDepositPct] = useState<number>(20);

  // Admin Whitelist
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

  // Status Change / Quote Emission by Admin
  const handleStatusChange = async (
    leadId: string, 
    newStatus: string, 
    customBasePrice?: number, 
    customPct?: number,
    validityDays: number = 30
  ) => {
    if (!session?.user?.email) return;

    if (newStatus === 'REFUNDED' && !confirm("CONFIRM FULL REFUND ISSUANCE? This will nullify VAT and lock the deal.")) {
      return;
    }
    if (newStatus === 'CANCELLED' && !confirm("CANCEL THIS QUOTATION?")) {
      return;
    }
    
    try {
      const payload: any = {
        lead_id: leadId,
        new_status: newStatus,
        admin_email: session.user.email
      };

      if (customBasePrice && customBasePrice > 0) {
        payload.base_price = customBasePrice;
        payload.deposit_percentage = customPct || 20;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + validityDays);
        payload.valid_until = expirationDate.toISOString();
      }

      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        await verifySolarAccess(session.user.email);
        setSelectedLeadForQuote(null);
        setQuoteBasePrice('');
      } else {
        alert("STATUS_UPDATE_FAILED: " + (resData.error || "Unknown Error"));
      }
    } catch (err) {
      alert("SYSTEM_ERROR_ON_STATUS_PATCH");
    }
  };

  // ADMIN ACTION: Toggle Final Balance Unlock State
  const handleToggleBalanceUnlock = async (leadId: string, currentUnlocked: boolean) => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          admin_email: session.user.email,
          balance_unlocked: !currentUnlocked
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        await verifySolarAccess(session.user.email);
      } else {
        alert("UNLOCK_FAILED: " + (resData.error || "Unknown Error"));
      }
    } catch (err) {
      alert("SYSTEM_ERROR_ON_BALANCE_UNLOCK");
    }
  };

  // Customer Payment Simulation (Deposit or Balance)
  const handleSimulatedCustomerPayment = async (leadId: string, paymentType: 'DEPOSIT' | 'BALANCE') => {
    try {
      const payload: any = { lead_id: leadId };

      if (paymentType === 'DEPOSIT') {
        payload.deposit_paid = true;
      } else {
        payload.balance_paid = true;
      }

      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`PAYMENT_CONFIRMED (${paymentType}): Transaction processed successfully!`);
        if (session?.user?.email) await verifySolarAccess(session.user.email);
      }
    } catch (err) {
      alert("PAYMENT_TRANSACTION_ERROR");
    }
  };

  // 1. GENERATORE RICEVUTA ACCONTO (INITIAL DEPOSIT)
  const handleDownloadDepositPDF = async (q: any) => {
    if (typeof window === 'undefined') return;
    setDownloadingPdfId(q.id);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const finalDeal = Number(q.final_deal || q.deal_value || 0);
      const basePrice = Number(q.base_price || (finalDeal / 1.12));
      const vatVal = Number(q.vat || q.vat_amount || (finalDeal - basePrice));
      const depPct = Number(q.deposit_percentage || 20);
      const depAmt = Number(q.deposit_amount || finalDeal * (depPct / 100));
      const balAmt = Number(q.balance_amount || finalDeal - depAmt);

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 30px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0891b2; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #0891b2; letter-spacing: 2px;">AZPHUR HQ</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #64748b; font-weight: bold;">OFFICIAL INITIAL DEPOSIT RECEIPT</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <p style="margin: 2px 0;"><strong>TX HASH:</strong> ${q.id?.split('-')[0].toUpperCase()}_DEP</p>
              <p style="margin: 2px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="margin-bottom: 25px; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0;"><strong>CLIENT NAME:</strong> ${q.customer_name || 'N/A'}</p>
            <p style="margin: 0;"><strong>CLIENT EMAIL:</strong> ${q.customer_email || 'N/A'}</p>
            <p style="margin: 0;"><strong>SYSTEM SPEC:</strong> ${q.quote_details?.roof_type ? `${q.quote_details.roof_type} Roof System` : 'Solar Energy System'}</p>
            <p style="margin: 0;"><strong>STATUS:</strong> <span style="color: #0891b2; font-weight: bold;">DEPOSIT PAID & CONFIRMED</span></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
            <thead>
              <tr style="background: #f0f9fa; border-bottom: 2px solid #1d1d1f; text-align: left;">
                <th style="padding: 10px; color: #0891b2;">DESCRIPTION</th>
                <th style="padding: 10px; text-align: right; color: #0891b2;">AMOUNT (PHP)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;">System Base Price</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;">Value Added Tax (12% VAT)</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${vatVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr style="border-bottom: 2px solid #1d1d1f; font-weight: bold; background: #fafafa;">
                <td style="padding: 10px;">TOTAL TURNKEY VALUE</td>
                <td style="padding: 10px; text-align: right; font-family: monospace; color: #0891b2;">₱${finalDeal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #f0f9fa; border: 1px solid #22d3ee; padding: 15px; border-radius: 8px; font-size: 11px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span><strong>INITIAL DEPOSIT PAID (${depPct}%):</strong></span>
              <span style="color: #166534; font-weight: bold; font-family: monospace;">
                ₱${depAmt.toLocaleString(undefined, {minimumFractionDigits: 2})} [PAID]
              </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>REMAINING BALANCE (${100 - depPct}%):</strong></span>
              <span style="color: #64748b; font-weight: bold; font-family: monospace;">
                ₱${balAmt.toLocaleString(undefined, {minimumFractionDigits: 2})} [PENDING INSTALLATION]
              </span>
            </div>
          </div>

          <div style="text-align: center; font-size: 9px; color: #86868b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Official digital deposit receipt generated by AZPHUR Solar Operations Center.
          </div>
        </div>
      `;

      const opt: any = {
        margin:       10,
        filename:     `AZPHUR_Deposit_Receipt_${q.id?.split('-')[0].toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("PDF_GENERATION_FAILED");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // 2. GENERATORE RICEVUTA SALDO FINALE (FINAL SETTLEMENT)
  const handleDownloadFinalPDF = async (q: any) => {
    if (typeof window === 'undefined') return;
    setDownloadingPdfId(q.id);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const finalDeal = Number(q.final_deal || q.deal_value || 0);
      const basePrice = Number(q.base_price || (finalDeal / 1.12));
      const vatVal = Number(q.vat || q.vat_amount || (finalDeal - basePrice));
      const depPct = Number(q.deposit_percentage || 20);
      const depAmt = Number(q.deposit_amount || finalDeal * (depPct / 100));
      const balAmt = Number(q.balance_amount || finalDeal - depAmt);

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 30px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #166534; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #166534; letter-spacing: 2px;">AZPHUR HQ</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #166534; font-weight: bold;">FINAL TURNKEY SETTLEMENT RECEIPT</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <p style="margin: 2px 0;"><strong>TX HASH:</strong> ${q.id?.split('-')[0].toUpperCase()}_FINAL</p>
              <p style="margin: 2px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="margin-bottom: 25px; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0;"><strong>CLIENT NAME:</strong> ${q.customer_name || 'N/A'}</p>
            <p style="margin: 0;"><strong>CLIENT EMAIL:</strong> ${q.customer_email || 'N/A'}</p>
            <p style="margin: 0;"><strong>SYSTEM SPEC:</strong> ${q.quote_details?.roof_type ? `${q.quote_details.roof_type} Roof System` : 'Solar Energy System'}</p>
            <p style="margin: 0;"><strong>STATUS:</strong> <span style="color: #166534; font-weight: bold;">FULLY SETTLED & CLOSED</span></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
            <thead>
              <tr style="background: #f0fdf4; border-bottom: 2px solid #1d1d1f; text-align: left;">
                <th style="padding: 10px; color: #166534;">DESCRIPTION</th>
                <th style="padding: 10px; text-align: right; color: #166534;">AMOUNT (PHP)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;">System Base Price</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;">Value Added Tax (12% VAT)</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${vatVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr style="border-bottom: 2px solid #1d1d1f; font-weight: bold; background: #fafafa;">
                <td style="padding: 10px;">TOTAL TURNKEY VALUE</td>
                <td style="padding: 10px; text-align: right; font-family: monospace; color: #166534;">₱${finalDeal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; font-size: 11px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span><strong>INITIAL DEPOSIT (${depPct}%):</strong></span>
              <span style="color: #166534; font-weight: bold; font-family: monospace;">
                ₱${depAmt.toLocaleString(undefined, {minimumFractionDigits: 2})} [PAID]
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span><strong>FINAL BALANCE (${100 - depPct}%):</strong></span>
              <span style="color: #166534; font-weight: bold; font-family: monospace;">
                ₱${balAmt.toLocaleString(undefined, {minimumFractionDigits: 2})} [PAID]
              </span>
            </div>
            <div style="padding-top: 8px; border-top: 1px dashed #86efac; text-align: center; color: #166534; font-weight: bold;">
              ✓ ALL OBLIGATIONS COMPLETED - ZERO REMAINING BALANCE
            </div>
          </div>

          <div style="text-align: center; font-size: 9px; color: #86868b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Official final settlement invoice generated by AZPHUR Solar Operations Center.
          </div>
        </div>
      `;

      const opt: any = {
        margin:       10,
        filename:     `AZPHUR_Final_Settlement_${q.id?.split('-')[0].toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("PDF_GENERATION_FAILED");
    } finally {
      setDownloadingPdfId(null);
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
        
        setIsAuthorizedCustomer(true);
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

      {/* NAVBAR */}
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
        {/* LOGIN TERMINAL */}
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

        {/* QUOTATION DASHBOARD TABLE */}
        {session && (
          <div className="login-box-premium dashboard-box fade-in">
            <span className="phase-label">{isAdmin ? "SYSTEM_SUPERVISOR_FEED // WRITE_ACCESS" : "SECURE_DATA_FEED // ENCRYPTED"}</span>
            <h2 className="text-cyan">{isAdmin ? "All Platform Leads" : "Your Solar Quotations"}</h2>
            
            {!isAuthorizedCustomer ? (
              <div className="no-records" style={{ borderColor: '#ef4444', color: '#ef4444', marginTop: '15px' }}>
                ACCESS_DENIED: Your account email is not whitelisted in the Solar Database System.
              </div>
            ) : loadingQuotes ? (
              <div className="system-ops-label">RETRIEVING_DATA_STREAM...</div>
            ) : myQuotes.length === 0 ? (
              <div className="no-records">No corporate quotations found. Complete the intake form below to submit a new request.</div>
            ) : (
              <>
                <p className="login-desc">
                  {isAdmin ? "Global list of system leads. Use status and quote emission controls." : "Real-time status updates of structural estimates managed by AZPHUR HQ."}
                </p>
                <div className="quotes-table-wrapper">
                  <table className="quotes-table">
                    <thead>
                      <tr>
                        <th>TX_HASH</th>
                        <th>{isAdmin ? "CUSTOMER / CONTACT" : "SYSTEM_TYPE"}</th>
                        <th>TOTAL VALUE</th>
                        <th>STATUS / ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myQuotes.map(q => {
                        const finalDeal = Number(q.final_deal || q.deal_value || 0);
                        const basePrice = Number(
                          q.base_price || (q.deal_value && q.deal_value !== finalDeal ? q.deal_value : finalDeal / 1.12)
                        );
                        const vatVal = Number(q.vat || q.vat_amount || (finalDeal - basePrice));
                        const depPct = Number(q.deposit_percentage || 20);
                        const depAmt = Number(q.deposit_amount || finalDeal * (depPct / 100));
                        const balAmt = Number(q.balance_amount || finalDeal - depAmt);

                        return (
                          <React.Fragment key={q.id}>
                            <tr>
                              <td className="mono">{q.id?.split('-')[0].toUpperCase()}_AZP</td>
                              <td>
                                {isAdmin ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: 800 }}>{q.customer_name || 'N/A'}</span>
                                    <span style={{ fontSize: '10px', color: '#5c5e62', fontFamily: 'monospace' }}>{q.customer_email}</span>
                                  </div>
                                ) : (
                                  q.quote_details?.roof_type ? `${q.quote_details.roof_type} Roof System` : 'Solar Energy System'
                                )}
                              </td>
                              <td className="mono">
                                ₱{finalDeal > 0 ? finalDeal.toLocaleString() : Number(q.quote_details?.monthly_bill || 0).toLocaleString()}
                              </td>
                              <td>
                                {isAdmin ? (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select 
                                      value={q.status?.toUpperCase() || 'NEW'} 
                                      onChange={(e) => handleStatusChange(q.id, e.target.value)}
                                      className="select-table-status"
                                    >
                                      <option value="NEW">NEW</option>
                                      <option value="CONTACTED">CONTACTED</option>
                                      <option value="QUOTED">QUOTED</option>
                                      <option value="WAITING_DEPOSIT">WAITING_DEPOSIT</option>
                                      <option value="DEPOSIT_PAID">DEPOSIT_PAID</option>
                                      <option value="WAITING_BALANCE">WAITING_BALANCE</option>
                                      <option value="CLOSED">CLOSED</option>
                                      <option value="CANCELLED">CANCELLED</option>
                                      <option value="REFUNDED">REFUNDED</option>
                                    </select>
                                    
                                    <button 
                                      className="btn-cyan-outline"
                                      style={{ padding: '4px 8px', fontSize: '9px' }}
                                      onClick={() => setSelectedLeadForQuote(selectedLeadForQuote === q.id ? null : q.id)}
                                    >
                                      {selectedLeadForQuote === q.id ? 'CLOSE' : 'EMIT'}
                                    </button>

                                    {/* ADMIN BALANCE UNLOCK TRIGGER BUTTON */}
                                    {q.deposit_paid && (
                                      <button
                                        onClick={() => handleToggleBalanceUnlock(q.id, q.balance_unlocked)}
                                        style={{
                                          background: q.balance_unlocked ? '#ef4444' : '#10b981',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontSize: '9px',
                                          fontWeight: 800,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {q.balance_unlocked ? "LOCK BALANCE" : "UNLOCK BALANCE"}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`status-tag ${q.status?.toLowerCase() || 'new'}`}>
                                    {q.status || 'NEW'}
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* ADMIN PANEL FOR QUOTE EMISSION WITH DEPOSIT SLIDER */}
                            {isAdmin && selectedLeadForQuote === q.id && (
                              <tr>
                                <td colSpan={4} style={{ background: '#f0fdf4', padding: '15px', borderBottom: '2px solid #166534' }}>
                                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input 
                                      type="number" 
                                      placeholder="Base Price (PHP)" 
                                      value={quoteBasePrice} 
                                      onChange={(e) => setQuoteBasePrice(e.target.value)} 
                                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #1d1d1f', fontSize: '12px' }}
                                    />
                                    <span style={{ fontSize: '11px', fontWeight: 800 }}>Deposit: {quoteDepositPct}%</span>
                                    <input 
                                      type="range" 
                                      min="1" 
                                      max="100" 
                                      value={quoteDepositPct} 
                                      onChange={(e) => setQuoteDepositPct(Number(e.target.value))} 
                                    />
                                    <button 
                                      className="login-btn-premium" 
                                      style={{ margin: 0, padding: '8px 16px', width: 'auto' }}
                                      onClick={() => handleStatusChange(q.id, 'QUOTED', Number(quoteBasePrice), quoteDepositPct)}
                                    >
                                      SEND QUOTATION
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* CUSTOMER QUOTE BREAKDOWN & PAYMENT CONTROLS */}
                            {!isAdmin && (
                              <tr>
                                <td colSpan={4} style={{ padding: '20px', background: '#f0f9fa', borderBottom: '2px solid #1d1d1f' }}>
                                  
                                  {(q.status === 'CANCELLED' || q.status === 'REFUNDED') ? (
                                    /* 🔴 BANNER DI ANNULLAMENTO / RIMBORSO */
                                    <div style={{
                                      background: q.status === 'REFUNDED' ? '#fef2f2' : '#f8fafc',
                                      border: `1px solid ${q.status === 'REFUNDED' ? '#fecaca' : '#cbd5e1'}`,
                                      padding: '20px',
                                      borderRadius: '12px',
                                      textAlign: 'center',
                                      width: '100%',
                                      margin: '5px 0'
                                    }}>
                                      <h4 style={{ 
                                        margin: '0 0 6px 0', 
                                        color: q.status === 'REFUNDED' ? '#991b1b' : '#475569',
                                        fontSize: '13px',
                                        fontWeight: 900
                                      }}>
                                        {q.status === 'REFUNDED' ? '🔄 TRANSACTION REFUNDED' : '❌ QUOTATION CANCELLED'}
                                      </h4>
                                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                                        {q.status === 'REFUNDED' 
                                          ? 'The initial deposit has been fully refunded due to technical/structural unfeasibility. All payment features are disabled.'
                                          : 'This quotation has been marked as cancelled. Please contact our support team if you wish to re-evaluate your setup.'}
                                      </p>
                                    </div>
                                  ) : finalDeal > 0 ? (
                                    <>
                                      {/* --- TRANSPARENT OFFER SHEET --- */}
                                      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 211, 238, 0.4)', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                          <div style={{ fontSize: '10px', fontWeight: 900, color: '#0891b2', letterSpacing: '1px' }}>
                                            OFFICIAL SYSTEM QUOTATION BREAKDOWN
                                          </div>

                                          {/* CONTENITORE DEDICATO AI DUE PULSANTI RICEVUTA PDF */}
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {/* 1. RICEVUTA ACCONTO */}
                                            {(q.deposit_paid || ['DEPOSIT_PAID', 'WAITING_BALANCE', 'BALANCE_PAID', 'CLOSED'].includes(q.status?.toUpperCase())) && (
                                              <button
                                                onClick={() => handleDownloadDepositPDF(q)}
                                                disabled={downloadingPdfId === q.id}
                                                style={{
                                                  background: '#0891b2',
                                                  color: '#fff',
                                                  border: 'none',
                                                  padding: '6px 12px',
                                                  borderRadius: '6px',
                                                  fontSize: '10px',
                                                  fontWeight: 800,
                                                  cursor: downloadingPdfId === q.id ? 'wait' : 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '5px'
                                                }}
                                              >
                                                📄 {downloadingPdfId === q.id ? 'GENERATING...' : 'DEPOSIT RECEIPT (PDF)'}
                                              </button>
                                            )}

                                            {/* 2. RICEVUTA SALDO FINALE */}
                                            {(q.balance_paid || ['CLOSED', 'BALANCE_PAID'].includes(q.status?.toUpperCase())) && (
                                              <button
                                                onClick={() => handleDownloadFinalPDF(q)}
                                                disabled={downloadingPdfId === q.id}
                                                style={{
                                                  background: '#10b981',
                                                  color: '#fff',
                                                  border: 'none',
                                                  padding: '6px 12px',
                                                  borderRadius: '6px',
                                                  fontSize: '10px',
                                                  fontWeight: 800,
                                                  cursor: downloadingPdfId === q.id ? 'wait' : 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '5px'
                                                }}
                                              >
                                                🧾 {downloadingPdfId === q.id ? 'GENERATING...' : 'FINAL SETTLEMENT (PDF)'}
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5c5e62' }}>
                                            <span>System Base Price:</span>
                                            <span className="mono" style={{ fontWeight: 700, color: '#1d1d1f' }}>₱{basePrice.toLocaleString()}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5c5e62' }}>
                                            <span>Value Added Tax (12% VAT):</span>
                                            <span className="mono" style={{ fontWeight: 700, color: '#1d1d1f' }}>₱{vatVal.toLocaleString()}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontWeight: 900, color: '#0891b2', fontSize: '14px' }}>
                                            <span>Turnkey Total Value:</span>
                                            <span className="mono">₱{finalDeal.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* --- MILESTONE PAYMENT BUTTONS --- */}
                                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
                                        
                                        {/* STEP 1: INITIAL DEPOSIT */}
                                        <div style={{ textAlign: 'center', flex: '1', minWidth: '220px' }}>
                                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0891b2', marginBottom: '5px' }}>
                                            STEP 1: INITIAL DEPOSIT ({depPct}%)
                                          </div>
                                          {(() => {
                                            const isExpired = q.valid_until && new Date() > new Date(q.valid_until);

                                            if (q.deposit_paid) {
                                              return (
                                                <span style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', fontWeight: 900, fontSize: '11px', display: 'block' }}>
                                                  ✅ DEPOSIT PAID (₱{depAmt.toLocaleString()})
                                                </span>
                                              );
                                            }

                                            if (isExpired) {
                                              return (
                                                <button disabled style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'not-allowed' }}>
                                                  ⚠️ QUOTE EXPIRED
                                                </button>
                                              );
                                            }

                                            return (
                                              <button 
                                                className="login-btn-premium" 
                                                style={{ margin: 0, padding: '12px 20px', width: '100%', background: '#0891b2' }}
                                                onClick={() => handleSimulatedCustomerPayment(q.id, 'DEPOSIT')}
                                              >
                                                Pay Deposit: ₱{depAmt.toLocaleString()}
                                              </button>
                                            );
                                          })()}
                                        </div>

                                        {/* STEP 2: FINAL BALANCE */}
                                        <div style={{ textAlign: 'center', flex: '1', minWidth: '220px' }}>
                                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0891b2', marginBottom: '5px' }}>
                                            STEP 2: FINAL BALANCE ({100 - depPct}%)
                                          </div>
                                          {q.balance_paid ? (
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', fontWeight: 900, fontSize: '11px', display: 'block' }}>
                                              ✅ BALANCE COMPLETED (₱{balAmt.toLocaleString()})
                                            </span>
                                          ) : q.balance_unlocked ? (
                                            <button 
                                              className="login-btn-premium" 
                                              style={{ margin: 0, padding: '12px 20px', width: '100%', background: '#10b981' }}
                                              onClick={() => handleSimulatedCustomerPayment(q.id, 'BALANCE')}
                                            >
                                              Pay Final Balance: ₱{balAmt.toLocaleString()}
                                            </button>
                                          ) : (
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, padding: '12px', background: '#e2e8f0', borderRadius: '8px' }}>
                                              🔒 BALANCE LOCKED (Pending Installation)
                                            </div>
                                          )}
                                        </div>

                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ textAlign: 'center', padding: '10px', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                                      ⏳ AWAITING OFFICIAL QUOTATION ISSUANCE FROM AZPHUR HQ
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* PUBLIC INFLOW FORM */}
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
        .dashboard-box { max-width: 820px !important; width: 100%; }
        
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
        .status-tag.waiting_deposit { background: #fef9c3; color: #854d0e; }
        .status-tag.deposit_paid { background: #e0f2fe; color: #0369a1; }
        .status-tag.waiting_balance { background: #ffedd5; color: #9a3412; }
        .status-tag.closed { background: #f1f5f9; color: #475569; }
        .status-tag.cancelled { background: #f1f5f9; color: #64748b; }
        .status-tag.refunded { background: #fef2f2; color: #991b1b; }
        
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