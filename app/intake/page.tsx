/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PaymentButtons from "../../components/PaymentButtons";
import InvestigationLifecycle from "../components/InvestigationLifecycle";
import InvestigationTimeline from "../components/InvestigationTimeline";
import AuditMetadata from "../components/AuditMetadata";
import { getCurrentSession } from "../../lib/auth";
import { isPreviewReadyResponse, nextPreviewStatus, readPreviewJson } from "../../lib/freeScanPreviewFlow";
import { createIntake, ShadowScoreIntake } from "../../lib/workspace";
import { decisionLightDisplayLabel } from "../../lib/canonicalDecision";
import { useLocale } from "../../components/LocaleProvider";

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
type FreeScanProviderSummary = {
  providerId: string;
  providerName: string;
  providerVersion?: string;
  category?: string;
  status: "completed" | "failed" | "skipped";
  duration: number;
  error?: string;
  failureReason?: string;
  lookupPerformed?: boolean;
  evidenceCount?: number;
  findingCount?: number;
  fields: Array<{ label: string; value: string }>;
};
type TrustInsight = {
  category: "Infrastructure Insight" | "Identity Insight" | "Email/Domain Insight" | "Overall Trust Note";
  insight: string;
  riskLevel: "Low" | "Medium" | "High" | "Insufficient Public Evidence";
  whyItMatters: string;
  recommendedNextStep: string;
  evidence: string[];
};
type TrustTimelineItem = { title: string; description: string; status: "completed" | "unavailable" | "pending"; evidenceSource: string };
type DecisionPreview = { decision: "PASS" | "PROCEED_WITH_VERIFICATION" | "REVIEW" | "FAIL" | "CONFIRMED RISK"; decisionLabel: "Evidence supports proceeding" | "Proceed with verification" | "Review required" | "Additional verification recommended" | "Verified negative indicators detected" | "Verified enough to proceed" | "Do not proceed"; decisionColor: "green" | "yellow" | "orange" | "red"; verificationScore: number; confidenceScore: number; identityScore: number; infrastructureScore: number; emailSecurityScore: number; reputationScore: number | "pending"; evidenceCoverageScore: number; confidenceLevel: "Low" | "Medium" | "High"; topReasons: string[]; reasons: string[]; missingSignals: string[]; blockingIssues: string[]; whatThisMeans: string; recommendedAction: string; limitedPreview: boolean };
type IdentityProfile = { identitySummary: string };
type BusinessNarrativeSection = { id: string; title: string; body: string[] };
type BusinessNarrative = { decision: string; confidence: string; decisionMode?: { proceed: "YES" | "REVIEW" | "NO"; decisionOutcome?: string; decisionLight?: string; riskLevel?: string; headline?: string; userMeaning?: string; allowedActions?: string[]; blockedActions?: string[]; confidence: string; mainRemainingUncertainty: string; recommendedNextAction: string; estimatedEffort: string; businessImpactIfSkipped: "Low" | "Medium" | "High" }; sections: BusinessNarrativeSection[] };
type ProviderRegistryItem = { id: string; name: string; version: string; category: string };
type FreeScanResult = { status?: "ready"; message?: string; reportReadyEvent?: { type: "free-preview-ready"; status: "ready"; ready: true; emittedAt: string }; executedAt: string; targetResolution?: { requestedTarget: string; resolvedTarget: string; companyId?: string; legalName?: string }; providerRegistry?: ProviderRegistryItem[]; providers: FreeScanProviderSummary[]; insights: TrustInsight[]; insightEngineVersion?: string; timeline?: TrustTimelineItem[]; decisionPreview?: DecisionPreview; identityProfile?: IdentityProfile; businessNarrative?: BusinessNarrative };

const CHECKOUT_DRAFT_KEY = "shadowscore.checkout-draft.v1";

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

const WEBSITE_SIGNAL_CATEGORIES = ["DNS Intelligence", "WHOIS Intelligence", "SSL Certificate Provider", "HTTP Security Headers Provider", "SPF Provider", "DMARC Provider", "Public Business Profile Provider", "Reputation Provider", "Website Metadata Provider", "Contact Discovery Provider", "Social Profile Discovery Provider"];

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
  const router = useRouter();
  const { t } = useLocale();
  const scanModes: Array<{ id: ScanMode; label: string; eyebrow: string; description: string }> = [
    { id: "website", label: t.intakeUi.websiteBusiness, eyebrow: t.intakeUi.noUploadRequired, description: t.intakeUi.websiteModeDescription },
    { id: "marketplace", label: t.intakeUi.marketplaceSeller, eyebrow: t.intakeUi.optionalEvidence, description: t.intakeUi.marketplaceModeDescription },
    { id: "evidence", label: t.intakeUi.evidenceReview, eyebrow: t.intakeUi.uploadRequired, description: t.intakeUi.evidenceModeDescription },
  ];
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
  const [freeScanResult, setFreeScanResult] = useState<FreeScanResult | null>(null);
  const [freeScanRunning, setFreeScanRunning] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [freeScanError, setFreeScanError] = useState("");
  const [investigationStartedAt, setInvestigationStartedAt] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target")?.trim();
    const mode = params.get("mode");

    if (!target) return;

    if (mode === "marketplace") {
      setScanMode("marketplace");
      setStore(target);
      return;
    }

    setScanMode("website");
    setWebsiteTarget(target);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resume") !== "checkout" || intake) return;
    const session = getCurrentSession();
    const stored = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!session || !stored) return;

    let cancelled = false;
    void (async () => {
      try {
        const draft = JSON.parse(stored) as ReturnType<typeof intakeRecord>;
        const created = await createIntake(session, draft);
        if (cancelled) return;
        setScanMode(draft.scanMode);
        setWebsiteTarget(draft.scanMode === "website" ? draft.target : "");
        setStore(draft.scanMode === "website" ? "" : draft.target);
        setEmail(draft.email);
        setSubmitted(true);
        setPreviewStatus("ready");
        setLeadSaved(true);
        setIntake(created);
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        router.replace("/intake");
      } catch {
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        setFreeScanError("The saved investigation could not be restored. Please save it again.");
      }
    })();
    return () => { cancelled = true; };
  }, [intake, router]);

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
    scanModes.find((mode) => mode.id === scanMode) || scanModes[0];
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
            ? "A URL, domain or business name is needed to prepare the investigation."
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
    return errors;
  }, [
    scanMode,
    marketplace,
    customMarketplace,
    caseType,
    store,
    websiteTarget,
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
      visibleSignalCategories: scanMode === "website" ? WEBSITE_SIGNAL_CATEGORIES : (detectedSignals.length ? detectedSignals.map((item) => item.title) : ["Marketplace identity", t.intakeUi.evidenceReadiness, "Payment or policy categories"]),
    });

  const resetFreeScan = () => {
    setFreeScanResult(null);
    setPreviewStatus("idle");
    setFreeScanError("");
    setInvestigationStartedAt(undefined);
  };

  const runFreePreview = async () => {
    setSubmitted(true);
    setFreeScanError("");
    setPreviewStatus("idle");

    if (!canAnalyze) return;

    if (scanMode !== "website") {
      setFreeScanResult(null);
      setPreviewStatus("ready");
      return;
    }

    setFreeScanRunning(true);
    setPreviewStatus("loading");
    setFreeScanResult(null);
    setInvestigationStartedAt(new Date().toISOString());

    try {
      const response = await fetch("/api/free-scan/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeRecord()),
      });
      const payload = await readPreviewJson(response);

      if (!isPreviewReadyResponse(payload)) {
        throw new Error("Investigation checks finished, but the preview-ready event was missing from the API response.");
      }

      setFreeScanResult(payload as FreeScanResult);
      setPreviewStatus(nextPreviewStatus(payload));
    } catch (error) {
      setPreviewStatus("failed");
      setFreeScanError(error instanceof Error ? error.message : "Unable to run investigation checks.");
    } finally {
      setFreeScanRunning(false);
    }
  };

  const providerStatusLabel = (result?: FreeScanProviderSummary) => {
    if (freeScanRunning) return "Not Checked";
    if (!result) return "Not Checked";
    if (result.status === "completed" && result.lookupPerformed === false) return "Not Applicable";
    if (result.status === "completed") return "Completed";
    if (result.failureReason === "Timeout") return "Timeout";
    if (result.failureReason === "Not Supported") return "Not Supported";
    return "Unavailable";
  };

  const providerStatusIcon = (status: string) => {
    if (status === "Completed") return "✓";
    if (status === "Timeout") return "⏱";
    if (status === "Not Checked") return "⏳";
    return "!";
  };

  const renderValue = (value: string): ReactNode => value || "Unavailable";

  const saveLead = async () => {
    const session = getCurrentSession();
    const record = intakeRecord();
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
    if (!session) {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(record));
      router.push(`/signup?returnTo=${encodeURIComponent("/intake?resume=checkout")}`);
      return;
    }
    const created = await createIntake(session, record);
    setIntake(created);
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
            {t.intakeUi.back}
          </Link>
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
            {t.intakeUi.preview}
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.45em] text-red-300">
              {t.intakeUi.eyebrow}
            </div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">
              {t.intake.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              {t.intake.description}
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="font-bold">{t.intakeUi.evidenceReadiness}</div>
              <p className="mt-4 leading-7 text-zinc-400">
                {t.intakeUi.evidenceReadinessCopy}
              </p>
            </div>
            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="font-bold text-red-200">{t.intakeUi.privateByDesign}</div>
              <p className="mt-3 leading-7 text-zinc-400">
                {t.intakeUi.privateByDesignCopy}
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <div className="grid gap-3 md:grid-cols-3">
              {scanModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setScanMode(mode.id);
                    setSubmitted(false);
                    setLeadSaved(false);
                    resetFreeScan();
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
                {t.intakeUi.selectedInvestigation}
              </div>
              <div className="mt-2 text-xl font-black">{activeMode.label}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {t.intake.coverage}
              </p>
            </div>

            {scanMode === "website" && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                    {t.intake.field} *
                  </div>
                  <input
                    value={websiteTarget}
                    onChange={(e) => {
                      setWebsiteTarget(e.target.value);
                      setSubmitted(false);
                      setLeadSaved(false);
                      resetFreeScan();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                    placeholder={t.intakeUi.targetPlaceholder}
                  />
                </label>
              </div>
            )}

            {scanMode !== "website" && (
              <>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {scanMode === "marketplace" && (
                    <>
                      <label>
                        <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                          {t.intakeUi.platform} *
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
                          {t.intakeUi.caseType} *
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
                          {t.intakeUi.sellerTarget} *
                        </div>
                        <input
                          value={store}
                          onChange={(e) => {
                            setStore(e.target.value);
                            setSubmitted(false);
                            setLeadSaved(false);
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                          placeholder={t.intakeUi.sellerPlaceholder}
                        />
                      </label>
                    </>
                  )}
                  {scanMode === "evidence" && (
                    <label className="md:col-span-2">
                      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                        {t.intakeUi.evidenceReference}
                      </div>
                      <input
                        value={store}
                        onChange={(e) => {
                          setStore(e.target.value);
                          setSubmitted(false);
                          setLeadSaved(false);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white"
                        placeholder={t.intakeUi.evidenceReferencePlaceholder}
                      />
                    </label>
                  )}
                </div>

                {marketplace === "Other" && scanMode === "marketplace" && (
                  <label className="mt-5 block">
                    <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
                      {t.intakeUi.customPlatform}
                    </div>
                    <input
                      value={customMarketplace}
                      onChange={(e) => {
                        setCustomMarketplace(e.target.value);
                        setSubmitted(false);
                        setLeadSaved(false);
                      }}
                      className="w-full rounded-2xl border border-red-400/20 bg-black p-4 text-white"
                      placeholder={t.intakeUi.customPlatformPlaceholder}
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
                      ? t.intakeUi.addOptionalEvidence
                      : t.intakeUi.dropEvidence}
                  </div>
                  <div className="mt-3 text-zinc-500">
                    {t.intakeUi.fileRequirements}
                  </div>
                  <div className="mt-5 text-sm font-bold text-red-300">
                    {t.intakeUi.selectFiles}
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
                        {t.intakeUi.evidenceReadiness}
                      </div>
                      <div className="mt-2 font-bold">
                        {files.length
                          ? `${files.length} ${t.intakeUi.filesLoaded}`
                          : scanMode === "marketplace"
                            ? t.intakeUi.evidenceOptional
                            : t.intakeUi.waitingForEvidence}
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
                    {t.intakeUi.evidenceQueue}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-zinc-400">
                    {files.length ? (
                      files.map((file) => (
                        <div key={`${file.name}-${file.size}`}>
                          • {file.name}
                        </div>
                      ))
                    ) : (
                      <div>{t.intakeUi.noEvidence}</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!canAnalyze && submitted && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
                <div className="font-bold">{t.intakeUi.previewCannotRun}</div>
                <div className="mt-2 space-y-1">
                  {blockingIssues.length > 0 && (
                    <div>• {t.intakeUi.removeBlockedFiles}</div>
                  )}
                  {formErrors.map((error) => (
                    <div key={error}>• {error}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={runFreePreview}
              className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500"
            >
              {freeScanRunning ? t.intakeUi.investigating : previewStatus === "ready" ? t.intakeUi.previewReady : t.intakeUi.startInvestigation}
            </button>

            {submitted && canAnalyze && previewStatus !== "idle" && (
              <InvestigationLifecycle
                running={previewStatus === "loading"}
                failed={previewStatus === "failed"}
                target={activeTarget}
                startedAt={investigationStartedAt}
                completedAt={freeScanResult?.executedAt}
                providers={freeScanResult?.providers}
              />
            )}

            {submitted && canAnalyze && previewStatus !== "loading" && (
              <div className="mt-8 space-y-6">
                <section className="rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
                  <div className="text-xs uppercase tracking-[0.22em] text-red-300">Business Identity</div>
                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Preview Status</div>
                      <div className="mt-2 text-xl font-black text-emerald-200">Ready</div>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Free preview shows direction only. Paid report unlocks the decision pack.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Investigation</div>
                      <div className="mt-2 text-xl font-black text-white">{activeMode.label}</div>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">{scanMode === "website" ? websiteTarget : activeTarget || displayMarketplace}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Report</div>
                      <div className="mt-2 text-xl font-black text-red-100">Locked</div>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Executive recommendation, source trail and action plan unlock after payment.</p>
                    </div>
                  </div>
                  {freeScanResult?.identityProfile?.identitySummary ? (
                    <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/[0.06] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-sky-200">Identity Summary</div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{freeScanResult.identityProfile.identitySummary}</p>
                    </div>
                  ) : null}
                </section>

                {freeScanResult?.businessNarrative ? (
                  <section className="rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6">
                    <div className="text-xs uppercase tracking-[0.22em] text-red-300">Decision preview</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decision</div>
                        <div className="mt-2 text-3xl font-black text-white">{freeScanResult.businessNarrative.decisionMode?.headline || freeScanResult.businessNarrative.decision}</div>
                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-200">{decisionLightDisplayLabel(freeScanResult.businessNarrative.decisionMode?.decisionLight)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Main uncertainty</div>
                        <div className="mt-2 text-lg font-black text-white">{freeScanResult.businessNarrative.decisionMode?.mainRemainingUncertainty || "Business identity"}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Impact if skipped</div>
                        <div className="mt-2 text-lg font-black text-white">{freeScanResult.businessNarrative.decisionMode?.businessImpactIfSkipped || "Medium"}</div>
                      </div>
                    </div>
                    {freeScanResult.message ? (
                      <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-bold leading-6 text-emerald-100">{freeScanResult.message}</p>
                    ) : null}
                    {freeScanResult.businessNarrative.decisionMode?.userMeaning ? (
                      <p className="mt-4 text-sm leading-6 text-zinc-200"><span className="font-bold text-white">What this means:</span> {freeScanResult.businessNarrative.decisionMode.userMeaning}</p>
                    ) : freeScanResult.decisionPreview?.recommendedAction ? (
                      <p className="mt-4 text-sm leading-6 text-zinc-200"><span className="font-bold text-white">Recommendation:</span> {freeScanResult.decisionPreview.recommendedAction}</p>
                    ) : null}
                    {freeScanResult.businessNarrative.sections.find((section) => section.id === "executiveSummary") ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Evidence Summary</div>
                        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
                          {freeScanResult.businessNarrative.sections.find((section) => section.id === "executiveSummary")?.body.map((item) => <p key={item}>{item}</p>)}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      {freeScanResult.businessNarrative.sections.filter((section) => ["whatWeFound", "whatRequiresVerification", "recommendedNextSteps", "decisionCost", "investigationStory"].includes(section.id)).map((section) => (
                        <div key={section.id} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                          <div className="text-xs uppercase tracking-[0.22em] text-red-200">{section.title}</div>
                          <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">{section.body.map((item) => <p key={item}>{item}</p>)}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-6 text-sm leading-7 text-yellow-100">
                  <div className="text-xs uppercase tracking-[0.22em] text-yellow-200">Why unlock?</div>
                  <p className="mt-4 text-base font-bold text-white">The free preview is a direction check. The paid report is the executive decision product: what to do, why it matters, and what uncertainty costs if ignored.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {["Final recommendation", "Source-backed appendix", "Action plan for next steps"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold text-yellow-50">✓ {item}</div>)}
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <label>
                      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Email for full report</div>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="you@example.com" />
                    </label>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <button type="button" onClick={saveLead} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white hover:border-red-400/30">Save Investigation</button>
                      <PaymentButtons planName="ShadowScore Trust Intelligence Report" price="$9.90" buttonLabel="Unlock Full Report" intakeId={intake?.intakeId} />
                    </div>
                  </div>
                  {leadSaved && <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">Investigation saved. Your full executive report remains locked until payment is confirmed.</div>}
                </section>

                <details className="rounded-[28px] border border-white/10 bg-black/50 p-6" open={false}>
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-red-300">Technical Details</summary>
                  <div className="mt-5 space-y-5">
                    {freeScanResult?.businessNarrative?.sections.find((section) => section.id === "evidenceUsed") ? (
                      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Evidence Used</div>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                          {freeScanResult.businessNarrative.sections.find((section) => section.id === "evidenceUsed")?.body.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </section>
                    ) : null}

                    {freeScanResult?.decisionPreview ? (
                      <section className="rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-red-200">Decision Preview</div>
                        <div className="mt-3 flex flex-wrap items-center gap-3"><div className="text-2xl font-black text-white">Decision: {(freeScanResult.decisionPreview.decision === "FAIL" ? "CONFIRMED RISK" : freeScanResult.decisionPreview.decision)}: {(freeScanResult.decisionPreview.decisionLabel === "Do not proceed" ? "Verified negative indicators detected" : freeScanResult.decisionPreview.decisionLabel === "Verified enough to proceed" ? "Evidence supports proceeding" : freeScanResult.decisionPreview.decisionLabel)}</div><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{freeScanResult.decisionPreview.confidenceLevel} confidence</span></div>
                        <p className="mt-4 text-sm leading-6 text-zinc-300"><span className="font-bold text-zinc-100">What this means:</span> {freeScanResult.decisionPreview.whatThisMeans}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300"><span className="font-bold text-zinc-100">Recommendation:</span> {freeScanResult.decisionPreview.recommendedAction}</p>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3"><div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Verified Signals</div><ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-200">{freeScanResult.decisionPreview.topReasons.slice(0, 4).map((reason) => <li key={reason}>• {reason}</li>)}</ul></div>
                          <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-3"><div className="text-xs uppercase tracking-[0.2em] text-orange-200">Verification Gaps</div>{freeScanResult.decisionPreview.missingSignals.length ? <ul className="mt-2 space-y-2 text-sm leading-6 text-orange-100">{freeScanResult.decisionPreview.missingSignals.map((signal) => <li key={signal}>• {signal}</li>)}</ul> : <p className="mt-2 text-sm text-zinc-300">No major verification gaps detected in the free preview.</p>}</div>
                          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3"><div className="text-xs uppercase tracking-[0.2em] text-red-200">Confirmed Risks</div>{freeScanResult.decisionPreview.blockingIssues.length ? <ul className="mt-2 space-y-2 text-sm leading-6 text-red-100">{freeScanResult.decisionPreview.blockingIssues.map((issue) => <li key={issue}>• {issue}</li>)}</ul> : <p className="mt-2 text-sm text-zinc-300">No confirmed blocking risk was found in the free preview.</p>}</div>
                          <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Unavailable Sources</div><ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-300">{freeScanResult.providers.filter((provider) => providerStatusLabel(provider) !== "Completed").map((provider) => <li key={provider.providerId}>• {provider.providerName}: {providerStatusLabel(provider)}</li>)}</ul></div>
                        </div>
                      </section>
                    ) : null}

                    {freeScanResult?.insights?.length ? (
                      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-emerald-200">Signal Review</div>
                        <div className="mt-3 grid gap-3">{freeScanResult.insights.map((insight) => <div key={insight.category} className="rounded-xl border border-white/10 bg-black/35 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-black text-white">{insight.category}</div><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{insight.riskLevel}</span></div><p className="mt-3 text-sm leading-6 text-zinc-300">{insight.insight}</p><p className="mt-2 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Why it matters:</span> {insight.whyItMatters}</p><p className="mt-2 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Next step:</span> {insight.recommendedNextStep}</p></div>)}</div>
                      </section>
                    ) : null}

                    {freeScanResult?.timeline?.length ? (
                      <InvestigationTimeline items={freeScanResult.timeline.map((item) => ({ ...item, timestamp: freeScanResult.executedAt }))} />
                    ) : null}
                    {freeScanResult ? <AuditMetadata compact createdAt={freeScanResult.executedAt} completedAt={freeScanResult.executedAt} engineVersion={freeScanResult.insightEngineVersion} policyVersion="Trust Policy v1.0" sources={freeScanResult.providers.filter((provider) => provider.status === "completed").map((provider) => provider.providerName)} /> : null}

                    {scanMode === "website" && (freeScanRunning || freeScanResult || freeScanError) && (
                      <section className="rounded-2xl border border-white/10 bg-black/50 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-sky-300">Provider status</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">{(freeScanResult?.providerRegistry || []).map((provider) => { const result = freeScanResult?.providers.find((item) => item.providerId === provider.id); const status = providerStatusLabel(result); return <div key={provider.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="font-black text-white">{providerStatusIcon(status)} {provider.name}</div><div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{provider.category} · v{provider.version} · {status}</div>{result && <div className="mt-3 space-y-2 text-sm text-zinc-300">{result.fields.map((field) => <div key={field.label}><span className="text-zinc-500">{field.label}:</span> {renderValue(field.value)}</div>)}{status !== "Completed" && <div className="text-yellow-100">Status: {status}. {result.error || result.failureReason || "Unavailable"}</div>}</div>}</div>; })}</div>
                        {freeScanResult?.providerRegistry?.length ? <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-zinc-400">Provider coverage: {freeScanResult.providers.filter((provider) => providerStatusLabel(provider) === "Completed").length} of {freeScanResult.providerRegistry.length} registered providers completed. Target checked: {freeScanResult.targetResolution?.resolvedTarget || activeTarget}.</div> : null}
                        {freeScanError && <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{freeScanError}</div>}
                      </section>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
