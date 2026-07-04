"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../../components/PaymentButtons";
import { analyzeRisk } from "../../lib/riskEngine";

type Severity = "Low" | "Medium" | "High" | "Critical";
type Finding = { title: string; severity: Severity; points: number; detail: string; recommendation: string };
type Requirement = { label: string; hints: string[] };

type FileIssue = { file: string; issue: string; severity: "Block" | "Warning" };

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_FILE_SIZE = 1024;
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "csv", "docx", "xlsx", "html"];

const MARKETPLACE_REQUIREMENTS: Record<string, Requirement[]> = {
  eBay: [
    { label: "Restriction, MC011, MC999 or BBE notice", hints: ["mc011", "mc999", "bbe", "restriction", "suspension", "review", "appeal"] },
    { label: "Tracking or delivery evidence", hints: ["tracking", "delivery", "delivered", "carrier", "ups", "usps", "fedex", "proof"] },
    { label: "Seller Hub or order screenshots", hints: ["seller", "hub", "order", "buyer", "feedback", "dashboard"] },
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
    { label: "Counterfeit or authenticity notice", hints: ["counterfeit", "authenticity", "brand", "invoice"] },
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
    { label: "Seller verification notice", hints: ["verification", "seller", "identity", "kyc", "passport", "license"] },
    { label: "Product rating or violation points", hints: ["rating", "violation", "points", "product", "quality"] },
    { label: "Fulfillment SLA or late dispatch data", hints: ["fulfillment", "late", "dispatch", "sla", "tracking"] },
    { label: "Payout or deferred settlement review", hints: ["payout", "settlement", "hold", "reserve", "deferred"] },
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

  SHEIN: [
    { label: "Seller verification or compliance notice", hints: ["shein", "verification", "seller", "compliance", "review"] },
    { label: "Product, catalog or authenticity notice", hints: ["product", "catalog", "authenticity", "counterfeit", "brand"] },
    { label: "Order, fulfillment or payout evidence", hints: ["order", "fulfillment", "delivery", "payout", "settlement"] },
    { label: "Supplier or business documentation", hints: ["supplier", "invoice", "business", "company", "license"] },
  ],
  Shopify: [
    { label: "Store, payment or risk notice", hints: ["shopify", "store", "risk", "notice", "review", "hold"] },
    { label: "Payment processor evidence", hints: ["paypal", "stripe", "payoneer", "reserve", "chargeback"] },
    { label: "Order, fulfillment or dispute evidence", hints: ["order", "tracking", "delivery", "dispute", "refund"] },
    { label: "Product and supplier documentation", hints: ["product", "supplier", "invoice", "policy"] },
  ],
  "Facebook Marketplace": [
    { label: "Marketplace restriction or account notice", hints: ["facebook", "marketplace", "restriction", "review", "appeal"] },
    { label: "Buyer, order or message evidence", hints: ["buyer", "order", "message", "dispute", "complaint"] },
    { label: "Payment or payout evidence", hints: ["payout", "payment", "hold", "reserve"] },
    { label: "Policy or product notice", hints: ["policy", "product", "listing", "violation"] },
  ],
  Vinted: [
    { label: "Account or commercial activity notice", hints: ["vinted", "commercial", "restriction", "review"] },
    { label: "Listing or product policy evidence", hints: ["listing", "product", "policy", "catalog"] },
    { label: "Buyer or order evidence", hints: ["buyer", "order", "tracking", "delivery"] },
    { label: "Verification or identity evidence", hints: ["verification", "identity", "business", "id"] },
  ],
  Depop: [
    { label: "Depop account or listing notice", hints: ["depop", "account", "listing", "restriction", "review"] },
    { label: "Buyer or dispute evidence", hints: ["buyer", "message", "dispute", "refund"] },
    { label: "Policy or authenticity evidence", hints: ["policy", "authenticity", "brand", "counterfeit"] },
    { label: "Payment or payout evidence", hints: ["payment", "payout", "hold", "reserve"] },
  ],
  Mercari: [
    { label: "Mercari account or marketplace notice", hints: ["mercari", "account", "restriction", "review", "notice"] },
    { label: "Order, shipping or buyer evidence", hints: ["order", "shipping", "tracking", "buyer"] },
    { label: "Policy or product evidence", hints: ["policy", "product", "violation", "authenticity"] },
    { label: "Payment or verification evidence", hints: ["payment", "payout", "verification", "hold"] },
  ],
  Temu: [
    { label: "Temu seller or compliance notice", hints: ["temu", "seller", "compliance", "review", "restriction"] },
    { label: "Product, catalog or authenticity evidence", hints: ["product", "catalog", "counterfeit", "authenticity"] },
    { label: "Fulfillment or payout evidence", hints: ["fulfillment", "delivery", "payout", "settlement"] },
    { label: "Supplier or business documentation", hints: ["supplier", "invoice", "business", "license"] },
  ],
  Other: [
    { label: "Marketplace, payment or account notice", hints: ["notice", "restriction", "suspension", "review", "appeal", "violation", "warning", "hold"] },
    { label: "Store, account or dashboard screenshot", hints: ["store", "seller", "account", "dashboard", "shop", "profile"] },
    { label: "Order, tracking, fulfillment or payout evidence", hints: ["order", "tracking", "delivery", "fulfillment", "payout", "settlement", "withdrawal", "hold"] },
    { label: "Verification, policy or compliance documents", hints: ["verification", "kyc", "policy", "compliance", "invoice", "business", "id", "utility"] },
  ],
};

const CASE_TYPES = [
  "Auto detect",
  "Marketplace review",
  "Payout hold / reserve",
  "Verification review",
  "Policy violation",
  "VeRO / IP complaint",
  "Counterfeit / authenticity concern",
  "Security concern",
  "Supplier documentation",
  "BBE / poor buying experience",
  "MC011 / proof of delivery",
  "MC999 / permanent restriction",
  "Restricted account",
  "Permanent suspension",
  "Deferred settlement",
  "Account health warning",
  "Warehouse / overseas inventory",
  "Payment review",
  "Other",
];

const RISK_SIGNALS = [
  { term: "mc011", title: "MC011 delivery review language detected", severity: "High" as Severity, points: 18, recommendation: "Organize tracking, delivery proof and buyer confirmation in one evidence timeline." },
  { term: "mc999", title: "Permanent restriction language detected", severity: "Critical" as Severity, points: 24, recommendation: "Build a full post-mortem. Avoid repeated unsupported appeals." },
  { term: "bbe", title: "Bad buying experience risk detected", severity: "High" as Severity, points: 18, recommendation: "Compare visible metrics with broader trust, complaints and fulfillment signals." },
  { term: "tba", title: "Carrier verification exposure detected", severity: "High" as Severity, points: 16, recommendation: "Strengthen proof with carrier-verifiable delivery evidence." },
  { term: "amazon", title: "Supplier source exposure detected", severity: "High" as Severity, points: 14, recommendation: "Review retail supplier dependency and invoice consistency." },
  { term: "counterfeit", title: "Counterfeit or authenticity concern detected", severity: "Critical" as Severity, points: 24, recommendation: "Prepare supplier invoices, authorization proof and authenticity documentation." },
  { term: "authenticity", title: "Authenticity documentation signal detected", severity: "High" as Severity, points: 18, recommendation: "Review supplier legitimacy and branded product exposure." },
  { term: "vero", title: "VeRO or IP complaint detected", severity: "High" as Severity, points: 18, recommendation: "Review brand, image, description and rights-owner exposure." },
  { term: "policy", title: "Policy exposure detected", severity: "Medium" as Severity, points: 12, recommendation: "Map policy events and remove similar high-risk listings." },
  { term: "security", title: "Security concern language detected", severity: "Critical" as Severity, points: 22, recommendation: "Review identity, access, device and linked account consistency." },
  { term: "verification", title: "Verification requirement detected", severity: "Medium" as Severity, points: 12, recommendation: "Prepare ID, business, utility, warehouse and supplier documentation." },
  { term: "payout", title: "Payout review indicator detected", severity: "Medium" as Severity, points: 12, recommendation: "Review delivery confidence, disputes and reserve-period exposure." },
  { term: "reserve", title: "Reserve or cashflow exposure detected", severity: "High" as Severity, points: 16, recommendation: "Reduce open claims and prepare proof of fulfillment and business legitimacy." },
  { term: "deferred settlement", title: "Deferred settlement risk detected", severity: "High" as Severity, points: 18, recommendation: "Review product quality, settlement eligibility and unresolved violations." },
  { term: "chargeback", title: "Chargeback exposure detected", severity: "High" as Severity, points: 18, recommendation: "Review payment processor risk and customer dispute prevention." },
  { term: "product rating", title: "Product quality and rating risk detected", severity: "High" as Severity, points: 16, recommendation: "Review low product ratings, complaints, returns and quality signals." },
  { term: "late shipment", title: "Late shipment risk detected", severity: "Medium" as Severity, points: 12, recommendation: "Review handling time, tracking upload timing and supplier SLA." },
  { term: "adult", title: "Restricted product category risk detected", severity: "High" as Severity, points: 17, recommendation: "Review category, imagery and listing text before relisting." },
  { term: "military", title: "Restricted item exposure detected", severity: "High" as Severity, points: 18, recommendation: "Remove similar listings and review restricted category rules." },
  { term: "report", title: "Community reporting risk detected", severity: "Medium" as Severity, points: 12, recommendation: "Identify whether removals are listing-level, account-level or competitor-report driven." },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function hasHint(fileNames: string[], hints: string[]) {
  return fileNames.some((name) => hints.some((hint) => name.includes(hint)));
}

function severityClass(severity: Severity) {
  if (severity === "Critical") return "border-red-300/40 bg-red-500/15 text-red-100";
  if (severity === "High") return "border-red-400/30 text-red-200";
  if (severity === "Medium") return "border-yellow-400/30 text-yellow-200";
  return "border-zinc-400/30 text-zinc-300";
}

function scoreLabel(score: number) {
  if (score >= 82) return "Critical Exposure";
  if (score >= 65) return "High Exposure";
  if (score >= 45) return "Elevated Exposure";
  if (score >= 25) return "Moderate Exposure";
  return "Low Exposure";
}

function scoreColor(score: number) {
  if (score >= 82) return "text-red-100";
  if (score >= 65) return "text-red-300";
  if (score >= 45) return "text-orange-200";
  if (score >= 25) return "text-yellow-200";
  return "text-emerald-200";
}

function healthStage(score: number) {
  if (score >= 82) return "Critical";
  if (score >= 65) return "Suspended / High Risk";
  if (score >= 45) return "Restricted / Review";
  if (score >= 25) return "Warning";
  return "Healthy";
}

function nextLikelyAction(score: number) {
  if (score >= 82) return "Manual investigation and full post-mortem recommended.";
  if (score >= 65) return "Prepare evidence before appeal or payout review escalates.";
  if (score >= 45) return "Fix missing documents and policy exposure quickly.";
  if (score >= 25) return "Monitor account health and correct weak signals.";
  return "Maintain consistent operations and documentation.";
}
function evidenceQuality(confidence: number) {
  if (confidence >= 82) return "Strong";
  if (confidence >= 62) return "Medium";
  if (confidence >= 42) return "Weak";
  return "Insufficient";
}


export default function IntakePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [marketplace, setMarketplace] = useState("eBay");
  const [customMarketplace, setCustomMarketplace] = useState("");
  const [caseType, setCaseType] = useState("Auto detect");
  const [store, setStore] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const displayMarketplace = marketplace === "Other" ? customMarketplace || "Other marketplace" : marketplace;
  const requirements = MARKETPLACE_REQUIREMENTS[marketplace] || MARKETPLACE_REQUIREMENTS.Other;
  const fileNames = useMemo(() => files.map((file) => normalize(file.name)), [files]);

  const fileIssues = useMemo<FileIssue[]>(() => {
    const issues: FileIssue[] = [];
    files.forEach((file) => {
      const ext = fileExtension(file);
      if (!ALLOWED_EXTENSIONS.includes(ext)) issues.push({ file: file.name, issue: `Unsupported file type .${ext || "unknown"}`, severity: "Block" });
      if (file.size < MIN_FILE_SIZE) issues.push({ file: file.name, issue: "File is too small to be useful evidence", severity: "Block" });
      if (file.size > MAX_FILE_SIZE) issues.push({ file: file.name, issue: "File is larger than 15MB", severity: "Block" });
      const relevant = [...requirements.flatMap((item) => item.hints), ...RISK_SIGNALS.map((item) => item.term), "seller", "marketplace", "account", "dashboard", "notice", "review", "restriction", "payout"].some((hint) => normalize(file.name).includes(hint));
      if (!relevant) issues.push({ file: file.name, issue: "Filename does not look marketplace-related. Use clear names such as ebay-mc011.pdf or tiktok-verification.png", severity: "Warning" });
    });
    return issues;
  }, [files, requirements]);

  const blockingIssues = fileIssues.filter((item) => item.severity === "Block");
  const warningIssues = fileIssues.filter((item) => item.severity === "Warning");

  const evidenceStatus = useMemo(() => requirements.map((item) => ({ ...item, present: hasHint(fileNames, item.hints) })), [fileNames, requirements]);
  const presentEvidence = evidenceStatus.filter((item) => item.present).length;

  const findings = useMemo<Finding[]>(() => {
    const result: Finding[] = [];

    if (!store.trim()) {
      result.push({ title: "Missing store URL or seller name", severity: "Medium", points: 8, detail: "A store URL or seller name helps connect evidence to a marketplace profile.", recommendation: "Add the marketplace profile, store URL or seller username before requesting manual review." });
    }

    if (!email.trim()) {
      result.push({ title: "No report email provided", severity: "Low", points: 4, detail: "A report email is needed if you want a downloadable assessment or analyst follow-up.", recommendation: "Add an email address before saving the lead." });
    }

    evidenceStatus.filter((item) => !item.present).forEach((item) => {
      result.push({ title: `${item.label} missing`, severity: "Medium", points: 9, detail: `The scan did not detect evidence related to ${item.label.toLowerCase()}.`, recommendation: `Upload a file with clear evidence for ${item.label.toLowerCase()}.` });
    });

    RISK_SIGNALS.forEach((item) => {
      if (fileNames.some((name) => name.includes(item.term)) || normalize(caseType).includes(item.term)) {
        result.push({ title: item.title, severity: item.severity, points: item.points, detail: "This signal may increase marketplace or payout exposure and should be reviewed in the full report.", recommendation: item.recommendation });
      }
    });

    if (files.length < 2) {
      result.push({ title: "Evidence package is thin", severity: "Medium", points: 10, detail: "One file rarely gives enough context for a strong risk assessment.", recommendation: "Add at least one notice, one dashboard screenshot and one proof file where possible." });
    }

    if (warningIssues.length > 0) {
      result.push({ title: "Low-confidence file naming", severity: "Low", points: 3, detail: "Some files do not include marketplace or issue keywords, so the scan confidence is lower.", recommendation: "Rename files with platform and issue names before uploading, for example ebay-bbe-notice.png." });
    }

    return result;
  }, [files.length, store, email, evidenceStatus, fileNames, caseType, warningIssues.length]);

  const score = useMemo(() => {
    const base = files.length ? 14 : 0;
    const missingPenalty = Math.max(0, requirements.length - presentEvidence) * 3;
    const total = findings.reduce((sum, item) => sum + item.points, base + missingPenalty);
    return Math.min(96, Math.max(files.length ? 18 : 0, total));
  }, [files.length, findings, requirements.length, presentEvidence]);

  const progress = files.length === 0 ? 0 : Math.min(100, 20 + files.length * 10 + presentEvidence * 16 - blockingIssues.length * 20);

  const detectedSignals = useMemo(() => {
    return RISK_SIGNALS.filter((item) => fileNames.some((name) => name.includes(item.term)) || normalize(caseType).includes(item.term));
  }, [fileNames, caseType]);

  const formErrors = useMemo(() => {
    const errors: string[] = [];
    if (!marketplace) errors.push("Select a marketplace.");
    if (marketplace === "Other" && !customMarketplace.trim()) errors.push("Enter the marketplace name or choose an existing option.");
    if (!caseType) errors.push("Select a case type or choose Auto detect.");
    if (!store.trim()) errors.push("Enter a store URL, seller ID or username.");
    if (!email.trim()) errors.push("Enter an email address for the report.");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push("Enter a valid email address.");
    return errors;
  }, [marketplace, customMarketplace, caseType, store, email]);

  const confidence = useMemo(() => {
    const score = 34 + presentEvidence * 12 + files.length * 7 + detectedSignals.length * 5 - warningIssues.length * 6 - blockingIssues.length * 20 + (store.trim() ? 8 : 0) + (email.trim() ? 8 : 0);
    return Math.max(18, Math.min(96, score));
  }, [presentEvidence, files.length, detectedSignals.length, warningIssues.length, blockingIssues.length, store, email]);

  const engineResult = useMemo(() => analyzeRisk({
    marketplace: displayMarketplace,
    caseType,
    store,
    email,
    fileNames: files.map((file) => file.name),
    evidencePresent: presentEvidence,
    evidenceRequired: requirements.length,
  }), [displayMarketplace, caseType, store, email, files, presentEvidence, requirements.length]);

  const canAnalyze = files.length > 0 && blockingIssues.length === 0 && formErrors.length === 0;

  const saveLead = () => {
    const lead = {
      createdAt: new Date().toISOString(),
      marketplace: displayMarketplace,
      caseType,
      store,
      email,
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
      score: engineResult.score,
      label: scoreLabel(engineResult.score),
      stage: engineResult.stage,
      revenueImpact: engineResult.revenueImpact,
      restrictionProbability: engineResult.restrictionProbability,
      primaryRiskDomain: engineResult.primaryRiskDomain,
      rootCauseHypothesis: engineResult.rootCauseHypothesis,
      findings: engineResult.findings.map((item) => item.title),
      warnings: warningIssues.map((item) => `${item.file}: ${item.issue}`),
    };
    sessionStorage.setItem("shadowscore_last_lead", JSON.stringify(lead));
    setLeadSaved(true);
  };

  const handleFileChange = (incoming: File[]) => {
    setSubmitted(false);
    setLeadSaved(false);
    setFiles(incoming);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%)]" />

      <header className="relative z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white">
            <img src="/shadowscore-shield-v8.png" alt="ShadowScore" className="h-8 w-8 object-contain" />
            Back to ShadowScore
          </Link>
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">Free Evidence-Based Scan</div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.45em] text-red-300">ShadowScore Trust Engine</div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">Free Marketplace & Payout Risk Scan</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Upload marketplace evidence and receive an instant preliminary Marketplace Health Stage. Unsupported files are blocked and weak evidence is clearly flagged.
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="font-bold">Anti-garbage validation</div>
              <p className="mt-4 leading-7 text-zinc-400">
                The scan accepts only relevant evidence formats and checks file size, file type, platform requirements and marketplace-related signals before producing a score. Unsupported files are blocked, weak evidence is flagged, missing notices are detected and evidence quality is scored.
              </p>
            </div>
            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="font-bold text-red-200">Safe positioning</div>
              <p className="mt-3 leading-7 text-zinc-400">
                ShadowScore does not access internal marketplace systems. The score is based on seller-supplied evidence, public marketplace rules and observable operational indicators.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Marketplace *</div>
                <select value={marketplace} onChange={(e) => { setMarketplace(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">
                  {Object.keys(MARKETPLACE_REQUIREMENTS).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Case type *</div>
                <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">
                  {CASE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Store URL, seller ID or username *</div>
                <input value={store} onChange={(e) => setStore(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="https://..." />
              </label>
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Email for report *</div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="you@example.com" />
              </label>
            </div>

            {marketplace === "Other" && (
              <label className="mt-5 block">
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Custom marketplace name</div>
                <input value={customMarketplace} onChange={(e) => { setCustomMarketplace(e.target.value); setSubmitted(false); setLeadSaved(false); }} className="w-full rounded-2xl border border-red-400/20 bg-black p-4 text-white" placeholder="Enter marketplace name" />
              </label>
            )}

            <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-14 text-center hover:border-red-500/40">
              <input type="file" multiple className="hidden" accept=".png,.jpg,.jpeg,.pdf,.csv,.docx,.xlsx,.html" onChange={(e) => handleFileChange(Array.from(e.target.files || []))} />
              <div className="text-2xl font-extrabold">Drop evidence files here</div>
              <div className="mt-3 text-zinc-500">PNG, JPG, PDF, CSV, DOCX, XLSX, HTML. 1KB to 15MB per file.</div>
              <div className="mt-5 text-sm font-bold text-red-300">Click to select files</div>
            </label>

            <div className="mt-6 rounded-2xl border border-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Evidence completeness</div>
                  <div className="mt-2 font-bold">{files.length ? `${files.length} files loaded` : "Waiting for evidence"}</div>
                </div>
                <div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">{progress}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500" style={{ width: `${Math.max(0, progress)}%` }} /></div>
            </div>

            {blockingIssues.length > 0 && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                <div className="font-bold">Blocked files</div>
                <div className="mt-2 space-y-1">{blockingIssues.map((item) => <div key={`${item.file}-${item.issue}`}>• {item.file}: {item.issue}</div>)}</div>
              </div>
            )}

            {warningIssues.length > 0 && (
              <div className="mt-6 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-5 text-sm leading-7 text-yellow-100">
                <div className="font-bold">Low-confidence evidence warnings</div>
                <div className="mt-2 space-y-1">{warningIssues.slice(0, 4).map((item) => <div key={`${item.file}-${item.issue}`}>• {item.file}: {item.issue}</div>)}</div>
              </div>
            )}

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
              <div className="mt-4 space-y-2 text-sm text-zinc-400">{files.length ? files.map((file) => <div key={`${file.name}-${file.size}`}>• {file.name}</div>) : <div>No evidence uploaded yet.</div>}</div>
            </div>

            {!canAnalyze && submitted && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                <div className="font-bold">Assessment cannot run yet.</div>
                <div className="mt-2 space-y-1">
                  {files.length === 0 && <div>• Upload at least one valid evidence file.</div>}
                  {blockingIssues.length > 0 && <div>• Remove blocked files before running the scan.</div>}
                  {formErrors.map((error) => <div key={error}>• {error}</div>)}
                </div>
              </div>
            )}

            <button type="button" onClick={() => setSubmitted(true)} className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500">
              Run Free Marketplace Scan
            </button>

            {submitted && canAnalyze && (
              <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
                <div className="grid gap-6 md:grid-cols-[180px_1fr]">
                  <div>
                    <div className={`text-6xl font-black ${scoreColor(engineResult.score)}`}>{engineResult.score}</div>
                    <div className="mt-3 text-sm font-bold text-white">{scoreLabel(engineResult.score)}</div>
                    <div className="mt-2 text-xs text-zinc-500">{displayMarketplace} · {caseType}</div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Health Stage</div>
                      <div className="mt-2 text-lg font-black text-orange-200">{engineResult.stage}</div>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{engineResult.nextLikelyOutcome}</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Scan Confidence</div>
                        <div className="mt-2 text-lg font-black text-emerald-200">{engineResult.confidence}%</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Evidence Quality</div>
                        <div className="mt-2 text-lg font-black text-red-100">{evidenceQuality(engineResult.confidence)}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="rounded-2xl border border-red-400/20 bg-black/55 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-red-300">Risk Engine V1</div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Primary Domain</div>
                          <div className="mt-2 font-black text-white">{engineResult.primaryRiskDomain}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue Impact</div>
                          <div className="mt-2 font-black text-red-100">{engineResult.revenueImpact}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Restriction Probability</div>
                          <div className="mt-2 font-black text-orange-200">{engineResult.restrictionProbability}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trust Score</div>
                          <div className="mt-2 font-black text-emerald-200">{engineResult.trustScore}/100</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Revenue Risk</div>
                          <div className="mt-2 font-black text-orange-200">{engineResult.revenueRiskScore}/100</div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Root Cause Hypothesis</div>
                        <div className="mt-2 font-bold text-white">{engineResult.rootCauseHypothesis}</div>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{engineResult.nextLikelyOutcome}</p>
                      </div>
                      {engineResult.missingEvidence.length > 0 && (
                        <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
                          <div className="font-bold">Missing evidence</div>
                          <div className="mt-2 space-y-1">{engineResult.missingEvidence.map((item) => <div key={item}>• {item}</div>)}</div>
                        </div>
                      )}
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Risk Timeline</div>
                        <div className="mt-4 space-y-3">
                          {engineResult.timeline.map((point, index) => (
                            <div key={`${point.label}-${index}`} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs font-black text-red-200">{index + 1}</div>
                              <div>
                                <div className="text-sm font-bold text-white">{point.label}: {point.status}</div>
                                <div className="mt-1 text-xs leading-5 text-zinc-500">{point.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-xl font-bold">Detected issue signals</div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm leading-6 text-zinc-300">
                      {detectedSignals.length ? detectedSignals.slice(0, 4).map((signal) => <div key={signal.term}>• {signal.title}</div>) : <div>Auto detect did not find a strong issue signal yet. Add notices with clear filenames such as ebay-mc011.pdf, walmart-counterfeit.png or paypal-reserve.pdf.</div>}
                    </div>
                    <div className="mt-6 text-xl font-bold">Preliminary findings</div>
                    <div className="mt-4 space-y-3">
                      {findings.map((finding) => (
                        <div key={finding.title} className="rounded-2xl border border-white/10 bg-black/45 p-4">
                          <div className="flex items-center justify-between gap-4"><div className="font-bold">{finding.title}</div><div className={`rounded-full border px-3 py-1 text-xs ${severityClass(finding.severity)}`}>{finding.severity}</div></div>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">{finding.detail}</p>
                          <p className="mt-3 text-sm leading-6 text-red-100">Recommended action: {finding.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Current Stage</div><div className="mt-2 font-black text-orange-200">{engineResult.stage}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Predicted Next</div><div className="mt-2 font-black text-red-200">{engineResult.restrictionProbability === "Critical" ? "Critical enforcement" : engineResult.restrictionProbability === "High" ? "Manual review" : engineResult.restrictionProbability === "Medium" ? "Warning" : "Monitor"}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fix Impact</div><div className="mt-2 font-black text-emerald-200">{Math.max(18, engineResult.score - 23)} after evidence</div></div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5 text-sm leading-7 text-zinc-400">This preliminary score is not internal marketplace data. It is a direction signal based on uploaded evidence metadata and visible indicators.</div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button type="button" onClick={saveLead} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white hover:border-red-400/30">Save Case Draft</button>
                  <PaymentButtons planName="Downloadable Scan Report" price="$9.90" buttonLabel="Download Full Report - $9.90" />
                </div>
                {leadSaved && <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">Case draft saved only in this browser. It is not uploaded to a server yet.</div>}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-7 text-zinc-400">The scan is free. Payment is only required if you want to download the full report.</div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
