"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const money = (value: unknown) => `₱${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type OfferDraft = {
  annual_interest_rate: string;
  term_months: string;
  origination_fee: string;
  expires_at: string;
  terms_summary: string;
  requirements: string;
};

const initialOffer = (): OfferDraft => ({
  annual_interest_rate: '',
  term_months: '12',
  origination_fee: '0',
  expires_at: '',
  terms_summary: '',
  requirements: ''
});

export default function AZPHURFundingPartnerPortal() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [publicPartners, setPublicPartners] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [offerDrafts, setOfferDrafts] = useState<Record<string, OfferDraft>>({});
  const [profileDraft, setProfileDraft] = useState<any>({});

  const api = useCallback(async (payload?: any, query = 'scope=partner') => {
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`/api/v1/funding-engine${payload ? '' : `?${query}`}`, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: payload ? JSON.stringify(payload) : undefined
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Funding Engine request failed.');
    return data;
  }, []);

  const loadPublicPartners = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/funding-engine?scope=public');
      const data = await response.json();
      setPublicPartners(response.ok && data.success ? data.partners || [] : []);
    } catch {
      setPublicPartners([]);
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api();
      setPartner(data.partner);
      setRequests(data.requests || []);
      setContracts(data.contracts || []);
      setProfileDraft({
        display_name: data.partner?.display_name || '',
        contact_name: data.partner?.contact_name || '',
        public_contact_email: data.partner?.public_contact_email || '',
        contact_phone: data.partner?.contact_phone || '',
        website: data.partner?.website || '',
        public_description: data.partner?.public_description || '',
        headquarters_address: data.partner?.headquarters_address || '',
        country: data.partner?.country || ''
      });
      setMessage('');
    } catch (error: any) {
      setPartner(null);
      setRequests([]);
      setContracts([]);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadPublicPartners();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadDashboard(); else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) loadDashboard();
      else {
        setPartner(null);
        setRequests([]);
        setContracts([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadDashboard, loadPublicPartners]);

  useEffect(() => {
    if (!session || !partner) return;
    const timer = window.setInterval(loadDashboard, 20000);
    return () => window.clearInterval(timer);
  }, [session, partner, loadDashboard]);

  const stats = useMemo(() => ({
    open: requests.filter(item => ['open', 'under_review', 'offers_available'].includes(item.status)).length,
    offered: requests.filter(item => item.my_offer?.status === 'submitted').length,
    active: contracts.filter(item => item.contract_status === 'active').length,
    portfolio: contracts.filter(item => item.contract_status === 'active').reduce((sum, item) => sum + Number(item.principal_amount || 0), 0)
  }), [requests, contracts]);

  const run = async (key: string, payload: any) => {
    try {
      setBusy(key);
      setMessage('');
      await api(payload);
      await loadDashboard();
      if (payload.action === 'update_partner_profile') await loadPublicPartners();
      setMessage('Action completed successfully.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(null);
    }
  };

  const submitOffer = async (request: any) => {
    const draft = offerDrafts[request.id] || initialOffer();
    await run(`offer-${request.id}`, {
      action: 'submit_offer',
      request_id: request.id,
      principal_amount: request.requested_amount,
      annual_interest_rate: Number(draft.annual_interest_rate),
      term_months: Number(draft.term_months),
      origination_fee: Number(draft.origination_fee),
      expires_at: draft.expires_at,
      terms_summary: draft.terms_summary,
      requirements: draft.requirements.split('\n').map(item => item.trim()).filter(Boolean)
    });
  };

  const updateDraft = (requestId: string, field: keyof OfferDraft, value: string) => {
    setOfferDrafts(previous => ({
      ...previous,
      [requestId]: { ...(previous[requestId] || initialOffer()), [field]: value }
    }));
  };

  return (
    <main style={styles.page}>
      <button style={styles.homeButton} onClick={() => router.push('/')}>← BACK TO HOME</button>
      <header style={styles.header}>
        <div style={styles.logoGroup} onClick={() => router.push('/')}>
          <img src="/logo-azphur.avif" alt="AZPHUR Logo" style={styles.logo} />
          <div style={styles.slogan}>Shaping Sustainable Possibilities</div>
          <span style={styles.statusOrb} />
          <span style={styles.statusTag}>FUNDING NETWORK</span>
        </div>
        {session
          ? <button style={styles.secondaryButton} onClick={() => supabase.auth.signOut()}>SIGN OUT</button>
          : <button style={styles.loginButton} onClick={() => router.push('/login')}>LOG IN</button>}
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>AZPHUR FUNDING NETWORK</div>
        <h1 style={styles.title}>Capital connected to verified clean-energy projects.</h1>
        <p style={styles.heroText}>Funding partners review independent project requests, issue their own financing terms and fund approved AZPHUR milestones. Credit decisions and borrower repayment contracts remain between the customer and the funding partner.</p>
        <div style={styles.warning}>TEST ENVIRONMENT — NO REAL CREDIT APPROVAL, DISBURSEMENT OR REPAYMENT</div>
      </section>

      <section style={styles.directorySection}>
        <div style={styles.directoryHeader}>
          <div>
            <div style={styles.eyebrow}>VERIFIED NETWORK DIRECTORY</div>
            <h2 style={styles.directoryTitle}>Meet our funding partners.</h2>
            <p style={styles.heroText}>Explore verified organizations participating in the AZPHUR funding network. Financing eligibility and final credit approval remain with each independent partner.</p>
          </div>
          <div style={styles.networkCount}>{publicPartners.length} VERIFIED</div>
        </div>

        {publicLoading ? (
          <div style={styles.emptyDirectory}>LOADING VERIFIED FUNDERS...</div>
        ) : publicPartners.length === 0 ? (
          <div style={styles.emptyDirectory}>Verified funding partners will appear here once activated by AZPHUR.</div>
        ) : (
          <div style={styles.partnerGrid}>
            {publicPartners.map(publicPartner => (
              <article key={publicPartner.id} style={styles.partnerCard}>
                <div style={styles.partnerCardTop}>
                  <div style={styles.partnerMark}>{String(publicPartner.display_name || 'F').charAt(0).toUpperCase()}</div>
                  <span style={styles.verified}>✓ VERIFIED</span>
                </div>
                <div style={styles.partnerType}>{String(publicPartner.partner_type || 'funding partner').replace(/_/g, ' ')}</div>
                <h3 style={styles.partnerName}>{publicPartner.display_name}</h3>
                <div style={styles.legalName}>{publicPartner.legal_name}</div>
                <p style={styles.partnerDescription}>{publicPartner.public_description || 'Verified funding partner within the AZPHUR clean-energy network.'}</p>
                <div style={styles.contactList}>
                  {(publicPartner.headquarters_address || publicPartner.country) && <div style={styles.contactRow}><span style={styles.contactLabel}>LOCATION</span><strong>{[publicPartner.headquarters_address, publicPartner.country].filter(Boolean).join(', ')}</strong></div>}
                  {publicPartner.contact_name && <div style={styles.contactRow}><span style={styles.contactLabel}>CONTACT</span><strong>{publicPartner.contact_name}</strong></div>}
                  {publicPartner.public_contact_email && <div style={styles.contactRow}><span style={styles.contactLabel}>EMAIL</span><a style={styles.contactLink} href={`mailto:${publicPartner.public_contact_email}`}>{publicPartner.public_contact_email}</a></div>}
                  {publicPartner.contact_phone && <div style={styles.contactRow}><span style={styles.contactLabel}>PHONE</span><a style={styles.contactLink} href={`tel:${publicPartner.contact_phone}`}>{publicPartner.contact_phone}</a></div>}
                  {publicPartner.website && <div style={styles.contactRow}><span style={styles.contactLabel}>WEBSITE</span><a style={styles.contactLink} href={/^https?:\/\//i.test(publicPartner.website) ? publicPartner.website : `https://${publicPartner.website}`} target="_blank" rel="noopener noreferrer">Visit website</a></div>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {session && (loading ? (
        <section style={styles.card}>LOADING FUNDING NETWORK...</section>
      ) : !partner ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Access unavailable</h2>
          <p style={styles.muted}>{message || 'This account is not an active verified funding partner.'}</p>
        </section>
      ) : (
        <>
          <section style={styles.identityBar}>
            <div><div style={styles.eyebrow}>VERIFIED FUNDING PARTNER</div><h2 style={{ margin: '4px 0' }}>{partner.display_name}</h2><div style={styles.muted}>{partner.legal_name} · {partner.partner_type}</div></div>
            <div style={styles.verified}>✓ VERIFIED</div>
          </section>

          <section style={styles.statsGrid}>
            <Stat label="OPEN REQUESTS" value={stats.open} />
            <Stat label="MY LIVE OFFERS" value={stats.offered} />
            <Stat label="ACTIVE CONTRACTS" value={stats.active} />
            <Stat label="MOCK PORTFOLIO" value={money(stats.portfolio)} />
          </section>

          {message && <div style={styles.message}>{message}</div>}

          <section style={styles.card}>
            <div style={styles.sectionHeader}><div><div style={styles.eyebrow}>PRIVATE PROFILE</div><h2 style={styles.sectionTitle}>Partner information</h2></div><div style={styles.muted}>Verified financial limits can only be changed by AZPHUR Admin.</div></div>
            <div style={styles.formGridTwo}>
              <label style={styles.label}>PUBLIC DISPLAY NAME<input style={styles.input} value={profileDraft.display_name || ''} onChange={event => setProfileDraft({ ...profileDraft, display_name: event.target.value })} /></label>
              <label style={styles.label}>CONTACT NAME<input style={styles.input} value={profileDraft.contact_name || ''} onChange={event => setProfileDraft({ ...profileDraft, contact_name: event.target.value })} /></label>
              <label style={styles.label}>PUBLIC CONTACT EMAIL<input style={styles.input} type="email" value={profileDraft.public_contact_email || ''} onChange={event => setProfileDraft({ ...profileDraft, public_contact_email: event.target.value })} /></label>
              <label style={styles.label}>CONTACT PHONE<input style={styles.input} value={profileDraft.contact_phone || ''} onChange={event => setProfileDraft({ ...profileDraft, contact_phone: event.target.value })} /></label>
              <label style={styles.label}>WEBSITE<input style={styles.input} value={profileDraft.website || ''} onChange={event => setProfileDraft({ ...profileDraft, website: event.target.value })} /></label>
              <label style={styles.label}>HEADQUARTERS / LOCATION<input style={styles.input} value={profileDraft.headquarters_address || ''} onChange={event => setProfileDraft({ ...profileDraft, headquarters_address: event.target.value })} /></label>
              <label style={styles.label}>COUNTRY<input style={styles.input} value={profileDraft.country || ''} onChange={event => setProfileDraft({ ...profileDraft, country: event.target.value })} /></label>
              <label style={styles.label}>PUBLIC DESCRIPTION<textarea style={styles.textarea} value={profileDraft.public_description || ''} onChange={event => setProfileDraft({ ...profileDraft, public_description: event.target.value })} /></label>
            </div>
            <button style={styles.secondaryButton} disabled={busy === 'profile'} onClick={() => run('profile', { action: 'update_partner_profile', ...profileDraft })}>SAVE PROFILE</button>
          </section>

          <section style={styles.card}>
            <div style={styles.eyebrow}>LIVE MATCHING QUEUE</div>
            <h2 style={styles.sectionTitle}>Customer funding requests</h2>
            {requests.length === 0 ? <p style={styles.muted}>No eligible requests are currently available.</p> : requests.map(request => {
              const draft = offerDrafts[request.id] || initialOffer();
              const reviewing = request.my_decision?.decision === 'reviewing';
              const declined = request.my_decision?.decision === 'declined';
              return (
                <article key={request.id} style={styles.requestCard}>
                  <div style={styles.sectionHeader}>
                    <div><div style={styles.eyebrow}>REQUEST {request.id.slice(0, 8).toUpperCase()}</div><h3 style={{ margin: '4px 0' }}>{request.lead?.customer_name || 'Protected applicant'}</h3><div style={styles.muted}>{request.lead?.assigned_provider} + {request.lead?.assigned_installer}</div></div>
                    <div style={styles.amount}>{money(request.requested_amount)}</div>
                  </div>
                  <div style={styles.detailGrid}>
                    <Detail label="Requested term" value={`${request.requested_term_months} months`} />
                    <Detail label="Status" value={request.status} />
                    <Detail label="Project" value={request.purpose} />
                    <Detail label="Customer email" value={request.customer_email || 'Unlock after starting review'} />
                    <Detail label="Address" value={request.lead?.address || 'Protected'} />
                    <Detail label="Description" value={request.lead?.project_description || 'Not provided'} />
                  </div>

                  {!request.my_decision && (
                    <div style={styles.actions}>
                      <button style={styles.primaryButton} disabled={busy !== null} onClick={() => run(`review-${request.id}`, { action: 'partner_decision', request_id: request.id, decision: 'reviewing' })}>REVIEW REQUEST</button>
                      <button style={styles.dangerButton} disabled={busy !== null} onClick={() => run(`decline-${request.id}`, { action: 'partner_decision', request_id: request.id, decision: 'declined', reason: 'Outside current funding criteria' })}>DECLINE</button>
                    </div>
                  )}

                  {declined && <div style={styles.declined}>DECLINED BY THIS FUNDING PARTNER</div>}

                  {(reviewing || request.my_offer) && (
                    <div style={styles.offerBox}>
                      <div style={styles.eyebrow}>CREATE INDEPENDENT FINANCING OFFER</div>
                      <div style={styles.formGridTwo}>
                        <label style={styles.label}>ANNUAL INTEREST RATE (%)<input style={styles.input} type="number" min="0" max="100" step="0.01" value={draft.annual_interest_rate} onChange={event => updateDraft(request.id, 'annual_interest_rate', event.target.value)} /></label>
                        <label style={styles.label}>TERM (MONTHS)<input style={styles.input} type="number" min={partner.minimum_term_months} max={partner.maximum_term_months} value={draft.term_months} onChange={event => updateDraft(request.id, 'term_months', event.target.value)} /></label>
                        <label style={styles.label}>ORIGINATION FEE<input style={styles.input} type="number" min="0" value={draft.origination_fee} onChange={event => updateDraft(request.id, 'origination_fee', event.target.value)} /></label>
                        <label style={styles.label}>OFFER EXPIRY<input style={styles.input} type="datetime-local" value={draft.expires_at} onChange={event => updateDraft(request.id, 'expires_at', event.target.value)} /></label>
                        <label style={styles.label}>TERMS SUMMARY<textarea style={styles.textarea} value={draft.terms_summary} onChange={event => updateDraft(request.id, 'terms_summary', event.target.value)} /></label>
                        <label style={styles.label}>REQUIREMENTS — ONE PER LINE<textarea style={styles.textarea} value={draft.requirements} onChange={event => updateDraft(request.id, 'requirements', event.target.value)} /></label>
                      </div>
                      <button style={styles.primaryButton} disabled={busy !== null || !draft.terms_summary} onClick={() => submitOffer(request)}>{request.my_offer ? 'UPDATE OFFER' : 'SUBMIT OFFER'}</button>
                      {request.my_offer && <div style={styles.offerSummary}>Current offer: {request.my_offer.annual_interest_rate}% · {request.my_offer.term_months} months · {money(request.my_offer.estimated_installment)}/month</div>}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section style={styles.card}>
            <div style={styles.eyebrow}>CONTRACT OPERATIONS</div>
            <h2 style={styles.sectionTitle}>Approved funding contracts</h2>
            {contracts.length === 0 ? <p style={styles.muted}>No selected contracts yet.</p> : contracts.map(contract => {
              const projectLead = contract.lead;
              const downpaymentFunded = Boolean(projectLead?.provider_paid && projectLead?.installer_paid);
              const finalFunded = Boolean(projectLead?.provider_balance_paid && projectLead?.installer_balance_paid);
              const finalReleased = Boolean(projectLead?.provider_balance_unlocked && projectLead?.installer_balance_unlocked);
              const downpaymentReady = Number(projectLead?.provider_downpayment || 0) > 0 && Number(projectLead?.installer_downpayment || 0) > 0;
              return (
              <article key={contract.id} style={styles.requestCard}>
                <div style={styles.sectionHeader}><div><strong>{contract.contract_number}</strong><div style={styles.muted}>{contract.contract_status}</div></div><div style={styles.amount}>{money(contract.principal_amount)}</div></div>
                <div style={styles.detailGrid}>
                  <Detail label="Annual rate" value={`${contract.annual_interest_rate}%`} />
                  <Detail label="Duration" value={`${contract.term_months} months`} />
                  <Detail label="Installment" value={money(contract.installment_amount)} />
                  <Detail label="Total repayment" value={money(contract.total_repayment)} />
                </div>
                {contract.contract_status === 'active' && (
                  <div style={styles.actions}>
                    {!downpaymentFunded && (downpaymentReady ? (
                      <button style={styles.primaryButton} disabled={busy !== null} onClick={() => run(`fund-down-${contract.id}`, { action: 'fund_milestone', contract_id: contract.id, milestone: 'project_downpayment' })}>MOCK FUND PROJECT DOWN PAYMENT</button>
                    ) : (
                      <div style={styles.muted}>Waiting for both project down-payment allocations.</div>
                    ))}
                    {downpaymentFunded && !finalFunded && (finalReleased ? (
                      <button style={styles.secondaryButton} disabled={busy !== null} onClick={() => run(`fund-final-${contract.id}`, { action: 'fund_milestone', contract_id: contract.id, milestone: 'project_final' })}>MOCK FUND PROJECT FINAL</button>
                    ) : (
                      <div style={styles.muted}>Final balance remains locked until both provider and installer release it.</div>
                    ))}
                    {finalFunded && <div style={styles.offerSummary}>✓ ALL PROJECT FUNDING MILESTONES RECORDED</div>}
                  </div>
                )}
              </article>
              );
            })}
          </section>
        </>
      ))}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div style={styles.stat}><div style={styles.eyebrow}>{label}</div><div style={styles.statValue}>{value}</div></div>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div style={styles.detail}><div style={styles.detailLabel}>{label}</div><div>{value || '—'}</div></div>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f3f4f6', color: '#111827', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif', padding: '24px 0 60px' },
  homeButton: { position: 'fixed', top: 20, left: 20, zIndex: 20, border: '1px solid #22d3ee', borderRadius: 10, background: '#ffffff', color: '#0891b2', padding: '9px 12px', fontSize: 9, fontWeight: 950, cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' },
  header: { maxWidth: 1400, margin: '0 auto', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: '24px clamp(18px,4vw,50px)', borderBottom: '1px solid rgba(0,0,0,0.04)', borderRadius: '0 0 24px 24px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logo: { width: 'auto', height: 28, objectFit: 'contain' },
  slogan: { color: '#06b6d4', fontSize: 10, fontWeight: 800 },
  statusOrb: { width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', flexShrink: 0 },
  statusTag: { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: 6, fontSize: 8, fontWeight: 800 },
  loginButton: { border: 0, borderRadius: 12, background: '#111827', color: '#ffffff', padding: '10px 22px', fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  hero: { maxWidth: 1120, margin: '24px auto 28px', padding: 'clamp(38px,7vw,72px) clamp(20px,5vw,58px)', boxSizing: 'border-box', borderRadius: 32, background: 'linear-gradient(160deg,#d9f4f2 0%,#eefaf5 55%,#f7fdf8 100%)', boxShadow: '0 20px 45px rgba(6,182,212,0.10)' },
  eyebrow: { color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontSize: 'clamp(30px,6vw,60px)', lineHeight: 1.04, letterSpacing: '-0.035em', maxWidth: 900, margin: '12px 0', color: '#111827' },
  heroText: { maxWidth: 850, color: '#4b5563', lineHeight: 1.7, fontWeight: 500 },
  warning: { display: 'inline-block', marginTop: 18, padding: '9px 12px', border: '1px solid #f59e0b', color: '#92400e', background: '#fffbeb', borderRadius: 8, fontSize: 10, fontWeight: 900 },
  directorySection: { maxWidth: 1120, margin: '0 auto 28px', padding: 'clamp(20px,4vw,32px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 24, background: '#ffffff', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
  directoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 22 },
  directoryTitle: { margin: '7px 0', color: '#111827', fontSize: 'clamp(24px,4vw,38px)' },
  networkCount: { color: '#0891b2', border: '1px solid #22d3ee', background: '#d9f4f2', borderRadius: 999, padding: '8px 12px', fontSize: 9, fontWeight: 950 },
  emptyDirectory: { padding: 35, border: '1px dashed #cbd5e1', borderRadius: 14, textAlign: 'center', color: '#6b7280', background: '#f9fafb', fontSize: 11 },
  partnerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 },
  partnerCard: { display: 'flex', flexDirection: 'column', minHeight: 290, padding: 20, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, background: '#ffffff', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  partnerCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  partnerMark: { width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#06b6d4', color: '#ffffff', fontSize: 20, fontWeight: 950 },
  partnerType: { marginTop: 18, color: '#06b6d4', fontSize: 8, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase' },
  partnerName: { margin: '5px 0 2px', color: '#111827', fontSize: 20 },
  legalName: { color: '#9ca3af', fontSize: 9 },
  partnerDescription: { flex: 1, color: '#4b5563', fontSize: 10, lineHeight: 1.65 },
  contactList: { display: 'grid', gap: 8, paddingTop: 13, borderTop: '1px solid #f3f4f6', fontSize: 9 },
  contactRow: { display: 'grid', gridTemplateColumns: '72px minmax(0,1fr)', gap: 8, alignItems: 'start', color: '#1f2937', wordBreak: 'break-word' },
  contactLabel: { color: '#06b6d4', fontSize: 8, fontWeight: 950, letterSpacing: 0.8 },
  contactLink: { color: '#0891b2', textDecoration: 'none', fontWeight: 800 },
  card: { maxWidth: 1120, margin: '18px auto', padding: 'clamp(18px,4vw,30px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 24, background: '#ffffff', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' },
  loginCard: { maxWidth: 560, margin: '20px auto', padding: 30, border: '1px solid #22d3ee', borderRadius: 20, background: '#ffffff' },
  identityBar: { maxWidth: 1120, margin: '0 auto 18px', padding: 22, display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, background: 'linear-gradient(135deg,#ffffff 0%,#f0fdfa 100%)', boxShadow: '0 10px 30px rgba(6,182,212,0.06)' },
  verified: { color: '#047857', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 12px', borderRadius: 999, fontSize: 10, fontWeight: 900 },
  statsGrid: { maxWidth: 1120, margin: '0 auto 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 },
  stat: { padding: 18, background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.02)' },
  statValue: { fontSize: 24, fontWeight: 950, marginTop: 8 },
  sectionTitle: { margin: '6px 0 14px', fontSize: 22 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  formGrid: { display: 'grid', gap: 14 },
  formGridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '14px 0' },
  label: { display: 'grid', gap: 6, color: '#4b5563', fontSize: 9, fontWeight: 900, letterSpacing: 1 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 12, background: '#ffffff', color: '#111827', padding: 11, outlineColor: '#06b6d4' },
  textarea: { width: '100%', minHeight: 82, boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 12, background: '#ffffff', color: '#111827', padding: 11, resize: 'vertical', outlineColor: '#06b6d4' },
  primaryButton: { border: 0, borderRadius: 12, background: '#111827', color: '#ffffff', padding: '11px 15px', fontSize: 9, fontWeight: 950, cursor: 'pointer' },
  secondaryButton: { border: '1px solid #22d3ee', borderRadius: 12, background: '#ffffff', color: '#0891b2', padding: '10px 14px', fontSize: 9, fontWeight: 950, cursor: 'pointer' },
  dangerButton: { border: '1px solid #ef4444', borderRadius: 12, background: '#fff1f2', color: '#dc2626', padding: '10px 14px', fontSize: 9, fontWeight: 950, cursor: 'pointer' },
  message: { maxWidth: 1120, margin: '12px auto', padding: 12, borderRadius: 12, background: '#cffafe', color: '#155e75', fontSize: 11 },
  muted: { color: '#6b7280', fontSize: 11, lineHeight: 1.5 },
  requestCard: { padding: 18, marginTop: 14, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16 },
  amount: { color: '#0891b2', fontSize: 22, fontWeight: 950 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 14 },
  detail: { padding: 10, borderRadius: 12, background: '#ffffff', border: '1px solid #f3f4f6', color: '#374151', fontSize: 11 },
  detailLabel: { color: '#06b6d4', textTransform: 'uppercase', fontSize: 8, fontWeight: 900, marginBottom: 4 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  declined: { marginTop: 14, padding: 10, color: '#dc2626', background: '#fff1f2', borderRadius: 12, fontSize: 9, fontWeight: 900 },
  offerBox: { marginTop: 15, padding: 16, border: '1px solid rgba(6,182,212,0.25)', borderRadius: 16, background: '#f0fdfa' },
  offerSummary: { marginTop: 10, color: '#047857', fontSize: 10, fontWeight: 800 }
};
