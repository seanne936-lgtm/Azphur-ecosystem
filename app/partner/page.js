"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PartnerDashboard() {
  const [shipments, setShipments] = useState([]);
  const [installerInventory, setInstallerInventory] = useState([]);
  const [incomingLeads, setIncomingLeads] = useState([]);
  const [selectedEntityName, setSelectedEntityName] = useState('');
  const [entityType, setEntityType] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unlockedLeads, setUnlockedLeads] = useState({});

  const [quoteInputs, setQuoteInputs] = useState({});

  const [savingItem, setSavingItem] = useState(false);
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('SOLAR');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formImage, setFormImage] = useState('');

  const [instFormSku, setInstFormSku] = useState('');
  const [instFormName, setInstFormName] = useState('');
  const [instFormCategory, setInstFormCategory] = useState('LABOR_AND_SERVICES');
  const [instFormPrice, setInstFormPrice] = useState('');
  const [instFormQuantity, setInstFormQuantity] = useState('');
  const [instFormDescription, setInstFormDescription] = useState('');
  const [savingInstItem, setSavingInstItem] = useState(false);


  useEffect(() => {
    setMounted(true);
    checkActiveSession();
  }, []);

const handleDownloadPDF = async (q, type) => {
  if (!window.confirm(`Are you sure you want to delete the completed record for customer "${customerName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    // Invia l'ID specifico del lead come parametro di ricerca
    const response = await fetch(`/api/v1/solar-leads?lead_id=${leadId}`, {
      method: 'DELETE',
    });

    const resData = await response.json();
    if (response.ok && resData.success) {
      // Rimuove istantaneamente solo quella specifica card dalla schermata del partner
      setMyQuotations(prev => prev.filter(q => q.id !== leadId));
      alert(`RECORD_DELETED: Project for ${customerName} has been removed.`);
    } else {
      alert("DELETE_FAILED: " + (resData.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete request error:", err);
    alert("DELETE_ERROR: Could not complete the request.");
  }
};


/// Funzione per nascondere in modo sicuro e indipendente il record completato dalla propria vista
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to clear this completed record from your dashboard? This action will not affect other parties.")) {
      return;
    }

    try {
      // Invia una richiesta PATCH per aggiornare il flag di occultamento per questo specifico ruolo
      const response = await fetch('/api/v1/solar-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          hide_for: entityType === 'provider' ? 'provider' : 'installer' // Specifica chi sta compiendo l'azione
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        // Aggiorna lo stato locale rimuovendo la card solo dalla vista attuale
        setIncomingLeads(prev => prev.filter(q => q.id !== leadId));
        alert("RECORD_HIDDEN: The project has been successfully cleared from your panel.");
      } else {
        alert("ACTION_FAILED: " + (resData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Hide request error:", err);
      alert("DELETE_ERROR: Could not complete the request.");
    }
  };

  const generateAndDownloadOfficialPDF = async (lead = {}, proposalData = {}, type = 'provider') => {
    if (typeof window === 'undefined') return;

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const customerName = lead?.customer_name || lead?.full_name || 'Valued Customer';
      const address = lead?.address || lead?.installation_address || 'Manila';
      
      const entityNameDisplay = proposalData?.entity_name || selectedEntityName || 'AZPHUR Partner';
      
      const panelModel = proposalData?.panel_model || 'N/A';
      const inverterBattery = proposalData?.inverter_battery || 'N/A';
      const basePrice = Number(proposalData?.base_price) || 0;
      const recommendedPrice = Number(proposalData?.recommended_price) || 0;
      
      const installPeriod = proposalData?.install_period || 'N/A';
      const workmanshipTerms = proposalData?.workmanship_terms || 'Standard Terms';
      const laborCost = Number(proposalData?.labor_cost) || 0;
      
      const currentDate = new Date().toLocaleDateString();

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: Arial, sans-serif; color: #1d1d1f; max-width: 700px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #0891b2; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
              <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b; font-family: monospace;">
              <p style="margin: 0; font-weight: bold; color: #0891b2;">PARTNER PROPOSAL // ${type.toUpperCase()}</p>
              <p style="margin: 2px 0;">DATE: ${currentDate}</p>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; line-height: 1.8; border: 1px solid #e2e8f0;">
            <p style="margin: 0;"><strong>CUSTOMER NAME:</strong> ${customerName}</p>
            <p style="margin: 0;"><strong>PROJECT ADDRESS:</strong> ${address}</p>
            <p style="margin: 0;"><strong>VERIFIED ${type.toUpperCase()}:</strong> ${entityNameDisplay}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 12px 0;" />
            
            ${type === 'provider' ? `
              <p style="margin: 0;"><strong>PANEL MODEL:</strong> ${panelModel}</p>
              <p style="margin: 0;"><strong>INVERTER / BATTERY:</strong> ${inverterBattery}</p>
              <p style="margin: 0;"><strong>BASE PRICE (EXCL. VAT):</strong> â‚±${basePrice.toLocaleString()}</p>
              <p style="margin: 0;"><strong>RECOMMENDED PRICE:</strong> â‚±${recommendedPrice.toLocaleString()}</p>
            ` : `
              <p style="margin: 0;"><strong>INSTALLATION PERIOD:</strong> ${installPeriod}</p>
              <p style="margin: 0;"><strong>WORKMANSHIP TERMS:</strong> ${workmanshipTerms}</p>
              <p style="margin: 0;"><strong>LABOR COST:</strong> â‚±${laborCost.toLocaleString()}</p>
            `}
          </div>

          <div style="font-size: 10px; color: #475569; line-height: 1.6; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center;">
            <p style="margin: 0;">AZPHUR Network: This document represents an active proposal from the verified partner network.</p>
          </div>
        </div>
      `;

      document.body.appendChild(element);

      const fileIdSnippet = lead?.id ? lead.id.split('-')[0].toUpperCase() : 'PROPOSAL';
      const opt = {
        margin: 10,
        filename: `AZPHUR_Proposal_${type}_${entityNameDisplay.replace(/\s+/g, '_')}_${fileIdSnippet}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);

    } catch (err) {
      console.error("Errore generazione PDF:", err);
      alert("PDF_GENERATION_FAILED: " + err.message);
    }
  };
  
  async function saveDetailedQuotation(leadId, currentEntityType) {
    const inputState = quoteInputs[leadId] || {};
    let cleanEntityName = (selectedEntityName || '').trim();
    const tableName = currentEntityType === 'provider' ? 'provider_proposals' : 'installer_proposals';

    let proposalPayload = currentEntityType === 'provider' ? {
      lead_id: leadId,
      entity_name: cleanEntityName,
      panel_model: inputState.panelModel || '',
      inverter_battery: inputState.inverterBattery || '',
      base_price: inputState.basePrice ? Number(inputState.basePrice) : null,
      recommended_price: Number(inputState.recommendedPrice || 0),
      extra_options: inputState.extraOptions || []
    } : {
      lead_id: leadId,
      entity_name: cleanEntityName,
      install_period: inputState.installPeriod || '',
      workmanship_terms: inputState.workmanshipTerms || '',
      labor_cost: Number(inputState.laborCost || 0)
    };

    const basePriceVal = inputState.basePrice ? Number(inputState.basePrice) : 0;
    const dpPercentVal = inputState.downpaymentPercent !== undefined ? Number(inputState.downpaymentPercent) : 30;
    const totalWithVat = basePriceVal * 1.12;
    const calculatedDownpayment = (totalWithVat * dpPercentVal) / 100;
    const calculatedBalance = totalWithVat - calculatedDownpayment;

    let leadUpdatePayload = currentEntityType === 'provider' ? {
      provider_downpayment: calculatedDownpayment,
      provider_downpayment_pct: dpPercentVal,
      provider_balance: calculatedBalance
    } : {
      installer_downpayment: calculatedDownpayment,
      installer_downpayment_pct: dpPercentVal,
      installer_balance: calculatedBalance
    };

    try {
      const { data: existingData } = await supabase
        .from(tableName)
        .select('id')
        .eq('lead_id', leadId)
        .ilike('entity_name', cleanEntityName)
        .maybeSingle();

      let errorProposal = null;
      if (existingData && existingData.id) {
        const res = await supabase.from(tableName).update(proposalPayload).eq('id', existingData.id);
        errorProposal = res.error;
      } else {
        const res = await supabase.from(tableName).insert([proposalPayload]);
        errorProposal = res.error;
      }
      if (errorProposal) throw errorProposal;

      const { error: errorLead } = await supabase
        .from('leads')
        .update(leadUpdatePayload)
        .eq('id', leadId);

      if (errorLead) throw errorLead;

      alert(`${currentEntityType.toUpperCase()} proposal and payment pricing successfully saved & locked!`);
      
      setUnlockedLeads(prev => ({ ...prev, [`saved_${leadId}`]: true }));
      await fetchIncomingLeads();

    } catch (err) {
      alert("Error while saving proposal: " + err.message);
    }
  }

  async function checkActiveSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user?.email) {
        setAuthError('ACCESS_DENIED: Please sign in with an authorized partner or installer account.');
        setCheckingAuth(false);
        return;
      }

      const userEmail = session.user.email.toLowerCase().trim();

      if (userEmail.includes('admin') || userEmail === 'admin@azphur.com') {
        setIsAdmin(true);
        setEntityType('admin');
        fetchAllPartnersOverview();
        fetchAllInstallersOverview();
        fetchIncomingLeads();
        setCheckingAuth(false);
        return;
      }

      const { data: providerData } = await supabase
        .from('partner_whitelist')
        .select('provider_name')
        .eq('email', userEmail)
        .maybeSingle();

      if (providerData) {
        const formattedProvider = providerData.provider_name.trim();
        setSelectedEntityName(formattedProvider);
        setEntityType('provider');
        fetchPartnerCargo(formattedProvider);
        fetchIncomingLeads();
        setCheckingAuth(false);
        return;
      }

      const { data: installerData } = await supabase
        .from('installers_whitelist')
        .select('installer_name')
        .eq('email', userEmail)
        .maybeSingle();

      if (installerData) {
        const rawName = installerData.installer_name || installerData.name || userEmail.split('@')[0];
        const formattedInstaller = rawName.trim();
        setSelectedEntityName(formattedInstaller);
        setEntityType('installer');
        fetchInstallerCargo(formattedInstaller);
        fetchIncomingLeads();
        setCheckingAuth(false);
        return;
      }

      setAuthError(`ACCESS_DENIED: The email (${userEmail}) is not registered in partner or installer whitelist tables.`);
    } catch (err) {
      console.error("Auth session check error:", err);
      setAuthError('SYSTEM_ERROR: Failed to verify session against database.');
    } finally {
      setCheckingAuth(false);
    }
  }

  function handleQuoteInputChange(leadId, field, value) {
    setQuoteInputs(prev => ({
      ...prev,
      [leadId]: {
        ...(prev[leadId] || { basePrice: '', recommendedPrice: '', downpaymentPercent: 30 }),
        [field]: value
      }
    }));
  }

  async function fetchAllPartnersOverview() {
    setLoading(true);
    try {
      const { data } = await supabase.from('provider_inventory').select('*');
      if (data && Array.isArray(data)) setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllInstallersOverview() {
    try {
      const { data } = await supabase.from('installer_data_inventory').select('*');
      if (data && Array.isArray(data)) setInstallerInventory(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPartnerCargo(name) {
    if (!name) return;
    setLoading(true);
    try {
      const cleanName = name.trim();
      const { data, error } = await supabase
        .from('provider_inventory')
        .select('*')
        .ilike('provider_name', `%${cleanName}%`);

      if (error) throw error;
      setShipments(data || []);
    } catch (err) {
      console.error("Error fetching partner cargo:", err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstallerCargo(name) {
    if (!name) return;
    setLoading(true);
    try {
      const cleanName = name.trim();
      const { data, error } = await supabase
        .from('installer_data_inventory')
        .select('*')
        .ilike('installer_name', `%${cleanName}%`);

      if (error) throw error;
      setInstallerInventory(data || []);
    } catch (err) {
      console.error("Error fetching installer cargo:", err);
      setInstallerInventory([]);
    } finally {
      setLoading(false);
    }
  }

  function generateAndDownloadClientBroadcastPDF(lead) {
    let pdfData = {};
    try {
      pdfData = typeof lead.quote_pdf_data === 'string' ? JSON.parse(lead.quote_pdf_data) : (lead.quote_pdf_data || {});
    } catch (e) {
      pdfData = {};
    }

    const clientName = lead.customer_name || pdfData.full_name || 'Customer';
    const clientEmail = lead.customer_email || pdfData.corporate_email || 'N/A';
    const clientPhone = lead.customer_phone || pdfData.mobile_phone || 'N/A';
    const clientAddress = lead.address || pdfData.installation_address || 'N/A';
    const monthlyBill = lead.monthly_bill || pdfData.monthly_utility_bill || '0';
    const roofType = lead.roof_type || pdfData.roof_structure || 'N/A';
    const objective = lead.objective || pdfData.energy_objective || 'N/A';
    const projectDesc = lead.project_description || lead.notes || 'N/A';
    const txId = lead.id ? lead.id.split('-')[0].toUpperCase() : 'BROADCAST';
    
    const today = new Date();
    const currentDate = String(today.getDate()).padStart(2, '0') + '/' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                        today.getFullYear();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AZPHUR Solar Quotation Broadcast - ${clientName}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              padding: 20px; 
              margin: 0;
              color: #1e293b; 
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              padding: 24px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #0891b2; 
              padding-bottom: 18px; 
              margin-bottom: 24px; 
            }
            .header h1 { 
              color: #0891b2; 
              margin: 0 0 8px 0; 
              font-size: 22px; 
              letter-spacing: 0.5px;
            }
            .header p {
              margin: 0;
              font-size: 13px;
              color: #475569;
              line-height: 1.5;
            }
            .section { 
              margin-bottom: 18px; 
              font-size: 13px; 
              line-height: 1.6; 
              background: #f8fafc;
              padding: 12px 16px;
              border-radius: 8px;
              border-left: 4px solid #0891b2;
            }
            .label { 
              font-weight: 700; 
              color: #334155; 
              display: block;
              margin-bottom: 4px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .value {
              color: #0f172a;
              font-size: 14px;
              font-weight: 500;
            }
            .meta-date {
              text-align: right;
              font-size: 11px;
              color: #64748b;
              margin-bottom: 16px;
              font-family: monospace;
            }
            .footer { 
              margin-top: 30px; 
              font-size: 11px; 
              color: #64748b; 
              text-align: center; 
              border-top: 1px solid #e2e8f0; 
              padding-top: 16px; 
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AZPHUR INC</h1>
              <p>Shaping Sustainable Possibilities<br/><strong>SOLAR QUOTATION BROADCAST</strong></p>
            </div>
            
            <div class="meta-date">TX ID: <strong>${txId}</strong> | DATE: <strong>${currentDate}</strong></div>

            <div class="section">
              <span class="label">Full Name / Entity</span>
              <span class="value">${clientName}</span>
            </div>

            <div class="section">
              <span class="label">Corporate Email</span>
              <span class="value">${clientEmail}</span>
            </div>

            <div class="section">
              <span class="label">Mobile Phone</span>
              <span class="value">${clientPhone}</span>
            </div>

            <div class="section">
              <span class="label">Installation Address</span>
              <span class="value">${clientAddress}</span>
            </div>

            <div class="section">
              <span class="label">Monthly Utility Bill</span>
              <span class="value">â‚±${monthlyBill}</span>
            </div>

            <div class="section">
              <span class="label">Roof Structure</span>
              <span class="value">${roofType}</span>
            </div>

            <div class="section">
              <span class="label">Energy Objective</span>
              <span class="value">${objective}</span>
            </div>

            <div class="section">
              <span class="label">Project Description</span>
              <span class="value">${projectDesc}</span>
            </div>

            <div class="footer">
              <p>Notice: Official broadcasted document across the AZPHUR ecosystem.<br/>AZPHUR Distributed Network System.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AZPHUR_Broadcast_${clientName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleAcceptLead(leadId) {
    if (!window.confirm(`CONFIRM AVAILABILITY:\nExpress interest in handling this request as ${selectedEntityName}?`)) return;

    try {
      const leadObj = incomingLeads.find(l => l.id === leadId);
      const cleanName = selectedEntityName.trim();

      if (entityType === 'provider') {
        let currentAccepted = [];
        if (Array.isArray(leadObj?.partner_accepted_by)) {
          currentAccepted = [...leadObj.partner_accepted_by];
        } else if (typeof leadObj?.partner_accepted_by === 'string' && leadObj.partner_accepted_by.trim() !== '') {
          currentAccepted = [leadObj.partner_accepted_by];
        }
        
        if (!currentAccepted.some(name => name.toLowerCase().trim() === cleanName.toLowerCase())) {
          currentAccepted.push(cleanName);
        }

        setIncomingLeads(prevLeads => 
          prevLeads.map(l => l.id === leadId ? { ...l, partner_accepted_by: currentAccepted } : l)
        );

        const { error } = await supabase
          .from('leads')
          .update({ partner_accepted_by: currentAccepted })
          .eq('id', leadId);

        if (error) throw error;

      } else if (entityType === 'installer') {
        let currentAccepted = [];
        if (Array.isArray(leadObj?.installer_accepted_by)) {
          currentAccepted = [...leadObj.installer_accepted_by];
        } else if (typeof leadObj?.installer_accepted_by === 'string' && leadObj.installer_accepted_by.trim() !== '') {
          currentAccepted = [leadObj.installer_accepted_by];
        }
        
        if (!currentAccepted.some(name => name.toLowerCase().trim() === cleanName.toLowerCase())) {
          currentAccepted.push(cleanName);
        }

        setIncomingLeads(prevLeads => 
          prevLeads.map(l => l.id === leadId ? { ...l, installer_accepted_by: currentAccepted } : l)
        );

        const { error } = await supabase
          .from('leads')
          .update({ installer_accepted_by: currentAccepted })
          .eq('id', leadId);

        if (error) throw error;
      }

    } catch (err) {
      console.error("Error in lead acceptance:", err);
      alert("System error during acceptance: " + err.message);
    }
  }

  async function fetchIncomingLeads() {
    try {
      const cleanEntityName = (selectedEntityName || '').toLowerCase().replace(/[\s_-]/g, '').trim();

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) throw leadsError;
      if (!leadsData || !Array.isArray(leadsData)) {
        setIncomingLeads([]);
        return;
      }

      const [provRes, instRes] = await Promise.all([
        supabase.from('provider_proposals').select('*'),
        supabase.from('installer_proposals').select('*')
      ]);

      const allProviders = provRes.data || [];
      const allInstallers = instRes.data || [];

      const filteredLeads = leadsData
        .filter(lead => {
          if (isAdmin) return true;
          
          const assignedProv = (lead.assigned_provider || '').toLowerCase().replace(/[\s_-]/g, '').trim();
          const assignedInst = (lead.assigned_installer || '').toLowerCase().replace(/[\s_-]/g, '').trim();

          if (entityType === 'provider') {
            if (assignedProv && assignedProv !== cleanEntityName) {
              return false;
            }
          } else if (entityType === 'installer') {
            if (assignedInst && assignedInst !== cleanEntityName) {
              return false;
            }
          }

          return true;
        })
        .map(lead => {
          return {
            ...lead,
            provider_proposals: allProviders.filter(p => p.lead_id === lead.id),
            installer_proposals: allInstallers.filter(i => i.lead_id === lead.id)
          };
        });

      setIncomingLeads(filteredLeads);

    } catch (err) {
      console.error("Error fetching filtered leads:", err);
      setIncomingLeads([]);
    }
  }

  const handleOpenNotificationsModal = async () => {
    setShowNotificationsModal(true);
    if (typeof fetchIncomingLeads === 'function') {
      await fetchIncomingLeads();
    }
  };

  async function handleRejectLead(leadId) {
    if (!window.confirm("Are you sure you want to decline this request?")) return;

    try {
      const leadObj = incomingLeads.find(l => l.id === leadId);
      const cleanName = (selectedEntityName || '').trim();

      if (entityType === 'provider') {
        let currentRejected = [];
        if (Array.isArray(leadObj?.partner_rejected_by)) {
          currentRejected = [...leadObj.partner_rejected_by];
        } else if (typeof leadObj?.partner_rejected_by === 'string' && leadObj.partner_rejected_by.trim() !== '') {
          currentRejected = [leadObj.partner_rejected_by];
        }

        if (!currentRejected.some(name => name.toLowerCase().trim() === cleanName.toLowerCase())) {
          currentRejected.push(cleanName);
        }

        const { error } = await supabase
          .from('leads')
          .update({ partner_rejected_by: currentRejected })
          .eq('id', leadId);

        if (error) throw error;

      } else if (entityType === 'installer') {
        let currentRejected = [];
        if (Array.isArray(leadObj?.installer_rejected_by)) {
          currentRejected = [...leadObj.installer_rejected_by];
        } else if (typeof leadObj?.installer_rejected_by === 'string' && leadObj.installer_rejected_by.trim() !== '') {
          currentRejected = [leadObj.installer_rejected_by];
        }

        if (!currentRejected.some(name => name.toLowerCase().trim() === cleanName.toLowerCase())) {
          currentRejected.push(cleanName);
        }

        const { error } = await supabase
          .from('leads')
          .update({ installer_rejected_by: currentRejected })
          .eq('id', leadId);

        if (error) throw error;
      }

      await fetchIncomingLeads();
      alert("Request declined successfully for this profile.");

    } catch (err) {
      console.error("Error rejecting lead:", err);
      alert("Error during decline: " + err.message);
    }
  }

  async function handleProviderQuantityChange(id, delta) {
    const updated = shipments.map(s => s.id === id ? { ...s, quantity: Math.max(0, Number(s.quantity || 0) + delta) } : s);
    setShipments(updated);
    const target = updated.find(s => s.id === id);
    if (target) await supabase.from('provider_inventory').update({ quantity: target.quantity }).eq('id', id);
  }

  async function handleProviderPriceChange(id, currentPrice) {
    const newPriceInput = prompt(`CURRENT PRICE: â‚±${currentPrice}\nEnter new price:`, currentPrice);
    if (newPriceInput === null) return;
    const parsedPrice = parseFloat(newPriceInput);
    if (isNaN(parsedPrice) || parsedPrice < 0) return alert("Invalid price.");

    const updated = shipments.map(s => s.id === id ? { ...s, price: parsedPrice } : s);
    setShipments(updated);
    await supabase.from('provider_inventory').update({ price: parsedPrice }).eq('id', id);
    alert("Price updated successfully!");
  }

  async function handleDeleteProviderItem(id, name) {
    if (!window.confirm(`Delete "${name}" from inventory?`)) return;
    const { error } = await supabase.from('provider_inventory').delete().eq('id', id);
    if (!error) fetchPartnerCargo(selectedEntityName);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!formSku || !formName || !formPrice) return alert("Fill required fields.");

    setSavingItem(true);
    const payload = {
      id: formSku,
      provider_name: selectedEntityName,
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      quantity: parseInt(formQuantity || 0, 10),
      image_url: formImage || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=200',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('provider_inventory').upsert(payload);
    setSavingItem(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setFormSku(''); setFormName(''); setFormPrice(''); setFormQuantity(''); setFormImage('');
      fetchPartnerCargo(selectedEntityName);
      alert("Product saved successfully!");
    }
  }

  async function handleInstallerQuantityChange(id, delta) {
    const updated = installerInventory.map(i => i.id === id ? { ...i, quantity: Math.max(0, Number(i.quantity || 0) + delta) } : i);
    setInstallerInventory(updated);
    const target = updated.find(i => i.id === id);
    if (target) await supabase.from('installer_data_inventory').update({ quantity: target.quantity }).eq('id', id);
  }

  async function handleInstallerPriceChange(id, currentPrice) {
    const newPriceInput = prompt(`CURRENT PRICE: â‚±${currentPrice}\nEnter new price:`, currentPrice);
    if (newPriceInput === null) return;
    const parsedPrice = parseFloat(newPriceInput);
    if (isNaN(parsedPrice) || parsedPrice < 0) return alert("Invalid price.");

    const updated = installerInventory.map(i => i.id === id ? { ...i, price: parsedPrice } : i);
    setInstallerInventory(updated);
    await supabase.from('installer_data_inventory').update({ price: parsedPrice }).eq('id', id);
    alert("Price updated successfully!");
  }

  async function handleDeleteInstallerItem(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.from('installer_data_inventory').delete().eq('id', id);
    if (!error) fetchInstallerCargo(selectedEntityName);
  }

  async function handleSaveInstallerItem(e) {
    e.preventDefault();
    if (!instFormSku || !instFormName || !instFormPrice) return alert("Fill required fields.");

    setSavingInstItem(true);
    const payload = {
      id: instFormSku,
      installer_name: selectedEntityName,
      item_name: instFormName,
      category: instFormCategory,
      price: parseFloat(instFormPrice),
      quantity: parseInt(instFormQuantity || 0, 10),
      description: instFormDescription || 'Professional solar installation service.'
    };

    const { error } = await supabase.from('installer_data_inventory').upsert(payload);
    setSavingInstItem(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setInstFormSku(''); setInstFormName(''); setInstFormPrice(''); setInstFormQuantity(''); setInstFormDescription('');
      fetchInstallerCargo(selectedEntityName);
      alert("Service saved successfully!");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (!mounted) return null;
  if (checkingAuth) return <div style={{ background: '#fdfbf7', minHeight: '100vh', fontFamily: 'monospace', padding: '40px', color: '#0891b2' }}>VERIFYING_SECURE_UPLINK...</div>;

 const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().trim();

  const newIncomingLeadsCount = incomingLeads.filter(lead => {
    // Escludiamo subito i lead già assegnati o scelti
    const assignedEntity = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;
    if ((assignedEntity || '').toLowerCase().trim() === cleanCurrentEntity) {
      return false;
    }

    const rejectedList = entityType === 'provider' 
      ? (Array.isArray(lead.partner_rejected_by) ? lead.partner_rejected_by : (lead.partner_rejected_by ? [lead.partner_rejected_by] : []))
      : (Array.isArray(lead.installer_rejected_by) ? lead.installer_rejected_by : (lead.installer_rejected_by ? [lead.installer_rejected_by] : []));
    
    const isRejectedByMe = rejectedList.some(item => {
      let itemName = typeof item === 'string' ? item : JSON.stringify(item);
      return itemName.replace(/[\[\]"]/g, '').toLowerCase().trim() === cleanCurrentEntity;
    });
    if (isRejectedByMe) return false;

    const myProposal = entityType === 'provider'
      ? (lead.provider_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity)
      : (lead.installer_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity);

    // Soglia > 100 per ignorare il vecchio "3" di test e sbloccare l'input
    const hasThisEntitySubmitted = Boolean(
      myProposal && 
      (Number(myProposal.base_price) > 100 || Number(myProposal.labor_cost) > 100)
    );
    if (hasThisEntitySubmitted) return false;

    const acceptedList = entityType === 'provider' 
      ? (Array.isArray(lead.partner_accepted_by) ? lead.partner_accepted_by : (lead.partner_accepted_by ? [lead.partner_accepted_by] : []))
      : (Array.isArray(lead.installer_accepted_by) ? lead.installer_accepted_by : (lead.installer_accepted_by ? [lead.installer_accepted_by] : []));
    
    const isAcceptedByMe = acceptedList.some(item => {
      let itemName = typeof item === 'string' ? item : JSON.stringify(item);
      return itemName.replace(/[\[\]"]/g, '').toLowerCase().trim() === cleanCurrentEntity;
    });

    return !isAcceptedByMe;
  }).length;

 const pendingAcceptedLeadsList = incomingLeads.filter(lead => {
    const assignedEntity = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;
    
    if (assignedEntity && assignedEntity.toLowerCase().replace(/[\s_-]/g, '').trim() !== cleanCurrentEntity) {
      return false;
    }

    const acceptedList = entityType === 'provider' 
      ? (Array.isArray(lead.partner_accepted_by) ? lead.partner_accepted_by : (lead.partner_accepted_by ? [lead.partner_accepted_by] : []))
      : (Array.isArray(lead.installer_accepted_by) ? lead.installer_accepted_by : (lead.installer_accepted_by ? [lead.installer_accepted_by] : []));
    
    const isAcceptedByMe = acceptedList.some(item => {
      let itemName = typeof item === 'string' ? item : JSON.stringify(item);
      return itemName.replace(/[\[\]"]/g, '').toLowerCase().trim() === cleanCurrentEntity;
    });

    if (!isAcceptedByMe) return false;

    const myProposal = entityType === 'provider'
      ? (lead.provider_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity)
      : (lead.installer_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity);

    // FIX: Usiamo la stessa soglia pulita (> 100) ed eliminiamo il >= 0 sulla manodopera
    const hasThisEntitySubmitted = Boolean(
      myProposal && 
      (Number(myProposal.base_price) > 100 || Number(myProposal.labor_cost) > 100)
    );
    
    return !hasThisEntitySubmitted;
  });

return (
    <div className="partner-canvas">
      <style jsx global>{`
        html, body { background: linear-gradient(135deg, #fdfbf7 0%, #f0fdfa 50%, #e0f2fe 100%) !important; background-attachment: fixed !important; margin: 0; padding: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .partner-canvas { background: linear-gradient(135deg, #fdfbf7 0%, #f0fdfa 50%, #e0f2fe 100%) !important; min-height: 100vh; color: #1e293b; box-sizing: border-box; }
        .nav-partner { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
        .main-logo { height: 28px; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(34,211,238,0.2)); max-width: 140px; }
        .btn-back { font-size: 10px; font-weight: 900; color: #0891b2; text-decoration: none; letter-spacing: 1px; border: 2px solid #22d3ee; padding: 6px 12px; border-radius: 8px; background: #fff; box-shadow: 0 4px 12px rgba(34,211,238,0.1); white-space: nowrap; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 15px 60px; box-sizing: border-box; width: 100%; }
        .auth-card { max-width: 450px; width: 100%; margin: 30px auto; background: #fff; padding: 25px 15px; border-radius: 16px; border: 3px solid #22d3ee; box-shadow: 0 15px 35px rgba(34, 211, 238, 0.15); text-align: center; box-sizing: border-box; }
        .phase-label { font-size: 9px; font-weight: 900; color: #0891b2; letter-spacing: 1.5px; margin-bottom: 8px; display: block; text-transform: uppercase; }
        .title-cyan { color: #0e7490; font-weight: 900; font-size: 18px; margin-bottom: 20px; word-break: break-word; }
        .notification-banner { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: #fff; padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; box-shadow: 0 8px 20px rgba(8,145,178,0.2); box-sizing: border-box; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 10px; box-sizing: border-box; }
        
        @media (max-width: 768px) {
          .nav-partner { padding: 12px 15px; }
          .main-logo { height: 24px; }
          .container { padding: 0 10px 40px; }
          .auth-card { margin: 20px auto; padding: 20px 12px; }
          .notification-banner { padding: 12px; }
        }
      `}</style>

      <nav className="nav-partner">
        <img src="/logo-azphur.avif" alt="AZPHUR" className="main-logo" onClick={() => window.location.href='/'} />
        <Link href="/" className="btn-back">← BACK TO HQ</Link>
      </nav>

      <div className="container">
        {authError ? (
          <div className="auth-card">
            <span className="phase-label">SECURITY ALERT</span>
            <h2 className="title-cyan">UNAUTHORIZED ACCESS</h2>
            <p style={{fontSize: '12px', color: '#4a5568', marginBottom: '25px', fontFamily: 'monospace', wordBreak: 'break-word'}}>{authError}</p>
            <Link href="/" className="btn-back">RETURN TO HOME</Link>
          </div>
        ) : (!selectedEntityName && !isAdmin) ? (
          <div className="auth-card">
            <span className="phase-label">NODE AUTHENTICATION</span>
            <h2 className="title-cyan">VERIFYING WHITELIST...</h2>
          </div>
        ) : (
          <div className="dashboard-content">
            
         {!isAdmin && (
              <div className="notification-banner">
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1}}>
                    <span style={{fontSize: '22px', flexShrink: 0}}>🔔</span>
                    <div style={{minWidth: 0}}>
                      <strong style={{fontSize: '12px', display: 'block', wordBreak: 'break-word'}}>Client Request Pool & Independent Hub</strong>
                      
                      <div style={{display: 'flex', gap: '10px', marginTop: '6px', fontSize: '10px', fontFamily: 'monospace', flexWrap: 'wrap'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '6px'}}>
                          <span className="flicker-dot" style={{background: '#22c55e'}}></span>
                          <strong style={{color: '#86efac'}}>{newIncomingLeadsCount}</strong> lead in arrivo
                        </span>

                        <span style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '6px'}}>
                          <span className="flicker-dot" style={{background: '#facc15'}}></span>
                          <strong style={{color: '#fde047'}}>{pendingAcceptedLeadsList.filter(lead => {
                            const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().replace(/[\s_-]/g, '').trim();
                            const assignedEntity = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;
                            if (assignedEntity && assignedEntity.toLowerCase().replace(/[\s_-]/g, '').trim() !== cleanCurrentEntity) {
                              return false;
                            }
                            return true;
                          }).length}</strong> lead in pending
                        </span>
                      </div>
                    </div>
                  </div>

               <button 
  type="button"
  onClick={async (e) => {
    e.preventDefault();
    // 1. Apri subito la modale all'istante
    setShowNotificationsModal(true);
    
    // 2. Carica i dati in sottofondo senza bloccare l'apertura
    if (typeof fetchIncomingLeads === 'function') {
      fetchIncomingLeads();
    }
  }} 
  style={{
    background: '#fff', 
    color: '#0891b2', 
    border: 'none', 
    padding: '8px 14px', 
    borderRadius: '8px', 
    fontWeight: 900, 
    fontSize: '10px', 
    cursor: 'pointer', 
    whiteSpace: 'nowrap',
    zIndex: 10,
    position: 'relative',
    width: '100%',
    maxWidth: 'none',
    textAlign: 'center'
  }}
>
  VIEW INCOMING LEADS POOL
</button>
                </div>
              </div>
            )}

         {!isAdmin && (
  <div style={{marginBottom: '40px', boxSizing: 'border-box', width: '100%'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '8px'}}>
      <h3 style={{fontSize: '15px', color: '#0e7490', margin: 0, wordBreak: 'break-word'}}>
        💷 Active Client Quotations & Payments Hub
      </h3>
      <span style={{fontSize: '10px', color: '#64748b', fontFamily: 'monospace'}}>
        Clients who have officially selected you
      </span>
    </div>

    {incomingLeads.filter(lead => {
      const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().trim();
      const assignedEntity = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;
      return (assignedEntity || '').toLowerCase().trim() === cleanCurrentEntity;
    }).length === 0 ? (
      <div style={{background: '#fff', border: '1px dashed #bae6fd', padding: '20px 15px', borderRadius: '12px', textAlign: 'center', boxSizing: 'border-box'}}>
        <p style={{fontSize: '11px', color: '#64748b', fontFamily: 'monospace', margin: 0, lineHeight: '1.5'}}>
          No officially assigned clients yet. Once a client selects you from their dashboard, their quotation and escrow payment hub will appear here automatically.
        </p>
      </div>
    ) : (
      incomingLeads
        .filter(lead => {
          const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().trim();
          const assignedEntity = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;
          return (assignedEntity || '').toLowerCase().trim() === cleanCurrentEntity;
        })
        .map(lead => {
          let existingQuoteData = {};
          try {
            existingQuoteData = lead.quote_pdf_data ? JSON.parse(lead.quote_pdf_data) : {};
          } catch (e) {
            existingQuoteData = {};
          }

          const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().trim();
          
          const myProposal = entityType === 'provider'
            ? (lead.provider_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity)
            : (lead.installer_proposals || []).find(p => (p.entity_name || '').toLowerCase().trim() === cleanCurrentEntity);

          const currentInput = quoteInputs[lead.id] || {};
          
          const rawDbPrice = myProposal?.base_price;
          const validDbPrice = Number(rawDbPrice) > 10 ? rawDbPrice : '';

          const inputState = {
            basePrice: currentInput.basePrice !== undefined ? currentInput.basePrice : validDbPrice,
            recommendedPrice: currentInput.recommendedPrice ?? myProposal?.recommended_price ?? '',
            downpaymentPercent: currentInput.downpaymentPercent ?? 30,
            panelModel: currentInput.panelModel ?? myProposal?.panel_model ?? '',
            inverterBattery: currentInput.inverterBattery ?? myProposal?.inverter_battery ?? '',
            installPeriod: currentInput.installPeriod ?? myProposal?.install_period ?? '',
            workmanshipTerms: currentInput.workmanshipTerms ?? myProposal?.workmanship_terms ?? '',
            laborCost: currentInput.laborCost !== undefined ? currentInput.laborCost : (myProposal?.labor_cost ?? '')
          };

          const hasThisEntitySubmitted = Boolean(myProposal && Number(myProposal.base_price || myProposal.labor_cost || 0) > 0);
          
          const isDbUnlocked = entityType === 'provider' ? lead.provider_balance_unlocked : lead.installer_balance_unlocked;
          const isManuallyUnlocked = Boolean(unlockedLeads[`${lead.id}_${cleanCurrentEntity}`] ?? isDbUnlocked);

          const customerName = lead.customer_name || lead.full_name || lead.quote_details?.full_name || 'Valued Customer';
          const customerEmail = lead.customer_email || lead.email || lead.quote_details?.email || 'N/A';
          const customerAddress = lead.address || lead.installation_address || lead.quote_details?.address || 'N/A';
          const customerBill = lead.monthly_bill || lead.quote_details?.monthly_bill || lead.average_monthly_bill || '0';
          const roofType = lead.roof_type || lead.quote_details?.roof_type || '';

          const isProvider = entityType === 'provider';
          const downpayment = isProvider ? (lead.provider_downpayment || 0) : (lead.installer_downpayment || 0);
          const balance = isProvider ? (lead.provider_balance || 0) : (lead.installer_balance || 0);
          const isPaidInitial = isProvider ? lead.provider_paid : lead.installer_paid;
          const isPaidBalance = isProvider ? lead.provider_balance_paid : lead.installer_balance_paid;

          const baseNumeric = Number(inputState.basePrice || 0);
          const totalWithVat = baseNumeric * 1.12;
          const dpPercent = Number(inputState.downpaymentPercent || 30);
          const calculatedDownpayment = (totalWithVat * dpPercent) / 100;
          const calculatedBalance = totalWithVat - calculatedDownpayment;

          const isPriceLocked = Boolean(hasThisEntitySubmitted) || Boolean(isPaidInitial);

          const handleToggleBalanceUnlock = async (leadId, shouldUnlock) => {
            setUnlockedLeads(prev => ({ ...prev, [`${leadId}_${cleanCurrentEntity}`]: shouldUnlock }));
            try {
              const unlockColumn = entityType === 'provider' ? 'provider_balance_unlocked' : 'installer_balance_unlocked';
              const { error } = await supabase
                .from('leads')
                .update({ [unlockColumn]: shouldUnlock })
                .eq('id', leadId);

              if (error) {
                console.error('Errore aggiornamento sblocco:', error);
              } else if (typeof fetchIncomingLeads === 'function') {
                await fetchIncomingLeads();
              }
            } catch (err) {
              console.error('Errore di rete:', err);
            }
          };

          return (
            <div key={lead.id} className="lead-card" style={{ background: '#fff', border: '2px solid #22d3ee', padding: '15px', borderRadius: '16px', marginBottom: '15px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', width: '100%' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#0891b2' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '8px', flexWrap: 'wrap', gap: '5px' }}>
                <span style={{ fontSize: '10px', color: '#0891b2', fontWeight: 900, fontFamily: 'monospace' }}>TX REF: {lead.id?.split('-')[0].toUpperCase()}</span>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '8px', fontWeight: 900 }}>OFFICIALLY SELECTED</span>
              </div>

              <div style={{ paddingLeft: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0e7490', wordBreak: 'break-word', flex: 1, minWidth: '150px' }}>{customerName}</h4>
                  <span style={{ background: hasThisEntitySubmitted ? '#e0f2fe' : '#dcfce7', color: hasThisEntitySubmitted ? '#0369a1' : '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {hasThisEntitySubmitted ? 'LOCKED' : 'NEW'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px', lineHeight: '1.6', wordBreak: 'break-word' }}>
                  Email: <strong>{customerEmail}</strong><br/>
                  Monthly Bill: <strong>₱{Number(customerBill).toLocaleString()}</strong> | Roof Type: <strong>{roofType || 'N/A'}</strong>
                </div>

                <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: 700, fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  📍 INSTALLATION ADDRESS: {customerAddress}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginBottom: '15px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#0284c7', letterSpacing: '0.5px', marginBottom: '10px', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  GENERATE_OFFICIAL_QUOTE (12% VAT INCLUDED)
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input 
                    type="number" 
                    placeholder="Base Price (PHP)" 
                    value={inputState.basePrice} 
                    onChange={e => handleQuoteInputChange(lead.id, 'basePrice', e.target.value)}
                    disabled={isPriceLocked}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      fontSize: '12px', 
                      background: isPriceLocked ? '#f1f5f9' : '#fff', 
                      boxSizing: 'border-box', 
                      fontFamily: 'monospace',
                      cursor: isPriceLocked ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                {hasThisEntitySubmitted && (
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#0369a1', marginBottom: '10px', fontFamily: 'monospace' }}>
                    🔒 YOUR QUOTE LOCKED (PRICE FIXED)
                  </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#334155', fontFamily: 'monospace' }}>INITIAL_DOWN_PAYMENT:</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>{dpPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={dpPercent} 
                    onChange={e => handleQuoteInputChange(lead.id, 'downpaymentPercent', Number(e.target.value))}
                    disabled={isPriceLocked}
                    style={{ 
                      width: '100%', 
                      accentColor: '#0284c7', 
                      cursor: isPriceLocked ? 'not-allowed' : 'pointer' 
                    }}
                  />
                </div>

                <button 
                  onClick={() => {
                    if (isPriceLocked) return;
                    saveDetailedQuotation(lead.id, entityType);
                  }}
                  disabled={isPriceLocked}
                  style={{ 
                    width: '100%', 
                    background: isPriceLocked ? '#cbd5e1' : '#0ea5e9', 
                    color: isPriceLocked ? '#64748b' : '#fff', 
                    border: 'none', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontWeight: 900, 
                    fontSize: '11px', 
                    cursor: isPriceLocked ? 'not-allowed' : 'pointer', 
                    fontFamily: 'monospace', 
                    letterSpacing: '0.5px', 
                    boxShadow: isPriceLocked ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.2)',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                >
                  {isPaidInitial ? 'LOCKED (DEPOSIT PAID)' : (hasThisEntitySubmitted ? 'QUOTE LOCKED' : 'EMIT_QUOTE_V2')}
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', marginBottom: '15px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#0284c7', letterSpacing: '0.5px', marginBottom: '10px', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  FORCE INSTALLATION GATEWAY & ESCROW
                </div>
                
                <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', marginBottom: '12px', wordBreak: 'break-word', lineHeight: '1.5' }}>
                  DEPOSIT: ₱{Number(calculatedDownpayment || downpayment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} | BALANCE: ₱{Number(calculatedBalance || balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', sm: {flexDirection: 'row'}, fontSize: '10px', color: '#475569', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ width: '100%', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Initial Tranche:</span>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: isPaidInitial ? '#dcfce7' : '#fee2e2', color: isPaidInitial ? '#166534' : '#991b1b', fontWeight: 900, textAlign: 'center' }}>
                      {isPaidInitial ? '✓ Paid' : '⏳ Pending Deposit'}
                    </span>
                  </div>
                  <div style={{ width: '100%', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Final Tranche:</span>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: isPaidBalance ? '#dcfce7' : '#fee2e2', color: isPaidBalance ? '#166534' : '#991b1b', fontWeight: 900, textAlign: 'center' }}>
                      {isPaidBalance ? '✓ Paid' : '⏳ Pending Balance'}
                    </span>
                  </div>
                </div>

                {(hasThisEntitySubmitted || isPaidInitial) && (
                  <div style={{ marginTop: '15px' }}>
                    {!isManuallyUnlocked ? (
                      <button 
                        onClick={() => handleToggleBalanceUnlock(lead.id, true)}
                        style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 900, fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.5px', boxSizing: 'border-box' }}
                      >
                        UNLOCK FINAL TRANCHE / BALANCE
                      </button>
                    ) : (
                      <div style={{ background: '#e0f2fe', border: '1px solid #0284c7', padding: '10px', borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#0369a1', fontFamily: 'monospace', display: 'block', marginBottom: '6px', wordBreak: 'break-word' }}>
                          🔓 FINAL TRANCHE UNLOCKED FOR CUSTOMER
                        </span>
                        <button 
                          onClick={() => handleToggleBalanceUnlock(lead.id, false)}
                          style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 900, fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace' }}
                        >
                          LOCK AGAIN
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {isPaidBalance && (
                  <div style={{ marginTop: '12px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetId = lead.id;
                        if (typeof handleDeleteLead === 'function') {
                          handleDeleteLead(targetId);
                        } else if (typeof handleProviderDeleteLead === 'function') {
                          handleProviderDeleteLead(targetId);
                        } else {
                          console.error("Nessuna funzione di eliminazione trovata nello scope!");
                          alert("DELETE_ERROR: Funzione di eliminazione non definita.");
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        background: '#fee2e2', 
                        color: '#991b1b', 
                        border: 'none', 
                        padding: '10px', 
                        borderRadius: '6px', 
                        fontWeight: 900, 
                        fontSize: '10px', 
                        cursor: 'pointer', 
                        fontFamily: 'monospace',
                        position: 'relative',
                        zIndex: 10,
                        pointerEvents: 'auto',
                        boxSizing: 'border-box'
                      }}
                    >
                      DELETE COMPLETED RECORD
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
    )}
  </div>
)}
            
            
            {(entityType === 'provider' || isAdmin) && (
              <div style={{marginBottom: '40px', boxSizing: 'border-box', width: '100%'}}>
                <h3 style={{fontSize: '15px', color: '#0e7490', marginBottom: '15px', wordBreak: 'break-word'}}>
                  {isAdmin ? 'Global Hardware Provider Inventory' : `Hardware Catalog for ${selectedEntityName}`}
                </h3>
                
                {entityType === 'provider' && (
                  <div style={{background: '#fff', border: '3px solid #22d3ee', borderRadius: '16px', padding: '15px', marginBottom: '25px', boxSizing: 'border-box', width: '100%'}}>
                    <span className="phase-label">ADD / UPDATE HARDWARE ITEM</span>
                    <form onSubmit={handleSaveProduct}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px'}}>
                        <input type="text" placeholder="SKU ID (e.g. AZ-PANEL-01)" value={formSku} onChange={e => setFormSku(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <input type="text" placeholder="Product Name" value={formName} onChange={e => setFormName(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={{padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', background: '#fff', width: '100%', boxSizing: 'border-box'}}>
                          <option value="SOLAR">Solar Modules / Panels</option>
                          <option value="STORAGE_BATTERIES">Storage Batteries</option>
                          <option value="INVERTERS">Inverter / Micro-inverter</option>
                          <option value="EV">EV Charger</option>
                        </select>
                        <input type="number" step="0.01" placeholder="Price (₱)" value={formPrice} onChange={e => setFormPrice(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <input type="number" placeholder="Quantity" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                      </div>
                      <button type="submit" disabled={savingItem} style={{marginTop: '15px', background: '#0891b2', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '10px', cursor: 'pointer', width: '100%', boxSizing: 'border-box'}}>
                        {savingItem ? 'SAVING...' : 'PUBLISH TO INVENTORY'}
                      </button>
                    </form>
                  </div>
                )}

                {shipments.length === 0 ? (
                  <p style={{fontSize: '11px', color: '#64748b', fontFamily: 'monospace'}}>No hardware items found in database for this node.</p>
                ) : (
                  shipments.map(s => (
                    <div key={s.id} className="inventory-item-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '10px', flexWrap: 'wrap', gap: '10px', boxSizing: 'border-box', width: '100%'}}>
                      <div style={{minWidth: 0, flex: 1}}>
                        <strong style={{wordBreak: 'break-word'}}>{s.name}</strong> <span style={{fontSize: '11px', color: '#64748b', wordBreak: 'break-word'}}>({s.provider_name})</span>
                        <div style={{fontSize: '10px', color: '#0891b2', fontFamily: 'monospace', marginTop: '3px', wordBreak: 'break-word'}}>SKU: {s.id} | Category: {s.category || 'SOLAR'} | Price: <strong>₱{s.price}</strong></div>
                      </div>
                      <div className="inventory-actions" style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>
                        <span style={{fontSize: '11px', whiteSpace: 'nowrap'}}>Qty: <strong>{s.quantity}</strong></span>
                        {entityType === 'provider' && (
                          <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap'}}>
                            <button onClick={() => handleProviderQuantityChange(s.id, -1)} style={{padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #bae6fd', background: '#fff'}}>-</button>
                            <button onClick={() => handleProviderQuantityChange(s.id, 1)} style={{padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #bae6fd', background: '#fff'}}>+</button>
                            <button onClick={() => handleProviderPriceChange(s.id, s.price)} style={{fontSize: '9px', padding: '8px 10px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap'}}>Edit Price</button>
                            <button onClick={() => handleDeleteProviderItem(s.id, s.name)} className="btn-delete" style={{fontSize: '9px', padding: '8px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap'}}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {(entityType === 'installer' || isAdmin) && (
              <div style={{marginBottom: '40px', boxSizing: 'border-box', width: '100%'}}>
                <h3 style={{fontSize: '15px', color: '#0e7490', marginBottom: '15px', wordBreak: 'break-word'}}>
                  {isAdmin ? 'Global Installer Labor Catalog' : `Installer Services Catalog for ${selectedEntityName}`}
                </h3>

                {entityType === 'installer' && (
                  <div style={{background: '#fff', border: '3px solid #10b981', borderRadius: '16px', padding: '15px', marginBottom: '25px', boxSizing: 'border-box', width: '100%'}}>
                    <span className="phase-label" style={{color: '#10b981'}}>ADD / UPDATE INSTALLATION SERVICE</span>
                    <form onSubmit={handleSaveInstallerItem}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px'}}>
                        <input type="text" placeholder="Item Code (e.g. LAB-01)" value={instFormSku} onChange={e => setInstFormSku(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <input type="text" placeholder="Service Name" value={instFormName} onChange={e => setInstFormName(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <select value={instFormCategory} onChange={e => setInstFormCategory(e.target.value)} style={{padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', background: '#fff', width: '100%', boxSizing: 'border-box'}}>
                          <option value="TECHNICAL_SURVEY">Technical Survey Inspection</option>
                          <option value="ROOF_LABOR">Roof Mounting Labor</option>
                          <option value="ELECTRICAL_LABOR">Electrical Wiring Labor</option>
                        </select>
                        <input type="number" step="0.01" placeholder="Fee (₱)" value={instFormPrice} onChange={e => setInstFormPrice(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                        <input type="number" placeholder="Capacity / Slots" value={instFormQuantity} onChange={e => setInstFormQuantity(e.target.value)} required style={{padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', width: '100%', boxSizing: 'border-box'}} />
                      </div>
                      <input type="text" placeholder="Description..." value={instFormDescription} onChange={e => setInstFormDescription(e.target.value)} style={{width: '100%', marginTop: '12px', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', boxSizing: 'border-box'}} />
                      <button type="submit" disabled={savingInstItem} style={{marginTop: '15px', background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '10px', cursor: 'pointer', width: '100%', boxSizing: 'border-box'}}>
                        {savingInstItem ? 'SAVING...' : 'PUBLISH SERVICE'}
                      </button>
                    </form>
                  </div>
                )}

                {installerInventory.length === 0 ? (
                  <p style={{fontSize: '11px', color: '#64748b', fontFamily: 'monospace'}}>No service items found in database for this node.</p>
                ) : (
                  installerInventory.map(item => (
                    <div key={item.id} className="inventory-item-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '10px', flexWrap: 'wrap', gap: '10px', boxSizing: 'border-box', width: '100%'}}>
                      <div style={{minWidth: 0, flex: 1}}>
                        <strong style={{wordBreak: 'break-word'}}>{item.item_name}</strong> <span style={{fontSize: '11px', color: '#64748b', wordBreak: 'break-word'}}>({item.installer_name})</span>
                        <div style={{fontSize: '10px', color: '#10b981', fontFamily: 'monospace', marginTop: '3px', wordBreak: 'break-word'}}>Code: {item.id} | Price: <strong>₱{item.price}</strong></div>
                      </div>
                      <div className="inventory-actions" style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>
                        <span style={{fontSize: '11px', whiteSpace: 'nowrap'}}>Slots: <strong>{item.quantity}</strong></span>
                        {entityType === 'installer' && (
                          <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap'}}>
                            <button onClick={() => handleInstallerQuantityChange(item.id, -1)} style={{padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #a7f3d0', background: '#fff'}}>-</button>
                            <button onClick={() => handleInstallerQuantityChange(item.id, 1)} style={{padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #a7f3d0', background: '#fff'}}>+</button>
                            <button onClick={() => handleInstallerPriceChange(item.id, item.price)} style={{fontSize: '9px', padding: '8px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap'}}>Edit Price</button>
                            <button onClick={() => handleDeleteInstallerItem(item.id, item.item_name)} className="btn-delete" style={{fontSize: '9px', padding: '8px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap'}}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </div>



 {showNotificationsModal && (
  <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, boxSizing: 'border-box', padding: '15px' }}>
    <div className="modal-content" style={{ maxWidth: '650px', width: '95%', background: '#fff', padding: '20px', borderRadius: '16px', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>
      
      {/* Intestazione fissa del Modale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '15px', color: '#0e7490', margin: 0, fontWeight: 900, fontFamily: 'monospace' }}>📋 INCOMING CUSTOMER LEADS POOL</h3>
        <button 
          onClick={() => setShowNotificationsModal(false)}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
        >
          ✕ Close
        </button>
      </div>

      {/* Controllo e mapping dei lead */}
      {(!incomingLeads || incomingLeads.length === 0) ? (
        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '20px' }}>
          No customer leads found in network pool.
        </p>
      ) : (
        incomingLeads.map(lead => {
          if (!lead) return null;

          const cleanCurrentEntity = (selectedEntityName || '').toLowerCase().replace(/[\s_-]/g, '').trim();
          const assignedEntityForThisRole = entityType === 'provider' ? lead.assigned_provider : lead.assigned_installer;

          if (assignedEntityForThisRole && assignedEntityForThisRole.toLowerCase().replace(/[\s_-]/g, '').trim() !== cleanCurrentEntity) {
            return null;
          }

          let pdfData = {};
          try {
            pdfData = typeof lead.quote_pdf_data === 'string' ? JSON.parse(lead.quote_pdf_data) : (lead.quote_pdf_data || {});
          } catch (e) {
            pdfData = {};
          }

          const customerName = lead.customer_name || lead.full_name || pdfData.full_name || pdfData.entity_name || lead.quote_details?.full_name || 'Valued Customer';
          const customerEmail = lead.customer_email || lead.email || pdfData.email || pdfData.corporate_email || lead.quote_details?.email || 'N/A';
          
          const rawBill = lead.monthly_bill || pdfData.monthly_bill || pdfData.monthly_utility_bill || lead.quote_details?.monthly_bill || lead.average_monthly_bill || '0';
          const cleanBillNumber = String(rawBill).replace(/[^0-9.]/g, '');
          const customerBill = Number(cleanBillNumber) || 0;

          const customerAddress = lead.address || lead.installation_address || pdfData.address || pdfData.installation_address || lead.quote_details?.address || 'N/A';
          const roofType = lead.roof_type || lead.roof_structure || pdfData.roof_type || pdfData.roof_structure || lead.quote_details?.roof_type || 'N/A';
          const projectDesc = lead.project_description || pdfData.project_description || lead.notes || 'N/A';
          const energyObjective = lead.objective || pdfData.energy_objective || 'N/A';
          
          const rawAcceptedList = entityType === 'provider' ? lead.partner_accepted_by : lead.installer_accepted_by;
          let acceptedList = [];
          try {
            if (Array.isArray(rawAcceptedList)) {
              acceptedList = rawAcceptedList;
            } else if (typeof rawAcceptedList === 'string') {
              acceptedList = rawAcceptedList.startsWith('[') ? JSON.parse(rawAcceptedList) : [rawAcceptedList];
            } else if (rawAcceptedList) {
              acceptedList = [rawAcceptedList];
            }
          } catch (e) {
            acceptedList = rawAcceptedList ? [String(rawAcceptedList)] : [];
          }

          const isCurrentEntityAccepted = acceptedList.some(item => {
            let itemName = typeof item === 'string' ? item : JSON.stringify(item);
            let cleanItem = itemName.replace(/[\[\]"]/g, '').toLowerCase().replace(/[\s_-]/g, '').trim();
            return cleanItem === cleanCurrentEntity;
          });

          const proposalsArray = entityType === 'provider' ? (lead.provider_proposals || []) : (lead.installer_proposals || []);
          const myProposal = proposalsArray.find(p => {
            const propName = (p.entity_name || p.provider_name || p.installer_name || p.name || '').toLowerCase().replace(/[\s_-]/g, '').trim();
            return propName === cleanCurrentEntity;
          });

          const isProposalSaved = Boolean(
            myProposal && 
            (
              String(myProposal.panel_model || '').trim() !== '' ||
              String(myProposal.install_period || '').trim() !== '' ||
              Number(myProposal.base_price || 0) > 0 || 
              Number(myProposal.labor_cost || 0) > 0 || 
              Number(myProposal.recommended_price || 0) > 0
            )
          );

          const currentInput = quoteInputs[lead.id] || {};
          const inputState = {
            panelModel: currentInput.panelModel ?? myProposal?.panel_model ?? '',
            inverterBattery: currentInput.inverterBattery ?? myProposal?.inverter_battery ?? '',
            basePrice: currentInput.basePrice ?? myProposal?.base_price ?? '',
            recommendedPrice: currentInput.recommendedPrice ?? myProposal?.recommended_price ?? '',
            installPeriod: currentInput.installPeriod ?? myProposal?.install_period ?? '',
            workmanshipTerms: currentInput.workmanshipTerms ?? myProposal?.workmanship_terms ?? 'Standard Terms',
            laborCost: currentInput.laborCost ?? myProposal?.labor_cost ?? ''
          };

          return (
            <div key={lead.id} className="lead-card" style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', marginBottom: '15px', background: '#f8fafc', boxSizing: 'border-box', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: 900, fontFamily: 'monospace' }}>TX: {lead.id?.split('-')[0].toUpperCase()}</div>
                
                <button
                  onClick={() => {
                    if (typeof generateAndDownloadClientBroadcastPDF === 'function') {
                      generateAndDownloadClientBroadcastPDF(lead);
                    } else {
                      alert(`Downloading client request broadcast PDF for: ${customerName}`);
                    }
                  }}
                  style={{ background: '#475569', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                >
                  📄 VIEW CLIENT BROADCAST PDF
                </button>
              </div>

              <h4 style={{ margin: '6px 0', fontSize: '14px', wordBreak: 'break-word' }}>{customerName} ({customerEmail})</h4>
              
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', lineHeight: '1.6', wordBreak: 'break-word' }}>
                Monthly Bill: <strong>₱{customerBill.toLocaleString()}</strong><br/>
                Address: <strong>{customerAddress}</strong> | Roof Type: <strong>{roofType}</strong><br/>
                Objective: <strong>{energyObjective}</strong> | Notes: <em>{projectDesc}</em>
              </div>

              {/* --- SITE SURVEY PHOTOS --- */}
              {(() => {
                const photos = lead.site_photos || lead.quote_details?.site_photos || {};
                const mdpList = photos.mdp || [];
                const houseList = photos.house || [];
                const meterList = photos.meter || [];
                const inverterList = photos.inverter || [];

                const hasAnyPhoto = mdpList.length > 0 || houseList.length > 0 || meterList.length > 0 || inverterList.length > 0;

                if (!hasAnyPhoto) return null;

const renderThumbnails = (arr, label) => {
                  if (!arr || arr.length === 0) return null;
                  return (
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0891b2' }}>{label}:</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                        {arr.map((imgSrc, idx) => (
                          <a 
                            key={idx} 
                            href={imgSrc} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Click to view full size"
                            onClick={(e) => {
                              if (imgSrc && imgSrc.startsWith('data:image')) {
                                e.preventDefault();
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`<iframe src="${imgSrc}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              } else if (!imgSrc || !imgSrc.startsWith('http')) {
                                e.preventDefault();
                                alert("Image not available or invalid link.");
                              }
                            }}
                          >
                            <img 
                              src={imgSrc} 
                              alt="Site Survey" 
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                };

                return (
                  <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', color: '#334155' }}>📸 Site Survey Photos (Click to view):</p>
                    {renderThumbnails(mdpList, 'MDP Panel')}
                    {renderThumbnails(houseList, 'House / Roof')}
                    {renderThumbnails(meterList, 'Electric Meter')}
                    {renderThumbnails(inverterList, 'Inverter Area')}
                  </div>
                );
              })()}

              {!isCurrentEntityAccepted ? (
                <div style={{ background: '#fef9c3', border: '1px solid #facc15', padding: '12px', borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#854d0e', display: 'block', marginBottom: '8px', wordBreak: 'break-word' }}>
                    ⏳ NEW CUSTOMER REQUEST - PENDING YOUR ACCEPTANCE
                  </span>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleAcceptLead(lead.id)}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 900, fontSize: '10px', cursor: 'pointer', flex: 1, minWidth: '110px' }}
                    >
                      ✓ ACCEPT & CLAIM
                    </button>
                    <button 
                      onClick={() => handleRejectLead(lead.id)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 900, fontSize: '10px', cursor: 'pointer', minWidth: '110px' }}
                    >
                      ✕ REJECT / NO THANKS
                    </button>
                  </div>
                </div>
              ) : !isProposalSaved ? (
                <div style={{ background: '#e0f2fe', border: '1px solid #0284c7', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1', display: 'block', marginBottom: '10px', wordBreak: 'break-word' }}>
                    📜 COMPLIANCE & PRICING FORM (Required before submission)
                  </span>

                  {entityType === 'provider' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Panel Model:</label>
                        <input 
                          type="text" 
                          value={inputState.panelModel} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'panelModel', e.target.value)}
                          placeholder="e.g. Trina Solar 550W Tier-1"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Inverter & Battery Specs:</label>
                        <input 
                          type="text" 
                          value={inputState.inverterBattery} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'inverterBattery', e.target.value)}
                          placeholder="e.g. Huawei Hybrid 5kW + LiFePO4"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Base Price (₱ Excl. VAT):</label>
                        <input 
                          type="number" 
                          value={inputState.basePrice} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'basePrice', e.target.value)}
                          placeholder="150000"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Recommended Price (₱):</label>
                        <input 
                          type="number" 
                          value={inputState.recommendedPrice} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'recommendedPrice', e.target.value)}
                          placeholder="168000"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Installation Period:</label>
                        <input 
                          type="text" 
                          value={inputState.installPeriod} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'installPeriod', e.target.value)}
                          placeholder="e.g. 3-5 Working Days"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Workmanship Terms:</label>
                        <input 
                          type="text" 
                          value={inputState.workmanshipTerms} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'workmanshipTerms', e.target.value)}
                          placeholder="Standard Terms & Structural Warranty"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Labor Cost (₱):</label>
                        <input 
                          type="number" 
                          value={inputState.laborCost} 
                          onChange={(e) => handleQuoteInputChange(lead.id, 'laborCost', e.target.value)}
                          placeholder="25000"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => saveDetailedQuotation(lead.id, entityType)}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 900, fontSize: '11px', cursor: 'pointer', width: '100%', marginTop: '12px', boxSizing: 'border-box' }}
                  >
                    💾 SAVE & LOCK PROPOSAL
                  </button>
                </div>
              ) : (
                <div style={{ background: '#fef9c3', border: '1px solid #facc15', padding: '12px', borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#854d0e', display: 'block', marginBottom: '6px', wordBreak: 'break-word' }}>
                    ✅ CLAIMED & PENDING CLIENT SELECTION
                  </span>
                  <p style={{ fontSize: '10px', color: '#713f12', marginBottom: '10px', wordBreak: 'break-word' }}>
                    Proposal submitted to network pool. Waiting for client confirmation.
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
     </div>
    </div>
 )}
 </div>
)}
