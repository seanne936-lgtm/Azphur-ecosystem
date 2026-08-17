import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

const adminEmails = [
  "admin@azphur.com", 
  "azphur@gmail.com", 
  "seanne936@gmail.com",
  "rhonjhonglenpaz@gmail.com"
];

const ADMIN_NOTIFY_LIST = [
  "seanne936@gmail.com",
  "azphur@gmail.com",
  "rhonjhonglenpaz@gmail.com"
];

// Helper per recuperare la mail dalla whitelist in base al nome
async function getWhitelistEmail(name: string, type: 'provider' | 'installer'): Promise<string> {
  try {
    const table = type === 'provider' ? 'partner_whitelist' : 'installers_whitelist';
    const column = type === 'provider' ? 'provider_name' : 'installer_name';
    
    const normalizedSearchTerm = name.replace(/_/g, ' ').trim();

    let { data } = await supabase
      .from(table)
      .select('email')
      .ilike(column, `%${normalizedSearchTerm}%`)
      .maybeSingle();

    if (data?.email) return data.email.toLowerCase().trim();

    const { data: fallbackData } = await supabase
      .from(table)
      .select('email')
      .ilike(column, `%${name.trim()}%`)
      .maybeSingle();

    if (fallbackData?.email) return fallbackData.email.toLowerCase().trim();

  } catch (e) {
    console.error("Error fetching whitelist email:", e);
  }
  
  return type === 'provider' ? 'partner@azphur.com' : 'installer@azphur.com';
}

/**
 * ----------------------------------------------------------------
 * GET: RETRIEVE QUOTATIONS (CUSTOMER, PARTNERS, INSTALLERS & ADMIN)
 * ----------------------------------------------------------------
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('user_id');

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'User identifier (email or user_id) is required.' },
        { status: 400 }
      );
    }

    const emailClean = email ? email.toLowerCase().trim() : '';
    const isAdmin = adminEmails.includes(emailClean);

    let query = supabase.from('leads').select('*');

    if (isAdmin) {
      query = query.order('created_at', { ascending: false });
    } else {
      if (emailClean) {
        query = query.or(`customer_email.eq.${emailClean},quote_details->>email.eq.${emailClean}`);
      } else if (userId) {
        query = query.eq('quote_details->>user_id', userId);
      }
    }

    const { data: leadsData, error } = await query;

    if (error) {
      console.error('--- PRIVATE AREA READ ERROR ---', error);
      return NextResponse.json({ error: 'Unable to retrieve quotations.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      quotations: leadsData || [], 
      data: leadsData || [] 
    }, { status: 200 });

  } catch (error) {
    console.error('Internal GET Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * ----------------------------------------------------------------
 * POST: CREATE NEW LEAD (CUSTOMER INFLOW) + NOTIFY ALL PARTNERS & ADMINS
 * ----------------------------------------------------------------
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      customer_name, 
      full_name, 
      customer_email, 
      email, 
      customer_phone, 
      phone, 
      monthly_bill, 
      roof_type, 
      objective, 
      project_description,
      address,
      ai_recommendation,
      selected_partner,
      selected_items,
      quote_pdf_data,
      pdf_generated,
      site_photos // <-- AGGIUNTO QUI
    } = body;

    const resolvedName = customer_name || full_name;
    const resolvedEmail = customer_email || email;
    const resolvedPhone = customer_phone || phone;

    if (!resolvedName || !resolvedEmail || !resolvedPhone || monthly_bill === undefined || monthly_bill === '') {
      return NextResponse.json(
        { error: 'Name, Email, Phone, and Monthly Bill fields are required.' }, 
        { status: 400 }
      );
    }

    const emailClean = resolvedEmail.toLowerCase().trim();

    const inflowDetails = {
      full_name: resolvedName,
      email: emailClean,
      phone: resolvedPhone,
      monthly_bill,
      roof_type: roof_type || 'Flat',
      objective: objective || null, 
      project_description: project_description || null,
      address: address || null,     
      user_id: user_id || null,
      ai_recommendation: ai_recommendation || null,
      selected_partner: selected_partner || null,
      selected_items: selected_items || [],
      pdf_generated: pdf_generated || false,
      site_photos: site_photos || null // <-- SALVATO ANCHE NEI DETTAGLI JSON
    };

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          customer_name: resolvedName,
          customer_email: emailClean,
          customer_phone: resolvedPhone,
          address: address || null,
          project_description: project_description || null,
          monthly_bill: monthly_bill !== undefined && monthly_bill !== '' ? Number(monthly_bill) : null,
          roof_type: roof_type || 'Flat',
          objective: objective || null,
          status: 'BROADCAST_ACTIVE',
          quote_details: inflowDetails,
          quote_pdf_data: quote_pdf_data || null,
          selected_partner: selected_partner || null,
          selected_items: selected_items || [], // <-- QUESTA VIRGOLA ERA QUELLA MANCANTE
          
          mdp_photos: site_photos?.mdp || [],
          house_photos: site_photos?.house || [],
          meter_photos: site_photos?.meter || [],
          inverter_photos: site_photos?.inverter || []
        }
      ])
      .select();
    if (leadError) {
      console.error('--- SUPABASE INSERTION ERROR ---', leadError.message);
      return NextResponse.json({ error: 'Failed to save lead.', details: leadError.message }, { status: 500 });
    }

    await supabase
      .from('solar_allowed_customer')
      .upsert({ email: emailClean }, { onConflict: 'email' });

    const createdLead = leadData && leadData[0] ? leadData[0] : null;

    const { data: providers } = await supabase.from('partner_whitelist').select('email');
    const { data: installers } = await supabase.from('installers_whitelist').select('email');

    const recipientEmails = new Set<string>([...ADMIN_NOTIFY_LIST]);

    if (providers && Array.isArray(providers)) {
      providers.forEach(p => { if (p.email) recipientEmails.add(p.email.toLowerCase().trim()); });
    }
    if (installers && Array.isArray(installers)) {
      installers.forEach(i => { if (i.email) recipientEmails.add(i.email.toLowerCase().trim()); });
    }

    try {
      const itemsHtml = selected_items && selected_items.length > 0
        ? selected_items.map((item: any) => `<li>${item.name || item.item_name} - Qty: ${item.quantity} (Price: PHP ${item.price || item.unitPrice})</li>`).join('')
        : '<li>None</li>';

      await resend.emails.send({
        from: 'AZPHUR Operations <notifications@azphur.com>', 
        to: Array.from(recipientEmails),
        subject: `🚨 New Solar Broadcast Lead: ${resolvedName}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #0891b2; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #0891b2; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 22px; color: #0891b2; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
              <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
            </div>
            
            <h2 style="color: #0891b2; margin-top: 0; font-size: 16px;">Official Solar Quotation Broadcast</h2>
            <p style="font-size: 12px; color: #475569;">A new client request has been successfully generated and broadcasted across the network. Access your operations panel to claim it.</p>
            
            <div style="background: #f0f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;"><strong>Customer / Entity:</strong> ${resolvedName}</p>
              <p style="margin: 0;"><strong>Corporate Email:</strong> ${emailClean}</p>
              <p style="margin: 0;"><strong>Mobile Phone:</strong> ${resolvedPhone}</p>
              <p style="margin: 0;"><strong>Installation Address:</strong> ${address || 'N/A'}</p>
              <p style="margin: 0;"><strong>Monthly Utility Bill:</strong> PHP ${Number(monthly_bill || 0).toLocaleString()}</p>
              <p style="margin: 0;"><strong>Roof Structure:</strong> ${roof_type || 'Flat'}</p>
              <p style="margin: 0;"><strong>Energy Objective:</strong> ${objective || 'N/A'}</p>
              ${project_description ? `<p style="margin: 0;"><strong>Project Description:</strong> ${project_description}</p>` : ''}
            </div>

            <p style="font-size: 11px; font-weight: bold; margin-top: 15px;">Selected Items / Products:</p>
            <ul style="font-size: 11px; color: #334155;">
              ${itemsHtml}
            </ul>

            <div style="font-size: 9px; color: #64748b; margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center;">
              <p style="margin: 0 0 4px 0;">AZPHUR Distributed Network System</p>
              <p style="margin: 0; font-style: italic; color: #86868b;">Shaping Sustainable Possibilities.</p>
            </div>
          </div>
        `
      });
    } catch (resendError) {
      console.error('Resend email delivery failed:', resendError);
    }

    return NextResponse.json({
      success: true,
      message: 'Lead inflow completed successfully and broadcast notification dispatched!',
      lead_id: createdLead ? createdLead.id : null
    }, { status: 201 });

  } catch (error: any) {
    console.error('Internal Server POST Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * ----------------------------------------------------------------
 * PUT: LEAD ACCEPTANCE BY PROVIDER OR INSTALLER
 * ----------------------------------------------------------------
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { lead_id, selection_type, entity_name } = body;

    if (!lead_id || !selection_type || !entity_name) {
      return NextResponse.json({ error: 'Missing lead_id, selection_type or entity_name.' }, { status: 400 });
    }

    const { data: currentLead, error: fetchErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .maybeSingle();

    if (fetchErr || !currentLead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    let updatePayload: Record<string, any> = {};

    if (selection_type === 'provider') {
      let existingAccepted: string[] = [];
      const rawAccepted = currentLead.partner_accepted_by;
      if (typeof rawAccepted === 'string' && rawAccepted.trim() !== '') {
        try { existingAccepted = JSON.parse(rawAccepted); } catch { existingAccepted = rawAccepted.split(',').map((s: string) => s.trim()); }
      } else if (Array.isArray(rawAccepted)) {
        existingAccepted = rawAccepted;
      }
      
      if (!existingAccepted.includes(entity_name)) {
        existingAccepted.push(entity_name);
      }

      updatePayload = {
        partner_accepted_by: JSON.stringify(existingAccepted),
        status: 'ACCEPTED_BY_PROVIDER'
      };
    } else if (selection_type === 'installer') {
      let existingAcceptedInst: string[] = [];
      const rawAcceptedInst = currentLead.installer_accepted_by;
      if (typeof rawAcceptedInst === 'string' && rawAcceptedInst.trim() !== '') {
        try { existingAcceptedInst = JSON.parse(rawAcceptedInst); } catch { existingAcceptedInst = rawAcceptedInst.split(',').map((s: string) => s.trim()); }
      } else if (Array.isArray(rawAcceptedInst)) {
        existingAcceptedInst = rawAcceptedInst;
      }
       
      if (!existingAcceptedInst.includes(entity_name)) {
        existingAcceptedInst.push(entity_name);
      }

      updatePayload = {
        installer_accepted_by: JSON.stringify(existingAcceptedInst),
        status: 'ACCEPTED_BY_INSTALLER'
      };
    } else {
      return NextResponse.json({ error: 'Invalid selection_type. Use provider or installer.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', lead_id)
      .select();

    if (error) {
      console.error('--- DETAILED POSTGRES ERROR (PUT) ---', error);
      return NextResponse.json({ error: 'Database update failed.', details: error.message }, { status: 500 });
    }

    const updatedLead = data?.[0] || null;
    const partnerEmail = await getWhitelistEmail(entity_name, selection_type);
    const customerEmail = updatedLead?.customer_email || updatedLead?.quote_details?.email;
    const customerName = updatedLead?.customer_name || 'Valued Customer';

    try {
      if (customerEmail) {
        await resend.emails.send({
          from: 'AZPHUR Operations <notifications@azphur.com>',
          to: [customerEmail, ...ADMIN_NOTIFY_LIST],
          subject: `AZPHUR Update: ${entity_name} has accepted your solar request!`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0891b2; margin-top: 0;">Partner Accepted Your Request!</h2>
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Il partner <strong>${entity_name}</strong> (Email: ${partnerEmail}) ha accettato di seguire la tua richiesta. Controlla sull'app per visualizzare i dettagli!</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
              <p style="font-size: 10px; color: #64748b; text-align: center;">AZPHUR Distributed Network System</p>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Failed to send partner acceptance email to customer:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `${selection_type.toUpperCase()} successfully accepted lead!`,
      lead: updatedLead
    }, { status: 200 });

  } catch (error: any) {
    console.error('Internal Server PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * ----------------------------------------------------------------
 * PATCH: SELEZIONE PARTNER, PROPOSTE, ESCROW & HIDE RECORD
 * ----------------------------------------------------------------
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      lead_id, 
      action,
      entity_type,
      entity_name,
      partner_email,
      partner_name,
      panel_model,
      inverter_battery,
      base_price,
      recommended_price,
      extra_options,
      install_period,
      workmanship_terms,
      labor_cost,
      assigned_provider,
      assigned_installer,
      payment_target,
      deposit_amount,
      final_deal,
      deal_value,
      provider_downpayment,
      provider_balance,
      installer_downpayment,
      installer_balance,
      hide_for
    } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'Missing lead_id.' }, { status: 400 });
    }

    const { data: currentLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .maybeSingle();

    const updateData: Record<string, any> = {};

    // 1. Gestione indipendente per nascondere il record completato al provider o all'installer
    if (hide_for) {
      if (hide_for === 'provider') updateData.provider_hidden = true;
      if (hide_for === 'installer') updateData.installer_hidden = true;
    }

    if (action === 'save_quotation') {
      let cleanEntityName = entity_name || partner_name || 'AZPHUR Partner';
      if (typeof cleanEntityName === 'string') {
        cleanEntityName = cleanEntityName.replace(/[\[\]"]/g, '');
      }

      let proposalPayload: Record<string, any>;
      let targetTable: string;

      if (entity_type === 'provider') {
        targetTable = 'provider_proposals';
        proposalPayload = {
          lead_id: lead_id,
          entity_name: cleanEntityName,
          panel_model: panel_model || 'Standard Solar PV Modules',
          inverter_battery: inverter_battery || null,
          base_price: base_price !== undefined && base_price !== '' ? Number(base_price) : null,
          recommended_price: recommended_price !== undefined && recommended_price !== '' ? Number(recommended_price) : 0,
          extra_options: extra_options || []
        };
      } else {
        targetTable = 'installer_proposals';
        proposalPayload = {
          lead_id: lead_id,
          entity_name: cleanEntityName,
          install_period: install_period || '7-10 Working Days',
          workmanship_terms: workmanship_terms || 'Standard Workmanship Warranty',
          labor_cost: labor_cost !== undefined && labor_cost !== '' ? Number(labor_cost) : 0
        };
      }

      const { error: propError } = await supabase
        .from(targetTable)
        .upsert(proposalPayload, { onConflict: 'lead_id' });

      if (propError) {
        console.error(`--- ERROR SAVING TO ${targetTable.toUpperCase()} ---`, propError.message);
        return NextResponse.json({ error: `Database error: ${propError.message}` }, { status: 500 });
      }

      updateData.quote_pdf_data = JSON.stringify({
        partner_email: partner_email || 'partner@azphur.com',
        partner_name: cleanEntityName,
        azphur_logo: 'AZPHUR',
        azphur_motto: 'Shaping Sustainable Possibilities',
        entity_type: entity_type,
        ...proposalPayload,
        updated_at: new Date().toISOString()
      });
      updateData.status = entity_type === 'provider' ? 'QUOTED_BY_PROVIDER' : 'QUOTED_BY_INSTALLER';
    }

    if (action === 'select_partner') {
      const { partner_name, partner_type } = body;
      const cleanSelectedName = (partner_name || '').replace(/[\[\]"]/g, '').trim();
      const fetchedPartnerEmail = await getWhitelistEmail(cleanSelectedName, partner_type);

      if (partner_type === 'provider') {
        updateData.assigned_provider = cleanSelectedName;
        updateData.provider_email = fetchedPartnerEmail;
        updateData.status = 'provider_selected';
      } else {
        updateData.assigned_installer = cleanSelectedName;
        updateData.installer_email = fetchedPartnerEmail;
        updateData.status = 'installer_selected';
      }

      const customerEmail = currentLead?.customer_email || currentLead?.quote_details?.email;
      const customerName = currentLead?.customer_name || 'Valued Customer';

      try {
        await resend.emails.send({
          from: 'AZPHUR Operations <notifications@azphur.com>',
          to: [fetchedPartnerEmail, ...ADMIN_NOTIFY_LIST],
          subject: `🎉 Congratulations! You have been selected by ${customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0891b2; margin-top: 0;">Project Assigned!</h2>
              <p>Il customer <strong>${customerName} (${customerEmail})</strong> ti ha scelto come ${partner_type} ufficiale. Inizia la fase di quotazione ed esecuzione.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
              <p style="font-size: 10px; color: #64748b; text-align: center;">AZPHUR Distributed Network System</p>
            </div>
          `
        });
      } catch (e) {
        console.error("Error sending email to selected partner:", e);
      }

      const rawAcceptedList = partner_type === 'provider' 
        ? currentLead?.partner_accepted_by 
        : currentLead?.installer_accepted_by;
      
      let acceptedList: string[] = [];
      if (typeof rawAcceptedList === 'string' && rawAcceptedList.trim() !== '') {
        try { acceptedList = JSON.parse(rawAcceptedList); } catch { acceptedList = rawAcceptedList.split(',').map((s: string) => s.trim()); }
      } else if (Array.isArray(rawAcceptedList)) {
        acceptedList = rawAcceptedList;
      }

      for (const unchosenName of acceptedList) {
        if (unchosenName && unchosenName.toLowerCase().trim() !== cleanSelectedName.toLowerCase().trim()) {
          const unchosenEmail = await getWhitelistEmail(unchosenName, partner_type);
          try {
            await resend.emails.send({
              from: 'AZPHUR Operations <notifications@azphur.com>',
              to: [unchosenEmail],
              subject: `AZPHUR Network Update: Request Update for ${customerName}`,
              html: `
                <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #b45309; margin-top: 0;">Lead Status Update</h2>
                  <p>Mi dispiace, questo cliente (<strong>${customerName}</strong>) non vi ha scelti. Potete tornare online.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
                  <p style="font-size: 10px; color: #64748b; text-align: center;">AZPHUR Distributed Network System</p>
                </div>
              `
            });
          } catch (e) {
            console.error("Error sending email to unchosen partner:", e);
          }
        }
      }
    }

    if (action === 'assign_provider' && assigned_provider !== undefined) {
      updateData.assigned_provider = assigned_provider;
      updateData.status = 'CONTRACT_ACTIVE_PROVIDER';
    }
    if (action === 'assign_installer' && assigned_installer !== undefined) {
      updateData.assigned_installer = assigned_installer;
      updateData.status = 'CONTRACT_ACTIVE_INSTALLER';
    }

    if (deal_value !== undefined) updateData.deal_value = deal_value;
    if (deposit_amount !== undefined) updateData.provider_downpayment = deposit_amount;
    if (provider_downpayment !== undefined) updateData.provider_downpayment = provider_downpayment;
    if (final_deal !== undefined) updateData.provider_balance = final_deal;
    if (provider_balance !== undefined) updateData.provider_balance = provider_balance;

    if (installer_downpayment !== undefined) updateData.installer_downpayment = installer_downpayment;
    if (installer_balance !== undefined) updateData.installer_balance = installer_balance;

    let triggeredPaymentTarget = null;

    if (payment_target === 'provider_initial') {
      updateData.provider_paid = true;
      triggeredPaymentTarget = 'provider_initial';
    } else if (payment_target === 'provider_final') {
      updateData.provider_balance_paid = true;
      updateData.status = 'COMPLETED_PROVIDER';
      triggeredPaymentTarget = 'provider_final';
    } else if (payment_target === 'installer_initial') {
      updateData.installer_paid = true;
      triggeredPaymentTarget = 'installer_initial';
    } else if (payment_target === 'installer_final') {
      updateData.installer_balance_paid = true;
      updateData.status = 'COMPLETED_INSTALLER';
      triggeredPaymentTarget = 'installer_final';
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .select();

    if (error) {
      console.error('--- SUPABASE PATCH UPDATE ERROR ---', error.message);
      return NextResponse.json({ 
        success: false, 
        error: `Database update failed: ${error.message}` 
      }, { status: 500 });
    }

    const updatedLead = data?.[0] || null;

    if (triggeredPaymentTarget && updatedLead) {
      const customerEmail = updatedLead.customer_email || updatedLead.quote_details?.email;
      const provName = updatedLead.assigned_provider || 'Provider';
      const instName = updatedLead.assigned_installer || 'Installer';
      let senderEntity = triggeredPaymentTarget.startsWith('provider') ? provName : instName;

      try {
        if (customerEmail) {
          await resend.emails.send({
            from: 'AZPHUR Operations <notifications@azphur.com>',
            to: [customerEmail, ...ADMIN_NOTIFY_LIST],
            subject: `AZPHUR Escrow Update: Payment Milestone Confirmed (${triggeredPaymentTarget.toUpperCase()})`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0891b2; margin-top: 0;">Payment Milestone Confirmed</h2>
                <p>Il pagamento per il traguardo <strong>(${triggeredPaymentTarget})</strong> con <strong>${senderEntity}</strong> è stato registrato con successo nel sistema Escrow.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
                <p style="font-size: 10px; color: #64748b; text-align: center;">AZPHUR Distributed Network System</p>
              </div>
            `
          });
        }
      } catch (payEmailErr) {
        console.error("Failed to send payment confirmation email:", payEmailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully via server API.',
      updated_lead: updatedLead
    }, { status: 200 });

  } catch (error) {
    console.error('Internal Server PATCH Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * ----------------------------------------------------------------
 * DELETE: REMOVE LEAD
 * ----------------------------------------------------------------
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('lead_id');

    if (!leadId) {
      return NextResponse.json({ error: 'Missing lead_id parameter.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete lead.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Record deleted.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}