import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Funding Engine requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_NOTIFY_LIST = [
  'seanne936@gmail.com',
  'azphur@gmail.com',
  'rhonjhonglenpaz@gmail.com'
];
const NOTIFICATION_FROM = 'AZPHUR Operations <notifications@azphur.com>';

const uniqueEmails = (emails: Array<string | null | undefined>) =>
  [...new Set(emails.map(email => email?.toLowerCase().trim()).filter((email): email is string => Boolean(email)))];

const money = (value: unknown) =>
  `PHP ${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function sendFundingNotification({
  to,
  subject,
  title,
  body,
  bccAdmins = true,
  accent = '#0891b2'
}: {
  to: string | string[];
  subject: string;
  title: string;
  body: string;
  bccAdmins?: boolean;
  accent?: string;
}) {
  const recipients = uniqueEmails(Array.isArray(to) ? to : [to]);
  if (recipients.length === 0) return;
  const [primaryRecipient, ...privateRecipients] = recipients;
  const hiddenRecipients = uniqueEmails([
    ...privateRecipients,
    ...(bccAdmins ? ADMIN_NOTIFY_LIST : [])
  ]).filter(email => email !== primaryRecipient);

  try {
    await resend.emails.send({
      from: NOTIFICATION_FROM,
      to: [primaryRecipient],
      bcc: hiddenRecipients.length > 0 ? hiddenRecipients : undefined,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1d1d1f; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-top: 4px solid ${accent}; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 22px; color: #0891b2; letter-spacing: 2px; font-weight: 900;">AZPHUR</h1>
            <p style="margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; font-style: italic;">Shaping Sustainable Possibilities</p>
          </div>
          <h2 style="color: ${accent}; margin-top: 0; font-size: 18px;">${title}</h2>
          <div style="font-size: 13px; color: #475569; line-height: 1.7;">${body}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
            <p style="margin: 0 0 4px;">AZPHUR Funding Network</p>
            <p style="margin: 0; font-style: italic;">Shaping Sustainable Possibilities.</p>
          </div>
        </div>
      `
    });
  } catch (notificationError) {
    console.error('Funding notification delivery failed:', notificationError);
  }
}

type AuthUser = { id: string; email: string };
type FundingPartner = {
  id: string;
  email: string;
  display_name: string;
  legal_name: string;
  access_status: string;
  verified: boolean;
  minimum_funding_amount: number;
  maximum_funding_amount: number | null;
  minimum_term_months: number;
  maximum_term_months: number;
};

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

async function requireUser(request: Request): Promise<AuthUser | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase().trim();
  if (error || !data.user || !email) return null;
  return { id: data.user.id, email };
}

async function requireFundingPartner(user: AuthUser): Promise<FundingPartner | null> {
  const { data } = await admin
    .from('funding_partner_whitelist')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .eq('access_status', 'active')
    .eq('verified', true)
    .maybeSingle();

  if (!data) return null;
  if (!data.user_id) {
    await admin.from('funding_partner_whitelist').update({ user_id: user.id }).eq('id', data.id);
  }
  return data as FundingPartner;
}

function taxTotal(amount: unknown, registered: unknown, rate: unknown, included: unknown) {
  const quoted = Math.max(Number(amount) || 0, 0);
  const isRegistered = registered === true;
  const safeRate = isRegistered ? Math.max(Number(rate) || 0, 0) : 0;
  if (!isRegistered || safeRate === 0 || included === true) return quoted;
  return quoted + quoted * (safeRate / 100);
}

function projectAmounts(lead: any) {
  const providerDownpayment = taxTotal(
    lead.provider_downpayment,
    lead.provider_vat_registered,
    lead.provider_vat_rate,
    lead.provider_prices_include_tax
  );
  const installerDownpayment = taxTotal(
    lead.installer_downpayment,
    lead.installer_vat_registered,
    lead.installer_vat_rate,
    lead.installer_prices_include_tax
  );
  const providerFinal = taxTotal(
    lead.provider_balance,
    lead.provider_vat_registered,
    lead.provider_vat_rate,
    lead.provider_prices_include_tax
  );
  const installerFinal = taxTotal(
    lead.installer_balance,
    lead.installer_vat_registered,
    lead.installer_vat_rate,
    lead.installer_prices_include_tax
  );
  return {
    providerDownpayment,
    installerDownpayment,
    providerFinal,
    installerFinal,
    downpaymentTotal: providerDownpayment + installerDownpayment,
    finalTotal: providerFinal + installerFinal,
    projectTotal: providerDownpayment + installerDownpayment + providerFinal + installerFinal
  };
}

function monthlyPayment(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

async function event(
  actor: AuthUser,
  actorRole: 'customer' | 'funding_partner' | 'admin' | 'system',
  eventType: string,
  requestId?: string,
  contractId?: string,
  metadata: Record<string, unknown> = {}
) {
  await admin.from('funding_events').insert({
    request_id: requestId || null,
    contract_id: contractId || null,
    actor_user_id: actor.id,
    actor_role: actorRole,
    event_type: eventType,
    metadata
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'customer';

  if (scope === 'public') {
    const { data, error } = await admin
      .from('funding_partner_whitelist')
      .select('id,legal_name,display_name,partner_type,public_contact_email,contact_name,contact_phone,website,public_description,headquarters_address,country,verified')
      .eq('access_status', 'active')
      .eq('verified', true)
      .order('display_name', { ascending: true });
    if (error) return jsonError('Unable to load the verified funding network.', 500);
    return NextResponse.json({ success: true, partners: data || [] });
  }

  const user = await requireUser(request);
  if (!user) return jsonError('Authentication required.', 401);

  if (scope === 'partner') {
    const partner = await requireFundingPartner(user);
    if (!partner) return jsonError('Verified funding partner access required.', 403);

    const [{ data: requests }, { data: decisions }, { data: offers }, { data: contracts }] = await Promise.all([
      admin.from('funding_requests').select('*').in('status', ['open', 'under_review', 'offers_available', 'offer_selected', 'contract_pending', 'active']).order('submitted_at', { ascending: false }),
      admin.from('funding_partner_decisions').select('*').eq('funding_partner_id', partner.id),
      admin.from('funding_offers').select('*').eq('funding_partner_id', partner.id),
      admin.from('funding_contracts').select('*').eq('funding_partner_id', partner.id).order('created_at', { ascending: false })
    ]);

    const leadIds = [...new Set((requests || []).map((item: any) => item.lead_id))];
    const { data: leads } = leadIds.length
      ? await admin.from('leads').select('id,customer_name,customer_email,address,project_description,assigned_provider,assigned_installer,provider_downpayment,provider_balance,installer_downpayment,installer_balance,provider_balance_unlocked,installer_balance_unlocked,provider_paid,installer_paid,provider_balance_paid,installer_balance_paid,payment_method').in('id', leadIds)
      : { data: [] as any[] };

    const decisionByRequest = new Map((decisions || []).map((item: any) => [item.request_id, item]));
    const leadById = new Map((leads || []).map((item: any) => [item.id, item]));
    const safeRequests = (requests || []).map((item: any) => {
      const decision: any = decisionByRequest.get(item.id);
      const lead: any = leadById.get(item.lead_id);
      const maySeePrivate = decision?.decision === 'reviewing' || decision?.decision === 'offer_submitted' || item.selected_offer_id;
      return {
        ...item,
        customer_email: maySeePrivate ? item.customer_email : null,
        customer_notes: maySeePrivate ? item.customer_notes : null,
        lead: lead ? {
          ...lead,
          customer_name: maySeePrivate ? lead.customer_name : 'Protected applicant',
          customer_email: maySeePrivate ? lead.customer_email : null,
          address: maySeePrivate ? lead.address : null,
          project_description: maySeePrivate ? lead.project_description : null
        } : null,
        my_decision: decision || null,
        my_offer: (offers || []).find((offer: any) => offer.request_id === item.id) || null
      };
    });

    const safeContracts = (contracts || []).map((contract: any) => ({
      ...contract,
      lead: leadById.get(contract.lead_id) || null
    }));
    return NextResponse.json({ success: true, partner, requests: safeRequests, contracts: safeContracts });
  }

  const { data: requests, error } = await admin
    .from('funding_requests')
    .select('*')
    .eq('customer_user_id', user.id)
    .order('submitted_at', { ascending: false });
  if (error) return jsonError(error.message, 500);

  const requestIds = (requests || []).map((item: any) => item.id);
  const { data: offers } = requestIds.length
    ? await admin.from('funding_offers').select('*, funding_partner_whitelist(display_name,partner_type,verified)').in('request_id', requestIds).in('status', ['submitted', 'selected'])
    : { data: [] as any[] };
  const { data: contracts } = requestIds.length
    ? await admin.from('funding_contracts').select('*, funding_partner_whitelist(display_name,partner_type)').in('request_id', requestIds)
    : { data: [] as any[] };
  const contractIds = (contracts || []).map((item: any) => item.id);
  const { data: installments } = contractIds.length
    ? await admin.from('funding_installments').select('*').in('contract_id', contractIds).order('installment_number')
    : { data: [] as any[] };

  return NextResponse.json({ success: true, requests: requests || [], offers: offers || [], contracts: contracts || [], installments: installments || [] });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Authentication required.', 401);

  const body = await request.json();
  const action = body.action;

  if (action === 'choose_direct') {
    const { data: lead } = await admin.from('leads').select('id,customer_email,funding_request_id,payment_method,provider_paid,installer_paid,provider_balance_paid,installer_balance_paid').eq('id', body.lead_id).maybeSingle();
    if (!lead || lead.customer_email?.toLowerCase() !== user.email) return jsonError('Lead not found.', 404);
    if (lead.funding_request_id) return jsonError('Cancel the financing request before switching to direct payment.', 409);
    if (lead.payment_method === 'financing' || lead.provider_paid || lead.installer_paid || lead.provider_balance_paid || lead.installer_balance_paid) return jsonError('Payment method is already locked for this project.', 409);
    const { data, error } = await admin.from('leads').update({ payment_method: 'direct' }).eq('id', lead.id).select().single();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, updated_lead: data });
  }

  if (action === 'cancel_request') {
    const { data: fundingRequest } = await admin
      .from('funding_requests')
      .select('*')
      .eq('id', body.request_id)
      .eq('customer_user_id', user.id)
      .maybeSingle();
    if (!fundingRequest || !['open', 'under_review', 'offers_available'].includes(fundingRequest.status)) {
      return jsonError('This funding request can no longer be cancelled.', 409);
    }
    await admin.from('funding_offers').update({ status: 'not_selected' }).eq('request_id', fundingRequest.id).eq('status', 'submitted');
    await admin.from('funding_requests').update({ status: 'cancelled' }).eq('id', fundingRequest.id);
    const { data: updatedLead, error } = await admin.from('leads').update({ payment_method: 'direct' }).eq('id', fundingRequest.lead_id).select().single();
    if (error) return jsonError(error.message, 500);
    await event(user, 'customer', 'funding_request_cancelled', fundingRequest.id);

    const { data: notifiedPartners } = await admin
      .from('funding_partner_decisions')
      .select('funding_partner_whitelist(email)')
      .eq('request_id', fundingRequest.id);
    const partnerEmails = (notifiedPartners || []).map((item: any) => item.funding_partner_whitelist?.email).filter(Boolean);
    await sendFundingNotification({
      to: [user.email, ...partnerEmails],
      subject: 'AZPHUR Funding Request Cancelled',
      title: 'Funding Request Cancelled',
      body: '<p>The customer has cancelled this funding request and returned to direct project payment. No further action is required.</p>',
      accent: '#b45309'
    });
    return NextResponse.json({ success: true, updated_lead: updatedLead });
  }

  if (action === 'create_request') {
    const termMonths = Number(body.requested_term_months);
    if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > 240) return jsonError('Invalid requested term.');

    const { data: lead } = await admin.from('leads').select('*').eq('id', body.lead_id).maybeSingle();
    if (!lead || lead.customer_email?.toLowerCase() !== user.email) return jsonError('Lead not found.', 404);
    if (!lead.assigned_provider || !lead.assigned_installer) return jsonError('Select both provider and installer first.', 409);
    if (lead.payment_method === 'direct') return jsonError('Direct payment was already selected for this project.', 409);
    if (lead.provider_paid || lead.installer_paid || lead.provider_balance_paid || lead.installer_balance_paid) return jsonError('Financing cannot start after a project payment was recorded.', 409);
    if (body.customer_consent !== true) return jsonError('Customer consent is required before financial data can be shared.', 409);

    const amounts = projectAmounts(lead);
    if (amounts.projectTotal <= 0) return jsonError('Project allocations are not ready.', 409);

    const { data: fundingRequest, error } = await admin.from('funding_requests').insert({
      lead_id: lead.id,
      customer_user_id: user.id,
      customer_email: user.email,
      requested_amount: amounts.projectTotal,
      requested_term_months: termMonths,
      purpose: body.purpose || 'AZPHUR solar project',
      customer_notes: body.customer_notes || null,
      status: 'open'
    }).select().single();
    if (error) return jsonError(error.code === '23505' ? 'A funding request already exists for this lead.' : error.message, error.code === '23505' ? 409 : 500);

    const { data: updatedLead } = await admin.from('leads').update({
      payment_method: 'financing_pending',
      funding_request_id: fundingRequest.id
    }).eq('id', lead.id).select().single();
    await event(user, 'customer', 'funding_request_created', fundingRequest.id, undefined, { amount: amounts.projectTotal, term_months: termMonths, customer_consent: true });

    const { data: fundingPartners } = await admin
      .from('funding_partner_whitelist')
      .select('email,display_name')
      .eq('access_status', 'active')
      .eq('verified', true);

    for (const fundingPartner of fundingPartners || []) {
      if (!fundingPartner.email) continue;
      await sendFundingNotification({
        to: fundingPartner.email,
        bccAdmins: false,
        subject: `New AZPHUR Funding Request · ${money(amounts.projectTotal)}`,
        title: 'New Funding Opportunity',
        body: `
          <p>Hi <strong>${fundingPartner.display_name || 'Funding Partner'}</strong>,</p>
          <p>A verified AZPHUR customer has requested financing for a clean-energy project.</p>
          <div style="background:#f0f9fa;padding:14px;border-radius:8px;">
            <p style="margin:0;"><strong>Requested amount:</strong> ${money(amounts.projectTotal)}</p>
            <p style="margin:4px 0 0;"><strong>Requested term:</strong> ${termMonths} months</p>
            <p style="margin:4px 0 0;"><strong>Purpose:</strong> ${fundingRequest.purpose}</p>
          </div>
          <p>Open your AZPHUR funding portal to review or decline the request. Customer identity remains protected until you begin the review.</p>
        `
      });
    }
    await sendFundingNotification({
      to: ADMIN_NOTIFY_LIST,
      bccAdmins: false,
      subject: `New AZPHUR Funding Request · ${money(amounts.projectTotal)}`,
      title: 'New Funding Request Broadcast',
      body: `<p>A customer submitted a new funding request for <strong>${money(amounts.projectTotal)}</strong> over <strong>${termMonths} months</strong>.</p><p>The request was broadcast to <strong>${(fundingPartners || []).filter(partner => partner.email).length}</strong> active verified funding partners.</p>`
    });
    return NextResponse.json({ success: true, request: fundingRequest, updated_lead: updatedLead }, { status: 201 });
  }

  if (action === 'partner_decision') {
    const partner = await requireFundingPartner(user);
    if (!partner) return jsonError('Verified funding partner access required.', 403);
    if (!['reviewing', 'declined'].includes(body.decision)) return jsonError('Invalid decision.');

    const { data: fundingRequest } = await admin.from('funding_requests').select('id,status,customer_email,lead_id').eq('id', body.request_id).maybeSingle();
    if (!fundingRequest || !['open', 'under_review', 'offers_available'].includes(fundingRequest.status)) return jsonError('Funding request is not available.', 409);

    const { data, error } = await admin.from('funding_partner_decisions').upsert({
      request_id: fundingRequest.id,
      funding_partner_id: partner.id,
      decision: body.decision,
      reason: body.reason || null,
      decided_at: new Date().toISOString()
    }, { onConflict: 'request_id,funding_partner_id' }).select().single();
    if (error) return jsonError(error.message, 500);
    if (body.decision === 'reviewing' && fundingRequest.status === 'open') {
      await admin.from('funding_requests').update({ status: 'under_review' }).eq('id', fundingRequest.id);
    }
    await event(user, 'funding_partner', `funding_request_${body.decision}`, fundingRequest.id);

    if (body.decision === 'reviewing') {
      const { data: lead } = await admin.from('leads').select('customer_name').eq('id', fundingRequest.lead_id).maybeSingle();
      await sendFundingNotification({
        to: fundingRequest.customer_email,
        subject: `${partner.display_name} is reviewing your AZPHUR funding request`,
        title: 'A Funding Partner Is Interested',
        body: `
          <p>Hi <strong>${lead?.customer_name || 'Valued Customer'}</strong>,</p>
          <p><strong>${partner.display_name}</strong> has confirmed interest and started reviewing your funding request.</p>
          <p><strong>Funding partner email:</strong> ${partner.email}</p>
          <p>Open AZPHUR to follow the request and review any financing offer the partner submits.</p>
        `
      });
    } else {
      await sendFundingNotification({
        to: ADMIN_NOTIFY_LIST,
        bccAdmins: false,
        subject: `${partner.display_name} declined an AZPHUR funding request`,
        title: 'Funding Request Declined by Partner',
        body: `<p><strong>${partner.display_name}</strong> declined funding request ${fundingRequest.id.slice(0, 8).toUpperCase()}.</p><p>The request remains available to other verified funding partners.</p>`,
        accent: '#b45309'
      });
    }
    return NextResponse.json({ success: true, decision: data });
  }

  if (action === 'submit_offer') {
    const partner = await requireFundingPartner(user);
    if (!partner) return jsonError('Verified funding partner access required.', 403);

    const { data: fundingRequest } = await admin.from('funding_requests').select('*').eq('id', body.request_id).maybeSingle();
    if (!fundingRequest || !['open', 'under_review', 'offers_available'].includes(fundingRequest.status)) return jsonError('Funding request is not available.', 409);

    const principal = Number(body.principal_amount);
    const annualRate = Number(body.annual_interest_rate);
    const termMonths = Number(body.term_months);
    const fee = Math.max(Number(body.origination_fee) || 0, 0);
    const termsSummary = String(body.terms_summary || '').trim();
    if (!Number.isFinite(principal) || !Number.isFinite(annualRate)) return jsonError('Invalid financial values.');
    if (principal !== Number(fundingRequest.requested_amount)) return jsonError('The offer must cover the complete requested project amount.');
    if (annualRate < 0 || annualRate > 100) return jsonError('Invalid annual interest rate.');
    if (!termsSummary) return jsonError('Terms summary is required.');
    if (!Number.isInteger(termMonths) || termMonths < partner.minimum_term_months || termMonths > partner.maximum_term_months) return jsonError('Term is outside this partner profile limits.');
    if (principal < Number(partner.minimum_funding_amount || 0) || (partner.maximum_funding_amount && principal > Number(partner.maximum_funding_amount))) return jsonError('Amount is outside this partner profile limits.');

    const installment = monthlyPayment(principal, annualRate, termMonths);
    const totalRepayment = installment * termMonths + fee;
    const expiresAt = new Date(body.expires_at);
    if (!body.expires_at || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) return jsonError('Offer expiry must be in the future.');

    const { data: offer, error } = await admin.from('funding_offers').upsert({
      request_id: fundingRequest.id,
      funding_partner_id: partner.id,
      principal_amount: principal,
      annual_interest_rate: annualRate,
      term_months: termMonths,
      origination_fee: fee,
      estimated_installment: Number(installment.toFixed(2)),
      total_repayment: Number(totalRepayment.toFixed(2)),
      terms_summary: termsSummary,
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      expires_at: expiresAt.toISOString(),
      status: 'submitted'
    }, { onConflict: 'request_id,funding_partner_id' }).select().single();
    if (error) return jsonError(error.message, 500);

    await admin.from('funding_partner_decisions').upsert({ request_id: fundingRequest.id, funding_partner_id: partner.id, decision: 'offer_submitted', decided_at: new Date().toISOString() }, { onConflict: 'request_id,funding_partner_id' });
    await admin.from('funding_requests').update({ status: 'offers_available' }).eq('id', fundingRequest.id);
    await event(user, 'funding_partner', 'funding_offer_submitted', fundingRequest.id, undefined, { offer_id: offer.id });

    const { data: lead } = await admin.from('leads').select('customer_name').eq('id', fundingRequest.lead_id).maybeSingle();
    await sendFundingNotification({
      to: fundingRequest.customer_email,
      subject: `New financing offer from ${partner.display_name}`,
      title: 'A New Funding Offer Is Available',
      body: `
        <p>Hi <strong>${lead?.customer_name || 'Valued Customer'}</strong>,</p>
        <p><strong>${partner.display_name}</strong> has submitted a financing offer for your AZPHUR project.</p>
        <div style="background:#f0f9fa;padding:14px;border-radius:8px;">
          <p style="margin:0;"><strong>Principal:</strong> ${money(principal)}</p>
          <p style="margin:4px 0 0;"><strong>Annual interest rate:</strong> ${annualRate}%</p>
          <p style="margin:4px 0 0;"><strong>Term:</strong> ${termMonths} months</p>
          <p style="margin:4px 0 0;"><strong>Estimated installment:</strong> ${money(offer.estimated_installment)}</p>
        </div>
        <p>Open AZPHUR to review the complete terms before making a decision.</p>
      `
    });
    return NextResponse.json({ success: true, offer });
  }

  if (action === 'select_offer') {
    const { data: fundingRequest } = await admin.from('funding_requests').select('*').eq('id', body.request_id).eq('customer_user_id', user.id).maybeSingle();
    if (!fundingRequest || fundingRequest.status !== 'offers_available') return jsonError('Funding request is not ready for selection.', 409);
    const { data: offer } = await admin.from('funding_offers').select('*').eq('id', body.offer_id).eq('request_id', fundingRequest.id).eq('status', 'submitted').maybeSingle();
    if (!offer || new Date(offer.expires_at) <= new Date()) return jsonError('Offer is unavailable or expired.', 409);

    await admin.from('funding_offers').update({ status: 'not_selected' }).eq('request_id', fundingRequest.id).neq('id', offer.id);
    await admin.from('funding_offers').update({ status: 'selected' }).eq('id', offer.id);
    await admin.from('funding_requests').update({ selected_offer_id: offer.id, status: 'contract_pending' }).eq('id', fundingRequest.id);

    const contractNumber = `AZF-${Date.now()}-${offer.id.slice(0, 6).toUpperCase()}`;
    const { data: contract, error } = await admin.from('funding_contracts').insert({
      contract_number: contractNumber,
      request_id: fundingRequest.id,
      offer_id: offer.id,
      lead_id: fundingRequest.lead_id,
      funding_partner_id: offer.funding_partner_id,
      customer_user_id: user.id,
      principal_amount: offer.principal_amount,
      annual_interest_rate: offer.annual_interest_rate,
      term_months: offer.term_months,
      installment_amount: offer.estimated_installment,
      total_repayment: offer.total_repayment,
      contract_status: 'pending_customer_acceptance'
    }).select().single();
    if (error) return jsonError(error.message, 500);

    await admin.from('leads').update({ funding_contract_id: contract.id }).eq('id', fundingRequest.lead_id);
    await event(user, 'customer', 'funding_offer_selected', fundingRequest.id, contract.id, { offer_id: offer.id });

    const [{ data: selectedFundingPartner }, { data: reviewedPartners }, { data: lead }] = await Promise.all([
      admin.from('funding_partner_whitelist').select('email,display_name').eq('id', offer.funding_partner_id).maybeSingle(),
      admin.from('funding_partner_decisions').select('funding_partner_id,decision,funding_partner_whitelist(email,display_name)').eq('request_id', fundingRequest.id).in('decision', ['reviewing', 'offer_submitted']),
      admin.from('leads').select('customer_name,customer_email').eq('id', fundingRequest.lead_id).maybeSingle()
    ]);

    if (selectedFundingPartner?.email) {
      await sendFundingNotification({
        to: selectedFundingPartner.email,
        subject: `You were selected to finance ${lead?.customer_name || 'an AZPHUR customer'}`,
        title: 'Your Funding Offer Was Selected',
        body: `
          <p>Congratulations, <strong>${selectedFundingPartner.display_name}</strong>.</p>
          <p><strong>${lead?.customer_name || 'The customer'}</strong> (${lead?.customer_email || fundingRequest.customer_email}) selected your financing offer.</p>
          <p>Contract <strong>${contract.contract_number}</strong> is now awaiting customer acceptance. Open your AZPHUR funding portal to begin the financial phase.</p>
        `
      });
    }

    for (const reviewedPartner of reviewedPartners || []) {
      const otherPartner: any = reviewedPartner.funding_partner_whitelist;
      if (!otherPartner?.email || reviewedPartner.funding_partner_id === offer.funding_partner_id) continue;
      await sendFundingNotification({
        to: otherPartner.email,
        subject: 'AZPHUR Funding Request Selection Update',
        title: 'Another Funding Offer Was Selected',
        body: `
          <p>Thank you, <strong>${otherPartner.display_name || 'Funding Partner'}</strong>, for reviewing the request from <strong>${lead?.customer_name || 'this AZPHUR customer'}</strong> (${lead?.customer_email || fundingRequest.customer_email}).</p>
          <p>The customer selected another funding offer. Your account remains active and you can continue receiving other eligible AZPHUR funding requests.</p>
        `,
        accent: '#b45309'
      });
    }
    return NextResponse.json({ success: true, contract });
  }

  if (action === 'accept_contract') {
    const { data: contract } = await admin.from('funding_contracts').select('*').eq('id', body.contract_id).eq('customer_user_id', user.id).eq('contract_status', 'pending_customer_acceptance').maybeSingle();
    if (!contract) return jsonError('Contract is unavailable.', 409);

    const startDate = new Date();
    const firstDueDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate()));
    const payment = Number(contract.installment_amount);
    const monthlyRate = Number(contract.annual_interest_rate) / 100 / 12;
    let balance = Number(contract.principal_amount);
    const installments = [];
    for (let number = 1; number <= Number(contract.term_months); number += 1) {
      const interest = balance * monthlyRate;
      const principal = number === Number(contract.term_months) ? balance : Math.max(payment - interest, 0);
      const dueDate = new Date(Date.UTC(firstDueDate.getUTCFullYear(), firstDueDate.getUTCMonth() + number - 1, firstDueDate.getUTCDate()));
      installments.push({
        contract_id: contract.id,
        funding_partner_id: contract.funding_partner_id,
        installment_number: number,
        due_date: dueDate.toISOString().slice(0, 10),
        principal_component: Number(principal.toFixed(2)),
        interest_component: Number(interest.toFixed(2)),
        amount_due: Number((principal + interest + (number === 1 ? Number(contract.total_repayment) - payment * Number(contract.term_months) : 0)).toFixed(2))
      });
      balance = Math.max(balance - principal, 0);
    }

    const { error: installmentError } = await admin.from('funding_installments').insert(installments);
    if (installmentError) return jsonError(installmentError.message, 500);
    const { data: activeContract, error } = await admin.from('funding_contracts').update({
      contract_status: 'active',
      customer_accepted_at: new Date().toISOString(),
      start_date: startDate.toISOString().slice(0, 10),
      first_due_date: firstDueDate.toISOString().slice(0, 10)
    }).eq('id', contract.id).select().single();
    if (error) return jsonError(error.message, 500);
    await admin.from('funding_requests').update({ status: 'active' }).eq('id', contract.request_id);
    const { data: updatedLead } = await admin.from('leads').update({ payment_method: 'financing' }).eq('id', contract.lead_id).select().single();
    await event(user, 'customer', 'funding_contract_accepted', contract.request_id, contract.id);

    const { data: selectedFundingPartner } = await admin
      .from('funding_partner_whitelist')
      .select('email,display_name')
      .eq('id', contract.funding_partner_id)
      .maybeSingle();
    await sendFundingNotification({
      to: uniqueEmails([user.email, selectedFundingPartner?.email]),
      subject: `AZPHUR Funding Contract ${contract.contract_number} Is Active`,
      title: 'Funding Contract Activated',
      body: `
        <p>The customer accepted contract <strong>${contract.contract_number}</strong>. The financing phase is now active.</p>
        <div style="background:#f0f9fa;padding:14px;border-radius:8px;">
          <p style="margin:0;"><strong>Principal:</strong> ${money(contract.principal_amount)}</p>
          <p style="margin:4px 0 0;"><strong>Term:</strong> ${contract.term_months} months</p>
          <p style="margin:4px 0 0;"><strong>Monthly installment:</strong> ${money(contract.installment_amount)}</p>
          <p style="margin:4px 0 0;"><strong>First due date:</strong> ${firstDueDate.toISOString().slice(0, 10)}</p>
        </div>
        <p>The selected funding partner may now fund the eligible AZPHUR project milestones.</p>
      `
    });
    return NextResponse.json({ success: true, contract: activeContract, updated_lead: updatedLead });
  }

  if (action === 'fund_milestone') {
    const partner = await requireFundingPartner(user);
    if (!partner) return jsonError('Verified funding partner access required.', 403);
    if (!['project_downpayment', 'project_final'].includes(body.milestone)) return jsonError('Invalid milestone.');

    const { data: contract } = await admin.from('funding_contracts').select('*').eq('id', body.contract_id).eq('funding_partner_id', partner.id).eq('contract_status', 'active').maybeSingle();
    if (!contract) return jsonError('Active contract not found.', 404);
    const { data: lead } = await admin.from('leads').select('*').eq('id', contract.lead_id).eq('payment_method', 'financing').maybeSingle();
    if (!lead) return jsonError('Financed lead not found.', 404);
    const amounts = projectAmounts(lead);

    const isFinal = body.milestone === 'project_final';
    if (!isFinal && (lead.provider_paid || lead.installer_paid)) return jsonError('Project down payment was already funded.', 409);
    if (isFinal && (lead.provider_balance_paid || lead.installer_balance_paid)) return jsonError('Project final balance was already funded.', 409);
    if (isFinal && (!lead.provider_paid || !lead.installer_paid)) return jsonError('Project down payment must be funded first.', 409);
    if (isFinal && (!lead.provider_balance_unlocked || !lead.installer_balance_unlocked)) return jsonError('Both final allocations must be unlocked.', 409);

    const providerAllocation = isFinal ? amounts.providerFinal : amounts.providerDownpayment;
    const installerAllocation = isFinal ? amounts.installerFinal : amounts.installerDownpayment;
    if (providerAllocation <= 0 || installerAllocation <= 0) return jsonError('Both partner allocations must be ready.', 409);

    const { data: disbursement, error } = await admin.from('funding_disbursements').upsert({
      contract_id: contract.id,
      lead_id: lead.id,
      funding_partner_id: partner.id,
      milestone: body.milestone,
      provider_allocation: providerAllocation,
      installer_allocation: installerAllocation,
      total_amount: providerAllocation + installerAllocation,
      status: 'mock_funded',
      gateway: 'mock',
      gateway_reference: `MOCK-${Date.now()}`,
      funded_at: new Date().toISOString()
    }, { onConflict: 'contract_id,milestone' }).select().single();
    if (error) return jsonError(error.message, 500);

    const leadUpdate = isFinal
      ? { provider_balance_paid: true, installer_balance_paid: true, status: 'PROJECT_COMPLETED_MOCK' }
      : { provider_paid: true, installer_paid: true, status: 'PROJECT_DOWNPAYMENT_PAID_MOCK' };
    const { data: updatedLead } = await admin.from('leads').update(leadUpdate).eq('id', lead.id).select().single();
    await event(user, 'funding_partner', `milestone_${body.milestone}_mock_funded`, contract.request_id, contract.id, { disbursement_id: disbursement.id });

    const milestoneLabel = isFinal ? 'project final balance' : 'project down payment';
    await sendFundingNotification({
      to: uniqueEmails([lead.customer_email, lead.provider_email, lead.installer_email, partner.email]),
      subject: `AZPHUR ${isFinal ? 'Final Balance' : 'Down Payment'} Funded`,
      title: 'Project Milestone Funded',
      body: `
        <p><strong>${partner.display_name}</strong> funded the <strong>${milestoneLabel}</strong> for this AZPHUR project.</p>
        <div style="background:#f0f9fa;padding:14px;border-radius:8px;">
          <p style="margin:0;"><strong>Provider allocation:</strong> ${money(providerAllocation)}</p>
          <p style="margin:4px 0 0;"><strong>Installer allocation:</strong> ${money(installerAllocation)}</p>
          <p style="margin:4px 0 0;"><strong>Total funded:</strong> ${money(providerAllocation + installerAllocation)}</p>
        </div>
        <p>Open AZPHUR to review the updated project status.</p>
        <p style="padding:10px;background:#fef9c3;color:#854d0e;border-radius:6px;font-weight:bold;">TEST MODE — NO REAL MONEY MOVED.</p>
      `
    });
    return NextResponse.json({ success: true, payment_mode: 'mock', disbursement, updated_lead: updatedLead });
  }

  if (action === 'pay_installment') {
    const { data: installment } = await admin.from('funding_installments').select('*, funding_contracts!inner(customer_user_id,request_id)').eq('id', body.installment_id).maybeSingle();
    if (!installment || installment.funding_contracts?.customer_user_id !== user.id) return jsonError('Installment not found.', 404);
    if (!['scheduled', 'due', 'late'].includes(installment.status)) return jsonError('Installment cannot be paid.', 409);
    const { data, error } = await admin.from('funding_installments').update({
      status: 'mock_paid',
      amount_paid: installment.amount_due,
      gateway: 'mock',
      gateway_reference: `MOCK-REPAY-${Date.now()}`,
      paid_at: new Date().toISOString()
    }).eq('id', installment.id).select().single();
    if (error) return jsonError(error.message, 500);
    await event(user, 'customer', 'installment_mock_paid', installment.funding_contracts.request_id, installment.contract_id, { installment_id: installment.id });

    const { data: fundingPartner } = await admin
      .from('funding_partner_whitelist')
      .select('email,display_name')
      .eq('id', installment.funding_partner_id)
      .maybeSingle();
    await sendFundingNotification({
      to: uniqueEmails([user.email, fundingPartner?.email]),
      subject: `AZPHUR Installment ${installment.installment_number} Recorded`,
      title: 'Installment Payment Confirmed',
      body: `
        <p>Installment <strong>#${installment.installment_number}</strong> has been recorded for the AZPHUR funding contract.</p>
        <p><strong>Amount:</strong> ${money(installment.amount_due)}</p>
        <p>Open AZPHUR to review the repayment schedule and updated installment status.</p>
        <p style="padding:10px;background:#fef9c3;color:#854d0e;border-radius:6px;font-weight:bold;">TEST MODE — NO REAL MONEY MOVED.</p>
      `
    });
    return NextResponse.json({ success: true, payment_mode: 'mock', installment: data });
  }

  if (action === 'update_partner_profile') {
    const partner = await requireFundingPartner(user);
    if (!partner) return jsonError('Verified funding partner access required.', 403);
    const allowed = {
      display_name: body.display_name || partner.display_name,
      contact_name: body.contact_name || null,
      public_contact_email: body.public_contact_email || null,
      contact_phone: body.contact_phone || null,
      website: body.website || null,
      public_description: body.public_description || null,
      headquarters_address: body.headquarters_address || null,
      country: body.country || null
    };
    const { data, error } = await admin.from('funding_partner_whitelist').update(allowed).eq('id', partner.id).select().single();
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, partner: data });
  }

  return jsonError('Unsupported funding action.', 400);
}
