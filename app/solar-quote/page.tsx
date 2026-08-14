// [Complete Integrated SolarQuoteMarketplacePage Component - Synchronized with Partner Whitelists, Quotes, and Escrow Financials]
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SolarQuoteMarketplacePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Public Form
  const [fullName, setFullName] = useState('');
  const [emailForm, setEmailForm] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [roofType, setRoofType] = useState('Flat');
  const [objective, setObjective] = useState('');
  const [address, setAddress] = useState(''); 
  const [projectDescription, setProjectDescription] = useState('');         
  const [loadingForm, setLoadingForm] = useState(false);
  const [successForm, setSuccessForm] = useState(false);
  const [isSubmitUnlocked, setIsSubmitUnlocked] = useState(false);
  const [mdpPhotos, setMdpPhotos] = useState<FileList | null>(null);
const [housePhotos, setHousePhotos] = useState<FileList | null>(null);
const [meterPhotos, setMeterPhotos] = useState<FileList | null>(null);
const [inverterPhotos, setInverterPhotos] = useState<FileList | null>(null);

  // Auth States
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // Corretto lo stato setShowLogin
const totalPhotosCount = (mdpPhotos?.length || 0) + (housePhotos?.length || 0) + (meterPhotos?.length || 0) + (inverterPhotos?.length || 0);

  // Private Data States
  const [myQuotations, setMyQuotations] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isAuthorizedCustomer, setIsAuthorizedCustomer] = useState<boolean>(false);
  const [debugStatus, setDebugStatus] = useState<string>("Waiting...");

  // Active Chat State
  const [activeChatQuoteId, setActiveChatQuoteId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTargetType, setChatTargetType] = useState<'provider' | 'installer'>('provider');

  useEffect(() => {
    setMounted(true);
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        await verifyMarketplaceAccess(session.user.email.toLowerCase().trim());
      }
    });

    

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        await verifyMarketplaceAccess(session.user.email.toLowerCase().trim());
      } else {
        setMyQuotations([]);
        setIsAuthorizedCustomer(false);
        setDebugStatus("No active user session");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  

  const parseEntityName = (item: any): string => {
    if (!item) return '';
    let current = item;
    
    for (let i = 0; i < 5; i++) {
      if (typeof current === 'string') {
        try {
          current = JSON.parse(current);
          continue;
        } catch (e) {
          current = current.replace(/[\[\]"'\\]/g, '').trim();
          break;
        }
      } else if (Array.isArray(current)) {
        current = current.length > 0 ? current[0] : '';
      } else {
        break;
      }
    }

    return String(current || '').replace(/[\[\]"'\\]/g, '').trim() || 'Verified Partner';
  };

  const verifyMarketplaceAccess = async (userEmail: string): Promise<boolean> => {
    const emailClean = userEmail.toLowerCase().trim();
    setLoadingQuotes(true);
    
    try {
      const response = await fetch(`/api/v1/solar-leads?email=${encodeURIComponent(emailClean)}`);
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        setDebugStatus(`Connected - Records: ${resData.quotations?.length || 0}`);
        setIsAuthorizedCustomer(true);
        setMyQuotations(resData.quotations || []);
        return true;
      } else {
        setDebugStatus("No records found for email");
        setIsAuthorizedCustomer(false);
        setMyQuotations([]);
        return false;
      }
    } catch (err: any) {
      setDebugStatus(`Error: ${err.message}`);
      setIsAuthorizedCustomer(false);
      return false;
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchWhitelistEmailForPartner = async (partnerName: string, type: 'provider' | 'installer'): Promise<string> => {
    try {
      const cleanTarget = (partnerName || '').toLowerCase().replace(/[_]/g, ' ').trim();
      if (type === 'provider') {
        const { data, error } = await supabase
          .from('partner_whitelist')
          .select('email, provider_name')
          .maybeSingle();
        if (!error && data?.email) return data.email;
      } else {
        const { data, error } = await supabase
          .from('installers_whitelist')
          .select('email, installer_name')
          .maybeSingle();
        if (!error && data?.email) return data.email;
      }
    } catch (e) {
      console.error("Error fetching whitelist email:", e);
    }
    return type === 'provider' ? 'partner@azphur.com' : 'installer@azphur.com';
  };

// 1. Funzione per caricare le foto su Supabase Storage (definita una sola volta)
const handleUploadAllPhotos = async () => {
  const uploadCategoryFiles = async (files: FileList | null, folderName: string) => {
    const urls: string[] = [];
    if (!files || files.length === 0) return urls;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${folderName}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('site-surveys')
        .upload(filePath, file);

      if (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('site-surveys')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        urls.push(publicUrlData.publicUrl);
      }
    }
    return urls;
  };

  const [mdpUrls, houseUrls, meterUrls, inverterUrls] = await Promise.all([
    uploadCategoryFiles(mdpPhotos, 'mdp'),
    uploadCategoryFiles(housePhotos, 'house'),
    uploadCategoryFiles(meterPhotos, 'meter'),
    uploadCategoryFiles(inverterPhotos, 'inverter')
  ]);

  return {
    mdp: mdpUrls,
    house: houseUrls,
    meter: meterUrls,
    inverter: inverterUrls
  };
};

// 2. Form submission function connected to your real states
const handleSubmitLead = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoadingForm(true);

  try {
    // 1. Upload photos to Supabase Storage and obtain public URLs (https://...)
    const sitePhotosPayload = await handleUploadAllPhotos();

    // 2. Save data into the Supabase database using the exact state names
    const { error } = await supabase
      .from('leads')
      .insert([
        {
          customer_name: fullName,
          customer_email: emailForm,
          phone: phone,
          monthly_bill: monthlyBill !== undefined && monthlyBill !== '' ? Number(monthlyBill) : null,
          roof_type: roofType || 'Flat',
          objective: objective || null,
          address: address || null,
          project_description: projectDescription || null,
          
          // Saving the correct public links into Supabase columns
          mdp_photos: sitePhotosPayload.mdp,
          house_photos: sitePhotosPayload.house,
          meter_photos: sitePhotosPayload.meter,
          inverter_photos: sitePhotosPayload.inverter,
        }
      ]);

    if (error) {
      throw error;
    }

    setSuccessForm(true);
    alert('Request and photos successfully submitted!');
  } catch (err: any) {
    console.error('Error during save:', err.message);
    alert('Error sending data. Please try again.');
  } finally {
    setLoadingForm(false);
  }
};


  const handleSimulatedPayment = async (leadId: string, paymentTarget: 'provider_initial' | 'provider_final' | 'installer_initial' | 'installer_final') => {
    try {
      const payload = { lead_id: leadId, payment_target: paymentTarget };
      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setMyQuotations(prev => prev.map(q => {
          if (q.id === leadId) {
            const updated = { ...q };
            if (paymentTarget === 'provider_initial') updated.provider_paid = true;
            if (paymentTarget === 'provider_final') updated.provider_balance_paid = true;
            if (paymentTarget === 'installer_initial') updated.installer_paid = true;
            if (paymentTarget === 'installer_final') updated.installer_balance_paid = true;
            return updated;
          }
          return q;
        }));
        alert(`PAYMENT_CONFIRMED (${paymentTarget.toUpperCase()}) successfully processed via Escrow.`);
      } else {
        alert("PAYMENT_FAILED: " + (resData.error || "Error"));
      }
    } catch (err) {
      alert("PAYMENT_ERROR");
    }
  };

  const handleSendMessage = async (e: React.FormEvent, leadId: string) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      const payload = {
        lead_id: leadId,
        sender_type: 'customer',
        target_entity: chatTargetType,
        message: chatInput.trim()
      };

      const response = await fetch('/api/v1/solar-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setChatMessages(prev => [...prev, data.message]);
        setChatInput('');
      } else {
        alert("CHAT_SEND_ERROR");
      }
    } catch (err) {
      alert("CHAT_NETWORK_ERROR");
    }
  };

  const loadChatHistory = async (leadId: string, target: 'provider' | 'installer') => {
    setActiveChatQuoteId(leadId);
    setChatTargetType(target);
    try {
      const response = await fetch(`/api/v1/solar-chat?lead_id=${leadId}&target=${target}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      setChatMessages([]);
    }
  };

const handleDownloadPDF = async (q: any, type: 'provider' | 'installer', cleanNameOrMilestone?: string, milestone?: 'initial' | 'final') => {
    if (typeof window === 'undefined') return;

    const isProv = type === 'provider';
    const assignedEntity = isProv ? q.assigned_provider : q.assigned_installer;
    const isAssigned = Boolean(assignedEntity);

    // ==========================================
    // PARTE 1: DOWNLOAD DELLA PROPOSTA DEL PARTNER (NON ANCORA ASSEGNATO)
    // ==========================================
    if (!isAssigned) {
      try {
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default || html2pdfModule;

        const cleanName = cleanNameOrMilestone || (isProv ? q.partner_accepted_by : q.installer_accepted_by) || '';
        const normalizedEntityName = String(Array.isArray(cleanName) ? cleanName[0] : cleanName).toLowerCase().replace(/[\s_-]/g, '').trim();

        // Recupero email dalla whitelist corretta (CORRETTO TYPECAST)
        let partnerEmail = 'N/A';
        try {
          const whitelistTable = isProv ? 'provider_whitelist' : 'installers_whitelist';
          const nameColumn = isProv ? 'provider_name' : 'installer_name';
          
          const { data: whiteData } = await supabase
            .from(whitelistTable)
            .select(`email, ${nameColumn}`);

          if (whiteData) {
            const matchedPartner = whiteData.find((w: any) => 
              String(w[nameColumn] || '').toLowerCase().replace(/[\s_-]/g, '').trim() === normalizedEntityName
            );
            if (matchedPartner?.email) {
              partnerEmail = matchedPartner.email;
            }
          }
        } catch (e) {
          console.warn("Could not fetch whitelist email:", e);
        }

        // Recupero dati proposta dalla tabella specifica del partner
        let partnerData = null;
        const proposalTable = isProv ? 'provider_proposals' : 'installer_proposals';
        
        const { data: proposalsList } = await supabase
          .from(proposalTable)
          .select('*')
          .eq('lead_id', q.id);

        if (proposalsList && proposalsList.length > 0) {
          partnerData = proposalsList.find((p: any) => {
            const pName = (p.entity_name || p.provider_name || p.installer_name || p.name || '').toLowerCase().replace(/[\s_-]/g, '').trim();
            return pName === normalizedEntityName;
          }) || proposalsList[0];
        }

        let pdfData: any = {};
        try {
          pdfData = typeof q.quote_pdf_data === 'string' ? JSON.parse(q.quote_pdf_data) : (q.quote_pdf_data || {});
        } catch (e) {
          pdfData = {};
        }

        const customerName = q.customer_name || q.full_name || pdfData.full_name || q.quote_details?.full_name || 'Valued Customer';
        const projectAddress = q.address || pdfData.address || pdfData.installation_address || q.quote_details?.address || 'N/A';

        const panelModel = partnerData?.panel_model || 'N/A';
        const inverterBattery = partnerData?.inverter_battery || 'N/A';
        const basePrice = Number(partnerData?.base_price || 0);
        const recommendedPrice = Number(partnerData?.recommended_price || 0);

        const installPeriod = partnerData?.install_period || 'N/A';
        const workmanshipTerms = partnerData?.workmanship_terms || 'Standard Terms & Structural Warranty';
        const laborCost = Number(partnerData?.labor_cost || 0);

        const element = document.createElement('div');
        element.innerHTML = `
          <div style="padding: 35px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${isProv ? '#0891b2' : '#166534'}; padding-bottom: 20px; margin-bottom: 20px;">
              <div>
                <h1 style="margin: 0; font-size: 22px; color: ${isProv ? '#0891b2' : '#166534'}; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
                <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
              </div>
              <div style="text-align: right; font-size: 10px; color: #64748b;">
                <p style="margin: 2px 0;"><strong>PARTNER PROPOSAL // ${type.toUpperCase()}</strong></p>
                <p style="margin: 2px 0;"><strong>ENTITY:</strong> ${normalizedEntityName || 'Partner'}</p>
                <p style="margin: 2px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div style="background: ${isProv ? '#f0f9fa' : '#f0fdf4'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0;"><strong>CUSTOMER NAME:</strong> ${customerName}</p>
              <p style="margin: 0;"><strong>PROJECT ADDRESS:</strong> ${projectAddress}</p>
              <p style="margin: 0;"><strong>VERIFIED ${type.toUpperCase()}:</strong> ${normalizedEntityName} (${partnerEmail})</p>
              <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 10px 0;" />

              ${isProv ? `
                <p style="margin: 0;"><strong>PANEL MODEL:</strong> ${panelModel}</p>
                <p style="margin: 0;"><strong>INVERTER / BATTERY:</strong> ${inverterBattery}</p>
                <p style="margin: 0;"><strong>BASE PRICE:</strong> ₱${basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                <p style="margin: 0;"><strong>RECOMMENDED PRICE:</strong> ₱${recommendedPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              ` : `
                <p style="margin: 0;"><strong>INSTALLATION PERIOD:</strong> ${installPeriod}</p>
                <p style="margin: 0;"><strong>WORKMANSHIP TERMS:</strong> ${workmanshipTerms}</p>
                <p style="margin: 0;"><strong>LABOR COST:</strong> ₱${laborCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              `}

              <p style="margin: 8px 0 0 0; font-weight: bold; color: ${isProv ? '#0891b2' : '#166534'};">STATUS: Official Claimed Proposal</p>
            </div>

            <div style="font-size: 9px; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 15px;">
              <p style="margin: 0 0 5px 0;"><strong>AZPHUR Network:</strong> This document represents an active custom quotation generated by the verified partner.</p>
              <p style="margin: 0; text-align: center; color: #86868b; font-style: italic;">AZPHUR Distributed Network System — Shaping Sustainable Possibilities.</p>
            </div>
          </div>
        `;

        const opt = {
          margin: 10,
          filename: `AZPHUR_Proposal_${type}_${String(normalizedEntityName || 'Partner').replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await (html2pdf() as any).set(opt).from(element).save();
        return;
      } catch (err: unknown) {
        // CORRETTO CAST DI 'err'
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("PDF generation error:", err);
        alert("PDF_GENERATION_FAILED: " + errorMsg);
        return;
      }
    }

    // ==========================================
    // PARTE 2: RICEVUTA ESCROW (GIA' ASSEGNATO E PAGATO)
    // ==========================================
    const targetMilestone = (cleanNameOrMilestone === 'initial' || cleanNameOrMilestone === 'final') ? cleanNameOrMilestone : (milestone || 'initial');
    const isInitial = targetMilestone === 'initial';
    
    const isPaid = isProv 
      ? (isInitial ? Boolean(q.provider_paid) : Boolean(q.provider_balance_paid))
      : (isInitial ? Boolean(q.installer_paid) : Boolean(q.installer_balance_paid));

    if (!isPaid) {
      alert("RECEIPT_LOCKED: Payment for this milestone has not been completed yet.");
      return;
    }

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const entityName = parseEntityName(assignedEntity);
      let partnerEmail = isProv ? q.provider_email : q.installer_email;
      if (!partnerEmail || partnerEmail.includes('partner@azphur.com') || partnerEmail.includes('installer@azphur.com')) {
        partnerEmail = await fetchWhitelistEmailForPartner(entityName, type);
      }
      
      // Recupero corretto e sicuro degli importi dalle colonne reali della tabella leads
      const initialAmt = isProv 
        ? Number(q.provider_downpayment ?? q.deposit_amount ?? 0) 
        : Number(q.installer_downpayment ?? 0);

      const finalAmt = isProv 
        ? Number(q.provider_balance ?? q.final_deal ?? q.deal_value ?? 0) 
        : Number(q.installer_balance ?? 0);

      const totalDealAmt = initialAmt + finalAmt;

      const initialStatusText = (isProv ? q.provider_paid : q.installer_paid) ? 'PAID & SETTLED' : 'PENDING (UNPAID)';
      const finalStatusText = (isProv ? q.provider_balance_paid : q.installer_balance_paid) ? 'PAID & SETTLED' : 'PENDING (UNPAID)';

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 35px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${isProv ? '#0891b2' : '#166534'}; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; font-size: 22px; color: ${isProv ? '#0891b2' : '#166534'}; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
              <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <p style="margin: 2px 0;"><strong>ESCROW RECEIPT // ${type.toUpperCase()} (${targetMilestone.toUpperCase()})</strong></p>
              <p style="margin: 2px 0;"><strong>TX ID:</strong> ${q.id?.split('-')[0].toUpperCase()}_${targetMilestone.toUpperCase()}</p>
              <p style="margin: 2px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style="background: ${isProv ? '#f0f9fa' : '#f0fdf4'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 11px; line-height: 1.6;">
            <p style="margin: 0;"><strong>CUSTOMER NAME:</strong> ${q.customer_name || 'Valued Customer'}</p>
            <p style="margin: 0;"><strong>CUSTOMER EMAIL:</strong> ${q.customer_email || 'N/A'}</p>
            <p style="margin: 0;"><strong>PROJECT ADDRESS:</strong> ${q.address || 'N/A'}</p>
            <p style="margin: 0;"><strong>ASSIGNED ${type.toUpperCase()}:</strong> ${entityName} (${partnerEmail})</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: bold; color: ${isProv ? '#0891b2' : '#166534'};"><strong>AGREED TOTAL CONTRACT VALUE:</strong> ₱${totalDealAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
            <thead>
              <tr style="background: ${isProv ? '#0891b2' : '#166534'}; color: #ffffff; text-align: left;">
                <th style="padding: 10px;">ESCROW MILESTONE STAGE</th>
                <th style="padding: 10px; text-align: right;">AMOUNT (PHP)</th>
                <th style="padding: 10px; text-align: center;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
                <td style="padding: 10px; font-weight: bold;">Initial Downpayment / Milestone</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${initialAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: ${(isProv ? q.provider_paid : q.installer_paid) ? '#166534' : '#b45309'};">${initialStatusText}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
                <td style="padding: 10px; font-weight: bold;">Final Completion Milestone / Balance</td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">₱${finalAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: ${(isProv ? q.provider_balance_paid : q.installer_balance_paid) ? '#166534' : '#b45309'};">${finalStatusText}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 9px; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 15px;">
            <p style="margin: 0 0 5px 0;"><strong>AZPHUR Service Policy:</strong> All transactions are protected by AZPHUR neutral escrow infrastructure.</p>
            <p style="margin: 0; text-align: center; color: #86868b; font-style: italic;">AZPHUR Distributed Network System — Shaping Sustainable Possibilities.</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `AZPHUR_Paid_Receipt_${type}_${targetMilestone}_${q.id?.split('-')[0].toUpperCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await (html2pdf() as any).set(opt).from(element).save();
    } catch (err: unknown) {
      console.error("Receipt generation error:", err);
      alert("PDF_GENERATION_FAILED");
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    const submittedEmail = emailForm.toLowerCase().trim();

    try {
     // Funzione di utilità corretta per convertire FileList in un array di stringhe Base64
      const convertFilesToBase64 = async (files: FileList | null): Promise<string[]> => {
        if (!files || files.length === 0) return [];
        const promises: Promise<string>[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          promises.push(
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
            })
          );
        }
        return Promise.all(promises);
      };

      // Convertiamo le foto dei 4 campi
      const mdpBase64List = await convertFilesToBase64(mdpPhotos);
      const houseBase64List = await convertFilesToBase64(housePhotos);
      const meterBase64List = await convertFilesToBase64(meterPhotos);
      const inverterBase64List = await convertFilesToBase64(inverterPhotos);

      let pdfBase64 = null;
      if (typeof window !== 'undefined') {
        try {
          const html2pdfModule = await import('html2pdf.js');
          const html2pdf = html2pdfModule.default || html2pdfModule;

          const pdfElement = document.createElement('div');
          pdfElement.innerHTML = `
            <div style="padding: 40px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0891b2; padding-bottom: 20px; margin-bottom: 25px;">
                <div>
                  <h1 style="margin: 0; font-size: 24px; color: #0891b2; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
                  <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
                </div>
                <div style="text-align: right; font-size: 10px; color: #64748b;">
                  <p style="margin: 2px 0;"><strong>SOLAR QUOTATION BROADCAST</strong></p>
                  <p style="margin: 2px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style="background: #f0f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
                <p style="margin: 0;"><strong>FULL NAME / ENTITY:</strong> ${fullName}</p>
                <p style="margin: 0;"><strong>CORPORATE EMAIL:</strong> ${submittedEmail}</p>
                <p style="margin: 0;"><strong>MOBILE PHONE:</strong> ${phone}</p>
                <p style="margin: 0;"><strong>INSTALLATION ADDRESS:</strong> ${address}</p>
                <p style="margin: 0;"><strong>MONTHLY UTILITY BILL:</strong> ₱${Number(monthlyBill || 0).toLocaleString()}</p>
                <p style="margin: 0;"><strong>ROOF STRUCTURE:</strong> ${roofType || 'Flat'}</p>
                <p style="margin: 0;"><strong>ENERGY OBJECTIVE:</strong> ${objective || 'N/A'}</p>
                <p style="margin: 0;"><strong>PROJECT DESCRIPTION:</strong> ${projectDescription || 'N/A'}</p>
                <p style="margin: 0; margin-top: 10px;"><strong>SITE SURVEY ATTACHMENTS:</strong> MDP (${mdpBase64List.length}), House (${houseBase64List.length}), Meter (${meterBase64List.length}), Inverter (${inverterBase64List.length})</p>
              </div>

              <div style="font-size: 9px; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 15px;">
                <p style="margin: 0 0 5px 0;"><strong>Notice:</strong> Official broadcasted document across the AZPHUR ecosystem.</p>
                <p style="margin: 0; text-align: center; color: #86868b; font-style: italic;">AZPHUR Distributed Network System — Shaping Sustainable Possibilities.</p>
              </div>
            </div>
          `;

          document.body.appendChild(pdfElement);

          const opt = {
            margin: 10,
            filename: `AZPHUR_Solar_Broadcast_${fullName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          await (html2pdf() as any).set(opt).from(pdfElement).save();
          pdfBase64 = await (html2pdf() as any).set(opt).from(pdfElement).outputPdf('datauristring');

          document.body.removeChild(pdfElement);
        } catch (pdfErr) {
          console.error("PDF Generation error:", pdfErr);
        }
      }

      // Invio dei dati completi inclusi i file convertiti in Base64
      const response = await fetch('/api/v1/solar-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: fullName,
          customer_email: submittedEmail,
          customer_phone: phone,
          monthly_bill: monthlyBill,
          roof_type: roofType || 'Flat',
          objective: objective || 'N/A',
          project_description: projectDescription || 'N/A',
          address: address,
          user_id: session?.user?.id || null,
          quote_pdf_data: pdfBase64,
          // Invio delle foto al backend
          site_photos: {
            mdp: mdpBase64List,
            house: houseBase64List,
            meter: meterBase64List,
            inverter: inverterBase64List
          },
          quote_details: {
            full_name: fullName,
            email: submittedEmail,
            phone: phone,
            monthly_bill: monthlyBill,
            roof_type: roofType || 'Flat',
            energy_objective: objective || 'N/A',
            project_description: projectDescription || 'N/A',
            address: address
          }
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessForm(true);
        // Reset pulito di TUTTI i campi del form (inclusi i file state)
        setFullName('');
        setEmailForm('');
        setPhone('');
        setMonthlyBill('');
        setObjective('');
        setRoofType('Flat');
        setProjectDescription('');
        setAddress('');
        setMdpPhotos(null);
        setHousePhotos(null);
        setMeterPhotos(null);
        setInverterPhotos(null);
        setIsSubmitUnlocked(false);
        
        setIsAuthorizedCustomer(true);
        if (session?.user?.email) {
          await verifyMarketplaceAccess(session.user.email);
        }
      } else {
        alert("BROADCAST_FAILED: " + (data.error || "Network error"));
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
        await verifyMarketplaceAccess(data.session.user.email);
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
    setMyQuotations([]);
    setIsAuthorizedCustomer(false);
  };

  if (!mounted) return null;
  return (
    <div className="az-premium-canvas quote-screen">
      <style jsx global>{`
        html, body { background-color: #f0f9fa !important; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .az-premium-canvas { background-color: #f0f9fa; min-height: 100vh; color: #1d1d1f; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; overflow-x: hidden; }
        
        /* Mobile-first responsive navigation adjustments */
        @media (max-width: 768px) {
          .nav-minimal-lux { padding: 12px 15px !important; flex-direction: column; gap: 12px; align-items: stretch !important; }
          .logo-group { justify-content: space-between; width: 100%; flex-wrap: wrap; }
          .nav-items { justify-content: flex-end; width: 100%; gap: 8px; }
          .center-content { padding: 15px 10px !important; width: 100% !important; box-sizing: border-box; }
          .login-box-premium { padding: 20px 15px !important; width: 100% !important; box-sizing: border-box; }
        }
      `}</style>

      <div className="glow-sphere"></div>

      <nav className="nav-minimal-lux" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', boxSizing: 'border-box', flexWrap: 'wrap', gap: '10px' }}>
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={{ height: '32px', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div className="status-orb"></div>
          <span className="op-status-tag" style={{ fontSize: '10px' }}>SHAPING SUSTAINABLE POSSIBILITIES</span>
          <span style={{ fontSize: '7px', color: '#0891b2', marginLeft: '4px', fontFamily: 'monospace' }}>[SYS: {debugStatus}]</span>
        </div>
        
        <div className="nav-items" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {session ? (
            <div className="user-badge-zone" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="user-email-tag" style={{ wordBreak: 'break-all', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</span>
              <button onClick={handleLogout} className="btn-cyan-outline btn-logout">DISCONNECT</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(!showLogin)} className="btn-cyan-outline">
              {showLogin ? "CLOSE LOGIN" : "ACCESS PORTAL"}
            </button>
          )}
          <Link href="/" className="exit-btn-lux">EXIT</Link>
        </div>
      </nav>

      <div className="center-content" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px', boxSizing: 'border-box', flex: 1 }}>
        {showLogin && !session && (
          <div className="login-box-premium fade-in" style={{ width: '100%', maxWidth: '480px', margin: '0 auto', boxSizing: 'border-box' }}>
            <span className="phase-label">SECURE_CLIENT_LOGIN</span>
            <h3 className="text-cyan">Marketplace Terminal</h3>
            <p className="login-desc">Sign in to review proposals once accepted by real verified providers and installers, manage escrow, and chat securely.</p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>CLIENT_EMAIL</label>
                <input type="email" required placeholder="name@domain.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label>SECURITY_PASSWORD</label>
                <input type="password" required placeholder="•••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loadingAuth} className="login-btn-premium">
                {loadingAuth ? 'AUTHENTICATING...' : 'ACCESS MY DASHBOARD'}
              </button>
            </form>
          </div>
        )}

        {session && (
          <div className="login-box-premium dashboard-box fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
            <span className="phase-label" style={{ wordBreak: 'break-word' }}>AZPHUR ECOSYSTEM // SECURE ESCROW & LOGISTICS HUB</span>
            <h2 className="text-cyan" style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}>Your Active Requests & Partner Proposals</h2>
            
            {!isAuthorizedCustomer ? (
              <div className="no-records" style={{ borderColor: '#ef4444', color: '#ef4444', marginTop: '15px' }}>
                ACCESS_DENIED: No quotation requests found linked to your authenticated email.
              </div>
            ) : loadingQuotes ? (
              <div className="system-ops-label">FETCHING_REQUEST_STATUS...</div>
            ) : myQuotations.length === 0 ? (
              <div className="no-records">No active broadcast found. Submit a new requirement below to broadcast to the platform.</div>
            ) : (
              <>
                <p className="login-desc">
                  Requests remain in stand-by status until a verified partner or installer formally accepts them from their dedicated operations panel.
                </p>
                <div className="quotes-table-wrapper" style={{ width: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
                  {myQuotations.map(q => {
                    const partnerAcceptedList = Array.isArray(q.partner_accepted_by) ? q.partner_accepted_by : (q.partner_accepted_by ? [q.partner_accepted_by] : []);
                    const installerAcceptedList = Array.isArray(q.installer_accepted_by) ? q.installer_accepted_by : (q.installer_accepted_by ? [q.installer_accepted_by] : []);

                    const hasProviderCandidate = partnerAcceptedList.length > 0;
                    const hasInstallerCandidate = installerAcceptedList.length > 0;

                    const assignedProv = q.assigned_provider;
                    const assignedInst = q.assigned_installer;

                    const cleanAssignedProvName = parseEntityName(assignedProv);
                    const cleanAssignedInstName = parseEntityName(assignedInst);
                    
                    const providerEmail = q.provider_email || 'partner@azphur.com';
                    const installerEmail = q.installer_email || 'installer@azphur.com';

                    const provInitialAmt = q.provider_downpayment !== null && q.provider_downpayment !== undefined ? Number(q.provider_downpayment) : 0;
                    const provFinalAmt = q.provider_balance !== null && q.provider_balance !== undefined ? Number(q.provider_balance) : 0;
                    const providerTotal = provInitialAmt + provFinalAmt;

                    const instInitialAmt = q.installer_downpayment !== null && q.installer_downpayment !== undefined ? Number(q.installer_downpayment) : 0;
                    const instFinalAmt = q.installer_balance !== null && q.installer_balance !== undefined ? Number(q.installer_balance) : 0;
                    const installerTotal = instInitialAmt + instFinalAmt;
                    

                    

                    return (
                      <div key={q.id} style={{ background: '#fff', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '14px', border: '2px solid #1d1d1f', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: '220px', wordBreak: 'break-word' }}>
                            <span className="mono" style={{ fontSize: '10px', color: '#0891b2', fontWeight: 900 }}>TX_ID: {q.id?.split('-')[0].toUpperCase()}</span>
                            <h4 style={{ margin: '4px 0 0', fontSize: '15px', color: '#1d1d1f' }}>{q.roof_type || 'Solar'} Request</h4>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Address: <strong>{q.address || 'N/A'}</strong> | Bill: <strong>₱{q.monthly_bill || '0'}</strong>
                            </div>
                          </div>
                          <div>
                            <span className={`status-tag ${assignedProv && assignedInst ? 'closed' : 'pending_provider_acceptance'}`} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                              STATUS: {assignedProv && assignedInst ? 'CONTRACT ACTIVE & ASSIGNED (2/2)' : 'PENDING 2/2 SELECTION'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                          
                          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #22d3ee', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '5px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 900, color: '#0891b2', letterSpacing: '1px' }}>1. HARDWARE PROVIDER</span>
                              <span style={{ fontSize: '9px', fontWeight: 800, background: assignedProv ? '#dcfce7' : '#fef9c3', color: assignedProv ? '#166534' : '#854d0e', padding: '2px 6px', borderRadius: '4px' }}>
                                {assignedProv ? 'ASSIGNED' : 'PENDING SELECTION'}
                              </span>
                            </div>
                            {assignedProv ? (
                              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #166534', wordBreak: 'break-word' }}>
                                <div style={{ fontWeight: 800, fontSize: '12px', color: '#1d1d1f' }}>{cleanAssignedProvName}</div>
                                <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: 700, marginTop: '2px', wordBreak: 'break-all' }}>Email: {providerEmail}</div>
                                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 900, marginTop: '6px' }}>✓ Officially Assigned by You</div>
                              </div>
                            ) : !hasProviderCandidate ? (
                              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 700 }}>⏳ Awaiting availability from hardware providers...</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#0e7490' }}>Available Providers who accepted:</div>
                                {
                                  Array.from(
                                    new Map(
                                      partnerAcceptedList
                                        .flatMap((item: string) => typeof item === 'string' ? item.split(',') : [item])
                                        .map((provName: string) => {
                                          const clean = parseEntityName(provName);
                                          return [clean, provName];
                                        })
                                    ).values()
                                  ).map((provName: any, idx: number) => {
                                    const cleanName = parseEntityName(provName);
                                    if (!cleanName || cleanName.trim() === '') return null;
                                    return (
                                      <div key={idx} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                          <div style={{ wordBreak: 'break-word', flex: 1, minWidth: '120px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '11px' }}>{cleanName}</div>
                                          </div>
                                          <button 
                                            onClick={async () => {
                                              try {
                                                const res = await fetch('/api/v1/solar-leads', {
                                                  method: 'PATCH',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    lead_id: q.id,
                                                    action: 'select_partner',
                                                    partner_name: cleanName,
                                                    partner_type: 'provider'
                                                  })
                                                });

                                                const data = await res.json();

                                                if (res.ok && data.success) {
                                                  await supabase
                                                    .from('provider_proposals')
                                                    .update({ status: 'rejected_by_customer' })
                                                    .eq('lead_id', q.id)
                                                    .neq('entity_name', cleanName);

                                                  setMyQuotations(prev => prev.map(item => item.id === q.id ? { ...item, assigned_provider: cleanName, status: 'provider_selected' } : item));
                                                  alert(`Provider "${cleanName}" successfully selected! Notifications dispatched.`); 
                                                } else {
                                                  console.error("API Error:", data.error);
                                                  alert("Error assigning provider: " + (data.error || 'Unknown error'));
                                                }
                                              } catch (err) {
                                                console.error("Network Error:", err);
                                                alert("Error during provider selection.");
                                              }
                                            }}
                                            style={{ background: '#0891b2', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                          >
                                            SELECT
                                          </button>
                                        </div>
                                        <button 
                                          onClick={() => handleDownloadPDF(q, 'provider', cleanName)}
                                          style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #166534', padding: '6px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800, cursor: 'pointer', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                                        >
                                          📄 Download Provider Proposal PDF
                                        </button>
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            )}
                          </div>

                          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #166534', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '5px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 900, color: '#166534', letterSpacing: '1px' }}>2. INSTALLATION PARTNER</span>
                              <span style={{ fontSize: '9px', fontWeight: 800, background: assignedInst ? '#dcfce7' : '#fef9c3', color: assignedInst ? '#166534' : '#854d0e', padding: '2px 6px', borderRadius: '4px' }}>
                                {assignedInst ? 'ASSIGNED' : 'PENDING SELECTION'}
                              </span>
                            </div>
                            {assignedInst ? (
                              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #166534', wordBreak: 'break-word' }}>
                                <div style={{ fontWeight: 800, fontSize: '12px', color: '#1d1d1f' }}>{cleanAssignedInstName}</div>
                                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, marginTop: '2px', wordBreak: 'break-all' }}>Email: {installerEmail}</div>
                                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 900, marginTop: '6px' }}>✓ Officially Assigned by You</div>
                              </div>
                            ) : !hasInstallerCandidate ? (
                              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 700 }}>⏳ Awaiting availability from installers...</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#166534' }}>Available Installers who accepted:</div>
                                {
                                  Array.from(
                                    new Map(
                                      (installerAcceptedList || [])
                                        .flatMap((item: string) => typeof item === 'string' ? item.split(',') : [item])
                                        .map((instName: string) => {
                                          const clean = parseEntityName(instName);
                                          return [clean, instName];
                                        })
                                    ).values()
                                  ).map((instName: any, idx: number) => {
                                    const cleanName = parseEntityName(instName);
                                    if (!cleanName || cleanName.trim() === '') return null;
                                    return (
                                      <div key={idx} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                          <div style={{ wordBreak: 'break-word', flex: 1, minWidth: '120px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '11px' }}>{cleanName}</div>
                                          </div>
                                          <button 
                                            onClick={async () => {
                                              try {
                                                const res = await fetch('/api/v1/solar-leads', {
                                                  method: 'PATCH',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    lead_id: q.id,
                                                    action: 'select_partner',
                                                    partner_name: cleanName,
                                                    partner_type: 'installer'
                                                  })
                                                });

                                                const data = await res.json();

                                                if (res.ok && data.success) {
                                                  await supabase
                                                    .from('installer_proposals')
                                                    .update({ status: 'rejected_by_customer' })
                                                    .eq('lead_id', q.id)
                                                    .neq('entity_name', cleanName);

                                                  setMyQuotations(prev => prev.map(item => 
                                                    item.id === q.id 
                                                      ? { ...item, assigned_installer: cleanName, status: 'installer_selected' } 
                                                      : item
                                                  ));
                                                  
                                                  alert(`Installer "${cleanName}" successfully selected! Notifications dispatched.`); 
                                                } else {
                                                  console.error("API Error:", data.error);
                                                  alert("Error assigning installer: " + (data.error || 'Unknown error'));
                                                }
                                              } catch (err) {
                                                console.error("Network Error:", err);
                                                alert("Network or connection error during installer selection.");
                                              }
                                            }}
                                            style={{ background: '#166534', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                          >
                                            SELECT
                                          </button>
                                        </div>
                                        <button 
                                          onClick={() => handleDownloadPDF(q, 'installer', cleanName)}
                                          style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #166534', padding: '6px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 800, cursor: 'pointer', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                                        >
                                          📄 Download Installer Proposal PDF
                                        </button>
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            )}
                          </div>
                                 
                        </div>
                      
               {assignedProv && assignedInst && (
                        <div style={{ background: '#f8fafc', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '14px', border: '2px solid #0891b2', marginTop: '20px', boxSizing: 'border-box', width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 900, color: '#0891b2', letterSpacing: '1px' }}>SECURE ESCROW INFRASTRUCTURE & VIRTUAL CHAT</span>
                              <h3 style={{ margin: '2px 0 0', fontSize: '14px', color: '#1d1d1f' }}>Active Project Milestone Dashboard</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={() => loadChatHistory(q.id, 'provider')} className="btn-cyan-outline" style={{ padding: '6px 12px', fontSize: '9px', borderColor: '#0891b2', color: '#0891b2', background: '#fff' }}>💬 Chat with Provider</button>
                              <button onClick={() => loadChatHistory(q.id, 'installer')} className="btn-cyan-outline" style={{ padding: '6px 12px', fontSize: '9px', borderColor: '#166534', color: '#166534', background: '#fff' }}>💬 Chat with Installer</button>
                            </div>
                          </div>

                          {activeChatQuoteId === q.id && (
                            <div style={{ background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#0891b2' }}>ACTIVE CHAT WITH {chatTargetType.toUpperCase()}</span>
                                <button onClick={() => setActiveChatQuoteId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✕</button>
                              </div>
                              <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '11px', boxSizing: 'border-box' }}>
                                {chatMessages.length === 0 ? (
                                  <div style={{ color: '#86868b', textAlign: 'center' }}>No messages yet.</div>
                                ) : (
                                  chatMessages.map((m: any, idx: number) => (
                                    <div key={idx} style={{ marginBottom: '6px', textAlign: m.sender_type === 'customer' ? 'right' : 'left', wordBreak: 'break-word' }}>
                                      <span style={{ background: m.sender_type === 'customer' ? '#e0f2fe' : '#e2e8f0', padding: '6px 10px', borderRadius: '8px', display: 'inline-block', maxWidth: '100%', boxSizing: 'border-box' }}>
                                        <strong>{m.sender_name || m.sender_type}:</strong> {m.message}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                              <form onSubmit={(e) => handleSendMessage(e, q.id)} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <input type="text" placeholder="Type message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1, minWidth: '160px', padding: '10px', fontSize: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                                <button type="submit" className="login-btn-premium" style={{ margin: 0, padding: '10px 16px', fontSize: '9px', width: 'auto', whiteSpace: 'nowrap' }}>Send</button>
                              </form>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                            
                            {/* PROVIDER ESCROW PANEL */}
                            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '2px solid #0891b2', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box', overflow: 'hidden' }}>
                              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', wordBreak: 'break-word' }}>
                                <span style={{ fontSize: '9px', fontWeight: 900, color: '#0891b2', letterSpacing: '1px' }}>HARDWARE PROVIDER ESCROW</span>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#1d1d1f', marginTop: '4px' }}>{cleanAssignedProvName}</div>
                                <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: 700, wordBreak: 'break-all' }}>Email: {providerEmail}</div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', marginTop: '2px' }}>
                                  Agreed Total Deal: {providerTotal !== null ? '₱' + providerTotal.toLocaleString() : 'PENDING'}
                                </div>
                              </div>

                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '5px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#0891b2' }}>1. PROV INITIAL DOWNPAYMENT</span>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d1d1f' }}>{provInitialAmt !== null ? '₱' + provInitialAmt.toLocaleString() : 'PENDING'}</span>
                                </div>
                                {q.provider_paid ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textAlign: 'center' }}>✓ ESCROW PAID</span>
                                    <button onClick={() => handleDownloadPDF(q, 'provider', 'initial')} className="btn-cyan-outline" style={{ padding: '6px', fontSize: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>📄 DOWNLOAD PAID RECEIPT PDF</button>
                                  </div>
                                ) : provInitialAmt !== null ? (
                                  <button onClick={() => handleSimulatedPayment(q.id, 'provider_initial')} className="login-btn-premium" style={{ margin: '8px 0 0 0', padding: '10px', fontSize: '9px', background: '#0891b2', width: '100%', boxSizing: 'border-box' }}>Pay Initial</button>
                                ) : (
                                  <div style={{ fontSize: '8px', color: '#b45309', background: '#fef9c3', padding: '8px', borderRadius: '6px', fontWeight: 800, textAlign: 'center', marginTop: '8px' }}>⏳ WAITING PRICE PENDING</div>
                                )}
                              </div>

                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '5px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#0891b2' }}>2. PROV FINAL BALANCE</span>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d1d1f' }}>{provFinalAmt !== null ? '₱' + provFinalAmt.toLocaleString() : 'PENDING'}</span>
                                </div>
                                {q.provider_balance_paid ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textAlign: 'center' }}>✓ ESCROW PAID</span>
                                    <button onClick={() => handleDownloadPDF(q, 'provider', 'final')} className="btn-cyan-outline" style={{ padding: '6px', fontSize: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>📄 DOWNLOAD PAID RECEIPT PDF</button>
                                  </div>
                                ) : q.provider_balance_unlocked && provFinalAmt !== null ? (
                                  <button onClick={() => handleSimulatedPayment(q.id, 'provider_final')} className="login-btn-premium" style={{ margin: '8px 0 0 0', padding: '10px', fontSize: '9px', background: '#0891b2', width: '100%', boxSizing: 'border-box' }}>Pay Final</button>
                                ) : (
                                  <div style={{ fontSize: '8px', color: '#b45309', background: '#fef9c3', padding: '8px', borderRadius: '6px', fontWeight: 800, textAlign: 'center', marginTop: '8px' }}>🔒 FINAL PENDING</div>
                                )}
                              </div>
                            </div>

                            {/* INSTALLER ESCROW PANEL */}
                            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '2px solid #166534', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box', overflow: 'hidden' }}>
                              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', wordBreak: 'break-word' }}>
                                <span style={{ fontSize: '9px', fontWeight: 900, color: '#166534', letterSpacing: '1px' }}>INSTALLATION PARTNER ESCROW</span>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#1d1d1f', marginTop: '4px' }}>{cleanAssignedInstName}</div>
                                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, wordBreak: 'break-all' }}>Email: {installerEmail}</div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', marginTop: '2px' }}>
                                  Agreed Total Deal: {installerTotal !== null ? '₱' + installerTotal.toLocaleString() : 'PENDING'}
                                </div>
                              </div>

                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '5px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#166534' }}>INST INITIAL DOWNPAYMENT</span>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d1d1f' }}>{instInitialAmt !== null ? '₱' + instInitialAmt.toLocaleString() : 'PENDING'}</span>
                                </div>
                                {q.installer_paid ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textAlign: 'center' }}>✓ ESCROW PAID</span>
                                    <button onClick={() => handleDownloadPDF(q, 'installer', 'initial')} className="btn-cyan-outline" style={{ borderColor: '#166534', color: '#166534', padding: '6px', fontSize: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>📄 DOWNLOAD PAID RECEIPT PDF</button>
                                  </div>
                                ) : instInitialAmt !== null ? (
                                  <button onClick={() => handleSimulatedPayment(q.id, 'installer_initial')} className="login-btn-premium" style={{ margin: '8px 0 0 0', padding: '10px', fontSize: '9px', background: '#166534', width: '100%', boxSizing: 'border-box' }}>Pay Initial</button>
                                ) : (
                                  <div style={{ fontSize: '8px', color: '#b45309', background: '#fef9c3', padding: '8px', borderRadius: '6px', fontWeight: 800, textAlign: 'center', marginTop: '8px' }}>⏳ PENDING PARTNER QUOTE</div>
                                )}
                              </div>

                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '5px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#166534' }}>4. INST FINAL BALANCE</span>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d1d1f' }}>{instFinalAmt !== null ? '₱' + instFinalAmt.toLocaleString() : 'PENDING'}</span>
                                </div>
                                {q.installer_balance_paid ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textAlign: 'center' }}>✓ ESCROW PAID</span>
                                    <button onClick={() => handleDownloadPDF(q, 'installer', 'final')} className="btn-cyan-outline" style={{ borderColor: '#166534', color: '#166534', padding: '6px', fontSize: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>📄 DOWNLOAD PAID RECEIPT PDF</button>
                                  </div>
                                ) : q.installer_balance_unlocked && instFinalAmt !== null ? (
                                  <button onClick={() => handleSimulatedPayment(q.id, 'installer_final')} className="login-btn-premium" style={{ margin: '8px 0 0 0', padding: '10px', fontSize: '9px', background: '#166534', width: '100%', boxSizing: 'border-box' }}>Pay Final</button>
                                ) : (
                                  <div style={{ fontSize: '8px', color: '#b45309', background: '#fef9c3', padding: '8px', borderRadius: '6px', fontWeight: 800, textAlign: 'center', marginTop: '8px' }}>🔒 FINAL PENDING</div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="login-box-premium form-inflow-box" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="login-header">
          <span className="phase-label">BROADCAST INTERFACE // NEUTRAL PLATFORM</span>
          <h2 className="text-cyan">Request Real Partner Proposals</h2>
          <p className="login-desc">Submit your project details. AZPHUR automatically broadcasts your requirement to all online provider and installer networks instantly.</p>
        </div>

       {successForm ? (
  <div className="success-panel fade-in">
    <span className="phase-label success-tag">BROADCAST_SUCCESSFUL</span>
    <p>Your request has been successfully transmitted to all active online providers and installers.</p>
    <button 
      onClick={() => {
        setSuccessForm(false);
        // Resetta tutti gli stati delle foto per il nuovo inserimento
        setMdpPhotos(null);
        setHousePhotos(null);
        setMeterPhotos(null);
        setInverterPhotos(null);
        setIsSubmitUnlocked(false);
      }} 
      className="login-btn-premium"
    >
      SUBMIT ANOTHER REQUEST
    </button>
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
              <input type="text" placeholder="e.g. Lower bills, Power backup" required value={objective} onChange={e => setObjective(e.target.value)} />
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>PROJECT_DESCRIPTION</label>
              <textarea rows={3} placeholder="Describe your project details or specific requirements..." value={projectDescription} onChange={e => setProjectDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>ROOF_STRUCTURE</label>
              <select value={roofType} onChange={e => setRoofType(e.target.value)} className="select-lux">
                <option value="Flat">Flat Roof</option>
                <option value="Pitched">Pitched Roof</option>
                <option value="Industrial">Industrial Envelope Coverage</option>
              </select>
            </div>

{/* SITE_SURVEY // SITE PHOTOS (MAX 4 EACH) */}
<div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
  <span className="phase-label" style={{ color: '#0891b2' }}>SITE_SURVEY // SITE PHOTOS (MAX 4 EACH)</span>
  
  {/* MDP */}
  <div className="input-group" style={{ marginTop: '12px' }}>
    <label>MDP (MAIN DISTRIBUTION PANEL)</label>
    <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 6px 0' }}>Upload clear photos of your main circuit breaker panel to evaluate electrical capacity and safety compliance.</p>
    <input 
      type="file" 
      id="mdp-upload" 
      accept="image/*" 
      multiple 
      onChange={e => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const existingFiles = mdpPhotos ? Array.from(mdpPhotos) : [];
        const combinedFiles = [...existingFiles, ...newFiles];
        const dataTransfer = new DataTransfer();
        combinedFiles.forEach(file => dataTransfer.items.add(file));
        setMdpPhotos(dataTransfer.files);
      }} 
      style={{ display: 'none' }} 
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <label htmlFor="mdp-upload" style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }}>
        Choose Files
      </label>
      <span style={{ fontSize: '11px', color: mdpPhotos && mdpPhotos.length > 0 ? '#0891b2' : '#64748b', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {mdpPhotos && mdpPhotos.length > 0 ? `✓ ${mdpPhotos.length} file(s) selected` : 'No file chosen'}
      </span>
    </div>
    {mdpPhotos && mdpPhotos.length > 0 && (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {Array.from(mdpPhotos).map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                <img src={previewUrl} alt="MDP Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
              </a>
              <button 
                type="button"
                onClick={() => {
                  const updatedFiles = Array.from(mdpPhotos).filter((_, i) => i !== idx);
                  const dataTransfer = new DataTransfer();
                  updatedFiles.forEach(f => dataTransfer.items.add(f));
                  setMdpPhotos(updatedFiles.length > 0 ? dataTransfer.files : null);
                }}
                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* HOUSE OVERVIEW */}
  <div className="input-group" style={{ marginTop: '12px' }}>
    <label>CLIENT HOUSE (OVERVIEW)</label>
    <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 6px 0' }}>Provide wide-angle exterior shots of your roof structure and property to assess optimal solar layout orientation.</p>
    <input 
      type="file" 
      id="house-upload" 
      accept="image/*" 
      multiple 
      onChange={e => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const existingFiles = housePhotos ? Array.from(housePhotos) : [];
        const combinedFiles = [...existingFiles, ...newFiles];
        const dataTransfer = new DataTransfer();
        combinedFiles.forEach(file => dataTransfer.items.add(file));
        setHousePhotos(dataTransfer.files);
      }} 
      style={{ display: 'none' }} 
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <label htmlFor="house-upload" style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }}>
        Choose Files
      </label>
      <span style={{ fontSize: '11px', color: housePhotos && housePhotos.length > 0 ? '#0891b2' : '#64748b', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {housePhotos && housePhotos.length > 0 ? `✓ ${housePhotos.length} file(s) selected` : 'No file chosen'}
      </span>
    </div>
    {housePhotos && housePhotos.length > 0 && (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {Array.from(housePhotos).map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                <img src={previewUrl} alt="House Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
              </a>
              <button 
                type="button"
                onClick={() => {
                  const updatedFiles = Array.from(housePhotos).filter((_, i) => i !== idx);
                  const dataTransfer = new DataTransfer();
                  updatedFiles.forEach(f => dataTransfer.items.add(f));
                  setHousePhotos(updatedFiles.length > 0 ? dataTransfer.files : null);
                }}
                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* ELECTRIC METER */}
  <div className="input-group" style={{ marginTop: '12px' }}>
    <label>ELECTRIC METER</label>
    <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 6px 0' }}>Capture a legible image of your utility power meter for grid integration and net metering compatibility checks.</p>
    <input 
      type="file" 
      id="meter-upload" 
      accept="image/*" 
      multiple 
      onChange={e => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const existingFiles = meterPhotos ? Array.from(meterPhotos) : [];
        const combinedFiles = [...existingFiles, ...newFiles];
        const dataTransfer = new DataTransfer();
        combinedFiles.forEach(file => dataTransfer.items.add(file));
        setMeterPhotos(dataTransfer.files);
      }} 
      style={{ display: 'none' }} 
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <label htmlFor="meter-upload" style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }}>
        Choose Files
      </label>
      <span style={{ fontSize: '11px', color: meterPhotos && meterPhotos.length > 0 ? '#0891b2' : '#64748b', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {meterPhotos && meterPhotos.length > 0 ? `✓ ${meterPhotos.length} file(s) selected` : 'No file chosen'}
      </span>
    </div>
    {meterPhotos && meterPhotos.length > 0 && (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {Array.from(meterPhotos).map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                <img src={previewUrl} alt="Meter Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
              </a>
              <button 
                type="button"
                onClick={() => {
                  const updatedFiles = Array.from(meterPhotos).filter((_, i) => i !== idx);
                  const dataTransfer = new DataTransfer();
                  updatedFiles.forEach(f => dataTransfer.items.add(f));
                  setMeterPhotos(updatedFiles.length > 0 ? dataTransfer.files : null);
                }}
                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* INVERTER PLACEMENT AREA */}
  <div className="input-group" style={{ marginTop: '12px' }}>
    <label>INVERTER PLACEMENT AREA</label>
    <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 6px 0' }}>Select a shaded, well-ventilated location at ambient temperature (e.g., utility room, garage, or under-stairs area close to the MDP).</p>
    <input 
      type="file" 
      id="inverter-upload" 
      accept="image/*" 
      multiple 
      onChange={e => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const existingFiles = inverterPhotos ? Array.from(inverterPhotos) : [];
        const combinedFiles = [...existingFiles, ...newFiles];
        const dataTransfer = new DataTransfer();
        combinedFiles.forEach(file => dataTransfer.items.add(file));
        setInverterPhotos(dataTransfer.files);
      }} 
      style={{ display: 'none' }} 
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <label htmlFor="inverter-upload" style={{ display: 'inline-block', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }}>
        Choose Files
      </label>
      <span style={{ fontSize: '11px', color: inverterPhotos && inverterPhotos.length > 0 ? '#0891b2' : '#64748b', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {inverterPhotos && inverterPhotos.length > 0 ? `✓ ${inverterPhotos.length} file(s) selected` : 'No file chosen'}
      </span>
    </div>
    {inverterPhotos && inverterPhotos.length > 0 && (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {Array.from(inverterPhotos).map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Click to view full size">
                <img src={previewUrl} alt="Inverter Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
              </a>
              <button 
                type="button"
                onClick={() => {
                  const updatedFiles = Array.from(inverterPhotos).filter((_, i) => i !== idx);
                  const dataTransfer = new DataTransfer();
                  updatedFiles.forEach(f => dataTransfer.items.add(f));
                  setInverterPhotos(updatedFiles.length > 0 ? dataTransfer.files : null);
                }}
                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

            {!isSubmitUnlocked ? (
              <div style={{ marginTop: '25px', marginBottom: '15px' }}>
                <button type="button" onClick={() => setIsSubmitUnlocked(true)} style={{ background: '#e2e8f0', color: '#475569', border: '1px dashed #0891b2', padding: '12px', borderRadius: '12px', fontSize: '10px', fontWeight: 900, cursor: 'pointer', width: '100%', letterSpacing: '1px', boxSizing: 'border-box' }}>
                  🔒 LOCKED: CLICK HERE TO UNLOCK & SUBMIT REQUEST
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 900, marginTop: '20px', marginBottom: '10px', textAlign: 'center' }}>
                ✓ BROADCAST GATEWAY UNLOCKED
              </div>
            )}
            <button type="submit" disabled={loadingForm || !isSubmitUnlocked} className="login-btn-premium" style={{ opacity: !isSubmitUnlocked ? 0.6 : 1, cursor: !isSubmitUnlocked ? 'not-allowed' : 'pointer' }}>
              {loadingForm ? 'BROADCASTING...' : 'BROADCAST REQUEST TO ALL ONLINE PARTNERS'}
            </button>
          </form>
        )}
      </div>
    </div>

    <style jsx>{`
      .glow-sphere { position: fixed; top: 10%; left: 50%; transform: translateX(-50%); width: 85vw; height: 45vw; background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%); z-index: 0; pointer-events: none; }
      .nav-minimal-lux { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px 20px; max-width: 1400px; width: 100%; margin: 0 auto; position: relative; z-index: 10; box-sizing: border-box; gap: 15px; }
      .logo-group { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
      .status-orb { width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-left: 6px; box-shadow: 0 0 10px #22d3ee; flex-shrink: 0; }
      .op-status-tag { font-size: 7px; color: #0891b2; border: 1px solid #22d3ee; padding: 2px 6px; border-radius: 3px; margin-left: 6px; font-weight: 900; white-space: nowrap; }
      .nav-items { display: flex; align-items: center; gap: 10px; }
      .btn-cyan-outline { background: none; border: 1px solid #22d3ee; color: #0891b2; padding: 8px 16px; border-radius: 100px; cursor: pointer; font-weight: 800; font-size: 10px; transition: 0.3s; letter-spacing: 1px; white-space: nowrap; }
      .btn-cyan-outline:hover { background: #22d3ee; color: #fff; box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2); }
      .exit-btn-lux { font-size: 10px; color: #1d1d1f; font-weight: 900; text-decoration: none; border: 3px solid #1d1d1f; padding: 6px 12px; border-radius: 8px; background: #fff; text-transform: uppercase; letter-spacing: 1px; }
      .user-badge-zone { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); border: 1px solid rgba(34,211,238,0.3); padding: 4px 10px; border-radius: 50px; flex-wrap: wrap; justify-content: center; }
      .user-email-tag { font-size: 10px; font-weight: 700; color: #0891b2; font-family: monospace; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .btn-logout { border-color: #f87171; color: #ef4444; padding: 4px 8px; }
      .btn-logout:hover { background: #ef4444; color: #fff; box-shadow: none; }
      .center-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 16px; z-index: 1; width: 100%; box-sizing: border-box; gap: 24px; }
      .login-box-premium { background: linear-gradient(135deg, #ffffff 0%, #e6f7f9 100%); padding: 30px; border-radius: 20px; border: 3px solid #1d1d1f; width: 100%; max-width: 460px; text-align: left; box-shadow: 0 20px 40px rgba(34, 211, 238, 0.08); box-sizing: border-box; }
      .dashboard-box { max-width: 960px !important; width: 100%; }
      .phase-label { font-size: 9px; font-weight: 900; color: #86868b; letter-spacing: 1.5px; margin-bottom: 12px; display: block; }
      .text-cyan { color: #0891b2 !important; font-size: 22px; font-weight: 800; margin: 0; }
      .login-desc { font-size: 12px; color: #5c5e62; margin: 8px 0 20px; line-height: 1.5; font-weight: 500; }
      .input-group label { font-size: 9px; color: #0891b2; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 6px; }
      .input-group input, .select-lux { width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 10px; color: #1d1d1f; font-size: 12px; font-weight: 600; box-sizing: border-box; }
      .select-lux { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%230891b2' d='M0 0l5 5 5-5z'/></svg>"); background-repeat: no-repeat; background-position: right 12px center; }
      .login-btn-premium { background: #1d1d1f; color: white; padding: 14px; border-radius: 10px; font-weight: 900; border: none; cursor: pointer; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; width: 100%; margin-top: 15px; box-sizing: border-box; }
      .login-btn-premium:hover { background: #22d3ee; color: #1d1d1f; transform: translateY(-1px); }
      .quotes-table-wrapper { width: 100%; overflow-x: auto; margin-top: 15px; }
      .mono { font-family: monospace; font-size: 11px; }
      .status-tag { font-size: 8px; padding: 4px 8px; border-radius: 4px; font-weight: 900; text-transform: uppercase; display: inline-block; }
      .status-tag.closed { background: #dcfce7; color: #166534; }
      .status-tag.pending_provider_acceptance { background: #fef9c3; color: #854d0e; }
      .no-records { padding: 20px; text-align: center; font-weight: 700; color: #86868b; background: #fff; border-radius: 100px; border: 1px solid #e6f7f9; }
      .system-ops-label { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 2px; text-align: center; margin: 15px 0; }
      .success-panel { text-align: center; padding: 10px 0; font-weight: 600; }
      .success-tag { color: #0891b2 !important; font-weight: 900; }
      .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  </div>
);
}