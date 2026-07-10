/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession } from "../../lib/auth";
import { buildTrustTimeline } from "../../lib/trustTimeline";
import { getWorkspace, ShadowScoreReport } from "../../lib/workspace";
import { useEffect, useState } from "react";

function formatDate(value?: string) {
  if (!value) return "Pending";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function findNarrativeSection(report: ShadowScoreReport, id: string) {
  return report.reportSummary?.businessNarrative?.sections.find((section) => section.id === id);
}

function fallbackSection(title: string, body: Array<string | undefined>) {
  return { title, body: body.filter((item): item is string => Boolean(item)) };
}


function FieldDetail({ label, field }: { label: string; field?: { value: string; confidence: string; evidenceSource: string[]; lastVerified: string } }) {
  if (!field) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-black text-white">{field.value}</div>
      <div className="mt-2 text-xs text-red-200">{field.confidence} confidence</div>
      <div className="mt-2 text-xs leading-5 text-zinc-500">Evidence Source: {field.evidenceSource.length ? field.evidenceSource.join(", ") : "Not verified"}</div>
      <div className="mt-1 text-xs leading-5 text-zinc-500">Last Verified: {formatDate(field.lastVerified)}</div>
    </div>
  );
}

function BusinessCard({ title, body }: { title: string; body: string[] }) {
  if (!body.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="text-xs uppercase tracking-[0.28em] text-red-200">{title}</div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
        {body.map((item) => <p key={item}>{item}</p>)}
      </div>
    </div>
  );
}

function DecisionCard({ report }: { report: ShadowScoreReport }) {
  const rawDecision = report.reportSummary?.decision?.decision || (report.reportSummary?.businessNarrative?.decision?.toUpperCase().includes("FAIL") ? "FAIL" : report.reportSummary?.businessNarrative?.decision?.toUpperCase().includes("PASS") ? "PASS" : "REVIEW");
  const decision = rawDecision === "FAIL" ? "CONFIRMED RISK" : rawDecision;
  const tone = decision === "PASS"
    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
    : decision === "CONFIRMED RISK"
      ? "border-red-400/35 bg-red-500/10 text-red-100"
      : "border-orange-400/35 bg-orange-500/10 text-orange-100";
  return (
    <section className={`rounded-[28px] border p-6 shadow-2xl shadow-black/20 ${tone}`}>
      <div className="text-xs uppercase tracking-[0.28em] opacity-80">Decision</div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-5xl font-black tracking-tight">{decision}</div>
          <p className="mt-3 max-w-2xl text-base font-bold opacity-90">{(report.reportSummary?.decision?.decisionLabel === "Do not proceed" ? "Verified negative indicators detected" : report.reportSummary?.decision?.decisionLabel) || report.reportSummary?.businessNarrative?.decision || "Review available evidence"}</p>
        </div>
        {report.reportSummary?.decision?.verificationScore ? (
          <div className="rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-right">
            <div className="text-3xl font-black">{report.reportSummary.decision.verificationScore}/100</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Confidence</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function ReportPage() {
  const [reportId, setReportId] = useState("");
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReportId(new URLSearchParams(window.location.search).get("reportId") || "");
    const session = getCurrentSession();
    if (!session) {
      setLoaded(true);
      return;
    }
    getWorkspace(session).then((workspace) => setReports(workspace.reports)).finally(() => setLoaded(true));
  }, []);

  const report = useMemo(() => reports.find((item) => item.reportId === reportId), [reports, reportId]);
  const isReady = report?.reportStatus === "ready";
  const trustTimeline = useMemo(() => report ? buildTrustTimeline({
    providerResults: report.providerResults,
    insights: report.reportSummary?.insights,
    insightEngineVersion: report.reportSummary?.insightEngineVersion,
    audience: "paid",
  }) : [], [report]);
  const executiveSummary = report ? findNarrativeSection(report, "executiveSummary") : undefined;
  const evidenceUsed = report ? findNarrativeSection(report, "evidenceUsed") : undefined;
  const narrativeCards = report ? [
    findNarrativeSection(report, "whatWeFound") || fallbackSection("Key Findings", report.reportSummary?.decision?.topReasons || [report.reportSummary?.message]),
    findNarrativeSection(report, "whatRequiresVerification") || fallbackSection("Needs Review", [report.reportSummary?.decision?.whatThisMeans]),
    findNarrativeSection(report, "recommendedNextSteps") || fallbackSection("Next Steps", [report.reportSummary?.decision?.recommendedAction]),
  ] : [];

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/workspace" className="text-sm font-bold text-red-300 hover:text-red-200">← Back to dashboard</Link>
        <div className="mt-8 text-xs uppercase tracking-[0.45em] text-red-300">Private Report</div>
        {!loaded && <p className="mt-6 text-zinc-400">Preparing report...</p>}
        {loaded && !report && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-7">
            <h1 className="text-3xl font-black">Report not found</h1>
            <p className="mt-4 leading-7 text-zinc-400">Open a ready report from your dashboard. ShadowScore does not display demo reports.</p>
          </div>
        )}
        {report && !isReady && (
          <div className="mt-8 rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-7">
            <h1 className="text-3xl font-black text-yellow-100">Report locked</h1>
            <p className="mt-4 leading-7 text-zinc-300">This report is not ready. Full report details and downloads appear only when paymentStatus is paid and reportStatus is ready.</p>
          </div>
        )}
        {report && isReady && (
          <div className="mt-8 rounded-[32px] border border-white/10 bg-black/55 p-8 shadow-[0_0_60px_rgba(120,0,20,0.16)]">
            <DecisionCard report={report} />

            <section className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="text-xs uppercase tracking-[0.28em] text-red-200">Business Identity</div>
              <h1 className="mt-4 text-4xl font-extrabold">{report.reportSummary?.identityProfile?.businessIdentity?.businessName.value || report.target || report.entity}</h1>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <FieldDetail label="Business" field={report.reportSummary?.identityProfile?.businessIdentity?.businessName} />
                <FieldDetail label="Status" field={{ value: report.reportSummary?.identityProfile?.businessIdentityStatus === "Detected" ? "Likely verified business" : report.reportSummary?.identityProfile?.businessIdentityStatus || "Not verified", confidence: report.reportSummary?.identityProfile?.identityConfidence || "Low", evidenceSource: ["Public business profile", "DNS", "WHOIS"], lastVerified: report.reportSummary?.identityProfile?.generatedAt || report.readyAt || report.createdAt }} />
                <FieldDetail label="Industry" field={report.reportSummary?.identityProfile?.businessIdentity?.industry} />
                <FieldDetail label="Country" field={report.reportSummary?.identityProfile?.businessIdentity?.country} />
                <FieldDetail label="Public Identity" field={{ value: report.reportSummary?.identityProfile?.businessIdentityStatus || "Not verified", confidence: report.reportSummary?.identityProfile?.identityConfidence || "Low", evidenceSource: ["Evidence Confidence Matrix"], lastVerified: report.reportSummary?.identityProfile?.generatedAt || report.readyAt || report.createdAt }} />
                <FieldDetail label="Evidence Coverage" field={{ value: report.reportSummary?.identityProfile?.businessIdentity?.evidenceCoverage.label || "0 of 11 sources", confidence: report.reportSummary?.identityProfile?.businessIdentityStatus || "Not verified", evidenceSource: ["Evidence Confidence Matrix"], lastVerified: report.reportSummary?.identityProfile?.generatedAt || report.readyAt || report.createdAt }} />
              </div>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300"><span className="font-bold text-white">Recommendation:</span> {report.reportSummary?.identityProfile?.businessIdentityStatus === "Detected" ? "Business identity appears consistent. Verify ownership for high-value transactions." : report.reportSummary?.identityProfile?.identitySummary || report.reportSummary?.message}</p>
              {report.reportSummary?.execution ? (
                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  {[
                    ["Completed in", `${report.reportSummary.execution.completedInSeconds} seconds`],
                    ["Evidence", String(report.reportSummary.execution.evidenceCollected)],
                    ["Confidence", report.reportSummary.execution.decisionConfidence || "Not verified"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</div>
                      <div className="mt-2 text-lg font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="text-xs uppercase tracking-[0.28em] text-red-200">Why</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="text-3xl font-black text-white">{report.reportSummary?.businessNarrative?.decision || report.reportSummary?.decision?.decisionLabel || "Review available evidence"}</div>
                {(report.reportSummary?.businessNarrative?.confidence || report.reportSummary?.decision?.confidenceLevel) ? (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{report.reportSummary?.businessNarrative?.confidence || report.reportSummary?.decision?.confidenceLevel} confidence</span>
                ) : null}
              </div>
              {report.reportSummary?.decision?.recommendedAction ? (
                <p className="mt-5 text-base leading-7 text-zinc-200"><span className="font-bold text-white">Recommendation:</span> {report.reportSummary.decision.recommendedAction}</p>
              ) : null}
              {executiveSummary?.body.length ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-400">Summary</div>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
                    {executiveSummary.body.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </div>
              ) : null}
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {narrativeCards.map((section) => <BusinessCard key={section.title} title={section.title} body={section.body} />)}
              </div>
            </section>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Report ID", report.reportId],
                ["Target", report.target || report.entity],
                ["Ready at", formatDate(report.readyAt)],
                ["Primary domain", report.reportSummary?.businessNarrative?.primaryDomain || report.reportSummary?.primaryRiskDomain || "Pending"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">{label}</div>
                  <div className="mt-3 break-words text-xl font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            {trustTimeline.length ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-red-300">Timeline</div>
                <div className="mt-5 space-y-4">
                  {trustTimeline.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-black text-white">Step {index + 1}: {item.title}</div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{item.status}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{item.description}</p>
                      <p className="mt-3 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Evidence source:</span> {item.evidenceSource}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <details className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <summary className="cursor-pointer text-xs uppercase tracking-[0.28em] text-red-300">Technical Details</summary>
              {report.reportSummary?.identityProfile?.businessIdentity?.evidenceConfidenceMatrix.length ? (
                <section className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-400">Business Identity Evidence Confidence Matrix</div>
                  <div className="mt-4 grid gap-3">
                    {report.reportSummary.identityProfile.businessIdentity?.evidenceConfidenceMatrix.map((row) => (
                      <div key={row.field} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
                        <div className="font-black text-white">{row.field}: {row.value}</div>
                        <div className="mt-2 text-xs text-red-200">{row.confidence}</div>
                        <div className="mt-2 text-xs text-zinc-500">Detected from: {row.detectedFrom.length ? row.detectedFrom.join(", ") : "Not verified"}</div>
                        <div className="mt-2 text-xs text-zinc-500">Last Verified: {formatDate(row.lastVerified)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {evidenceUsed?.body.length ? (
                <section className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-400">Evidence Used</div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                    {evidenceUsed.body.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </section>
              ) : null}
              {report.reportSummary?.insights?.length ? (
                <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-emerald-200">Signal Review</div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {report.reportSummary.insights.map((insight) => (
                      <div key={insight.category} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="font-black text-white">{insight.category}</div>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{insight.riskLevel}</span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-zinc-300">{insight.insight}</p>
                        <p className="mt-3 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Why it matters:</span> {insight.whyItMatters}</p>
                        <p className="mt-2 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Recommended next step:</span> {insight.recommendedNextStep}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {report.reportSummary?.technicalDetails ? (
                <section className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-400">Provider status</div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {(["executed", "skipped", "pending", "failed"] as const).map((status) => (
                      <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-300">{status}</div>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                          {report.reportSummary?.technicalDetails?.[status].length ? report.reportSummary.technicalDetails[status].map((item) => (
                            <li key={`${status}-${item.engineId}`}>• {item.label}{item.providerId ? ` (${item.providerId})` : ""}{item.reason ? ` — ${item.reason}` : ""}</li>
                          )) : <li>• None</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              <pre className="mt-4 overflow-x-auto text-xs leading-6 text-zinc-400">{JSON.stringify(report.providerResults || [], null, 2)}</pre>
            </details>
            <Link href="/reports" className="mt-8 inline-flex rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm font-black text-emerald-100">Back to reports</Link>
          </div>
        )}
      </section>
    </ShadowScoreLayout>
  );
}
