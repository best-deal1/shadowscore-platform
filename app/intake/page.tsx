"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../../components/PaymentButtons";

type Severity = "Low" | "Medium" | "High" | "Critical";
type Finding = { title: string; severity: Severity; points: number; detail: string; recommendation: string };

type Requirement = { label: string; hints: string[] };
const MARKETPLACE_REQUIREMENTS: Record<string, Requirement[]> = {
  eBay: [
    { label: "Restriction or MC011 / MC999 notice", hints: ["mc011", "mc999", "restriction", "suspension", "review", "appeal"] },
    { label: "Tracking or delivery evidence", hints: ["tracking", "delivery", "delivered", "carrier", "ups", "usps", "fedex", "proof"] },
    { label: "Seller Hub or order screenshots", hints: ["seller", "hub", "order", "buyer", "feedback"] },
    { label: "Policy, VeRO or payout notices", hints: ["policy", "vero", "payout", "hold", "payment", "funds"] },
  ],
  Amazon: [
    { label: "Performance notification", hints: ["performance", "notification", "section 3", "deactivation", "suspension"] },
    { label: "Account Health screenshot", hints: ["account health", "health", "ahr", "dashboard"] },
    { label: "Supplier invoices or authenticity documents", hints: ["invoice", "supplier", "authenticity", "distributor", "receipt"] },
    { label: "Order, tracking or A-to-Z evidence", hints: ["tracking", "order", "a-to-z", "claim", "delivery"] },
  ],
  Walmart: [
    { label: "Seller performance notice", hints: ["performance", "seller", "review", "suspension"] },
    { label: "Order defect or cancellation evidence", hints: ["defect", "cancellation", "cancel", "odr"] },
    { label: "Tracking and fulfillment report", hints: ["tracking", "fulfillment", "delivery", "carrier"] },
    { label: "Policy compliance notice", hints: ["policy", "compliance", "violation"] },
  ],
  Etsy: [
    { label: "Shop notice or account review", hints: ["etsy", "shop", "review", "suspension", "reserve"] },
    { label: "IP or policy complaint evidence", hints: ["ip", "intellectual", "property", "policy", "copyright", "trademark"] },
    { label: "Cases and buyer messages", hints: ["case", "buyer", "message", "dispute"] },
    { label: "Tracking and delivery proof", hints: ["tracking", "delivery", "proof", "delivered"] },
  ],
  "TikTok Shop": [
    { label: "Seller verification notice", hints: ["verification", "seller", "identity", "kyc"] },
    { label: "Fulfillment SLA or late dispatch data", hints: ["fulfillment", "late", "dispatch", "sla", "tracking"] },
    { label: "Product compliance notice", hints: ["compliance", "policy", "violation", "restricted"] },
    { label: "Payout or settlement review", hints: ["payout", "settlement", "hold", "reserve"] },
  ],
  Vinted: [
    { label: "Commercial activity or Pro account notice", hints: ["commercial", "pro", "vinted", "restriction", "review"] },
    { label: "Identity or business verification", hints: ["identity", "business", "verification", "kyc"] },
    { label: "Listing policy evidence", hints: ["listing", "policy", "item", "category"] },
    { label: "Buyer case or delivery evidence", hints: ["buyer", "case", "delivery", "tracking"] },
  ],
  PayPal: [
    { label: "Reserve or limitation notice", hints: ["reserve", "limitation", "hold", "paypal"] },
    { label: "Chargeback or dispute evidence", hints: ["chargeback", "dispute", "claim", "refund"] },
    { label: "Transaction and delivery proof", hints: ["transaction", "tracking", "delivery", "proof"] },
    { label: "Business verification documents", hints: ["business", "verification", "utility", "invoice"] },
  ],

  Payoneer: [
    { label: "Payoneer account review or compliance notice", hints: ["payoneer", "review", "compliance", "restriction", "verification"] },
    { label: "Business verification documents", hints: ["business", "company", "utility", "id", "passport", "address"] },
    { label: "Payout or withdrawal issue", hints: ["payout", "withdrawal", "hold", "funds", "transfer"] },
    { label: "Marketplace connection evidence", hints: ["ebay", "amazon", "marketplace", "store", "seller"] },
  ],
  Stripe: [
    { label: "Reserve or account review notice", hints: ["reserve", "review", "stripe", "restricted"] },
    { label: "Chargeback evidence", hints: ["chargeback", "dispute", "refund"] },
    { label: "Fulfillment proof", hints: ["delivery", "tracking", "order", "proof"] },
    { label: "Business and product documentation", hints: ["business", "product", "policy", "verification"] },
  ],
  Other: [
    { label: "Marketplace notice or account message", hints: ["notice", "restriction", "suspension", "review", "appeal", "violation", "warning"] },
    { label: "Store, account or dashboard screenshot", hints: ["store", "seller", "account", "dashboard", "shop", "profile"] },
    { label: "Order, tracking, fulfillment or payout evidence", hints: ["order", "tracking", "delivery", "fulfillment", "payout", "settlement", "withdrawal", "hold"] },
    { label: "Verification, policy or compliance documents", hints: ["verification", "kyc", "policy", "compliance", "invoice", "business", "id", "utility"] },
  ],
};

const CASE_TYPES = ["MC011 / proof of delivery", "MC999 / permanent restriction", "BBE / poor buying experience", "Payout hold", "Verification review", "Policy violation", "VeRO / IP complaint", "Counterfeit / authenticity concern", "Security concern", "Supplier documentation", "General marketplace review"];
const SIGNALS = [
  { term: "ship by", title: "Handling deadline risk detected", severity: "High" as Severity, points: 12, recommendation: "Upload carrier-valid tracking before the ship-by deadline or communicate with the buyer and cancel cleanly if needed." },
  { term: "send by", title: "Send-by deadline risk detected", severity: "High" as Severity, points: 12, recommendation: "Do not upload fake tracking. Escalate the supplier or cancel before a defect is created." },
  { term: "aliexpress", title: "AliExpress supplier delay exposure detected", severity: "High" as Severity, points: 14, recommendation: "Reduce supplier dependency and avoid listings that cannot meet handling time." },
  { term: "no tracking", title: "Missing tracking signal detected", severity: "High" as Severity, points: 12, recommendation: "Prepare verifiable tracking and proof of shipment before marketplace review starts." },
  { term: "mc999", title: "Account-level restriction language detected", severity: "Critical" as Severity, points: 24, recommendation: "Build a full post-mortem and avoid repeated unsupported appeals." },
  { term: "bbe", title: "Bad buying experience language detected", severity: "High" as Severity, points: 18, recommendation: "Compare visible seller metrics with broader trust and experience signals." },
  { term: "tba", title: "Carrier verification risk detected", severity: "High" as Severity, points: 16, recommendation: "Strengthen proof with carrier-verifiable delivery evidence." },
  { term: "amazon", title: "Supplier source exposure detected", severity: "High" as Severity, points: 14, recommendation: "Review supplier dependency and invoice consistency." },
  { term: "counterfeit", title: "Authenticity or counterfeit concern detected", severity: "Critical" as Severity, points: 24, recommendation: "Prepare supplier invoices, authorized distributor proof and product-authenticity documentation." },
  { term: "authenticity", title: "Authenticity documentation signal detected", severity: "High" as Severity, points: 18, recommendation: "Review invoice quality, supplier legitimacy and branded-product exposure." },
  { term: "payoneer", title: "Payoneer compliance or payout review detected", severity: "Medium" as Severity, points: 12, recommendation: "Review business details, payout verification and cross-border payment consistency." },
  { term: "vero", title: "VeRO or IP complaint detected", severity: "High" as Severity, points: 18, recommendation: "Review brand, image, description and rights-owner exposure." },
  { term: "policy", title: "Policy exposure detected", severity: "Medium" as Severity, points: 12, recommendation: "Map every policy event into the account timeline." },
  { term: "adult", title: "Adult item category risk detected", severity: "High" as Severity, points: 17, recommendation: "Review category, imagery and listing language before relisting." },
  { term: "military", title: "Restricted-category risk detected", severity: "High" as Severity, points: 18, recommendation: "Review restricted category exposure and remove similar listings." },
  { term: "security", title: "Security concern language detected", severity: "Critical" as Severity, points: 22, recommendation: "Review identity, access, device and linked account consistency." },
  { term: "chargeback", title: "Chargeback exposure detected", severity: "High" as Severity, points: 18, recommendation: "Review payment processor risk and chargeback prevention controls." },
  { term: "payout", title: "Payment review indicator detected", severity: "Medium" as Severity, points: 12, recommendation: "Review unresolved buyer, delivery and reserve-period exposure." },
  { term: "verification", title: "Verification requirement detected", severity: "Medium" as Severity, points: 12, recommendation: "Prepare ID, business, utility, warehouse and supplier documentation." },
  { term: "product rating", title: "Reputation and product-rating risk detected", severity: "High" as Severity, points: 16, recommendation: "Review low product ratings, complaints, returns and deferred settlement exposure." },
  { term: "deferred settlement", title: "Deferred settlement risk detected", severity: "High" as Severity, points: 18, recommendation: "Review product quality, payout eligibility and unresolved marketplace violations." },
  { term: "withdrawal", title: "Withdrawal or payout restriction detected", severity: "High" as Severity, points: 18, recommendation: "Prepare payment verification, order proof and dispute status before escalation." },
];
function normalize(value: string) { return value.toLowerCase().replace(/[_-]+/g, " "); }
function hasHint(fileNames: string[], hints: string[]) { return fileNames.some((name) => hints.some((hint) => name.includes(hint))); }
function scoreLabel(score: number) { if (score >= 82) return "Critical Exposure"; if (score >= 65) return "High Exposure"; if (score >= 45) return "Elevated Exposure"; if (score >= 25) return "Moderate Exposure"; return "Low Exposure"; }
function healthStage(score: number) {
  if (score >= 82) return "Permanent Restriction Risk";
  if (score >= 65) return "Suspended / Critical";
  if (score >= 45) return "Restricted / Review";
  if (score >= 25) return "Warning";
  return "Healthy";
}
function nextLikelyAction(score: number) {
  if (score >= 82) return "Escalation is likely already severe. Focus on post-mortem and evidence reconstruction.";
  if (score >= 65) return "Immediate manual review recommended before submitting more appeals or documents.";
  if (score >= 45) return "Resolve missing evidence, verification and policy issues before the review deepens.";
  if (score >= 25) return "Monitor account health and fix weak signals before they become enforcement actions.";
  return "Maintain consistent operations and continue monitoring.";
}
function severityClass(severity: Severity) { if (severity === "Critical") return "border-red-300/40 bg-red-500/15 text-red-100"; if (severity === "High") return "border-red-400/30 bg-red-500/10 text-red-200"; if (severity === "Medium") return "border-yellow-400/30 bg-yellow-500/10 text-yellow-200"; return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"; }
function scoreColor(score: number) { if (score >= 82) return "text-red-100"; if (score >= 65) return "text-red-300"; if (score >= 45) return "text-orange-200"; if (score >= 25) return "text-yellow-200"; return "text-emerald-200"; }

export default function IntakePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [marketplace, setMarketplace] = useState("eBay");
  const [customMarketplace, setCustomMarketplace] = useState("");
  const [store, setStore] = useState("");
  const [email, setEmail] = useState("");
  const [caseType, setCaseType] = useState("MC011 / proof of delivery");
  const [submitted, setSubmitted] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const requirements = MARKETPLACE_REQUIREMENTS[marketplace] || MARKETPLACE_REQUIREMENTS.Other;
  const displayMarketplace = marketplace === "Other" && customMarketplace.trim() ? customMarketplace.trim() : marketplace;
  const fileNames = useMemo(() => files.map((file) => normalize(file.name)), [files]);
  const evidenceStatus = useMemo(() => requirements.map((item) => ({ ...item, present: hasHint(fileNames, item.hints) })), [fileNames, requirements]);
  const findings = useMemo<Finding[]>(() => {
    const result: Finding[] = [];
    if (!store.trim()) result.push({ title: "Missing store URL or seller name", severity: "Medium", points: 10, detail: "A store URL or seller name helps connect the evidence to a specific marketplace profile.", recommendation: "Add the store URL or seller handle before requesting manual review." });
    if (files.length === 0) return [{ title: "No evidence uploaded", severity: "High", points: 35, detail: "A real assessment requires notices, tracking records, account screenshots or payout messages.", recommendation: "Upload at least one restriction notice, tracking report or account-health screenshot." }];
    evidenceStatus.filter((item) => !item.present).forEach((item) => result.push({ title: `${item.label} missing`, severity: "Medium", points: 10, detail: `The uploaded file names do not indicate ${item.label.toLowerCase()}.`, recommendation: `Add evidence related to ${item.label.toLowerCase()} to strengthen the assessment.` }));
    SIGNALS.forEach((item) => { if (fileNames.some((name) => name.includes(item.term)) || normalize(caseType).includes(item.term)) result.push({ title: item.title, severity: item.severity, points: item.points, detail: "This signal may increase marketplace exposure and should be reviewed in the full report.", recommendation: item.recommendation }); });
    if (files.length < 3) result.push({ title: "Evidence package is thin", severity: "Medium", points: 10, detail: "A stronger case usually includes notice, tracking, delivery proof and account screenshots.", recommendation: "Upload a complete package before paying for a full investigation." });
    return result;
  }, [files, store, evidenceStatus, fileNames, caseType]);
  const score = useMemo(() => Math.min(96, Math.max(files.length ? 18 : 0, findings.reduce((sum, item) => sum + item.points, files.length ? 16 : 0))), [files.length, findings]);
  const progress = files.length === 0 ? 0 : Math.min(100, 25 + files.length * 12 + evidenceStatus.filter((item) => item.present).length * 12);
  const canAnalyze = files.length > 0;
  const saveLead = () => {
    const lead = { createdAt: new Date().toISOString(), marketplace: displayMarketplace, marketplaceSelection: marketplace, customMarketplace, caseType, store, email, files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })), score, label: scoreLabel(score), findings: findings.map((item) => item.title) };
    try { const existing = JSON.parse(localStorage.getItem("shadowscore_leads_v2") || "[]"); localStorage.setItem("shadowscore_leads_v2", JSON.stringify([lead, ...existing].slice(0, 100))); setLeadSaved(true); } catch { setLeadSaved(false); }
  };
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%)]" />
      <header className="relative z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white"><img src="/shadowscore-shield-v8.png" alt="ShadowScore" className="h-8 w-8 object-contain" />Back to ShadowScore</Link><div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">Free Evidence-Based Scan</div></div></header>
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14"><div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]"><div><div className="text-xs uppercase tracking-[0.45em] text-red-300">ShadowScore Trust Engine</div><h1 className="mt-6 text-5xl font-extrabold leading-tight">Free Marketplace & Payout Risk Scan</h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">Upload screenshots, emails, suspension notices or marketplace documents and receive an instant preliminary Marketplace Health Stage. Missing documents are flagged clearly.</p><div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="font-bold">Multi-marketplace evidence requirements</div><p className="mt-4 leading-7 text-zinc-400">The required evidence changes by platform. eBay, Amazon, Walmart, Etsy, TikTok Shop, payment providers and emerging marketplaces all evaluate different trust and compliance signals. Choose Other when your platform is not listed.</p></div><div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6"><div className="font-bold text-red-200">Safe positioning</div><p className="mt-3 leading-7 text-zinc-400">ShadowScore does not access internal marketplace systems. The score is based on seller-supplied evidence, public marketplace rules and observable operational indicators.</p></div></div>
      <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl"><div className="grid gap-5 md:grid-cols-2"><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Marketplace</div><select value={marketplace} onChange={(e) => { setMarketplace(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">{Object.keys(MARKETPLACE_REQUIREMENTS).map((item) => <option key={item}>{item}</option>)}</select></label><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Case type</div><select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">{CASE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Store URL or seller name</div><input value={store} onChange={(e) => setStore(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="https://..." /></label><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Email for report</div><input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="you@example.com" /></label></div>
      {marketplace === "Other" && <label className="mt-5 block"><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Custom marketplace name</div><input value={customMarketplace} onChange={(e) => { setCustomMarketplace(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-red-400/20 bg-black p-4 text-white" placeholder="Enter marketplace name, e.g. SHEIN, Depop, Mercado Libre" /><p className="mt-2 text-xs leading-5 text-zinc-500">Use this when the marketplace, payment provider or commerce platform is not listed above.</p></label>}
      <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-14 text-center hover:border-red-500/40"><input type="file" multiple className="hidden" onChange={(e) => { setSubmitted(false); setLeadSaved(false); setFiles(Array.from(e.target.files || [])); }} /><div className="text-2xl font-extrabold">Drop evidence files here</div><div className="mt-3 text-zinc-500">PNG, JPG, CSV, PDF, DOCX, XLSX, HTML</div><div className="mt-5 text-sm font-bold text-red-300">Click to select files</div></label>
      <div className="mt-6 rounded-2xl border border-white/10 p-5"><div className="mb-3 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Evidence completeness</div><div className="mt-2 font-bold">{files.length ? "Evidence loaded" : "Waiting for evidence"}</div></div><div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">{files.length} files</div></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{evidenceStatus.map((item) => <div key={item.label} className={`rounded-2xl border p-4 ${item.present ? "border-emerald-400/25 bg-emerald-500/10" : "border-yellow-400/25 bg-yellow-500/10"}`}><div className="text-sm font-bold">{item.present ? "✓ Present" : "Missing"}</div><div className="mt-2 text-xs leading-5 text-zinc-400">{item.label}</div></div>)}</div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xs uppercase tracking-[0.28em] text-red-300">Evidence Queue</div><div className="mt-4 space-y-2 text-sm text-zinc-400">{files.length ? files.map((file) => <div key={`${file.name}-${file.size}`}>• {file.name}</div>) : <div>No evidence uploaded yet.</div>}</div></div>
      {!canAnalyze && submitted && <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">Assessment cannot run yet. Please upload at least one evidence file.</div>}
      <button type="button" onClick={() => setSubmitted(true)} className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500">Run Free Marketplace Scan</button>
      {submitted && canAnalyze && <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6"><div className="grid gap-6 md:grid-cols-[180px_1fr]"><div><div className={`text-6xl font-black ${scoreColor(score)}`}>{score}</div><div className="mt-3 text-sm font-bold text-white">{scoreLabel(score)}</div><div className="mt-2 text-xs text-zinc-500">{displayMarketplace} · {caseType}</div><div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Health Stage</div><div className="mt-2 text-lg font-black text-orange-200">{healthStage(score)}</div><p className="mt-2 text-xs leading-5 text-zinc-400">{nextLikelyAction(score)}</p></div></div><div><div className="text-xl font-bold">Preliminary findings</div><div className="mt-4 space-y-3">{findings.map((finding) => <div key={finding.title} className="rounded-2xl border border-white/10 bg-black/45 p-4"><div className="flex items-center justify-between gap-4"><div className="font-bold">{finding.title}</div><div className={`rounded-full border px-3 py-1 text-xs ${severityClass(finding.severity)}`}>{finding.severity}</div></div><p className="mt-2 text-sm leading-6 text-zinc-400">{finding.detail}</p><p className="mt-3 text-sm leading-6 text-red-100">Recommended action: {finding.recommendation}</p></div>)}</div></div></div><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Current Stage</div><div className="mt-2 font-black text-orange-200">{healthStage(score)}</div></div><div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Predicted Next</div><div className="mt-2 font-black text-red-200">{score >= 45 ? "Manual Review" : "Warning"}</div></div><div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fix Impact</div><div className="mt-2 font-black text-emerald-200">{Math.max(18, score - 23)} after evidence</div></div></div><div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5 text-sm leading-7 text-zinc-400">This preliminary score is not internal marketplace data. It is a direction signal based on uploaded evidence and visible indicators.</div><div className="mt-6 grid gap-3 md:grid-cols-2"><button type="button" onClick={saveLead} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white hover:border-red-400/30">Save Lead Locally</button><Link href="/#pricing" className="rounded-2xl bg-red-600 px-5 py-4 text-center text-sm font-black text-white hover:bg-red-500">Download Full Report - $9.90</Link></div>{leadSaved && <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">Lead saved locally in this browser.</div>}<div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-7 text-zinc-400">The scan is free. Payment is only required if you want to download the full report.</div><PaymentButtons planName="Downloadable Scan Report" price="$9.90" /></div>}
      </div></div></section>
    </main>
  );
}
