"use client";

type ActiveProjectLead = {
  id: string;
  created_at?: string | null;
  customer_name?: string | null;
  full_name?: string | null;
  product_name?: string | null;
  status?: string | null;
  assigned_provider?: string | null;
  assigned_installer?: string | null;
  provider_paid?: boolean | null;
  installer_paid?: boolean | null;
  provider_balance_paid?: boolean | null;
  installer_balance_paid?: boolean | null;
};

type ProjectStage = {
  label: string;
  nextAction: string;
  progress: number;
  tone: "cyan" | "amber" | "green" | "slate";
};

type Props = {
  leads: ActiveProjectLead[];
  loading?: boolean;
};

const terminalStatuses = ["CANCELLED", "REFUNDED", "REJECTED"];

function getStage(lead: ActiveProjectLead): ProjectStage {
  const status = String(lead.status || "").toUpperCase();
  const teamSelected = Boolean(lead.assigned_provider && lead.assigned_installer);
  const downPaid = Boolean(lead.provider_paid && lead.installer_paid);
  const finalPaid = Boolean(
    lead.provider_balance_paid && lead.installer_balance_paid,
  );

  if (finalPaid || ["COMPLETED", "CLOSED", "SETTLED"].includes(status)) {
    return {
      label: "Project completed",
      nextAction: "Archive final project record",
      progress: 100,
      tone: "green",
    };
  }
  if (downPaid) {
    return {
      label: "Installation / final balance",
      nextAction: "Confirm completion and release final payment",
      progress: 68,
      tone: "cyan",
    };
  }
  if (status.includes("FUND") || status.includes("FINANC")) {
    return {
      label: "Funding in review",
      nextAction: "Review offers or await funder decision",
      progress: 45,
      tone: "amber",
    };
  }
  if (teamSelected) {
    return {
      label: "Project team confirmed",
      nextAction: "Await pricing and down payment",
      progress: 36,
      tone: "cyan",
    };
  }
  if (status.includes("PENDING") || status.includes("CLAIMED")) {
    return {
      label: "Partner response pending",
      nextAction: "Monitor provider and installer availability",
      progress: 18,
      tone: "amber",
    };
  }
  return {
    label: "New client request",
    nextAction: "Await partner availability",
    progress: 8,
    tone: "slate",
  };
}

function projectName(lead: ActiveProjectLead) {
  return lead.product_name || "AZPHUR energy project";
}

export default function AZPHURAdminActiveProjectsOverview({
  leads,
  loading = false,
}: Props) {
  const activeLeads = leads
    .filter(
      (lead) => !terminalStatuses.includes(String(lead.status || "").toUpperCase()),
    )
    .slice(0, 6);
  const attentionCount = activeLeads.filter((lead) => getStage(lead).progress < 45).length;
  const financeCount = activeLeads.filter((lead) =>
    String(lead.status || "").toUpperCase().match(/FUND|FINANC/),
  ).length;

  return (
    <section className="az-active-projects" aria-label="Active client projects overview">
      <style jsx global>{`
        .az-active-projects { margin: 18px 0 26px; }
        .az-active-projects *, .az-active-projects *::before, .az-active-projects *::after { box-sizing: border-box; }
        .az-active-projects__panel { background: #fff; border: 1px solid #dbe8eb; border-radius: 20px; padding: clamp(18px, 3vw, 28px); }
        .az-active-projects__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .az-active-projects__eyebrow { margin: 0 0 8px; color: #0891b2; font: 800 10px "JetBrains Mono", monospace; letter-spacing: 1.5px; }
        .az-active-projects__header h2 { margin: 0; color: #0f172a; font-size: 21px; letter-spacing: -0.7px; }
        .az-active-projects__header p { margin: 7px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; }
        .az-active-projects__live { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; color: #0e7490; font: 800 9px "JetBrains Mono", monospace; letter-spacing: 1px; padding-top: 5px; }
        .az-active-projects__dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 5px rgba(16,185,129,.12); }
        .az-active-projects__metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 21px 0 18px; }
        .az-active-projects__metric { min-height: 88px; border: 1px solid #dbe8eb; border-radius: 14px; padding: 14px; background: #f9fcfc; }
        .az-active-projects__metric strong { display: block; color: #0f172a; font-size: 25px; letter-spacing: -1px; }
        .az-active-projects__metric span { display: block; margin-top: 6px; color: #64748b; font: 700 9px "JetBrains Mono", monospace; letter-spacing: .75px; }
        .az-active-projects__table { overflow-x: auto; border: 1px solid #dbe8eb; border-radius: 15px; }
        .az-active-projects table { border-collapse: collapse; width: 100%; min-width: 790px; background: #fff; }
        .az-active-projects th { background: #eefafb; color: #527188; padding: 11px 14px; text-align: left; font: 800 9px "JetBrains Mono", monospace; letter-spacing: .9px; }
        .az-active-projects td { color: #0f172a; padding: 15px 14px; border-top: 1px solid #edf2f3; font-size: 12px; vertical-align: middle; }
        .az-active-projects__client { display: block; font-weight: 800; }
        .az-active-projects__sub { display: block; margin-top: 4px; color: #64748b; font: 700 9px "JetBrains Mono", monospace; letter-spacing: .35px; }
        .az-active-projects__stage { display: flex; align-items: center; gap: 8px; }
        .az-active-projects__stage b { font-size: 11px; white-space: nowrap; }
        .az-active-projects__bar { width: 76px; height: 7px; overflow: hidden; border-radius: 99px; background: #e8f0f2; }
        .az-active-projects__bar span { display: block; height: 100%; border-radius: inherit; background: #0891b2; }
        .az-active-projects__stage--amber .az-active-projects__bar span { background: #f59e0b; }
        .az-active-projects__stage--green .az-active-projects__bar span { background: #10b981; }
        .az-active-projects__stage--slate .az-active-projects__bar span { background: #64748b; }
        .az-active-projects__action { color: #0e7490; font-weight: 700; }
        .az-active-projects__empty { padding: 25px 14px; color: #64748b; text-align: center; font-size: 13px; }
        @media (max-width: 680px) {
          .az-active-projects__header { display: block; }
          .az-active-projects__live { margin-top: 12px; }
          .az-active-projects__metrics { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="az-active-projects__panel">
        <header className="az-active-projects__header">
          <div>
            <p className="az-active-projects__eyebrow">AZPHUR OPERATIONS / CLIENT CONTROL</p>
            <h2>Active client projects</h2>
            <p>One operational overview for projects currently moving through the AZPHUR workflow.</p>
          </div>
          <div className="az-active-projects__live">
            <span className="az-active-projects__dot" />
            {loading ? "SYNCING PROJECTS" : "LIVE PROJECT VIEW"}
          </div>
        </header>

        <div className="az-active-projects__metrics">
          <div className="az-active-projects__metric"><strong>{activeLeads.length}</strong><span>ACTIVE CLIENT PROJECTS</span></div>
          <div className="az-active-projects__metric"><strong>{attentionCount}</strong><span>NEED FOLLOW-UP</span></div>
          <div className="az-active-projects__metric"><strong>{financeCount}</strong><span>FUNDING IN REVIEW</span></div>
        </div>

        <div className="az-active-projects__table">
          {activeLeads.length ? (
            <table>
              <thead><tr><th>Client & project</th><th>Project team</th><th>Progress</th><th>Next action</th></tr></thead>
              <tbody>
                {activeLeads.map((lead) => {
                  const stage = getStage(lead);
                  return (
                    <tr key={lead.id}>
                      <td><span className="az-active-projects__client">{lead.customer_name || lead.full_name || "Client"}</span><span className="az-active-projects__sub">{projectName(lead)} · {lead.id.slice(0, 8).toUpperCase()}</span></td>
                      <td>{lead.assigned_provider || "Provider pending"}<span className="az-active-projects__sub">{lead.assigned_installer || "Installer pending"}</span></td>
                      <td><div className={`az-active-projects__stage az-active-projects__stage--${stage.tone}`}><div className="az-active-projects__bar"><span style={{ width: `${stage.progress}%` }} /></div><b>{stage.label}</b></div></td>
                      <td><span className="az-active-projects__action">{stage.nextAction}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="az-active-projects__empty">No active projects yet. New client projects will appear here automatically.</div>
          )}
        </div>
      </div>
    </section>
  );
}
