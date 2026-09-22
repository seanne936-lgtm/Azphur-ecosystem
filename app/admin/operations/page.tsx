"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AZPHURAdminActiveProjectsOverview from "../../../components/AZPHURAdminActiveProjectsOverview";

type LeadRecord = { id: string; created_at?: string | null; customer_name?: string | null; full_name?: string | null; customer_email?: string | null; product_name?: string | null; status?: string | null; assigned_provider?: string | null; assigned_installer?: string | null; provider_paid?: boolean | null; installer_paid?: boolean | null; provider_balance_paid?: boolean | null; installer_balance_paid?: boolean | null };
type GenericRecord = Record<string, unknown> & { id?: string; email?: string | null; created_at?: string | null; status?: string | null };
type Tab = "overview" | "clients" | "partners" | "funding" | "notifications" | "settings";

const ADMIN_EMAILS = ["admin@azphur.com"];
const CLOSED_STATUSES = ["CANCELLED", "REFUNDED", "REJECTED", "COMPLETED", "CLOSED", "SETTLED"];
const readableDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const recordName = (record: GenericRecord) => String(record.entity_name || record.company_name || record.display_name || record.business_name || record.email || "Unnamed partner");
const fundingCustomer = (record: GenericRecord) => String(record.customer_name || record.full_name || record.customer_email || record.lead_id || "Customer request");
const fundingAmount = (record: GenericRecord) => { const value = Number(record.requested_amount || record.amount || record.project_amount || 0); return value > 0 ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value) : "Amount pending"; };

export default function AdminOperationsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [providers, setProviders] = useState<GenericRecord[]>([]);
  const [installers, setInstallers] = useState<GenericRecord[]>([]);
  const [funders, setFunders] = useState<GenericRecord[]>([]);
  const [fundingRequests, setFundingRequests] = useState<GenericRecord[]>([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    let isMounted = true;
    const loadAdminOperations = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const email = session?.user.email?.trim().toLowerCase();
      if (!session || !email || !ADMIN_EMAILS.includes(email)) { router.replace("/"); return; }
      if (isMounted) setCheckingAccess(false);
      const accessToken = session.access_token;
      const [leadResult, providerResult, installerResult, fundingResult, funderResponse] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("partner_whitelist").select("*").order("created_at", { ascending: false }),
        supabase.from("installers_whitelist").select("*").order("created_at", { ascending: false }),
        supabase.from("funding_requests").select("*").order("created_at", { ascending: false }),
        fetch("/api/admin-operations/funding-partners", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      if (!isMounted) return;
      if (!leadResult.error) setLeads((leadResult.data || []) as LeadRecord[]);
      if (!providerResult.error) setProviders((providerResult.data || []) as GenericRecord[]);
      if (!installerResult.error) setInstallers((installerResult.data || []) as GenericRecord[]);
      if (!fundingResult.error) setFundingRequests((fundingResult.data || []) as GenericRecord[]);
      if (funderResponse.ok) {
        const funderPayload = await funderResponse.json();
        if (funderPayload.success) setFunders((funderPayload.partners || []) as GenericRecord[]);
      }
      setLoading(false);
    };
    void loadAdminOperations();
    const channel = supabase.channel("admin-operations-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => void loadAdminOperations())
      .on("postgres_changes", { event: "*", schema: "public", table: "funding_requests" }, () => void loadAdminOperations())
      .subscribe();
    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, [router]);

  const dashboard = useMemo(() => {
    const activeLeads = leads.filter((lead) => !CLOSED_STATUSES.includes(String(lead.status || "").toUpperCase()));
    const pendingLeads = activeLeads.filter((lead) => String(lead.status || "").toUpperCase().includes("PENDING"));
    const fundingInReview = fundingRequests.filter((request) => !["APPROVED", "DECLINED", "FUNDED", "CANCELLED"].includes(String(request.status || "").toUpperCase()));
    const events = leads.slice(0, 8).map((lead) => ({ id: lead.id, title: lead.customer_name || lead.full_name || "Client project", detail: lead.status ? `Project status: ${String(lead.status).replaceAll("_", " ")}` : "New client request recorded", createdAt: lead.created_at }));
    return { activeLeads, pendingLeads, fundingInReview, events };
  }, [leads, fundingRequests]);

  const navItems: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" }, { id: "clients", label: "Active Clients" }, { id: "partners", label: "Partner Network" }, { id: "funding", label: "Funding Requests" }, { id: "notifications", label: "Notifications" }, { id: "settings", label: "System Settings" },
  ];
  const partnerRows = [...providers.map((record) => ({ record, role: "Provider" })), ...installers.map((record) => ({ record, role: "Installer" })), ...funders.map((record) => ({ record, role: "Funding partner" }))];

  if (checkingAccess) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#0891b2", fontFamily: "monospace", fontWeight: 800, letterSpacing: "1px" }}>VERIFYING ADMIN ACCESS…</main>;

  const networkTotal = providers.length + installers.length + funders.length;

  return <main className="az-deye-shell">
    <style jsx global>{`
      .az-deye-shell{min-height:100vh;background:#eef1f7;color:#20242c;font-family:Inter,Arial,sans-serif;padding-bottom:90px}.az-deye-nav{height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100vw - 720px)/2));background:rgba(238,241,247,.92)}.az-deye-brand{display:flex;align-items:center;gap:10px;color:#0b77bd;font-weight:850;letter-spacing:-.4px}.az-deye-brand img{width:31px;height:31px;object-fit:contain}.az-deye-home{color:#5c6471;text-decoration:none;font-size:12px;font-weight:800}.az-deye-wrap{width:min(680px,calc(100% - 30px));margin:0 auto}.az-deye-card{background:rgba(255,255,255,.84);border:1px solid rgba(255,255,255,.92);border-radius:27px;box-shadow:0 13px 33px rgba(67,78,96,.08);padding:22px;margin-bottom:18px}.az-deye-overview{position:relative;overflow:hidden;background:linear-gradient(120deg,#8ec3f7 0%,#e8f5ff 50%,#fff 100%)}.az-deye-overview:before{content:"";position:absolute;width:250px;height:250px;left:-100px;top:-130px;background:radial-gradient(circle,rgba(34,119,233,.75),transparent 67%);filter:blur(8px)}.az-deye-title{position:relative;display:flex;align-items:center;gap:11px;font-size:23px;font-weight:500}.az-deye-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:rgba(255,255,255,.5);font-size:22px}.az-deye-primary{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:35px 0 20px}.az-deye-primary strong{display:block;font-size:46px;letter-spacing:-2.5px;line-height:1}.az-deye-primary small{display:block;margin-top:10px;color:#5f6570;font-size:16px}.az-deye-primary div:last-child{text-align:right}.az-deye-divider{height:13px;border-radius:20px;background:rgba(255,255,255,.82);position:relative}.az-deye-mini-row{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:23px}.az-deye-mini{display:flex;gap:11px;align-items:center}.az-deye-mini b{display:block;font-size:27px;line-height:1}.az-deye-mini span{display:block;margin-top:6px;color:#606773;font-size:14px}.az-deye-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:21px;font-size:23px;font-weight:500}.az-deye-total{padding:7px 12px;border-radius:14px;background:#fff;color:#687080;font-size:14px}.az-deye-subtitle{margin:0 0 13px;color:#737a85;font-size:17px;font-weight:500}.az-deye-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.az-deye-status{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 16px;border-radius:15px;font-size:16px}.az-deye-status b{font-size:30px}.az-live{background:linear-gradient(110deg,#dffbf0,#fff)}.az-blue{background:linear-gradient(110deg,#e0ecff,#fff)}.az-warn{background:linear-gradient(110deg,#fff1cc,#fff)}.az-alert{background:linear-gradient(110deg,#ffebe0,#fff)}.az-deye-tabs{position:fixed;z-index:3;left:50%;bottom:16px;transform:translateX(-50%);display:flex;width:min(660px,calc(100% - 24px));gap:4px;padding:8px;border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 10px 28px rgba(50,60,80,.15);backdrop-filter:blur(14px)}.az-deye-tab{flex:1;border:0;border-radius:17px;padding:11px 5px;background:transparent;color:#747b86;font-size:10px;font-weight:800;cursor:pointer}.az-deye-tab--active{background:#e5f1ff;color:#176dc4}.az-deye-data{margin-top:16px}.az-deye-data h2{margin:0 0 7px;font-size:21px}.az-deye-data>p{margin:0 0 16px;color:#707887;font-size:13px;line-height:1.5}.az-table-wrap{overflow:auto;border-radius:15px;border:1px solid #e6eaf0}.az-table{width:100%;min-width:620px;border-collapse:collapse}.az-table th{padding:11px 13px;background:#f2f6fb;color:#647386;text-align:left;font-size:10px;letter-spacing:.6px}.az-table td{padding:13px;border-top:1px solid #edf0f4;font-size:12px}.az-table small{display:block;margin-top:4px;color:#6f7782}.az-tag{display:inline-block;padding:5px 8px;border-radius:10px;background:#e2f4ff;color:#126ea9;font-size:9px;font-weight:850}.az-empty{padding:28px;text-align:center;color:#78808a;font-size:13px}.az-event{display:flex;justify-content:space-between;gap:10px;padding:13px 0;border-top:1px solid #ebeff3}.az-event:first-child{border-top:0}.az-event span{display:block;margin-top:4px;color:#727987;font-size:12px}.az-event time{flex:0 0 auto;color:#1476c2;font-size:10px;font-weight:800}.az-note{margin:20px 2px;color:#67717e;font-size:12px;line-height:1.55}@media(max-width:500px){.az-deye-primary strong{font-size:39px}.az-deye-title{font-size:20px}.az-deye-status{font-size:14px}.az-deye-status b{font-size:25px}}`}</style>
    <nav className="az-deye-nav"><div className="az-deye-brand"><img src="/logo-azphur.avif" alt="AZPHUR" />AZPHUR / ADMIN</div><Link className="az-deye-home" href="/">← HOME</Link></nav>
    <section className="az-deye-wrap">
      {activeTab === "overview" && <><section className="az-deye-card az-deye-overview"><div className="az-deye-title"><span className="az-deye-icon">☀</span>System Overview</div><div className="az-deye-primary"><div><strong>{dashboard.activeLeads.length}</strong><small>Active Projects</small></div><div><strong>{networkTotal}</strong><small>Network Partners</small></div></div><div className="az-deye-divider" /><div className="az-deye-mini-row"><div className="az-deye-mini"><span>📁</span><div><b>{leads.length}</b><span>Total Lead Records</span></div></div><div className="az-deye-mini"><span>🔔</span><div><b>{dashboard.pendingLeads.length}</b><span>Need Follow-up</span></div></div></div></section><section className="az-deye-card"><div className="az-deye-section-title"><span>🏠 Platform Summary</span><span className="az-deye-total">Total <b>{networkTotal}</b></span></div><p className="az-deye-subtitle">Workflow Status</p><div className="az-deye-grid"><div className="az-deye-status az-live"><span>✓ Live projects</span><b>{dashboard.activeLeads.length}</b></div><div className="az-deye-status az-blue"><span>⌁ Funding partners</span><b>{funders.length}</b></div><div className="az-deye-status az-warn"><span>◷ Funding review</span><b>{dashboard.fundingInReview.length}</b></div><div className="az-deye-status az-alert"><span>! Follow-up</span><b>{dashboard.pendingLeads.length}</b></div></div><p className="az-deye-subtitle" style={{marginTop:24}}>Network Status</p><div className="az-deye-grid"><div className="az-deye-status az-live"><span>✓ Providers</span><b>{providers.length}</b></div><div className="az-deye-status az-blue"><span>✓ Installers</span><b>{installers.length}</b></div></div></section></>}
      {activeTab === "clients" && <section className="az-deye-card az-deye-data"><AZPHURAdminActiveProjectsOverview leads={leads} loading={loading} /></section>}
      {activeTab === "partners" && <section className="az-deye-card az-deye-data"><h2>Partner Network</h2><p>Verified provider, installer and funding partner records.</p><div className="az-table-wrap"><table className="az-table"><thead><tr><th>PARTNER</th><th>ROLE</th><th>EMAIL</th><th>RECORDED</th></tr></thead><tbody>{partnerRows.map(({record,role}, index)=><tr key={`${role}-${record.id || index}`}><td><b>{recordName(record)}</b></td><td><span className="az-tag">{role}</span></td><td>{String(record.email || "—")}</td><td>{readableDate(record.created_at as string | null)}</td></tr>)}</tbody></table>{!partnerRows.length&&<div className="az-empty">No verified partner records yet.</div>}</div></section>}
      {activeTab === "funding" && <section className="az-deye-card az-deye-data"><h2>Funding Requests</h2><p>Live customer funding applications.</p><div className="az-table-wrap"><table className="az-table"><thead><tr><th>CUSTOMER</th><th>AMOUNT</th><th>STATUS</th><th>RECORDED</th></tr></thead><tbody>{fundingRequests.map((request,index)=><tr key={String(request.id||index)}><td><b>{fundingCustomer(request)}</b><small>{String(request.lead_id||"Funding application")}</small></td><td>{fundingAmount(request)}</td><td><span className="az-tag">{String(request.status||"UNDER REVIEW").replaceAll("_"," ")}</span></td><td>{readableDate(request.created_at as string|null)}</td></tr>)}</tbody></table>{!fundingRequests.length&&<div className="az-empty">No funding requests yet.</div>}</div></section>}
      {activeTab === "notifications" && <section className="az-deye-card az-deye-data"><h2>Project Notifications</h2><p>Live operational activity generated from lead records.</p>{dashboard.events.map(event=><div className="az-event" key={event.id}><div><b>{event.title}</b><span>{event.detail}</span></div><time>{readableDate(event.createdAt)}</time></div>)}{!dashboard.events.length&&<div className="az-empty">No project notifications yet.</div>}</section>}
      {activeTab === "settings" && <section className="az-deye-card az-deye-data"><h2>System Settings</h2><p>Live system reference. Editing controls will be added only with role permissions and audit logs.</p><div className="az-deye-grid"><div className="az-deye-status az-live"><span>Database link</span><b>{loading?"…":"✓"}</b></div><div className="az-deye-status az-blue"><span>Funding records</span><b>{fundingRequests.length}</b></div></div></section>}
      <p className="az-note">Future monitoring layer: solar production, plant/device status and hardware alarms will appear here when AZPHUR connects approved monitoring providers.</p>
    </section>
    <nav className="az-deye-tabs" aria-label="Admin navigation">{navItems.map(item=><button type="button" key={item.id} className={`az-deye-tab ${activeTab===item.id?"az-deye-tab--active":""}`} onClick={()=>setActiveTab(item.id)}>{item.label}</button>)}</nav>
  </main>;
}
