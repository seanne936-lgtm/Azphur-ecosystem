import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

type PartnerType = 'provider' | 'installer';
type PartnerIdentity = { type: PartnerType; name: string; email: string };

const normalize = (value: unknown) => String(value || '').toLowerCase().replace(/[\s_-]/g, '').trim();

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

async function getIdentity(request: Request): Promise<PartnerIdentity | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return null;

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const email = authData.user?.email?.trim().toLowerCase();
  if (authError || !email) return null;

  const [{ data: provider }, { data: installer }] = await Promise.all([
    admin.from('partner_whitelist').select('email, provider_name').eq('email', email).maybeSingle(),
    admin.from('installers_whitelist').select('email, installer_name').eq('email', email).maybeSingle()
  ]);

  if (provider?.provider_name) return { type: 'provider', name: provider.provider_name.trim(), email };
  if (installer?.installer_name) return { type: 'installer', name: installer.installer_name.trim(), email };
  return null;
}

function previewLead(lead: Record<string, any>) {
  return {
    id: lead.id,
    created_at: lead.created_at,
    status: lead.status,
    objective: lead.objective,
    roof_type: lead.roof_type,
    monthly_bill: lead.monthly_bill,
    project_description: lead.project_description,
    partner_accepted_by: lead.partner_accepted_by,
    installer_accepted_by: lead.installer_accepted_by,
    assigned_provider: lead.assigned_provider,
    assigned_installer: lead.assigned_installer,
    access_level: 'preview'
  };
}

export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request);
    if (!identity) return NextResponse.json({ success: false, error: 'Partner authentication required.' }, { status: 401 });

    const { data: leads, error: leadsError } = await admin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (leadsError) throw leadsError;

    const ownName = normalize(identity.name);
    const visibleLeads = (leads || []).flatMap((lead: Record<string, any>) => {
      const assigned = normalize(identity.type === 'provider' ? lead.assigned_provider : lead.assigned_installer);
      if (assigned && assigned !== ownName) return [];

      const acceptedBy = toList(identity.type === 'provider' ? lead.partner_accepted_by : lead.installer_accepted_by);
      // This is an authorised B2B evaluation pool: a verified provider or installer
      // needs the complete request (including contacts and site material) to assess it
      // before accepting. Once an entity is assigned to another partner, the lead is
      // no longer returned to this account.
      return [{ ...lead, access_level: 'full' }];
    });

    const proposalTable = identity.type === 'provider' ? 'provider_proposals' : 'installer_proposals';
    const { data: ownProposals, error: proposalError } = await admin
      .from(proposalTable)
      .select('*')
      .eq('entity_name', identity.name);
    if (proposalError) throw proposalError;

    return NextResponse.json({
      success: true,
      entity_type: identity.type,
      leads: visibleLeads,
      provider_proposals: identity.type === 'provider' ? ownProposals || [] : [],
      installer_proposals: identity.type === 'installer' ? ownProposals || [] : []
    });
  } catch (error: any) {
    console.error('Partner lead retrieval failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load partner leads.' }, { status: 500 });
  }
}
