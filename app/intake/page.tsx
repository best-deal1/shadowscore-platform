"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../../components/PaymentButtons";
import { getCurrentSession } from "../../lib/auth";
import { createIntake, ShadowScoreIntake } from "../../lib/workspace";

type Severity = "Low" | "Medium" | "High" | "Critical";
type Finding = {
  title: string;
  severity: Severity;
  points: number;
  detail: string;
  recommendation: string;
};
type Requirement = { label: string; hints: string[] };
type ScanMode = "website" | "marketplace" | "evidence";

type FileIssue = { file: string; issue: string; severity: "Block" | "Warning" };

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_FILE_SIZE = 1024;
const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "pdf",
  "csv",
  "docx",
  "xlsx",
  "html",
];

const MARKETPLACE_PLATFORMS = [
  "eBay",
  "Amazon",
  "Walmart",
  "Etsy",
  "TikTok Shop",
  "Shopify",
  "PayPal",
  "Payoneer",
  "Stripe",
  "Other",
];

const SCAN_MODES: Array<{
  id: ScanMode;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "website",
    label: "Website / Business",
    eyebrow: "No upload required",
    description:
      "Enter a URL, business name or company domain for the Trust Intelligence entry point.",
  },
  {
    id: "marketplace",
    label: "Marketplace / Seller",
    eyebrow: "Optional evidence",
    description:
      "Check a marketplace seller profile, platform account, payout provider or store identity.",
  },
  {
    id: "evidence",
    label: "Evidence Review",
    eyebrow: "Upload required",
    description:
      "Validate notices, screenshots, emails, invoices, tracking and payout documents.",
  },
];

const FUTURE_WEBSITE_PROVIDERS = [
  "SSL",
  "DNS",
  "WHOIS",
  "security headers",
  "SPF",
  "DMARC",
  "reputation",
  "business profile",
];

const MARKETPLACE_REQUIREMENTS: Record<string, Requirement[]> = {
  eBay: [
    {
      label: "Restriction, MC011, MC999 or BBE notice",
      hints: [
        "mc011",
        "mc999",
        "bbe",
        "restriction",
        "suspension",
        "review",
        "appeal",
      ],
    },
    {
      label: "Tracking or delivery evidence",
      hints: [
        "tracking",
        "delivery",
        "delivered",
        "carrier",
        "ups",
        "usps",
        "fedex",
        "proof",
      ],
    },
    {
      label: "Seller Hub or order screenshots",
      hints: ["seller", "hub", "order", "buyer", "feedback", "dashboard"],
    },
    {
      label: "Policy, VeRO or payout notices",
      hints: ["policy", "vero", "payout", "hold", "payment", "funds"],
    },
  ],
  Amazon: [
    {
      label: "Performance notification",
      hints: [
        "performance",
        "notification",
        "section 3",
        "deactivation",
        "suspension",
      ],
    },
    {
      label: "Account Health screenshot",
      hints: ["account health", "health", "ahr", "dashboard"],
    },
    {
      label: "Supplier invoices or authenticity documents",
      hints: ["invoice", "supplier", "authenticity", "distributor", "receipt"],
    },
    {
      label: "Order, tracking or A-to-Z evidence",
      hints: ["tracking", "order", "a-to-z", "claim", "delivery"],
    },
  ],
  Walmart: [
    {
      label: "Seller performance notice",
      hints: ["performance", "seller", "review", "suspension"],
    },
    {
      label: "Counterfeit or authenticity notice",
      hints: ["counterfeit", "authenticity", "brand", "invoice"],
    },
    {
      label: "Tracking and fulfillment report",
      hints: ["tracking", "fulfillment", "delivery", "carrier"],
    },
    {
      label: "Policy compliance notice",
      hints: ["policy", "compliance", "violation"],
    },
  ],
  Etsy: [
    {
      label: "Shop notice or account review",
      hints: ["etsy", "shop", "review", "suspension", "reserve"],
    },
    {
      label: "IP or policy complaint evidence",
      hints: [
        "ip",
        "intellectual",
        "property",
        "policy",
        "copyright",
        "trademark",
      ],
    },
    {
      label: "Cases and buyer messages",
      hints: ["case", "buyer", "message", "dispute"],
    },
    {
      label: "Tracking and delivery proof",
      hints: ["tracking", "delivery", "proof", "delivered"],
    },
  ],
  "TikTok Shop": [
    {
      label: "Seller verification notice",
      hints: [
        "verification",
        "seller",
        "identity",
        "kyc",
        "passport",
        "license",
      ],
    },
    {
      label: "Product rating or violation points",
      hints: ["rating", "violation", "points", "product", "quality"],
    },
    {
      label: "Fulfillment SLA or late dispatch data",
      hints: ["fulfillment", "late", "dispatch", "sla", "tracking"],
    },
    {
      label: "Payout or deferred settlement review",
      hints: ["payout", "settlement", "hold", "reserve", "deferred"],
    },
  ],
  PayPal: [
    {
      label: "Reserve or limitation notice",
      hints: ["reserve", "limitation", "hold", "paypal"],
    },
    {
      label: "Chargeback or dispute evidence",
      hints: ["chargeback", "dispute", "claim", "refund"],
    },
    {
      label: "Transaction and delivery proof",
      hints: ["transaction", "tracking", "delivery", "proof"],
    },
    {
      label: "Business verification documents",
      hints: ["business", "verification", "utility", "invoice"],
    },
  ],
  Payoneer: [
    {
      label: "Payoneer account review or compliance notice",
      hints: [
        "payoneer",
        "review",
        "compliance",
        "restriction",
        "verification",
      ],
    },
    {
      label: "Business verification documents",
      hints: ["business", "company", "utility", "id", "passport", "address"],
    },
    {
      label: "Payout or withdrawal issue",
      hints: ["payout", "withdrawal", "hold", "funds", "transfer"],
    },
    {
      label: "Marketplace connection evidence",
      hints: ["ebay", "amazon", "marketplace", "store", "seller"],
    },
  ],
  Stripe: [
    {
      label: "Reserve or account review notice",
      hints: ["reserve", "review", "stripe", "restricted"],
    },
    {
      label: "Chargeback evidence",
      hints: ["chargeback", "dispute", "refund"],
    },
    {
      label: "Fulfillment proof",
      hints: ["delivery", "tracking", "order", "proof"],
    },
    {
      label: "Business and product documentation",
      hints: ["business", "product", "policy", "verification"],
    },
  ],

  Shopify: [
    {
      label: "Store, payment or risk notice",
      hints: ["shopify", "store", "risk", "notice", "review", "hold"],
    },
    {
      label: "Payment processor evidence",
      hints: ["paypal", "stripe", "payoneer", "reserve", "chargeback"],
    },
    {
      label: "Order, fulfillment or dispute evidence",
      hints: ["order", "tracking", "delivery", "dispute", "refund"],
    },
    {
      label: "Product and supplier documentation",
      hints: ["product", "supplier", "invoice", "policy"],
    },
  ],
  Other: [
    {
      label: "Marketplace, payment or account notice",
      hints: [
        "notice",
        "restriction",
        "suspension",
        "review",
        "appeal",
        "violation",
        "warning",
        "hold",
      ],
    },
    {
      label: "Store, account or dashboard screenshot",
      hints: ["store", "seller", "account", "dashboard", "shop", "profile"],
    },
    {
      label: "Order, tracking, fulfillment or payout evidence",
      hints: [
        "order",
        "tracking",
        "delivery",
        "fulfillment",
        "payout",
        "settlement",
        "withdrawal",
        "hold",
      ],
    },
    {
      label: "Verification, policy or compliance documents",
      hints: [
        "verification",
        "kyc",
        "policy",
        "compliance",
        "invoice",
        "business",
        "id",
        "utility",
      ],
    },
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
  {
    term: "mc011",
    title: "MC011 delivery review language detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Organize tracking, delivery proof and buyer confirmation in one evidence timeline.",
  },
  {
    term: "mc999",
    title: "Permanent restriction language detected",
    severity: "Critical" as Severity,
    points: 24,
    recommendation:
      "Build a full post-mortem. Avoid repeated unsupported appeals.",
  },
  {
    term: "bbe",
    title: "Bad buying experience risk detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Compare visible metrics with broader trust, complaints and fulfillment signals.",
  },
  {
    term: "tba",
    title: "Carrier verification exposure detected",
    severity: "High" as Severity,
    points: 16,
    recommendation:
      "Strengthen proof with carrier-verifiable delivery evidence.",
  },
  {
    term: "amazon",
    title: "Supplier source exposure detected",
    severity: "High" as Severity,
    points: 14,
    recommendation:
      "Review retail supplier dependency and invoice consistency.",
  },
  {
    term: "counterfeit",
    title: "Counterfeit or authenticity concern detected",
    severity: "Critical" as Severity,
    points: 24,
    recommendation:
      "Prepare supplier invoices, authorization proof and authenticity documentation.",
  },
  {
    term: "authenticity",
    title: "Authenticity documentation signal detected",
    severity: "High" as Severity,
    points: 18,
    recommendation: "Review supplier legitimacy and branded product exposure.",
  },
  {
    term: "vero",
    title: "VeRO or IP complaint detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Review brand, image, description and rights-owner exposure.",
  },
  {
    term: "policy",
    title: "Policy exposure detected",
    severity: "Medium" as Severity,
    points: 12,
    recommendation: "Map policy events and remove similar high-risk listings.",
  },
  {
    term: "security",
    title: "Security concern language detected",
    severity: "Critical" as Severity,
    points: 22,
    recommendation:
      "Review identity, access, device and linked account consistency.",
  },
  {
    term: "verification",
    title: "Verification requirement detected",
    severity: "Medium" as Severity,
    points: 12,
    recommendation:
      "Prepare ID, business, utility, warehouse and supplier documentation.",
  },
  {
    term: "payout",
    title: "Payout review indicator detected",
    severity: "Medium" as Severity,
    points: 12,
    recommendation:
      "Review delivery confidence, disputes and reserve-period exposure.",
  },
  {
    term: "reserve",
    title: "Reserve or cashflow exposure detected",
    severity: "High" as Severity,
    points: 16,
    recommendation:
      "Reduce open claims and prepare proof of fulfillment and business legitimacy.",
  },
  {
    term: "deferred settlement",
    title: "Deferred settlement risk detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Review product quality, settlement eligibility and unresolved violations.",
  },
  {
    term: "chargeback",
    title: "Chargeback exposure detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Review payment processor risk and customer dispute prevention.",
  },
  {
    term: "product rating",
    title: "Product quality and rating risk detected",
    severity: "High" as Severity,
    points: 16,
    recommendation:
      "Review low product ratings, complaints, returns and quality signals.",
  },
  {
    term: "late shipment",
    title: "Late shipment risk detected",
    severity: "Medium" as Severity,
    points: 12,
    recommendation:
      "Review handling time, tracking upload timing and supplier SLA.",
  },
  {
    term: "adult",
    title: "Restricted product category risk detected",
    severity: "High" as Severity,
    points: 17,
    recommendation:
      "Review category, imagery and listing text before relisting.",
  },
  {
    term: "military",
    title: "Restricted item exposure detected",
    severity: "High" as Severity,
    points: 18,
    recommendation:
      "Remove similar listings and review restricted category rules.",
  },
  {
    term: "report",
    title: "Community reporting risk detected",
    severity: "Medium" as Severity,
    points: 12,
    recommendation:
      "Identify whether removals are listing-level, account-level or competitor-report driven.",
  },
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

export default function IntakePage() {
  const [scanMode, setScanMode] = useState<ScanMode>("website");
  const [files, setFiles] = useState<File[]>([]);
  const [marketplace, setMarketplace] = useState("eBay");
  const [customMarketplace, setCustomMarketplace] = useState("");
  const [caseType, setCaseType] = useState("Auto detect");
  const [store, setStore] = useState("");
  const [websiteTarget, setWebsiteTarget] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [intake, setIntake] = useState<ShadowScoreIntake | null>(null);

  const displayMarketplace =
    marketplace === "Other"
      ? customMarketplace || "Other marketplace"
      : marketplace;
  const activeTarget = scanMode === "website" ? websiteTarget : store;
  const requirements = useMemo(
    () =>
      scanMode === "website"
        ? []
        : MARKETPLACE_REQUIREMENTS[marketplace] ||
          MARKETPLACE_REQUIREMENTS.Other,
    [scanMode, marketplace],
  );
  const activeMode =
    SCAN_MODES.find((mode) => mode.id === scanMode) || SCAN_MODES[0];
  const fileNames = useMemo(
    () => files.map((file) => normalize(file.name)),
    [files],
  );

  const fileIssues = useMemo<FileIssue[]>(() => {
    const issues: FileIssue[] = [];
    files.forEach((file) => {
      const ext = fileExtension(file);
      if (!ALLOWED_EXTENSIONS.includes(ext))
        issues.push({
          file: file.name,
          issue: `Unsupported file type .${ext || "unknown"}`,
          severity: "Block",
        });
      if (file.size < MIN_FILE_SIZE)
        issues.push({
          file: file.name,
          issue: "File is too small to be useful evidence",
          severity: "Block",
        });
      if (file.size > MAX_FILE_SIZE)
        issues.push({
          file: file.name,
          issue: "File is larger than 15MB",
          severity: "Block",
        });
      const relevant = [
        ...requirements.flatMap((item) => item.hints),
        ...RISK_SIGNALS.map((item) => item.term),
        "seller",
        "marketplace",
        "account",
        "dashboard",
        "notice",
        "review",
        "restriction",
        "payout",
      ].some((hint) => normalize(file.name).includes(hint));
      if (!relevant)
        issues.push({
          file: file.name,
          issue:
            "Filename does not look related to the selected scan. Use clear names such as ebay-mc011.pdf, payout-hold.png or business-verification.pdf",
          severity: "Warning",
        });
    });
    return issues;
  }, [files, requirements]);

  const blockingIssues = fileIssues.filter((item) => item.severity === "Block");
  const warningIssues = fileIssues.filter(
    (item) => item.severity === "Warning",
  );

  const evidenceStatus = useMemo(
    () =>
      requirements.map((item) => ({
        ...item,
        present: hasHint(fileNames, item.hints),
      })),
    [fileNames, requirements],
  );
  const presentEvidence = evidenceStatus.filter((item) => item.present).length;

  const findings = useMemo<Finding[]>(() => {
    const result: Finding[] = [];

    if (!activeTarget.trim()) {
      result.push({
        title:
          scanMode === "website"
            ? "Missing website or business target"
            : "Missing store URL or seller name",
        severity: "Medium",
        points: 8,
        detail:
          scanMode === "website"
            ? "A URL, domain or business name is needed to prepare the future provider checks."
            : "A store URL or seller name helps connect evidence to a marketplace profile.",
        recommendation: "Add the target before requesting manual review.",
      });
    }

    if (!email.trim()) {
      result.push({
        title: "No report email provided",
        severity: "Low",
        points: 4,
        detail:
          "A report email is needed if you want a downloadable assessment or analyst follow-up.",
        recommendation: "Add an email address before saving the lead.",
      });
    }

    evidenceStatus
      .filter((item) => !item.present)
      .forEach((item) => {
        result.push({
          title: `${item.label} missing`,
          severity: "Medium",
          points: 9,
          detail: `The scan did not detect evidence related to ${item.label.toLowerCase()}.`,
          recommendation: `Upload a file with clear evidence for ${item.label.toLowerCase()}.`,
        });
      });

    RISK_SIGNALS.forEach((item) => {
      if (
        fileNames.some((name) => name.includes(item.term)) ||
        normalize(caseType).includes(item.term)
      ) {
        result.push({
          title: item.title,
          severity: item.severity,
          points: item.points,
          detail:
            "This signal may increase marketplace or payout exposure and should be reviewed in the full report.",
          recommendation: item.recommendation,
        });
      }
    });

    if (files.length < 2) {
      result.push({
        title: "Evidence package is thin",
        severity: "Medium",
        points: 10,
        detail:
          "One file rarely gives enough context for a strong risk assessment.",
        recommendation:
          "Add at least one notice, one dashboard screenshot and one proof file where possible.",
      });
    }

    if (warningIssues.length > 0) {
      result.push({
        title: "Low-confidence file naming",
        severity: "Low",
        points: 3,
        detail:
          "Some files do not include marketplace or issue keywords, so the scan confidence is lower.",
        recommendation:
          "Rename files with platform and issue names before uploading, for example ebay-bbe-notice.png.",
      });
    }

    return result;
  }, [
    files.length,
    activeTarget,
    email,
    evidenceStatus,
    fileNames,
    caseType,
    warningIssues.length,
    scanMode,
  ]);

  const progress =
    files.length === 0
      ? 0
      : Math.min(
          100,
          20 +
            files.length * 10 +
            presentEvidence * 16 -
            blockingIssues.length * 20,
        );

  const detectedSignals = useMemo(() => {
    return RISK_SIGNALS.filter(
      (item) =>
        fileNames.some((name) => name.includes(item.term)) ||
        normalize(caseType).includes(item.term),
    );
  }, [fileNames, caseType]);

  const formErrors = useMemo(() => {
    const errors: string[] = [];
    if (scanMode === "marketplace") {
      if (!marketplace) errors.push("Select a marketplace.");
      if (marketplace === "Other" && !customMarketplace.trim())
        errors.push("Enter the marketplace name or choose an existing option.");
      if (!caseType) errors.push("Select a case type or choose Auto detect.");
      if (!store.trim())
        errors.push(
          "Enter a seller URL, store URL, account name or seller ID.",
        );
    }
    if (scanMode === "website" && !websiteTarget.trim())
      errors.push("Enter a website URL, business name or company domain.");
    if (scanMode === "evidence" && files.length === 0)
      errors.push("Upload evidence for case review.");
    if (!email.trim()) errors.push("Enter an email address for the report.");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.push("Enter a valid email address.");
    return errors;
  }, [
    scanMode,
    marketplace,
    customMarketplace,
    caseType,
    store,
    websiteTarget,
    email,
    files.length,
  ]);

  const canAnalyze =
    blockingIssues.length === 0 &&
    formErrors.length === 0 &&
    (scanMode !== "evidence" || files.length > 0);

  const intakeRecord = () => ({
      scanMode,
      platform: scanMode === "website" ? "Website / Business" : displayMarketplace,
      caseType: scanMode === "website" ? "Business trust scan" : caseType,
      target: activeTarget,
      email,
      fileNames: files.map((file) => file.name),
      visibleSignalCategories: scanMode === "website" ? FUTURE_WEBSITE_PROVIDERS : (detectedSignals.length ? detectedSignals.map((item) => item.title) : ["Marketplace identity", "Evidence readiness", "Payment or policy categories"]),
    });

  const saveLead = async () => {
    const session = getCurrentSession();
    if (session) {
      const created = await createIntake(session, intakeRecord());
      setIntake(created);
    }
    const lead = {
      createdAt: new Date().toISOString(),
      scanMode,
      marketplace:
        scanMode === "website" ? "Website / Business" : displayMarketplace,
      caseType: scanMode === "website" ? "Business trust scan" : caseType,
      store: activeTarget,
      email,
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
      previewOnly: true,
      score: null,
      label: "Locked until payment",
      findings: findings.slice(0, 5).map((item) => item.title),
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
          <Link
            href="/"
            className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white"
          >
            <img
              src="/shadowscore-shield-v8.png"
              alt="ShadowScore"
              className="h-8 w-8 object-contain"
            />
            Back to ShadowScore
          </Link>
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
            Free Trust Intelligence Preview
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.45em] text-red-300">
              ShadowScore Trust Engine
            </div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">
              Trust Intelligence starts here
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Run a preview for a website, seller profile or evidence package.
              The free scan only shows intake readiness and visible signal
              categories; full scoring, recommendations, breakdowns and action
              plans stay locked until payment succeeds.
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="font-bold">Anti-garbage validation</div>
              <p className="mt-4 leading-7 text-zinc-400">
                The intake accepts relevant evidence formats and checks file
                size, file type, platform requirements and scan-related signals
                before producing a preview. Unsupported files are blocked, weak
                evidence is flagged and missing notices are detected without
                exposing a full risk score.
              </p>
            </div>
            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="font-bold text-red-200">Safe positioning</div>
              <p className="mt-3 leading-7 text-zinc-400">
                ShadowScore does not access internal marketplace systems and
                does not show demo data to new users. Checkout only creates a
                payment intent; completed reports are generated after successful
                payment.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <div className="grid gap-3 md:grid-cols-3">
              {SCAN_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setScanMode(mode.id);
                    setSubmitted(false);
                    setLeadSaved(false);
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${scanMode === mode.id ? "border-red-400/50 bg-red-500/15" : "border-white/10 bg-white/[0.03] hover:border-red-400/25"}`}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">
                    {mode.eyebrow}
                  </div>
                  <div className="mt-2 font-black text-white">{mode.label}</div>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-red-300">
                Active scan mode
              </div>
              <div className="mt-2 text-xl font-black">{activeMode.label}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This flow is structured so SSL, DNS, WHOIS, security-header,
                SPF, DMARC, reputation, business-profile and platform evidence
                providers can be plugged in later. No provider results or demo
                scores are hardcoded.
              </p>
            </div>

            {scanMode === "website" && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Website URL, business name or company domain *
                  </div>
                  <input
                    value={websiteTarget}
                    onChange={(e) => {
                      setWebsiteTarget(e.target.value);
                      setSubmitted(false);
                      setLeadSaved(false);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                    placeholder="example.com or Example LLC"
                  />
                </label>
                <label className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Email for locked report *
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                    placeholder="you@example.com"
                  />
                </label>
                <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5 text-sm leading-7 text-zinc-400">
                  <div className="font-bold text-red-100">
                    Future provider slots
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FUTURE_WEBSITE_PROVIDERS.map((provider) => (
                      <span
                        key={provider}
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {scanMode !== "website" && (
              <>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {scanMode === "marketplace" && (
                    <>
                      <label>
                        <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                          Platform *
                        </div>
                        <select
                          value={marketplace}
                          onChange={(e) => {
                            setMarketplace(e.target.value);
                            setSubmitted(false);
                            setLeadSaved(false);
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                        >
                          {MARKETPLACE_PLATFORMS.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                          Case type *
                        </div>
                        <select
                          value={caseType}
                          onChange={(e) => setCaseType(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                        >
                          {CASE_TYPES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                      <label className="md:col-span-2">
                        <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                          Seller URL, store URL, account name or seller ID *
                        </div>
                        <input
                          value={store}
                          onChange={(e) => {
                            setStore(e.target.value);
                            setSubmitted(false);
                            setLeadSaved(false);
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                          placeholder="https://... or seller ID"
                        />
                      </label>
                    </>
                  )}
                  {scanMode === "evidence" && (
                    <label className="md:col-span-2">
                      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                        Optional account, marketplace or case reference
                      </div>
                      <input
                        value={store}
                        onChange={(e) => {
                          setStore(e.target.value);
                          setSubmitted(false);
                          setLeadSaved(false);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                        placeholder="eBay MC011, PayPal reserve, order ID, account name..."
                      />
                    </label>
                  )}
                  <label className="md:col-span-2">
                    <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                      Email for locked report *
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                {marketplace === "Other" && scanMode === "marketplace" && (
                  <label className="mt-5 block">
                    <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                      Custom platform name
                    </div>
                    <input
                      value={customMarketplace}
                      onChange={(e) => {
                        setCustomMarketplace(e.target.value);
                        setSubmitted(false);
                        setLeadSaved(false);
                      }}
                      className="w-full rounded-2xl border border-red-400/20 bg-black p-4 text-white"
                      placeholder="Enter platform name"
                    />
                  </label>
                )}

                <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-14 text-center hover:border-red-500/40">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf,.csv,.docx,.xlsx,.html"
                    onChange={(e) =>
                      handleFileChange(Array.from(e.target.files || []))
                    }
                  />
                  <div className="text-2xl font-extrabold">
                    {scanMode === "marketplace"
                      ? "Add optional evidence"
                      : "Drop evidence files here"}
                  </div>
                  <div className="mt-3 text-zinc-500">
                    PNG, JPG, PDF, CSV, DOCX, XLSX, HTML. 1KB to 15MB per file.
                  </div>
                  <div className="mt-5 text-sm font-bold text-red-300">
                    Click to select files
                  </div>
                </label>
              </>
            )}

            {scanMode !== "website" && (
              <>
                <div className="mt-6 rounded-2xl border border-white/10 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                        Evidence readiness
                      </div>
                      <div className="mt-2 font-bold">
                        {files.length
                          ? `${files.length} files loaded`
                          : scanMode === "marketplace"
                            ? "Evidence optional"
                            : "Waiting for evidence"}
                      </div>
                    </div>
                    <div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
                      {progress}%
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500"
                      style={{ width: `${Math.max(0, progress)}%` }}
                    />
                  </div>
                </div>

                {blockingIssues.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                    <div className="font-bold">Blocked files</div>
                    <div className="mt-2 space-y-1">
                      {blockingIssues.map((item) => (
                        <div key={`${item.file}-${item.issue}`}>
                          • {item.file}: {item.issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {warningIssues.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-5 text-sm leading-7 text-yellow-100">
                    <div className="font-bold">
                      Low-confidence evidence warnings
                    </div>
                    <div className="mt-2 space-y-1">
                      {warningIssues.slice(0, 4).map((item) => (
                        <div key={`${item.file}-${item.issue}`}>
                          • {item.file}: {item.issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanMode === "marketplace" && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {evidenceStatus.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-2xl border p-4 ${item.present ? "border-emerald-400/25 bg-emerald-500/10" : "border-yellow-400/25 bg-yellow-500/10"}`}
                      >
                        <div className="text-sm font-bold">
                          {item.present ? "✓ Present" : "Missing"}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-zinc-400">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-red-300">
                    Evidence Queue
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-zinc-400">
                    {files.length ? (
                      files.map((file) => (
                        <div key={`${file.name}-${file.size}`}>
                          • {file.name}
                        </div>
                      ))
                    ) : (
                      <div>No evidence uploaded yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!canAnalyze && submitted && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                <div className="font-bold">Preview cannot run yet.</div>
                <div className="mt-2 space-y-1">
                  {blockingIssues.length > 0 && (
                    <div>• Remove blocked files before running the scan.</div>
                  )}
                  {formErrors.map((error) => (
                    <div key={error}>• {error}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500"
            >
              Run Free {activeMode.label} Preview
            </button>

            {submitted && canAnalyze && (
              <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Preview Status
                    </div>
                    <div className="mt-2 text-xl font-black text-emerald-200">
                      Ready
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Full score locked until payment.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Scan Mode
                    </div>
                    <div className="mt-2 text-xl font-black text-white">
                      {activeMode.label}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {scanMode === "website"
                        ? websiteTarget
                        : activeTarget || displayMarketplace}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Report
                    </div>
                    <div className="mt-2 text-xl font-black text-red-100">
                      Locked
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Generated only after payment succeeds.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-red-300">
                    Free preview includes
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(scanMode === "website"
                      ? [
                          "Business target captured",
                          "Provider slots prepared",
                          "No file upload required",
                          "Payment-gated report queued",
                        ]
                      : scanMode === "marketplace"
                        ? [
                            "Platform and seller target captured",
                            "Case type remains modular",
                            "Evidence validation if uploaded",
                            "Payment-gated report queued",
                          ]
                        : [
                            "Evidence package accepted",
                            "Evidence validation complete",
                            "Preliminary risk category names only",
                            "Payment-gated report queued",
                          ]
                    ).map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-zinc-300"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-xl font-bold">
                  Visible signal categories
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm leading-6 text-zinc-300">
                  {scanMode === "website" && (
                    <div>
                      Website trust, domain identity, security posture, email
                      authentication, reputation and business profile signals
                      are prepared for paid report generation.
                    </div>
                  )}
                  {scanMode === "marketplace" &&
                    (detectedSignals.length ? (
                      detectedSignals
                        .slice(0, 4)
                        .map((signal) => (
                          <div key={signal.term}>• {signal.title}</div>
                        ))
                    ) : (
                      <div>
                        Marketplace, seller identity, payout, policy and
                        evidence readiness categories are prepared. Add evidence
                        for stronger validation.
                      </div>
                    ))}
                  {scanMode === "evidence" &&
                    (files.length ? (
                      <div>
                        Evidence validation, document relevance, notice
                        classification and payout or policy risk categories are
                        prepared. Detailed findings stay locked.
                      </div>
                    ) : (
                      <div>
                        Upload evidence to prepare validation categories.
                      </div>
                    ))}
                </div>

                <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5 text-sm leading-7 text-yellow-100">
                  Free scan preview only. Full risk score, recommendations, full
                  breakdown, action plan and completed report are locked until
                  payment succeeds. Checkout starts a payment intent only.
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={saveLead}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white hover:border-red-400/30"
                  >
                    Save Intake Draft
                  </button>
                  <PaymentButtons
                    planName="Downloadable Trust Intelligence Report"
                    price="$9.90"
                    buttonLabel="Unlock Full Report - $9.90"
                    intakeId={intake?.intakeId}
                  />
                </div>
                {leadSaved && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    Intake record created with reportStatus=preview. Checkout will create a payment intent and locked placeholder only.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
