"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Severity = "Low" | "Medium" | "High" | "Critical";

type Finding = {
  title: string;
  severity: Severity;
  points: number;
  detail: string;
  recommendation: string;
};

type Requirement = {
  label: string;
  hints: string[];
};

const LEADS_KEY = "shadowscore_leads_v1";

const MARKETPLACE_REQUIREMENTS: Record<string, Requirement[]> = {
  eBay: [
    { label: "MC011 / MC999 / restriction notice", hints: ["mc011", "mc999", "restriction", "suspension", "appeal", "review", "indefinite"] },
    { label: "Tracking and delivery evidence", hints: ["tracking", "delivery", "delivered", "carrier", "ups", "usps", "fedex", "proof", "tba"] },
    { label: "Seller Hub / order screenshots", hints: ["seller", "hub", "order", "buyer", "feedback", "defect"] },
    { label: "Policy, VeRO or payout notices", hints: ["policy", "vero", "payout", "hold", "payment", "funds", "military"] },
  ],
  Amazon: [
    { label: "Performance notification", hints: ["performance", "notification", "section 3", "deactivation", "suspension"] },
    { label: "Account Health screenshot", hints: ["account health", "health", "ahr", "dashboard"] },
    { label: "Supplier invoices / authenticity documents", hints: ["invoice", "supplier", "authenticity", "distributor", "receipt"] },
    { label: "Order / tracking / A-to-Z evidence", hints: ["tracking", "order", "a-to-z", "claim", "delivery"] },
  ],
  Walmart: [
    { label: "Seller performance notice", hints: ["performance", "seller", "review", "suspension"] },
    { label: "Order defect / cancellation evidence", hints: ["defect", "cancellation", "cancel", "odr"] },
    { label: "Tracking / fulfillment report", hints: ["tracking", "fulfillment", "delivery", "carrier"] },
    { label: "Policy compliance notice", hints: ["policy", "compliance", "violation"] },
  ],
  Etsy: [
    { label: "Shop notice / account review", hints: ["etsy", "shop", "review", "suspension", "reserve"] },
    { label: "IP / policy complaint evidence", hints: ["ip", "intellectual", "property", "policy", "copyright", "trademark"] },
    { label: "Cases and buyer messages", hints: ["case", "buyer", "message", "dispute"] },
    { label: "Tracking / delivery proof", hints: ["tracking", "delivery", "proof", "delivered"] },
  ],
  "TikTok Shop": [
    { label: "Seller verification notice", hints: ["verification", "seller", "identity", "kyc"] },
    { label: "Fulfillment SLA / late dispatch data", hints: ["fulfillment", "late", "dispatch", "sla", "tracking"] },
    { label: "Product compliance notice", hints: ["compliance", "policy", "violation", "restricted"] },
    { label: "Payout / settlement review", hints: ["payout", "settlement", "hold", "reserve"] },
  ],
  SHEIN: [
    { label: "Seller onboarding or review notice", hints: ["onboarding", "seller", "review", "verification"] },
    { label: "Product compliance documents", hints: ["product", "compliance", "quality", "certificate"] },
    { label: "Fulfillment and return evidence", hints: ["fulfillment", "return", "delivery", "tracking"] },
    { label: "Supplier documentation", hints: ["supplier", "invoice", "factory", "document"] },
  ],
};

const CASE_TYPES = [
  "MC011 / proof of delivery",
  "MC999 / selling restriction",
  "Payout hold",
  "Verification review",
  "Policy violation",
  "Amazon Section 3",
  "Inauthentic / supplier documents",
  "Poor selling activity",
  "General marketplace review",
];

const SIGNALS = [
  { term: "mc999", title: "MC999 or permanent restriction reference", severity: "Critical" as Severity, points: 24, recommendation: "Prepare a full post-mortem, not only a tracking response." },
  { term: "indefinite", title: "Indefinite restriction language detected", severity: "Critical" as Severity, points: 22, recommendation: "Document the full sequence of events and avoid repeated unsupported appeals." },
  { term: "poor selling", title: "Poor selling activity language detected", severity: "High" as Severity, points: 18, recommendation: "Map delivery timing, tracking consistency, evidence quality and seller activity flow." },
  { term: "mc011", title: "MC011 proof-of-delivery review reference", severity: "High" as Severity, points: 18, recommendation: "Strengthen proof of delivery and buyer-facing delivery confirmation evidence." },
  { term: "payout", title: "Payout review or hold reference", severity: "Medium" as Severity, points: 12, recommendation: "Review cashflow exposure and unresolved claim window." },
  { term: "hold", title: "Funds hold reference", severity: "Medium" as Severity, points: 10, recommendation: "Add payout messages and order fulfillment proof to the evidence package." },
  { term: "amazon", title: "Amazon reference detected", severity: "High" as Severity, points: 16, recommendation: "Review supplier documentation and avoid submitting marketplace-branded retail invoices when supplier proof is required." },
  { term: "tba", title: "Amazon Logistics / TBA tracking reference", severity: "High" as Severity, points: 16, recommendation: "Check whether tracking is externally verifiable and aligned with marketplace expectations." },
  { term: "vero", title: "VeRO or IP complaint reference", severity: "High" as Severity, points: 18, recommendation: "Remove or review brand-sensitive listings and prepare policy compliance evidence." },
  { term: "policy", title: "Policy issue reference detected", severity: "Medium" as Severity, points: 12, recommendation: "Attach policy issue screenshots and document corrective action." },
  { term: "military", title: "Restricted item policy reference detected", severity: "Critical" as Severity, points: 22, recommendation: "Immediately review restricted categories and remove high-risk inventory." },
  { term: "section 3", title: "Amazon Section 3 reference detected", severity: "Critical" as Severity, points: 24, recommendation: "Prepare identity, supply chain and account health evidence." },
  { term: "inauthentic", title: "Inauthentic or supplier document issue", severity: "High" as Severity, points: 18, recommendation: "Prepare supplier chain, invoices and product authenticity documentation." },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function scoreLabel(score: number) {
  if (score >= 82) return "Critical Exposure";
  if (score >= 66) return "High Exposure";
  if (score >= 46) return "Elevated Exposure";
  if (score >= 25) return "Moderate Exposure";
  return "Low Exposure";
}

function scoreColor(score: number) {
  if (score >= 82) return "text-red-100";
  if (score >= 66) return "text-red-300";
  if (score >= 46) return "text-orange-200";
  if (score >= 25) return "text-yellow-200";
  return "text-emerald-200";
}

function severityBadge(severity: Severity) {
  if (severity === "Critical") return "border-red-300/40 bg-red-500/15 text-red-100";
  if (severity === "High") return "border-red-400/30 bg-red-500/10 text-red-200";
  if (severity === "Medium") return "border-yellow-400/30 bg-yellow-500/10 text-yellow-200";
  return "border-zinc-400/30 bg-white/[0.04] text-zinc-300";
}

function saveLead(record: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
  const next = [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...record }, ...existing].slice(0, 200);
  localStorage.setItem(LEADS_KEY, JSON.stringify(next));
}

export default function IntakePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [marketplace, setMarketplace] = useState("eBay");
  const [store, setStore] = useState("");
  const [caseType, setCaseType] = useState("MC011 / proof of delivery");
  const [submitted, setSubmitted] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const fileNames = useMemo(() => files.map((file) => normalize(file.name)), [files]);
  const requirements = MARKETPLACE_REQUIREMENTS[marketplace] || MARKETPLACE_REQUIREMENTS.eBay;

  const evidenceStatus = useMemo(() => {
    return requirements.map((item) => ({
      ...item,
      present: fileNames.some((name) => item.hints.some((hint) => name.includes(hint))),
    }));
  }, [requirements, fileNames]);

  const findings = useMemo<Finding[]>(() => {
    const result: Finding[] = [];

    if (!store.trim()) {
      result.push({
        title: "Missing store URL or seller name",
        severity: "Medium",
        points: 8,
        detail: "A store URL or seller name helps connect the evidence to a specific marketplace profile.",
        recommendation: "Add the store URL or seller username before submitting a paid review.",
      });
    }

    if (!files.length) {
      result.push({
        title: "No evidence uploaded",
        severity: "High",
        points: 35,
        detail: "A real assessment requires notices, tracking records, screenshots, payout messages or policy warnings.",
        recommendation: "Upload at least one file before running the assessment.",
      });
      return result;
    }

    evidenceStatus.filter((item) => !item.present).forEach((item) => {
      result.push({
        title: `${item.label} missing`,
        severity: "Medium",
        points: 10,
        detail: `The uploaded package does not appear to include ${item.label.toLowerCase()}.`,
        recommendation: `Add evidence related to ${item.label.toLowerCase()} to improve review quality.`,
      });
    });

    SIGNALS.forEach((signal) => {
      if (fileNames.some((name) => name.includes(signal.term)) || normalize(caseType).includes(signal.term)) {
        result.push({
          title: signal.title,
          severity: signal.severity,
          points: signal.points,
          detail: "This signal can increase marketplace exposure and should be reviewed in the full report.",
          recommendation: signal.recommendation,
        });
      }
    });

    if (files.length < 3) {
      result.push({
        title: "Evidence package is thin",
        severity: "Medium",
        points: 8,
        detail: "A stronger case usually includes the notice, tracking evidence, order screenshots and policy or payout context.",
        recommendation: "Upload a complete evidence pack before paying for deeper analysis.",
      });
    }

    return result;
  }, [files.length, store, evidenceStatus, fileNames, caseType]);

  const score = useMemo(() => {
    const base = files.length ? 18 : 0;
    const total = findings.reduce((sum, item) => sum + item.points, base);
    return Math.min(96, Math.max(files.length ? 18 : 0, total));
  }, [files.length, findings]);

  const progress = files.length === 0 ? 0 : Math.min(100, 25 + files.length * 12 + evidenceStatus.filter((item) => item.present).length * 10);
  const canAnalyze = files.length > 0;
  const topFindings = findings.filter((finding) => finding.title !== "No evidence uploaded").slice(0, 5);

  const runAssessment = () => {
    setSubmitted(true);
    if (!canAnalyze) return;

    saveLead({
      marketplace,
      store: store || "Not provided",
      caseType,
      score,
      scoreLabel: scoreLabel(score),
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type || "unknown" })),
      findings: topFindings.map((finding) => ({ title: finding.title, severity: finding.severity, points: finding.points })),
      clickedWhatsApp: false,
    });
    setLeadSaved(true);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `ShadowScore paid review request\nMarketplace: ${marketplace}\nStore: ${store || "Not provided"}\nCase type: ${caseType}\nPreliminary score: ${score} - ${scoreLabel(score)}\nTop findings: ${topFindings.map((f) => f.title).join(", ")}`
    );

    saveLead({
      marketplace,
      store: store || "Not provided",
      caseType,
      score,
      scoreLabel: scoreLabel(score),
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type || "unknown" })),
      findings: topFindings.map((finding) => ({ title: finding.title, severity: finding.severity, points: finding.points })),
      clickedWhatsApp: true,
    });

    window.open(`https://wa.me/972557293979?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%)]" />

      <header className="relative z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
          <div className="flex items-center gap-4">
            <Link href="/leads" className="hidden text-sm text-zinc-500 hover:text-white md:block">View Leads</Link>
            <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
              Real Preliminary Assessment
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.45em] text-red-300">ShadowScore Intake</div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">Marketplace Post-Mortem Console</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Upload evidence and receive an instant preliminary assessment. If key evidence is missing, ShadowScore explains what is missing instead of showing a fake score.
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="font-bold">Marketplace-specific evidence</div>
              <p className="mt-4 leading-7 text-zinc-400">
                Each marketplace requires different evidence. Selecting eBay, Amazon, Walmart, Etsy, TikTok Shop or SHEIN changes the checklist and the risk model.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="font-bold text-red-200">No internal marketplace data</div>
              <p className="mt-3 leading-7 text-zinc-400">
                This score is an independent assessment based on seller-supplied information, file names, selected case type and evidence completeness.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <div className="grid gap-5 md:grid-cols-3">
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Marketplace</div>
                <select value={marketplace} onChange={(e) => { setMarketplace(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">
                  {Object.keys(MARKETPLACE_REQUIREMENTS).map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>

              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Case type</div>
                <select value={caseType} onChange={(e) => { setCaseType(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">
                  {CASE_TYPES.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>

              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Store URL or seller name</div>
                <input value={store} onChange={(e) => { setStore(e.target.value); setLeadSaved(false); }} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="https://..." />
              </label>
            </div>

            <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-16 text-center hover:border-red-500/40">
              <input type="file" multiple className="hidden" onChange={(e) => {
                setSubmitted(false);
                setLeadSaved(false);
                setFiles(Array.from(e.target.files || []));
              }} />
              <div className="text-2xl font-extrabold">Drop evidence files here</div>
              <div className="mt-3 text-zinc-500">PNG, JPG, CSV, PDF, DOCX, XLSX, HTML</div>
              <div className="mt-5 text-sm font-bold text-red-300">Click to select files</div>
            </label>

            <div className="mt-6 rounded-2xl border border-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Evidence completeness</div>
                  <div className="mt-2 font-bold">{files.length ? "Evidence loaded" : "Waiting for evidence"}</div>
                </div>
                <div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
                  {files.length} files
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {evidenceStatus.map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${item.present ? "border-emerald-400/25 bg-emerald-500/10" : "border-yellow-400/25 bg-yellow-500/10"}`}>
                  <div className="text-sm font-bold">{item.present ? "✓ Present" : "Missing"}</div>
                  <div className="mt-2 text-xs leading-5 text-zinc-400">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-red-300">Evidence Queue</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                {files.length ? files.map((file) => <div key={`${file.name}-${file.size}`}>• {file.name}</div>) : <div>No evidence uploaded yet.</div>}
              </div>
            </div>

            {!canAnalyze && submitted && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                Assessment cannot run yet. Please upload at least one evidence file.
              </div>
            )}

            <button
              type="button"
              onClick={runAssessment}
              className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500"
            >
              Run Preliminary Assessment
            </button>

            {leadSaved && (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Scan saved locally. You can review it in the Leads page.
              </div>
            )}

            {submitted && canAnalyze && (
              <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
                <div className="grid gap-6 md:grid-cols-[190px_1fr]">
                  <div>
                    <div className={`text-6xl font-black ${scoreColor(score)}`}>{score}</div>
                    <div className="mt-3 text-sm font-bold text-white">{scoreLabel(score)}</div>
                    <div className="mt-2 text-xs text-zinc-500">{marketplace} · {caseType}</div>
                    <button onClick={openWhatsApp} className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">
                      Request Paid Review
                    </button>
                  </div>

                  <div>
                    <div className="text-xl font-bold">Why this score?</div>
                    <div className="mt-4 space-y-3">
                      {topFindings.length ? topFindings.map((finding) => (
                        <div key={finding.title} className="rounded-2xl border border-white/10 bg-black/45 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-bold">{finding.title}</div>
                            <div className={`rounded-full border px-3 py-1 text-xs ${severityBadge(finding.severity)}`}>
                              {finding.severity}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">{finding.detail}</p>
                          <p className="mt-3 text-sm leading-6 text-red-100">Recommended action: {finding.recommendation}</p>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                          No major preliminary gaps detected from the uploaded evidence package.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5 text-sm leading-7 text-zinc-400">
                  This preliminary score creates direction, not certainty. It does not guarantee marketplace outcomes and does not represent internal marketplace data.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
