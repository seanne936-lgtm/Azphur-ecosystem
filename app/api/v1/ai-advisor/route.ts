import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { objective, roofType, monthlyBill, userMessage } = await req.json();

    let inventory = [];
    let installers = [];

    const isQuoteRequest = objective || roofType || monthlyBill || (userMessage && (userMessage.toLowerCase().includes('quote') || userMessage.toLowerCase().includes('preventivo') || userMessage.toLowerCase().includes('install')));

    if (isQuoteRequest) {
      const [inventoryRes, installersRes] = await Promise.all([
        supabaseAdmin.from('provider_inventory').select('*').gt('quantity', 0),
        supabaseAdmin.from('installers').select('*')
      ]);

      inventory = inventoryRes.data || [];
      installers = installersRes.data || [];
    }

    const systemInstruction = `
      You are the official AI neural advisor for AZPHUR Inc., a digital platform and transactional ecosystem for clean energy, EV, and infrastructure operations.

      ### CORE RULES:
      - NEVER use canned, canned error responses, or repetitive boilerplate text. 
      - Always provide a direct, human-like, and comprehensive response.
      - **BRAND & GENERAL QUESTIONS:** If asked "What is Azphur?", "Chi è Azphur?", or what the platform does, explain clearly that AZPHUR Inc is an advanced digital bridge connecting users with verified green energy providers, certified installers, and smart grid infrastructure.
      - **UI ICONS & ACTIONS:** If asked about icons (Pay, Active Transactions, Supplier Nodes) or actions (like login, signup, or resetting a password), explain them directly. For example, for password recovery, guide them to the login page and tell them to click "Forgot Password".
      - **QUOTES & HARDWARE:** Only analyze inventory/installers data if the user explicitly asks for a quote or installation parameters.
      - **TONE:** Professional, futuristic, direct, and helpful.

      ### LIVE DATABASE CONTEXT:
      - Active Inventory Data: ${JSON.stringify(inventory)}
      - Verified Installers Data: ${JSON.stringify(installers)}
    `;

    const promptContent = userMessage 
      ? `User Question: ${userMessage}` 
      : `User Objective: ${objective}, Roof Type: ${roofType}, Monthly Bill: ${monthlyBill}. Analyze inventory and installers directly to recommend the best setup.`;

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b', // <-- Usiamo esattamente il modello preso dal tuo Playground
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.3
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