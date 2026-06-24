import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// INSERISCI QUI IL TUO URL DI MAKE / INTEGROMAT / N8N
const WEBHOOK_URL = 'https://hook.eu1.make.com/ely70wdf82166br81lqyjgnk3cua7ypz'; 

// Lista degli admin abilitati a vedere tutto e fare modifiche
const adminEmails = [
  "admin@azphur.com", 
  "tuofratello@email.com", 
  "tuamailprincipale@email.com"
];

/**
 * ----------------------------------------------------------------
 * GET: RETRIEVE QUOTATIONS
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
      query = query.in('status', ['NEW', 'QUOTED', 'CONTACTED', 'CLOSED']);
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
 * POST: SAVE A NEW LEAD + AUTO WHITELIST + WEBHOOK TRIGGER
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

    // 1. SALVATAGGIO DEL LEAD (Ne crea sempre uno nuovo anche se l'email fa più richieste)
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          customer_name: full_name,
          customer_email: emailClean,
          quote_details: dettagliInflow,
          status: initialStatus
        }
      ])
      .select();

    if (leadError) {
      console.error('--- SUPABASE INSERTION ERROR ---', leadError.message);
      return NextResponse.json({ error: 'Failed to save lead.', details: leadError.message }, { status: 500 });
    }

    // 2. AUTO-WHITELIST: Inserisce l'email in solar_allowed_customer
    // Usiamo upsert per ignorare l'inserimento se l'email esiste già (evitando l'errore di chiave duplicata)
    const { error: whitelistError } = await supabase
      .from('solar_allowed_customer')
      .upsert(
        { email: emailClean }, 
        { onConflict: 'email' }
      );

    if (whitelistError) {
      // Logghiamo l'errore ma non blocchiamo la risposta dell'utente, dato che il lead principale è già salvato
      console.error('--- AUTO WHITELISTING WARNING ---', whitelistError.message);
    }

    const createdLead = leadData && leadData[0] ? leadData[0] : null;

    // 3. TRIGGER DEL WEBHOOK IN BACKGROUND
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
 * PATCH: UPDATE STATUS FROM SUPERVISOR PANEL
 * ----------------------------------------------------------------
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { lead_id, new_status, admin_email } = body;

    if (!lead_id || !new_status || !admin_email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!adminEmails.includes(admin_email.toLowerCase().trim())) {
      return NextResponse.json({ error: 'Unauthorized. Action restricted to supervisors.' }, { status: 403 });
    }

    const allowedStates = ['NEW', 'QUOTED', 'CONTACTED', 'CLOSED'];
    if (!allowedStates.includes(new_status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ status: new_status.toUpperCase() })
      .eq('id', lead_id)
      .select();

    if (error) {
      console.error('--- SUPABASE UPDATE ERROR ---', error.message);
      return NextResponse.json({ error: 'Database update failed.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Lead status updated to ${new_status} successfully.`,
      updated_lead: data?.[0] || null
    }, { status: 200 });

  } catch (error) {
    console.error('Internal Server PATCH Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}