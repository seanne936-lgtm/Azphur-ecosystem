"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';

const money = (value: unknown) => `₱${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Props = {
  lead: any;
  session: any;
  canRequestFinancing: boolean;
  onLeadUpdated: (updatedLead: any) => void;
};

export default function AZPHURFundingOptionsPanel({ lead, session, canRequestFinancing, onLeadUpdated }: Props) {
  const [data, setData] = useState<any>({ requests: [], offers: [], contracts: [], installments: [] });
  const [termMonths, setTermMonths] = useState('12');
  const [notes, setNotes] = useState('');
  const [customerConsent, setCustomerConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const request = useMemo(
    () => data.requests?.find((item: any) => item.lead_id === lead.id && !['cancelled', 'declined'].includes(item.status)) || null,
    [data.requests, lead.id]
  );
  const offers = useMemo(
    () => request ? (data.offers || []).filter((item: any) => item.request_id === request.id) : [],
    [data.offers, request]
  );
  const contract = useMemo(
    () => request ? (data.contracts || []).find((item: any) => item.request_id === request.id) : null,
    [data.contracts, request]
  );
  const installments = useMemo(
    () => contract ? (data.installments || []).filter((item: any) => item.contract_id === contract.id) : [],
    [data.installments, contract]
  );

  const callApi = useCallback(async (payload?: any) => {
    if (!session?.access_token) throw new Error('Authentication required.');
    const response = await fetch(`/api/v1/funding-engine${payload ? '' : '?scope=customer'}`, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: payload ? JSON.stringify(payload) : undefined
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Funding request failed.');
    return result;
  }, [session?.access_token]);

  const refresh = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const result = await callApi();
      setData(result);
    } catch (error: any) {
      setMessage(error.message);
    }
  }, [callApi, session?.access_token]);

  useEffect(() => { refresh(); }, [refresh, lead.funding_request_id, lead.funding_contract_id]);

  const run = async (key: string, payload: any) => {
    try {
      setBusy(key);
      setMessage('');
      const result = await callApi(payload);
      if (result.updated_lead) onLeadUpdated(result.updated_lead);
      await refresh();
      setMessage('Action completed successfully.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(null);
    }
  };

  const financingActive = lead.payment_method === 'financing' || contract?.contract_status === 'active';
  const financingPending = lead.payment_method === 'financing_pending' || Boolean(request);
  // A completed or started direct milestone can never be converted into financing.
  const directPaymentStarted = Boolean(
    lead.provider_paid ||
    lead.installer_paid ||
    lead.provider_balance_paid ||
    lead.installer_balance_paid
  );
  const directSelected = lead.payment_method === 'direct' || directPaymentStarted;

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>AZPHUR FINANCE HUB</div>
          <h3 style={styles.title}>Choose how to fund this project</h3>
          <p style={styles.muted}>One AZPHUR project flow; provider and installer allocations remain separate internally.</p>
        </div>
        <span style={styles.mock}>MOCK — NO REAL MONEY</span>
      </div>

      {!financingPending && !directSelected && (
        <div style={styles.choiceGrid}>
          <button style={styles.directChoice} disabled={busy !== null} onClick={() => run('direct', { action: 'choose_direct', lead_id: lead.id })}>
            <strong>PAY DIRECT</strong>
            <span>Use the consolidated Project Down Payment and Project Final Payment.</span>
          </button>
          <div style={styles.financeChoice}>
            <strong>REQUEST FINANCING</strong>
            <span>Send the complete project amount to verified funding partners.</span>
            <div style={styles.formRow}>
              <label style={styles.label}>PREFERRED TERM
                <select style={styles.input} value={termMonths} onChange={event => setTermMonths(event.target.value)}>
                  {[6, 12, 18, 24, 36, 48, 60].map(months => <option key={months} value={months}>{months} months</option>)}
                </select>
              </label>
              <label style={styles.label}>CUSTOMER NOTES
                <input style={styles.input} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Optional information" />
              </label>
            </div>
            <label style={styles.consent}>
              <input type="checkbox" checked={customerConsent} onChange={event => setCustomerConsent(event.target.checked)} />
              <span>I consent to share this project and financial application data with verified funding partners for this request.</span>
            </label>
            {!canRequestFinancing && <div style={styles.lockedNotice}>PROJECT PRICES ARE STILL BEING FINALIZED. FINANCING CAN BE SENT AFTER BOTH PROJECT ALLOCATIONS ARE READY.</div>}
            <button style={styles.primaryButton} disabled={busy !== null || !canRequestFinancing || !customerConsent} onClick={() => run('request', { action: 'create_request', lead_id: lead.id, requested_term_months: Number(termMonths), customer_notes: notes, customer_consent: customerConsent })}>REQUEST FINANCING</button>
          </div>
        </div>
      )}

      {directSelected && (
        <div style={styles.confirmed}><strong>PAYMENT METHOD: DIRECT</strong><span>The consolidated project-payment controls below are enabled.</span></div>
      )}

      {financingPending && (
        <div style={styles.workflow}>
          <div style={styles.statusRow}><strong>FINANCING REQUEST</strong><span style={styles.status}>{request?.status || 'submitted'}</span></div>
          <div style={styles.summaryGrid}>
            <Info label="Requested amount" value={money(request?.requested_amount)} />
            <Info label="Requested duration" value={`${request?.requested_term_months || termMonths} months`} />
            <Info label="Offers received" value={offers.length} />
            <Info label="Payment method" value={financingActive ? 'Financing active' : 'Financing pending'} />
          </div>

          {request && !contract && ['open', 'under_review', 'offers_available'].includes(request.status) && (
            <button style={styles.cancelButton} disabled={busy !== null} onClick={() => run(`cancel-${request.id}`, { action: 'cancel_request', request_id: request.id })}>CANCEL FINANCING REQUEST AND PAY DIRECT</button>
          )}

          {offers.length > 0 && !contract && (
            <div style={styles.offerList}>
              <div style={styles.eyebrow}>VERIFIED PARTNER OFFERS</div>
              {offers.map((offer: any) => (
                <article key={offer.id} style={styles.offer}>
                  <div><strong>{offer.funding_partner_whitelist?.display_name || 'Verified funding partner'}</strong><div style={styles.muted}>{offer.funding_partner_whitelist?.partner_type} · {offer.funding_partner_whitelist?.verified ? 'Verified' : 'Verification pending'}</div></div>
                  <div style={styles.summaryGrid}>
                    <Info label="Principal" value={money(offer.principal_amount)} />
                    <Info label="Annual rate" value={`${offer.annual_interest_rate}%`} />
                    <Info label="Duration" value={`${offer.term_months} months`} />
                    <Info label="Estimated installment" value={money(offer.estimated_installment)} />
                    <Info label="Origination fee" value={money(offer.origination_fee)} />
                    <Info label="Total repayment" value={money(offer.total_repayment)} />
                  </div>
                  <p style={styles.terms}>{offer.terms_summary}</p>
                  {Array.isArray(offer.requirements) && offer.requirements.length > 0 && <ul style={styles.requirements}>{offer.requirements.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>}
                  <button style={styles.primaryButton} disabled={busy !== null || offer.status !== 'submitted'} onClick={() => run(`select-${offer.id}`, { action: 'select_offer', request_id: request.id, offer_id: offer.id })}>SELECT THIS OFFER</button>
                </article>
              ))}
            </div>
          )}

          {contract && (
            <div style={styles.contract}>
              <div style={styles.statusRow}><strong>CONTRACT {contract.contract_number}</strong><span style={styles.status}>{contract.contract_status}</span></div>
              <div style={styles.summaryGrid}>
                <Info label="Principal" value={money(contract.principal_amount)} />
                <Info label="Annual rate" value={`${contract.annual_interest_rate}%`} />
                <Info label="Duration" value={`${contract.term_months} months`} />
                <Info label="Monthly installment" value={money(contract.installment_amount)} />
                <Info label="Total repayment" value={money(contract.total_repayment)} />
              </div>
              {contract.contract_status === 'pending_customer_acceptance' && (
                <>
                  <div style={styles.disclaimer}>By accepting, the customer enters a financing agreement with the selected funding partner. AZPHUR remains the transaction platform and is not the lender.</div>
                  <button style={styles.primaryButton} disabled={busy !== null} onClick={() => run(`accept-${contract.id}`, { action: 'accept_contract', contract_id: contract.id })}>ACCEPT FUNDING CONTRACT — TEST</button>
                </>
              )}
              {contract.contract_status === 'active' && <div style={styles.confirmed}><strong>FUNDING ACTIVE</strong><span>The funding partner can now fund the project milestones. Direct customer project payment is disabled.</span></div>}
            </div>
          )}

          {installments.length > 0 && (
            <div style={styles.offerList}>
              <div style={styles.eyebrow}>REPAYMENT SCHEDULE TO FUNDING PARTNER</div>
              {installments.map((installment: any) => (
                <div key={installment.id} style={styles.installment}>
                  <div><strong>#{installment.installment_number}</strong><div style={styles.muted}>Due {installment.due_date}</div></div>
                  <div><strong>{money(installment.amount_due)}</strong><div style={styles.muted}>{installment.status}</div></div>
                  {['scheduled', 'due', 'late'].includes(installment.status) && <button style={styles.smallButton} disabled={busy !== null} onClick={() => run(`repay-${installment.id}`, { action: 'pay_installment', installment_id: installment.id })}>MOCK REPAY PARTNER</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {message && <div style={styles.message}>{message}</div>}
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div style={styles.info}><span>{label}</span><strong>{value || '—'}</strong></div>;
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: '#ffffff', color: '#1d1d1f', border: '2px solid #0891b2', borderRadius: 14, padding: 18, marginBottom: 18, boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottom: '1px solid #bae6fd', paddingBottom: 12 },
  eyebrow: { color: '#0891b2', fontSize: 9, fontWeight: 950, letterSpacing: 1.2 },
  title: { margin: '5px 0', fontSize: 16, color: '#1d1d1f' },
  muted: { color: '#64748b', fontSize: 9, lineHeight: 1.5 },
  mock: { alignSelf: 'flex-start', color: '#854d0e', background: '#fef9c3', border: '1px solid #facc15', borderRadius: 6, padding: '6px 8px', fontSize: 8, fontWeight: 950 },
  choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 14 },
  directChoice: { display: 'grid', gap: 8, alignContent: 'center', minHeight: 150, textAlign: 'left', background: '#f8fafc', color: '#1d1d1f', border: '1px solid #0891b2', borderRadius: 10, padding: 18, cursor: 'pointer' },
  financeChoice: { display: 'grid', gap: 9, background: '#f0fdf4', color: '#1d1d1f', border: '1px solid #166534', borderRadius: 10, padding: 18 },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 },
  label: { display: 'grid', gap: 4, color: '#166534', fontSize: 8, fontWeight: 900 },
  consent: { display: 'flex', alignItems: 'flex-start', gap: 7, color: '#475569', fontSize: 9, lineHeight: 1.45, cursor: 'pointer' },
  lockedNotice: { padding: 8, borderRadius: 6, background: '#fef9c3', color: '#854d0e', fontSize: 8, fontWeight: 900, lineHeight: 1.4 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #86efac', borderRadius: 6, background: '#ffffff', color: '#1d1d1f', padding: 8, fontSize: 10 },
  primaryButton: { border: 0, borderRadius: 7, background: '#0891b2', color: '#fff', padding: '10px 13px', fontSize: 8, fontWeight: 950, cursor: 'pointer' },
  smallButton: { border: '1px solid #0891b2', borderRadius: 6, background: '#ffffff', color: '#0891b2', padding: '7px 9px', fontSize: 7, fontWeight: 950, cursor: 'pointer' },
  cancelButton: { border: '1px solid #f59e0b', borderRadius: 7, background: '#fef9c3', color: '#854d0e', padding: '9px 11px', fontSize: 8, fontWeight: 950, cursor: 'pointer' },
  workflow: { marginTop: 14, display: 'grid', gap: 12 },
  statusRow: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  status: { color: '#0891b2', border: '1px solid #0891b2', borderRadius: 999, padding: '4px 8px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, marginTop: 10 },
  info: { display: 'grid', gap: 3, padding: 9, borderRadius: 7, background: '#f8fafc', fontSize: 10 },
  offerList: { display: 'grid', gap: 10, paddingTop: 8 },
  offer: { padding: 13, border: '1px solid #bae6fd', borderRadius: 9, background: '#ffffff' },
  terms: { color: '#475569', fontSize: 10, lineHeight: 1.6 },
  requirements: { color: '#475569', fontSize: 9, lineHeight: 1.6 },
  contract: { padding: 14, border: '1px solid #166534', borderRadius: 9, background: '#f0fdf4' },
  disclaimer: { margin: '12px 0', color: '#854d0e', background: '#fef9c3', padding: 10, borderRadius: 7, fontSize: 9, lineHeight: 1.5 },
  confirmed: { display: 'grid', gap: 4, marginTop: 14, padding: 12, borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 9 },
  installment: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 10, border: '1px solid #bae6fd', borderRadius: 8, background: '#f8fafc', fontSize: 10 },
  message: { marginTop: 12, padding: 10, borderRadius: 7, color: '#0e7490', background: '#ecfeff', fontSize: 9 }
};
