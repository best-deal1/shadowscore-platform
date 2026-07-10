"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import {
  ShadowScoreAcceptance,
  ShadowScoreEntity,
  ShadowScoreReport,
  addWatchlistEntity,
  getWorkspace,
  workspaceModeLabel,
} from "../../lib/workspace";
import { ShadowScoreUser, getCurrentSession, getCurrentUser, logoutUser } from "../../lib/auth";

const stageClass: Record<ShadowScoreReport["stage"], string> = {
  Healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  Warning: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
  Restricted: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  Suspended: "border-red-400/30 bg-red-500/10 text-red-200",
  Critical: "border-red-500/40 bg-red-600/15 text-red-100",
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[30px] border border-white/10 bg-white/[0.035] p-6 ${className}`}>{children}</div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<ShadowScoreUser | null>(() => getCurrentUser());
  const [authChecked, setAuthChecked] = useState(false);
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [entities, setEntities] = useState<ShadowScoreEntity[]>([]);
  const [acceptances, setAcceptances] = useState<ShadowScoreAcceptance[]>([]);
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState<ShadowScoreEntity["type"]>("Marketplace");

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentSession = getCurrentSession();
    if (!currentUser || !currentSession) {
      router.push("/login");
      return;
    }
    getWorkspace(currentSession)
      .then((workspace) => {
        setReports(workspace.reports);
        setEntities(workspace.entities);
        setAcceptances(workspace.acceptances);
      })
      .finally(() => setAuthChecked(true));
  }, [router]);

  function signOut() {
    logoutUser();
    router.push("/login");
  }

  async function addEntity() {
    const trimmed = entityName.trim();
    const currentSession = getCurrentSession();
    if (!trimmed || !currentSession) return;

    const next: ShadowScoreEntity = {
      id: `ent-${Date.now()}`,
      name: trimmed,
      type: entityType,
      status: "Monitoring",
      lastScore: 50,
      updatedAt: new Date().toISOString(),
    };

    const created = await addWatchlistEntity(currentSession, next);
    setEntities((items) => [created, ...items].slice(0, 25));
    setEntityName("");
  }


  async function simulatePaid(paymentIntentId: string) {
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    const response = await fetch("/api/workspace/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: currentSession, paymentIntentId }),
    });
    if (!response.ok) throw new Error("Unable to mark payment as paid.");
    const workspace = await getWorkspace(currentSession);
    setReports(workspace.reports);
  }
  const readyReports = useMemo(() => reports.filter((item) => item.reportStatus === "ready"), [reports]);
  const avgRisk = useMemo(() => Math.round(readyReports.reduce((sum, item) => sum + (item.riskScore || 0), 0) / Math.max(readyReports.filter((item) => typeof item.riskScore === "number").length, 1)), [readyReports]);
  const highRiskCount = useMemo(() => readyReports.filter((item) => (item.riskScore || 0) >= 70).length, [readyReports]);

  if (!authChecked || !user) {
    return (
      <ShadowScoreLayout>
        <section className="mx-auto max-w-3xl px-6 py-20 text-zinc-400">Loading secure workspace...</section>
      </ShadowScoreLayout>
    );
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">Trust Intelligence Workspace</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Dashboard</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
              Recent scans, saved reports, business history, monitoring and account controls are organized in one responsive workspace.
            </p>
          </div>

          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-zinc-500">Connected as:</div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-lg font-black text-white">{user.name}</div>
              <div className="mt-1 text-sm text-zinc-500">{user.email}</div>
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100">Plan: {readyReports.length > 0 ? "Professional" : "Free"}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/account" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-zinc-300 hover:border-red-400/30 hover:text-white">Account Settings</Link>
              <button onClick={signOut} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">Sign Out</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-600">V19 keeps this workspace empty for new accounts and treats persisted risk history as user-owned evidence. Current data mode: {workspaceModeLabel()}.</p>
          </Panel>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["Ready Reports", readyReports.length.toString(), "Payment-unlocked reports"],
            ["Average Risk", `${avgRisk}/100`, "Across unlocked reports only"],
            ["High Risk", highRiskCount.toString(), "Unlocked reports above 70 risk score"],
            ["Acceptances", acceptances.length.toString(), "Legal acceptance records for paid reports"],
          ].map(([label, value, body]) => (
            <Panel key={label}>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-600">{label}</div>
              <div className="mt-3 text-4xl font-black text-white">{value}</div>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{body}</p>
            </Panel>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Recent scans</div>
                <h2 className="mt-2 text-3xl font-black">Saved reports</h2>
              </div>
              <Link href="/intake" className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">New Scan</Link>
            </div>

            <div className="mt-8 space-y-4">
              {readyReports.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/55 p-6">
                  <div className="text-xl font-black text-white">No paid reports yet</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">Run a free scan to preview risk, then unlock the full ShadowScore report after payment.</p>
                </div>
              )}
              {readyReports.map((report) => (
                <div key={report.reportId} className="rounded-3xl border border-white/10 bg-black/55 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-600">{report.reportId}</div>
                      <div className="mt-2 text-xl font-black text-white">{report.title}</div>
                      <div className="mt-1 text-sm text-zinc-500">{report.entity} • {report.platform} • {formatDate(report.createdAt)}</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-black ${stageClass[report.stage]}`}>{report.stage}</div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">Risk Score</div>
                      <div className="mt-2 text-3xl font-black text-white">{report.riskScore ?? "Provider pending"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">Confidence</div>
                      <div className="mt-2 text-3xl font-black text-white">{report.confidenceScore ? `${report.confidenceScore}%` : "Provider pending"}</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-600">Why This Score?</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(report.topFactors.length ? report.topFactors : [report.reportSummary?.message || "Placeholder providers completed; production intelligence pending."]).map((factor) => (
                        <span key={factor} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">{factor}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>


          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-yellow-300">Business history</div>
            <h2 className="mt-2 text-3xl font-black">Report lifecycle</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Reports unlock from paymentStatus == paid only. Non-ready reports hide download and full report details.</p>
            <div className="mt-6 space-y-3">
              {reports.length === 0 && <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-500">No lifecycle records yet.</div>}
              {reports.map((report) => (
                <div key={report.reportId} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                  <div className="font-black text-white">{report.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{report.entity} • {formatDate(report.createdAt)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Payment: {report.paymentStatus || "paid"}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Report: {report.reportStatus}</span>
                  </div>
                  {report.reportStatus !== "ready" && report.paymentIntentId && (
                    <button onClick={() => simulatePaid(report.paymentIntentId!)} className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-xs font-black text-yellow-100">Dev webhook: mark paid and generate</button>
                  )}
                  {report.reportStatus === "ready" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href={`/report?reportId=${encodeURIComponent(report.reportId)}`} className="rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white hover:bg-red-500">View Report</Link>
                      <Link href="/reports" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-100">Open report center</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-8">
            <Panel>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Monitoring</div>
              <h2 className="mt-2 text-3xl font-black">Business watchlist</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">Track seller accounts, payment providers, suppliers, websites and businesses from one workspace. New workspaces start with an empty watchlist.</p>

              <div className="mt-6 space-y-3">
                {entities.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="font-black text-white">Empty watchlist</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Add your first marketplace account, payment provider, supplier, website or business when you are ready to monitor it.</p>
                  </div>
                )}
                {entities.map((entity) => (
                  <div key={entity.id} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{entity.name}</div>
                        <div className="mt-1 text-xs text-zinc-600">{entity.type} • Updated {formatDate(entity.updatedAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white">{entity.lastScore}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Risk</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs font-bold text-zinc-500">{entity.status}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-bold text-white">Add Entity</div>
                <div className="mt-3 grid gap-3">
                  <input value={entityName} onChange={(event) => setEntityName(event.target.value)} placeholder="eBay account, PayPal, supplier, website..." className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-red-400/50" />
                  <select value={entityType} onChange={(event) => setEntityType(event.target.value as ShadowScoreEntity["type"])} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-red-400/50">
                    <option>Marketplace</option>
                    <option>Payment</option>
                    <option>Business</option>
                    <option>Website</option>
                    <option>Supplier</option>
                  </select>
                  <button onClick={addEntity} className="rounded-2xl border border-red-400/30 bg-red-600/15 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-600/25">Add to Monitoring</button>
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Account</div>
              <h2 className="mt-2 text-3xl font-black">Latest activity</h2>
              <div className="mt-6 space-y-4">
                {reports.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="font-black text-white">Empty timeline</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Your scan and paid-report activity will appear here after you start your first scan.</p>
                  </div>
                )}
                {reports.slice(0, 4).map((report, index) => (
                  <div key={report.reportId} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      {index < Math.min(reports.length, 4) - 1 && <div className="h-full w-px bg-white/10" />}
                    </div>
                    <div className="pb-5">
                      <div className="text-sm font-bold text-white">{report.title}</div>
                      <div className="mt-1 text-xs text-zinc-600">Risk {report.riskScore} • Confidence {report.confidenceScore}% • {formatDate(report.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="mt-10">
          <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Workspace data</div>
          <p className="mt-3 text-sm leading-7 text-zinc-500">
            ShadowScore uses the configured database as the source of truth for reports, scan history, watchlists, purchased reports, payment history, legal acceptances and profile settings. LocalStorage is no longer used as primary workspace storage.
          </p>
        </Panel>
      </section>
    </ShadowScoreLayout>
  );
}
