import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'https://hook.eu1.make.com/ely70wdf82166br81lqyjgnk3cua7ypz'; 

const adminEmails = [
  "admin@azphur.com", 
  "tuofratello@email.com", 
  "tuamailprincipale@email.com"
];

/**
 * ----------------------------------------------------------------
 * GET: RECUPERO PREVENTIVI PER CUSTOMER & ADMIN
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
        query = query.eq('customer_email', emailClean);
      } else if (userId) {
        query = query.eq('quote_details->>user_id', userId);
      }
      query = query.in('status', [
        'NEW', 
        'QUOTED', 
        'CONTACTED', 
        'WAITING_DEPOSIT', 
        'DEPOSIT_PAID', 
        'WAITING_BALANCE', 
        'BALANCE_PAID',
        'CLOSED'
      ]);
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
 * POST: CREAZIONE NUOVO LEAD (INFLOW CUSTOMER)
 * ----------------------------------------------------------------
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, full_name, email, phone, monthly_bill, roof_type, objective, address } = body;

    if (!full_name || !email || !phone || !monthly_bill) {
      return NextResponse.json(
        { error: 'Name, Email, Phone, and Monthly Bill fields are required.' }, 
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    const dettagliInflow = {
      full_name,
      phone,
      monthly_bill,
      roof_type,
      objective: objective || null, 
      address: address || null,     
      user_id: user_id || null 
    };

    const initialStatus = 'NEW'; 

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          customer_name: full_name,
          customer_email: emailClean,
          quote_details: dettagliInflow,
          status: initialStatus,
          deposit_paid: false,
          balance_unlocked: false,
          balance_paid: false
        }
      ])
      .select();

    if (leadError) {
      console.error('--- SUPABASE INSERTION ERROR ---', leadError.message);
      return NextResponse.json({ error: 'Failed to save lead.', details: leadError.message }, { status: 500 });
    }

    const { error: whitelistError } = await supabase
      .from('solar_allowed_customer')
      .upsert(
        { email: emailClean }, 
        { onConflict: 'email' }
      );

    if (whitelistError) {
      console.error('--- AUTO WHITELISTING WARNING ---', whitelistError.message);
    }

    const createdLead = leadData && leadData[0] ? leadData[0] : null;

    if (WEBHOOK_URL && !WEBHOOK_URL.includes('tuo-webhook-url')) {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'NEW_SOLAR_LEAD',
          lead_id: createdLead?.id,
          timestamp: new Date().toISOString(),
          customer: {
            name: full_name,
            email: emailClean,
            phone: phone
          },
          details: {
            monthly_bill: monthly_bill,
            bill_range: monthly_bill, 
            roof_type: roof_type,
            objective: objective || null, 
            address: address || null      
          }
        })
      }).catch(wError => console.error('Webhook delivery failed:', wError));
    }

    return NextResponse.json({
      success: true,
      message: 'Lead inflow completed successfully and customer allowed!',
      lead_id: createdLead ? createdLead.id : null
    }, { status: 201 });

  } catch (error: any) {
    console.error('Internal Server POST Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * ----------------------------------------------------------------
 * PATCH: AZIONE ADMIN & CUSTOMER - EMISSIONE, SBLOCCO SALDO & PAGAMENTI
 * ----------------------------------------------------------------
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      lead_id, 
      new_status, 
      admin_email, 
      base_price,          
      deposit_percentage,
      balance_unlocked, 
      deposit_paid,      
      balance_paid       
    } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'Missing lead_id.' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    // 1. SE È UN'AZIONE ADMIN (Emissione / Revisione preventivo)
    if (admin_email) {
      if (!adminEmails.includes(admin_email.toLowerCase().trim())) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }

      // RECUPERO STATO ATTUALE PER REGOLA DI SICUREZZA
      const { data: currentLead } = await supabase
        .from('leads')
        .select('status')
        .eq('id', lead_id)
        .single();

      const isLocked = currentLead && [
        'DEPOSIT_PAID', 
        'WAITING_BALANCE', 
        'BALANCE_PAID', 
        'CLOSED'
      ].includes(currentLead.status);

      // SE IL CLIENTE HA GIÀ PAGATO L'ACCONTO, IL PREZZO È BLOCCO TOTALE
      if (base_price && isLocked) {
        return NextResponse.json(
          { error: 'Cannot modify base price after deposit has been paid.' }, 
          { status: 400 }
        );
      }

      // CAMBIO STATO MANUALE (es. Sblocco saldo)
      if (new_status) {
        updateData.status = new_status.toUpperCase();
      }

      if (typeof balance_unlocked === 'boolean') {
        updateData.balance_unlocked = balance_unlocked;
        if (balance_unlocked) {
          updateData.status = 'WAITING_BALANCE';
        }
      }

      // EMISSIONE O RE-ISSUE PREVENTIVO
      if (base_price && Number(base_price) > 0 && !isLocked) {
        const net = Number(base_price);
        const vatCalc = net * 0.12;
        const total = net + vatCalc;
        
        let pct = Number(deposit_percentage);
        if (isNaN(pct) || pct < 1) pct = 20; 
        if (pct > 100) pct = 100;

        const depositAmt = total * (pct / 100);
        const balanceAmt = total - depositAmt;

        // Sovrascrittura pulita dei dati sul DB
        updateData.base_price = net;
        updateData.deal_value = net;
        updateData.vat = vatCalc;
        updateData.vat_amount = vatCalc;
        updateData.final_deal = total;
        updateData.deposit_percentage = pct;
        updateData.deposit_amount = depositAmt;
        updateData.balance_amount = balanceAmt;
        
        // RE-ISSUE RESET: Ritorna a QUOTED per far vedere l'offerta aggiornata al cliente
        updateData.status = 'QUOTED'; 
      }
    }

    // 2. SE È UN'AZIONE DEL CLIENTE (Pagamento Effettuato)
    if (typeof deposit_paid === 'boolean' || typeof balance_paid === 'boolean') {
      // Recuperiamo i dati correnti per calcolare gli importi corretti ed evitare violazioni del DB
      const { data: currentLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (currentLead) {
        const finalDeal = Number(currentLead.final_deal || currentLead.deal_value || 0);
        const depPct = Number(currentLead.deposit_percentage || 20);

        if (deposit_paid) {
          const depAmt = currentLead.deposit_amount || (finalDeal * (depPct / 100));
          const balAmt = currentLead.balance_amount || (finalDeal - depAmt);

          updateData.deposit_paid = true;
          updateData.deposit_amount = depAmt;
          updateData.balance_amount = balAmt;
          updateData.status = 'DEPOSIT_PAID'; // Se il DB rifiuta DEPOSIT_PAID usa WAITING_BALANCE
        }

        if (balance_paid) {
          updateData.balance_paid = true;
          updateData.status = 'CLOSED';
        }
      }
    }

    // Aggiornamento su Supabase
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .select();

    if (error) {
      console.error('--- SUPABASE UPDATE ERROR ---', error.message);
      return NextResponse.json({ error: 'Database update failed.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
      updated_lead: data?.[0] || null
    }, { status: 200 });

  } catch (error) {
    console.error('Internal Server PATCH Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}