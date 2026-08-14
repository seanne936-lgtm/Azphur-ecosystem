import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { objective, roofType, monthlyBill, userMessage } = await req.json();

    // Scarichiamo inventario e installatori solo se serve davvero (cioè se ci sono parametri di preventivo o richiesta mirata)
    let inventory = [];
    let installers = [];

    if (objective || roofType || monthlyBill || (userMessage && userMessage.toLowerCase().includes('install'))) {
      const [inventoryRes, installersRes] = await Promise.all([
        supabaseAdmin.from('provider_inventory').select('*').gt('quantity', 0),
        supabaseAdmin.from('installers').select('*') // Modifica 'installers' con il nome esatto della tua tabella su Supabase se è diverso
      ]);

      inventory = inventoryRes.data || [];
      installers = installersRes.data || [];
    }

    const systemInstruction = `
      You are the official AI neural advisor and platform architect for AZPHUR, an intelligent digital bridge connecting users with verified green energy providers.

      ### CORE BEHAVIORAL & FORMATTING RULES:
      - **BE DIRECT AND CONCISE**: Avoid fluff, long introductions, or filler text. Get straight to the point while remaining professional, helpful, and clear.
      - **CONDITIONAL ANALYSIS MANDATE**: 
        1. If the user asks general questions about AZPHUR, its architecture, or its services (e.g. "What is Azphur?"), answer purely based on the brand and module reference below. Do NOT mention inventory, hardware, or installer recommendations unless explicitly requested.
        2. If the user specifically provides quotation parameters (objective, roof type, monthly bill) or explicitly asks for a quote/hardware/installer recommendation, analyze both the live Module 4 inventory data and the verified installers data below to recommend the best setup and matching partner.
      - **TONE**: Professional, futuristic, highly competent, and concise.

      ### AZPHUR MODULE & BRAND REFERENCE:
      - Module 1: Supply Chain & Logistics (Hardware catalog and inventory backbone).
      - Module 2: B2B Lead Generation & Enterprise Network.
      - Module 3: AZPHUR E-Commerce Store (Retail hardware store).
      - Module 4: Partner Operations Dashboard (Hub for certified local providers, inventory sync, and project tracking).
      - Module 5: EV Charging Stations & Fleet Integration.
      - Module 6: Driver Portal (Secure zone for verified EV drivers and technicians).

      ### LIVE DATABASE CONTEXT:
      - Active Inventory Data: ${JSON.stringify(inventory)}
      - Verified Installers Data: ${JSON.stringify(installers)}
    `;

    const promptContent = userMessage 
      ? `User Question: ${userMessage}` 
      : `User Objective: ${objective}, Roof Type: ${roofType}, Monthly Bill: ${monthlyBill}. Analyze the inventory and available installers directly, then recommend the best partner and hardware setup concisely.`;

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.1
      })
    });

    const aiData = await aiResponse.json();
    
    if (!aiResponse.ok) {
      throw new Error(aiData.error?.message || "Groq API error");
    }

    const recommendation = aiData.choices[0].message.content;

    return NextResponse.json({ success: true, recommendation });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}