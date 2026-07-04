"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import {
  ACCEPTANCES_STORAGE_KEY,
  ENTITIES_STORAGE_KEY,
  REPORTS_STORAGE_KEY,
  ShadowScoreAcceptance,
  ShadowScoreEntity,
  ShadowScoreReport,
  readJsonArray,
  writeJsonArray,
} from "../../lib/portal";
import { ShadowScoreUser, getCurrentUser, logoutUser } from "../../lib/auth";

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
  const [user, setUser] = useState<ShadowScoreUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [entities, setEntities] = useState<ShadowScoreEntity[]>([]);
  const [acceptances, setAcceptances] = useState<ShadowScoreAcceptance[]>([]);
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState<ShadowScoreEntity["type"]>("Marketplace");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setAuthChecked(true);

    const storedReports = readJsonArray<ShadowScoreReport>(REPORTS_STORAGE_KEY, []);
    const storedEntities = readJsonArray<ShadowScoreEntity>(ENTITIES_STORAGE_KEY, []);
    const storedAcceptances = readJsonArray<ShadowScoreAcceptance>(ACCEPTANCES_STORAGE_KEY, []);

    setReports(storedReports);
    setEntities(storedEntities);
    setAcceptances(storedAcceptances);
  }, [router]);

  function signOut() {
    logoutUser();
    router.push("/login");
  }

  function addEntity() {
    const trimmed = entityName.trim();
    if (!trimmed) return;

    const next: ShadowScoreEntity = {
      id: `ent-${Date.now()}`,
      name: trimmed,
      type: entityType,
      status: "Monitoring",
      lastScore: 50,
      updatedAt: new Date().toISOString(),
    };

    const updated = [next, ...entities].slice(0, 25);
    setEntities(updated);
    writeJsonArray(ENTITIES_STORAGE_KEY, updated.filter((item) => !item.id.startsWith("ent-ebay") && !item.id.startsWith("ent-paypal") && !item.id.startsWith("ent-url")));
    setEntityName("");
  }

  const paidReports = useMemo(() => reports.filter((item) => item.platform !== "Checkout" && item.riskScore > 0), [reports]);
  const lockedIntents = useMemo(() => reports.filter((item) => item.platform === "Checkout" || item.riskScore === 0), [reports]);
  const avgRisk = useMemo(() => Math.round(paidReports.reduce((sum, item) => sum + item.riskScore, 0) / Math.max(paidReports.length, 1)), [paidReports]);
  const highRiskCount = useMemo(() => paidReports.filter((item) => item.riskScore >= 70).length, [paidReports]);

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
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-red-300">Trust Intelligence Workspace V19</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Your ShadowScore Risk Workspace</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
              Your workspace will store paid reports, watched entities, legal acceptances and risk history after your first scan.
            </p>
          </div>

          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-zinc-500">Signed In Account</div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-lg font-black text-white">{user.name}</div>
              <div className="mt-1 text-sm text-zinc-500">{user.email}</div>
              <div className="mt-2 break-all text-xs text-zinc-700">User ID: {user.id}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/account" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-zinc-300 hover:border-red-400/30 hover:text-white">Account Settings</Link>
              <button onClick={signOut} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">Sign Out</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-600">V19 keeps this workspace empty for new accounts and treats persisted risk history as user-owned evidence. Production authentication and database storage remain the next hardening milestone.</p>
          </Panel>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["Reports", paidReports.length.toString(), "Paid reports only"],
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
                <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">My Reports</div>
                <h2 className="mt-2 text-3xl font-black">Saved Risk History</h2>
              </div>
              <Link href="/intake" className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">New Scan</Link>
            </div>

            <div className="mt-8 space-y-4">
              {paidReports.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/55 p-6">
                  <div className="text-xl font-black text-white">No paid reports yet</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">Run a free scan to preview risk, then unlock the full ShadowScore report after payment.</p>
                </div>
              )}
              {paidReports.map((report) => (
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
                      <div className="mt-2 text-3xl font-black text-white">{report.riskScore}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">Confidence</div>
                      <div className="mt-2 text-3xl font-black text-white">{report.confidenceScore}%</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-600">Why This Score?</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.topFactors.map((factor) => (
                        <span key={factor} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">{factor}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>


          {lockedIntents.length > 0 && (
            <Panel>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-yellow-300">Locked Payment Intents</div>
              <h2 className="mt-2 text-3xl font-black">Pending Checkout</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">These are payment intents only. Full risk score, recommendations and action plan unlock only after payment is completed.</p>
              <div className="mt-6 space-y-3">
                {lockedIntents.map((report) => (
                  <div key={report.reportId} className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
                    <div className="font-black text-white">{report.reportId}</div>
                    <div className="mt-1 text-sm text-zinc-400">{report.title}</div>
                    <div className="mt-3 inline-flex rounded-full border border-yellow-400/25 px-3 py-1 text-xs font-black text-yellow-100">Locked until payment</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="space-y-8">
            <Panel>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Watchlist</div>
              <h2 className="mt-2 text-3xl font-black">Saved Entities</h2>
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
                  <button onClick={addEntity} className="rounded-2xl border border-red-400/30 bg-red-600/15 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-600/25">Add to Watchlist</button>
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Risk Timeline</div>
              <h2 className="mt-2 text-3xl font-black">Latest Movement</h2>
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
          <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">V19 Data Note</div>
          <p className="mt-3 text-sm leading-7 text-zinc-500">
            ShadowScore should use the database as the source of truth for reports, scan history, watchlists, purchased reports, payment history, legal acceptances and profile settings. Local persistence remains a temporary client-side bridge only.
          </p>
        </Panel>
      </section>
    </ShadowScoreLayout>
  );
}
