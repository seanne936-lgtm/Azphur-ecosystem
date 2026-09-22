"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type LeadRecord = {
  id: string;
  created_at?: string | null;
  customer_name?: string | null;
  full_name?: string | null;
  status?: string | null;
  deal_value?: number | string | null;
  provider_initial?: number | string | null;
  installer_initial?: number | string | null;
  provider_final?: number | string | null;
  installer_final?: number | string | null;
  provider_paid?: boolean | null;
  installer_paid?: boolean | null;
  provider_balance_paid?: boolean | null;
  installer_balance_paid?: boolean | null;
};

type StationRecord = { id: string };
type MonthlyBucket = { key: string; label: string; value: number };

const CTO_SHARE_RATE = 0.22;
const PLATFORM_FEE_RATE = 0.1;
const FALLBACK_PHP_TO_EUR = 1 / 72.73;

const numberValue = (value: unknown) => Number(value) || 0;
const php = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
const eur = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
const monthLabel = (value?: string | null) =>
  new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
    new Date(value || Date.now()),
  );

function getProjectValue(lead: LeadRecord) {
  const declaredValue = numberValue(lead.deal_value);
  if (declaredValue > 0) return declaredValue;
  return (
    numberValue(lead.provider_initial) +
    numberValue(lead.installer_initial) +
    numberValue(lead.provider_final) +
    numberValue(lead.installer_final)
  );
}

function isSettled(lead: LeadRecord) {
  const status = String(lead.status || "").toUpperCase();
  return (
    ["CLOSED", "COMPLETED", "PAID", "SETTLED"].includes(status) ||
    Boolean(
      lead.provider_paid &&
      lead.installer_paid &&
      lead.provider_balance_paid &&
      lead.installer_balance_paid,
    )
  );
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [phpToEur, setPhpToEur] = useState(FALLBACK_PHP_TO_EUR);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<Date | null>(null);

  async function syncDashboard() {
    if (!supabase) return;
    setLoading(true);
    try {
      const [leadResult, stationResult] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("charging_stations").select("*"),
      ]);
      if (leadResult.error) throw leadResult.error;
      setLeads((leadResult.data || []) as LeadRecord[]);
      setStations((stationResult.data || []) as StationRecord[]);
    } catch (error) {
      console.error("CTO finance synchronization error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void syncDashboard();
    const channel = supabase
      .channel("cto-finance-live-ledger")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        syncDashboard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_stations" },
        syncDashboard,
      )
      .subscribe();

    const refreshExchangeRate = async () => {
      try {
        const response = await fetch("/api/exchange-rate", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          rate?: number;
          source?: "live" | "fallback";
          updated_at?: string | null;
        };
        if (response.ok && data.rate) {
          setPhpToEur(data.rate);
          setRateUpdatedAt(
            data.source === "live" && data.updated_at
              ? new Date(data.updated_at)
              : null,
          );
        }
      } catch {
        setRateUpdatedAt(null);
      }
    };
    void refreshExchangeRate();
    const interval = window.setInterval(refreshExchangeRate, 60 * 60 * 1000);
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const finance = useMemo(() => {
    const settled = leads.filter(isSettled);
    const pipeline = leads.filter(
      (lead) =>
        !isSettled(lead) &&
        !["CANCELLED", "REFUNDED"].includes(
          String(lead.status || "").toUpperCase(),
        ),
    );
    const months: MonthlyBucket[] = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
        value: 0,
      };
    });
    settled.forEach((lead) => {
      const date = new Date(lead.created_at || Date.now());
      const bucket = months.find(
        (month) => month.key === `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (bucket)
        bucket.value +=
          getProjectValue(lead) * PLATFORM_FEE_RATE * CTO_SHARE_RATE;
    });
    const confirmedGtv = settled.reduce(
      (sum, lead) => sum + getProjectValue(lead),
      0,
    );
    return {
      settled,
      pipeline,
      months,
      confirmedGtv,
      pipelineGtv: pipeline.reduce(
        (sum, lead) => sum + getProjectValue(lead),
        0,
      ),
      azphurFee: confirmedGtv * PLATFORM_FEE_RATE,
      ctoAccrued: confirmedGtv * PLATFORM_FEE_RATE * CTO_SHARE_RATE,
      downConfirmed: leads.filter(
        (lead) => lead.provider_paid && lead.installer_paid,
      ).length,
      finalConfirmed: leads.filter(
        (lead) => lead.provider_balance_paid && lead.installer_balance_paid,
      ).length,
    };
  }, [leads]);

  const maxMonthValue = Math.max(
    ...finance.months.map((month) => month.value),
    1,
  );
  const inEuro = (value: number) => value * phpToEur;
  const growthLinePoints = finance.months
    .map((month, index) => {
      const x = 34 + index * 105;
      const y = 156 - (month.value / maxMonthValue) * 116;
      return `${x},${y}`;
    })
    .join(" ");

  function exportCsv() {
    const lines = finance.settled.map((lead) => {
      const value = getProjectValue(lead);
      return [
        lead.id,
        lead.customer_name || lead.full_name || "Customer",
        monthLabel(lead.created_at),
        value,
        value * PLATFORM_FEE_RATE,
        value * PLATFORM_FEE_RATE * CTO_SHARE_RATE,
        String(lead.status || "SETTLED").toUpperCase(),
      ];
    });
    const csv = [
      ["AZPHUR CTO MONTHLY STATEMENT"],
      [
        "Project ID",
        "Customer",
        "Period",
        "Project GTV PHP",
        "AZPHUR fee PHP",
        "CTO accrued PHP",
        "Status",
      ],
      ...lines,
      [
        "TOTAL CTO COMPENSATION ACCRUED",
        "",
        "",
        "",
        "",
        finance.ctoAccrued,
        "",
      ],
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AZPHUR_CTO_statement_${new Date().toISOString().slice(0, 7)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="cto-shell">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap");
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #f4f7f8;
          color: #0f172a;
          font-family: Inter, sans-serif;
        }
        .cto-shell {
          min-height: 100vh;
          padding-bottom: 48px;
          background:
            radial-gradient(
              circle at 78% 0%,
              rgba(34, 211, 238, 0.16),
              transparent 30rem
            ),
            #f4f7f8;
        }
        .cto-nav {
          height: 74px;
          padding: 0 clamp(18px, 5vw, 70px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: rgba(255, 255, 255, 0.94);
          border-bottom: 1px solid #dfe8eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .cto-brand,
        .cto-actions,
        .status-live {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cto-logo {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }
        .brand-copy p,
        .brand-copy strong {
          display: block;
          margin: 0;
        }
        .brand-copy strong {
          font:
            800 12px "JetBrains Mono",
            monospace;
          letter-spacing: 1.8px;
          color: #0891b2;
        }
        .brand-copy p,
        .mono {
          font:
            700 9px "JetBrains Mono",
            monospace;
          letter-spacing: 1px;
          color: #64748b;
        }
        .back-link,
        .secondary-btn,
        .primary-btn {
          border-radius: 10px;
          text-decoration: none;
          font:
            800 10px "JetBrains Mono",
            monospace;
          letter-spacing: 0.7px;
          cursor: pointer;
        }
        .back-link {
          color: #0f172a;
          padding: 10px 12px;
        }
        .secondary-btn {
          color: #0e7490;
          background: #fff;
          border: 1px solid #67e8f9;
          padding: 11px 13px;
        }
        .primary-btn {
          color: #fff;
          background: #0891b2;
          border: 1px solid #0891b2;
          padding: 12px 14px;
        }
        .pulse {
          width: 8px;
          height: 8px;
          border-radius: 100%;
          background: #10b981;
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.12);
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          50% {
            opacity: 0.35;
            transform: scale(0.75);
          }
        }
        .cto-wrap {
          width: min(1360px, calc(100% - 40px));
          margin: 0 auto;
        }
        .hero {
          padding: 52px 0 30px;
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 24px;
        }
        .eyebrow {
          margin: 0 0 10px;
          color: #0891b2;
          font:
            800 10px "JetBrains Mono",
            monospace;
          letter-spacing: 2px;
        }
        h1 {
          font-size: clamp(31px, 5vw, 56px);
          letter-spacing: -2.8px;
          margin: 0;
          line-height: 0.98;
          color: #0f172a !important;
        }
        h1 span {
          color: #06b6d4;
        }
        .hero-copy {
          max-width: 505px;
          margin: 14px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }
        .rate-card {
          min-width: 245px;
          background: #fff;
          border: 1px solid #dbe8eb;
          border-radius: 17px;
          padding: 16px 18px;
        }
        .rate-card strong {
          display: block;
          font-size: 18px;
          margin-top: 6px;
          color: #0f172a !important;
        }
        .rate-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(220px, 1fr));
          gap: 12px;
        }
        .notice {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 15px 17px;
          border: 1px solid #a5f3fc;
          background: #ecfeff;
          border-radius: 14px;
          color: #155e75;
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .notice strong {
          color: #0e7490;
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .kpi {
          padding: 20px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #dbe8eb;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .kpi.accent {
          background: #0b718b;
          border-color: #0b718b;
          color: #fff;
        }
        .kpi-label {
          color: #64748b;
          font:
            800 9px "JetBrains Mono",
            monospace;
          letter-spacing: 1.2px;
        }
        .accent .kpi-label,
        .accent .sub-value,
        .accent .kpi-value {
          color: #cffafe !important;
        }
        .kpi-value {
          font-weight: 900;
          font-size: clamp(22px, 2.3vw, 31px);
          letter-spacing: -1.5px;
          margin-top: 10px;
          color: #0f172a !important;
        }
        .sub-value {
          color: #64748b;
          font-size: 11px;
          margin-top: 6px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-top: 18px;
        }
        .card {
          background: #fff;
          border: 1px solid #dbe8eb;
          border-radius: 20px;
          padding: 24px;
        }
        .card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .card h2 {
          margin: 0;
          font-size: 17px;
          letter-spacing: -0.6px;
        }
        .card p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }
        .line-chart {
          height: 210px;
          border-bottom: 1px solid #dbe8eb;
          padding-top: 12px;
        }
        .line-chart svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .line-labels {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 5px;
          margin-top: 11px;
        }
        .line-labels div {
          min-width: 0;
          text-align: center;
        }
        .line-labels strong,
        .line-labels span,
        .line-labels em {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .line-labels strong {
          color: #0891b2;
          font:
            800 9px "JetBrains Mono",
            monospace;
        }
        .line-labels span {
          color: #64748b;
          font:
            700 8px "JetBrains Mono",
            monospace;
          margin-top: 3px;
        }
        .line-labels em {
          color: #0f172a;
          font:
            800 9px "JetBrains Mono",
            monospace;
          font-style: normal;
          margin-top: 6px;
        }
        .growth-table {
          width: 100%;
          min-width: 620px;
          margin-top: 24px;
        }
        .growth-table-wrap {
          overflow: auto;
          border: 1px solid #dbe8eb;
          border-radius: 14px;
        }
        .growth-table td,
        .growth-table th {
          white-space: nowrap;
        }
        .growth-table .up {
          color: #059669;
          font-weight: 900;
        }
        .growth-table .flat {
          color: #64748b;
          font-weight: 900;
        }
        .summary-row strong,
        .module strong,
        .card h2 {
          color: #0f172a !important;
        }
        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 0;
          border-bottom: 1px solid #edf2f3;
          font-size: 13px;
        }
        .summary-row:last-child {
          border-bottom: 0;
        }
        .summary-row span {
          color: #64748b;
        }
        .summary-row strong {
          text-align: right;
        }
        .module-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .module {
          border: 1px solid #dbe8eb;
          background: #f9fcfc;
          border-radius: 14px;
          padding: 14px;
          min-height: 96px;
        }
        .module strong {
          display: block;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .module span {
          color: #64748b;
          font:
            700 10px "JetBrains Mono",
            monospace;
          line-height: 1.5;
        }
        .ledger {
          margin-top: 18px;
        }
        .table-wrap {
          overflow: auto;
          border: 1px solid #dbe8eb;
          border-radius: 15px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          min-width: 850px;
        }
        th {
          padding: 13px 15px;
          text-align: left;
          background: #f4fafa;
          color: #64748b;
          font:
            800 9px "JetBrains Mono",
            monospace;
          letter-spacing: 1px;
        }
        td {
          padding: 15px;
          border-top: 1px solid #edf2f3;
          font-size: 12px;
        }
        .project-id {
          color: #0891b2;
          font:
            800 10px "JetBrains Mono",
            monospace;
        }
        .tag {
          font:
            800 9px "JetBrains Mono",
            monospace;
          padding: 5px 7px;
          border-radius: 20px;
          background: #e0f7fa;
          color: #0e7490;
        }
        .tag.pending {
          background: #fff7d6;
          color: #9a6700;
        }
        .empty {
          padding: 34px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }
        .footer-note {
          margin-top: 16px;
          font:
            700 10px "JetBrains Mono",
            monospace;
          color: #64748b !important;
          line-height: 1.6;
        }
        .ledger td {
          color: #0f172a !important;
        }
        .ledger td strong {
          color: #0f172a !important;
        }
        .ledger .mono {
          color: #64748b !important;
        }
        .ledger .project-id {
          color: #0891b2 !important;
        }
        .ledger .tag {
          color: #0e7490 !important;
        }
        .ledger th:last-child,
        .ledger td:last-child {
          width: 126px;
        }
        .ledger-status {
          display: inline-flex;
          min-height: 25px;
          align-items: center;
          justify-content: center;
          max-width: 112px;
          padding: 4px 7px;
          text-align: center;
          line-height: 1.25;
          white-space: normal;
          overflow-wrap: normal;
          word-break: normal;
        }
        @media (max-width: 950px) {
          .kpis {
            grid-template-columns: repeat(2, 1fr);
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .hero {
            align-items: flex-start;
            flex-direction: column;
          }
        }
        @media (max-width: 640px) {
          .cto-wrap {
            width: min(100% - 24px, 1360px);
          }
          .cto-nav {
            padding: 0 12px;
          }
          .back-link,
          .status-live {
            display: none;
          }
          .secondary-btn {
            padding: 10px;
          }
          .hero {
            padding: 34px 0 24px;
          }
          .rate-card {
            min-width: 0;
            width: 100%;
          }
          .rate-cards {
            grid-template-columns: 1fr;
            width: 100%;
          }
          .kpis,
          .module-grid {
            grid-template-columns: 1fr;
          }
          .card {
            padding: 18px;
          }
          .primary-btn {
            padding: 11px;
          }
        }
        @media print {
          .cto-nav,
          .notice {
            display: none !important;
          }
          .cto-shell {
            background: #fff;
          }
          .cto-wrap {
            width: 100%;
          }
          .card,
          .kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }

        /* CTO control ledger — Deye-inspired visual layer.
           All finance calculations, live reads, exports and tables above remain unchanged. */
        body {
          background: #eef1f7;
          width: 100%;
          min-width: 100%;
          overflow-x: hidden;
        }
        .cto-shell {
          width: 100vw;
          max-width: 100vw;
          min-width: 100vw;
          padding-bottom: 38px;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 5% 4%, rgba(66, 135, 245, 0.22), transparent 23rem),
            #eef1f7;
        }
        .cto-nav {
          height: 72px;
          padding: 0 max(18px, calc((100vw - 760px) / 2));
          background: rgba(238, 241, 247, 0.9);
          border: 0;
          backdrop-filter: blur(16px);
        }
        .cto-brand {
          gap: 9px;
        }
        .cto-logo {
          width: 30px;
          height: 30px;
        }
        .brand-copy strong {
          color: #1676c7;
          font-size: 11px;
          letter-spacing: 1.35px;
        }
        .brand-copy p {
          color: #727a88;
          font-size: 8px;
        }
        .cto-actions {
          gap: 7px;
        }
        .back-link,
        .secondary-btn,
        .primary-btn {
          border-radius: 16px;
          font-size: 9px;
        }
        .secondary-btn {
          color: #126db7;
          border-color: #c8def4;
          background: rgba(255, 255, 255, 0.78);
        }
        .primary-btn {
          background: #1976c7;
          border-color: #1976c7;
        }
        .cto-wrap {
          width: min(760px, calc(100% - 30px));
        }
        .hero {
          position: relative;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: stretch;
          gap: 20px;
          margin-top: 24px;
          padding: clamp(22px, 5vw, 32px);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 28px;
          background: linear-gradient(121deg, #9fc8fa 0%, #e8f5ff 48%, #ffffff 100%);
          box-shadow: 0 15px 36px rgba(58, 73, 98, 0.1);
        }
        .hero::before {
          content: "";
          position: absolute;
          top: -135px;
          left: -85px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(45, 112, 227, 0.64), transparent 67%);
          filter: blur(8px);
          pointer-events: none;
        }
        .hero > * {
          position: relative;
        }
        .eyebrow {
          color: #136eb9;
          font-size: 9px;
          letter-spacing: 1.4px;
        }
        h1 {
          font-size: clamp(34px, 6vw, 54px);
          color: #20252f !important;
        }
        h1 span {
          color: #176fc0;
        }
        .hero-copy {
          max-width: 410px;
          color: #536170;
          font-size: 13px;
        }
        .rate-cards {
          grid-template-columns: 1fr;
          align-content: center;
        }
        .rate-card {
          min-width: 0;
          padding: 14px 15px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.68);
          box-shadow: none;
        }
        .rate-card strong {
          color: #1e2730 !important;
          font-size: 19px;
        }
        .notice {
          margin: 18px 0;
          border-color: #d6e7fb;
          border-radius: 18px;
          background: #f7fbff;
          color: #4b667d;
          box-shadow: 0 8px 20px rgba(61, 93, 127, 0.04);
        }
        .notice strong {
          color: #176fc0;
        }
        .kpis {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .kpi {
          min-height: 132px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 21px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 10px 25px rgba(58, 73, 98, 0.07);
        }
        .kpi:nth-child(1) {
          background: linear-gradient(122deg, #e2f6ee, #ffffff);
        }
        .kpi:nth-child(2) {
          background: linear-gradient(122deg, #e6efff, #ffffff);
        }
        .kpi:nth-child(4) {
          background: linear-gradient(122deg, #fff2d6, #ffffff);
        }
        .kpi.accent {
          border-color: transparent;
          background: linear-gradient(128deg, #116bb4, #29a3d3);
          box-shadow: 0 12px 29px rgba(20, 109, 181, 0.25);
        }
        .kpi-label {
          color: #657487;
          font-size: 8px;
        }
        .kpi-value {
          color: #20252f !important;
          font-size: clamp(24px, 5vw, 32px);
        }
        .sub-value {
          color: #647181;
        }
        .grid {
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 14px;
        }
        .card {
          padding: clamp(18px, 5vw, 25px);
          border: 1px solid rgba(255, 255, 255, 0.93);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 12px 28px rgba(58, 73, 98, 0.07);
        }
        .card-head {
          margin-bottom: 17px;
        }
        .card h2 {
          color: #262b34 !important;
          font-size: 20px;
          font-weight: 600;
        }
        .card p {
          color: #707986;
        }
        .line-chart {
          height: 225px;
          padding: 14px 7px 0;
          border-bottom-color: #dbe4ee;
          border-radius: 17px 17px 0 0;
          background: linear-gradient(180deg, #f4f9ff, transparent);
        }
        .line-labels strong {
          color: #1770bf;
        }
        .line-labels span {
          color: #667588;
        }
        .line-labels em {
          color: #263440;
        }
        .growth-table-wrap,
        .table-wrap {
          border-color: #e0e8f0;
          border-radius: 17px;
          background: rgba(255,255,255,.75);
        }
        th {
          background: #edf4fb;
          color: #617286;
        }
        .summary-row {
          padding: 15px 3px;
          border-bottom-color: #edf0f4;
        }
        .summary-row span {
          color: #6e7784;
        }
        .module-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .module {
          min-height: 105px;
          border-color: #e0e8f0;
          border-radius: 18px;
          background: linear-gradient(135deg, #f5f9ff, #fff);
        }
        .module:nth-child(1) {
          background: linear-gradient(135deg, #e9faf1, #fff);
        }
        .module:nth-child(2) {
          background: linear-gradient(135deg, #eaf2ff, #fff);
        }
        .module:nth-child(3) {
          background: linear-gradient(135deg, #fff3e4, #fff);
        }
        .module strong {
          color: #28313c !important;
        }
        .ledger {
          margin-top: 14px;
        }
        .ledger table {
          min-width: 0;
          table-layout: fixed;
        }
        .ledger th,
        .ledger td {
          padding: 10px 7px;
          font-size: 10px;
          overflow-wrap: anywhere;
        }
        .ledger th {
          font-size: 8px;
          letter-spacing: 0.55px;
        }
        .ledger .project-id,
        .ledger .mono,
        .ledger .tag {
          font-size: 8px;
          letter-spacing: 0.2px;
        }
        .footer-note {
          color: #6c7582 !important;
        }
        .compact-table-label {
          display: none;
        }
        @media (max-width: 640px), (max-aspect-ratio: 1/1) {
          .cto-shell {
            padding-bottom: 25px;
          }
          .cto-wrap {
            width: calc(100% - 24px);
          }
          .cto-nav {
            height: 64px;
            padding: 0 14px;
          }
          .cto-actions .secondary-btn {
            display: none;
          }
          .cto-actions .primary-btn {
            padding: 10px 11px;
          }
          .hero {
            grid-template-columns: 1fr;
            margin-top: 13px;
            padding: 23px 19px;
            border-radius: 24px;
          }
          .rate-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .rate-card {
            padding: 12px 11px;
          }
          .rate-card strong {
            font-size: 15px;
          }
          .kpis {
            grid-template-columns: 1fr 1fr;
          }
          .kpi {
            min-height: 126px;
            padding: 15px;
          }
          .kpi-value {
            font-size: 23px;
          }
          .module-grid {
            grid-template-columns: 1fr;
          }
          .grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .card {
            padding: 18px 14px;
          }
          .card-head {
            margin-bottom: 14px;
          }
          .card-head h2 {
            font-size: 15px;
          }
          .card-head p {
            font-size: 10px;
          }
          .line-chart {
            height: 150px;
            padding-top: 5px;
            overflow: hidden;
          }
          .line-labels {
            gap: 0;
            margin-top: 7px;
          }
          .line-labels strong {
            font-size: 8px;
          }
          .line-labels span {
            font-size: 7px;
          }
          .line-labels em {
            font-size: 8px;
            margin-top: 4px;
          }
          .growth-table {
            min-width: 0;
            width: 100%;
            table-layout: fixed;
            margin-top: 14px;
          }
          .growth-table th,
          .growth-table td {
            white-space: normal;
            overflow-wrap: anywhere;
            padding: 8px 4px;
            font-size: 8px;
            line-height: 1.3;
          }
          .growth-table th {
            font-size: 7px;
            letter-spacing: 0.25px;
          }
          .growth-table th:nth-child(1) { width: 18%; }
          .growth-table th:nth-child(2),
          .growth-table th:nth-child(3) { width: 28%; }
          .growth-table th:nth-child(4) { width: 26%; }
          .desktop-table-label {
            display: none;
          }
          .compact-table-label {
            display: inline;
          }
          .ledger th,
          .ledger td {
            padding: 8px 4px;
            font-size: 8px;
            line-height: 1.25;
          }
          .ledger th {
            font-size: 7px;
            letter-spacing: 0.2px;
          }
          .ledger .project-id,
          .ledger .mono,
          .ledger .tag {
            font-size: 7px;
          }
          .line-chart {
            height: 150px;
          }
          .line-labels {
            gap: 1px;
          }
          .line-labels strong {
            font-size: 7px;
          }
          .line-labels span {
            font-size: 7px;
          }
          .line-labels em {
            font-size: 8px;
          }
        }
      `}</style>
      <nav className="cto-nav">
        <div className="cto-brand">
          <img src="/logo-azphur.avif" className="cto-logo" alt="AZPHUR" />
          <div className="brand-copy">
            <strong>AZPHUR / CTO</strong>
            <p>PRIVATE CONTROL LEDGER</p>
          </div>
        </div>
        <div className="cto-actions">
          <div className="status-live">
            <span className="pulse" />
            <span className="mono">
              {loading ? "SYNCING" : "LIVE DATABASE LINK"}
            </span>
          </div>
          <Link className="back-link" href="/">
            ← HOME
          </Link>
          <button className="secondary-btn" onClick={exportCsv}>
            EXPORT CSV
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            SAVE AS PDF
          </button>
        </div>
      </nav>
      <section className="cto-wrap">
        <header className="hero">
          <div>
            <p className="eyebrow">CTO FINANCE CONTROL / AZPHUR</p>
            <h1>
              Your platform.
              <br />
              <span>Your ledger.</span>
            </h1>
            <p className="hero-copy">
              A private monthly view of completed platform activity, AZPHUR
              commission estimates and your accrued CTO compensation.
            </p>
          </div>
          <div className="rate-cards">
            <div className="rate-card">
              <span className="mono">LIVE PHP → EUR</span>
              <strong>₱1 = €{phpToEur.toFixed(5)}</strong>
              <span className="mono">
                {rateUpdatedAt
                  ? `updated ${rateUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "fallback rate until refresh"}
              </span>
            </div>
            <div className="rate-card">
              <span className="mono">LIVE EUR → PHP</span>
              <strong>€1 = ₱{(1 / phpToEur).toFixed(2)}</strong>
              <span className="mono">same live reference rate</span>
            </div>
          </div>
        </header>
        <div className="notice">
          <span>ⓘ</span>
          <div>
            <strong>Current pre-Xendit ledger.</strong> Settled lead values are
            used as the source of truth for now. Platform fees and CTO
            compensation are estimates until Xendit payment, fee, refund and
            payout records are connected.
          </div>
        </div>
        <section className="kpis">
          <article className="kpi">
            <span className="kpi-label">CONFIRMED PROJECT GTV</span>
            <strong className="kpi-value">{php(finance.confirmedGtv)}</strong>
            <span className="sub-value">
              {finance.settled.length} settled project
              {finance.settled.length === 1 ? "" : "s"}
            </span>
          </article>
          <article className="kpi">
            <span className="kpi-label">EST. AZPHUR SUCCESS FEE</span>
            <strong className="kpi-value">{php(finance.azphurFee)}</strong>
            <span className="sub-value">
              {(PLATFORM_FEE_RATE * 100).toFixed(0)}% planning rate ·{" "}
              {eur(inEuro(finance.azphurFee))}
            </span>
          </article>
          <article className="kpi accent">
            <span className="kpi-label">YOUR CTO COMPENSATION</span>
            <strong className="kpi-value">{php(finance.ctoAccrued)}</strong>
            <span className="sub-value">
              {(CTO_SHARE_RATE * 100).toFixed(0)}% of AZPHUR net success fee ·{" "}
              {eur(inEuro(finance.ctoAccrued))}
            </span>
          </article>
          <article className="kpi">
            <span className="kpi-label">ACTIVE PIPELINE VALUE</span>
            <strong className="kpi-value">{php(finance.pipelineGtv)}</strong>
            <span className="sub-value">
              {finance.pipeline.length} live lead
              {finance.pipeline.length === 1 ? "" : "s"} · not accrued
            </span>
          </article>
        </section>
        <section className="grid">
          <article className="card">
            <div className="card-head">
              <div>
                <h2>CTO compensation trend</h2>
                <p>
                  Monthly growth line, with both PHP and EUR values — last six
                  months.
                </p>
              </div>
              <span className="mono">PHP + EUR</span>
            </div>
            <div className="line-chart">
              <svg
                viewBox="0 0 590 180"
                role="img"
                aria-label="Monthly CTO compensation growth"
              >
                <line
                  x1="20"
                  y1="156"
                  x2="570"
                  y2="156"
                  stroke="#dbe8eb"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1="98"
                  x2="570"
                  y2="98"
                  stroke="#edf2f3"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
                <line
                  x1="20"
                  y1="40"
                  x2="570"
                  y2="40"
                  stroke="#edf2f3"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                />
                <polyline
                  points={growthLinePoints}
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {finance.months.map((month, index) => {
                  const x = 34 + index * 105;
                  const y = 156 - (month.value / maxMonthValue) * 116;
                  return (
                    <circle
                      key={month.key}
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#fff"
                      stroke="#06b6d4"
                      strokeWidth="4"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="line-labels">
              {finance.months.map((month) => (
                <div key={month.key}>
                  <strong>
                    {month.value ? php(month.value).replace("PHP", "₱") : "₱0"}
                  </strong>
                  <span>{month.value ? eur(inEuro(month.value)) : "€0"}</span>
                  <em>{month.label}</em>
                </div>
              ))}
            </div>
            <div className="growth-table-wrap">
              <table className="growth-table">
                <thead>
                  <tr>
                    <th>MONTH</th>
                    <th><span className="desktop-table-label">CTO ACCRUED (PHP)</span><span className="compact-table-label">PHP</span></th>
                    <th><span className="desktop-table-label">CTO ACCRUED (EUR)</span><span className="compact-table-label">EUR</span></th>
                    <th><span className="desktop-table-label">MONTHLY TREND</span><span className="compact-table-label">TREND</span></th>
                  </tr>
                </thead>
                <tbody>
                  {finance.months.map((month, index) => {
                    const previous = finance.months[index - 1]?.value || 0;
                    const difference = month.value - previous;
                    const trend =
                      index === 0 || difference === 0
                        ? "—"
                        : difference > 0
                          ? `↑ +${php(difference)}`
                          : `↓ ${php(difference)}`;
                    return (
                      <tr key={month.key}>
                        <td>
                          <strong>{month.label}</strong>
                        </td>
                        <td>{php(month.value)}</td>
                        <td>{eur(inEuro(month.value))}</td>
                        <td className={difference > 0 ? "up" : "flat"}>
                          {trend}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
          <article className="card">
            <div className="card-head">
              <div>
                <h2>Settlement control</h2>
                <p>Payment-stage signals currently available in lead data.</p>
              </div>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span>Combined down payments confirmed</span>
                <strong>{finance.downConfirmed}</strong>
              </div>
              <div className="summary-row">
                <span>Combined final balances confirmed</span>
                <strong>{finance.finalConfirmed}</strong>
              </div>
              <div className="summary-row">
                <span>EV charging stations tracked</span>
                <strong>{stations.length}</strong>
              </div>
              <div className="summary-row">
                <span>Monthly payout status</span>
                <strong className="tag pending">NOT YET CONNECTED</strong>
              </div>
            </div>
          </article>
        </section>
        <section className="grid">
          <article className="card">
            <div className="card-head">
              <div>
                <h2>Platform revenue channels</h2>
                <p>
                  All modules remain separated so their performance can be
                  compared cleanly.
                </p>
              </div>
            </div>
            <div className="module-grid">
              <div className="module">
                <strong>☀ Solar</strong>
                <span>
                  {finance.settled.length} confirmed project(s)
                  <br />
                  Primary live revenue path
                </span>
              </div>
              <div className="module">
                <strong>⚡ EV Charge</strong>
                <span>
                  {stations.length} station node(s)
                  <br />
                  Revenue activates with sessions
                </span>
              </div>
              <div className="module">
                <strong>🚘 EV Mobility</strong>
                <span>
                  Future module
                  <br />
                  Revenue activates with real trips
                </span>
              </div>
            </div>
          </article>
          <article className="card">
            <div className="card-head">
              <div>
                <h2>Monthly statement rule</h2>
                <p>What every future CTO report should preserve.</p>
              </div>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span>Calculation</span>
                <strong>AZPHUR net fee × 22%</strong>
              </div>
              <div className="summary-row">
                <span>Statement closing</span>
                <strong>End of month / 15th</strong>
              </div>
              <div className="summary-row">
                <span>Archival output</span>
                <strong>PDF + CSV ledger</strong>
              </div>
            </div>
          </article>
        </section>
        <section className="card ledger">
          <div className="card-head">
            <div>
              <h2>Confirmed project ledger</h2>
              <p>
                Only settled projects accrue an estimated AZPHUR fee and CTO
                compensation.
              </p>
            </div>
            <span className="mono">{finance.settled.length} RECORDS</span>
          </div>
          <div className="table-wrap">
            {finance.settled.length === 0 ? (
              <div className="empty">
                No settled project yet. The ledger will populate automatically
                after the first real completed transaction.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>PROJECT</th>
                    <th>CUSTOMER</th>
                    <th>RECORDED</th>
                    <th>PROJECT GTV</th>
                    <th>AZPHUR FEE EST.</th>
                    <th>YOUR 22%</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.settled.map((lead) => {
                    const value = getProjectValue(lead);
                    const fee = value * PLATFORM_FEE_RATE;
                    const share = fee * CTO_SHARE_RATE;
                    return (
                      <tr key={lead.id}>
                        <td className="project-id">
                          AZ-{lead.id.split("-")[0].toUpperCase()}
                        </td>
                        <td>
                          {lead.customer_name || lead.full_name || "Customer"}
                        </td>
                        <td>{monthLabel(lead.created_at)}</td>
                        <td>{php(value)}</td>
                        <td>{php(fee)}</td>
                        <td>
                          <strong>{php(share)}</strong>
                          <br />
                          <span className="mono">{eur(inEuro(share))}</span>
                        </td>
                        <td>
                          <span className="tag ledger-status">
                            {String(lead.status || "SETTLED").replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <p className="footer-note">
            This is a CTO control view, not a bank account or accounting
            substitute. Once Xendit is live, payment webhooks and payout
            references must become the settlement source before any monthly
            statement is marked final.
          </p>
        </section>
      </section>
    </main>
  );
}
