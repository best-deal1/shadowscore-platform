/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CANONICAL_LOGO_PATH } from "@/lib/brand";
import { useRouter } from "next/navigation";
import PaymentButtons from "../../components/PaymentButtons";
import { getCurrentSession } from "../../lib/auth";
import { isPreviewReadyResponse, nextPreviewStatus, readPreviewJson } from "../../lib/freeScanPreviewFlow";
import JourneyProgress from "../../components/investigation/JourneyProgress";
import { createIntake, ShadowScoreIntake } from "../../lib/workspace";
import { useLocale } from "../../components/LocaleProvider";
import { BETA_PRODUCT } from "../../lib/pricing";
import QuickCheckResult from "../../components/quick-check/QuickCheckResult";
import type { QuickCheckReport } from "../../lib/quickCheck/report";

type Severity = "Low" | "Medium" | "High" | "Critical";
type Finding = {
  title: string;
  severity: Severity;
  points: number;
  detail: string;
  recommendation: string;
};
type Requirement = { label: string; hints: string[] };
type ScanMode = "website" | "marketplace" | "evidence" | "personal";

type FileIssue = { file: string; issue: string; severity: "Block" | "Warning" };
type FreeScanResult = { status?: "ready"; message?: string; reportReadyEvent?: { type: "free-preview-ready"; status: "ready"; ready: true; emittedAt: string }; executedAt: string; targetResolution?: { requestedTarget: string; resolvedTarget: string; legalName?: string }; quickCheck?: QuickCheckReport; previewSummary?: { confidence: QuickCheckReport["confidence"]; providersQueried: number; sourcesSuccessfullyQueried: string[]; evidenceCollected: number; findingsDiscovered: number } };

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
  const personalIdentityEnabled = process.env.NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED === "true";
  const scanModes: Array<{ id: ScanMode; label: string; eyebrow: string; description: string }> = [
    { id: "website", label: t.intakeUi.websiteBusiness, eyebrow: t.intakeUi.noUploadRequired, description: t.intakeUi.websiteModeDescription },
    { id: "marketplace", label: t.intakeUi.marketplaceSeller, eyebrow: t.intakeUi.optionalEvidence, description: t.intakeUi.marketplaceModeDescription },
    { id: "personal", label: "Personal identity", eyebrow: "Multiple signals", description: "Investigate a person using an email, phone number, name, username, or a combination." },
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
  const [identityEmail, setIdentityEmail] = useState("");
  const [identityPhone, setIdentityPhone] = useState("");
  const [identityName, setIdentityName] = useState("");
  const [identityUsername, setIdentityUsername] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceAuthorized, setReferenceAuthorized] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [intake, setIntake] = useState<ShadowScoreIntake | null>(null);
  const [freeScanResult, setFreeScanResult] = useState<FreeScanResult | null>(null);
  const [freeScanRunning, setFreeScanRunning] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [freeScanError, setFreeScanError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [checkoutStage, setCheckoutStage] = useState(false);

  useEffect(() => {
    const session = getCurrentSession();
    if (session?.email) setEmail((current) => current || session.email);
  }, []);

  useEffect(() => {
    document.title = scanMode === "personal" ? "Personal Identity Investigation | ShadowScore" : "Start an Investigation | ShadowScore";
  }, [scanMode]);

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
        window.location.assign("/workspace");
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
  const identityTarget = identityEmail.trim() || identityPhone.trim() || identityUsername.trim() || identityName.trim();
  const activeTarget = scanMode === "website" ? websiteTarget : scanMode === "personal" ? identityTarget : store;
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
    if (scanMode === "personal" && !identityTarget) errors.push("Add at least one identity signal.");
    if (scanMode === "personal" && referenceImage && !referenceAuthorized) errors.push("Confirm that you are authorized to use the reference image.");
    return errors;
  }, [
    scanMode,
    identityTarget,
    referenceImage,
    referenceAuthorized,
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

  const intakeRecord = (resolvedEmail = email) => ({
      scanMode,
      platform: scanMode === "website" ? "Website / Business" : scanMode === "personal" ? "Personal identity" : displayMarketplace,
      caseType: scanMode === "website" ? "Business trust scan" : scanMode === "personal" ? "Identity resolution" : caseType,
      target: activeTarget,
      email: resolvedEmail,
      identitySignals: scanMode === "personal" ? { emails: identityEmail.trim() ? [identityEmail] : [], phones: identityPhone.trim() ? [identityPhone] : [], names: identityName.trim() ? [identityName] : [], usernames: identityUsername.trim() ? [identityUsername] : [], referenceImages: [] } : undefined,
      fileNames: files.map((file) => file.name),
      visibleSignalCategories: scanMode === "website" ? WEBSITE_SIGNAL_CATEGORIES : scanMode === "personal" ? ["Identity discovery", "Independent-source corroboration", "Contradictory contact evidence"] : (detectedSignals.length ? detectedSignals.map((item) => item.title) : ["Marketplace identity", t.intakeUi.evidenceReadiness, "Payment or policy categories"]),
    });

  const resetFreeScan = () => {
    setFreeScanResult(null);
    setPreviewStatus("idle");
    setFreeScanError("");
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


  const saveLead = async (resolvedEmail = email) => {
    setSaveError("");
    const session = getCurrentSession();
    const cleanEmail = resolvedEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Enter a valid customer email to save this investigation.");
    }
    setEmail(cleanEmail);
    const record = intakeRecord(cleanEmail);
    const lead = {
      createdAt: new Date().toISOString(),
      scanMode,
      marketplace:
        scanMode === "website" ? "Website / Business" : displayMarketplace,
      caseType: scanMode === "website" ? "Business trust scan" : caseType,
      store: activeTarget,
      email: cleanEmail,
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
      return "";
    }
    const created = await createIntake(session, record);
    if (scanMode === "personal" && referenceImage) {
      const upload = new FormData();
      upload.set("file", referenceImage);
      upload.set("intakeId", created.intakeId);
      upload.set("authorized", String(referenceAuthorized));
      const response = await fetch("/api/identity-evidence", { method: "POST", body: upload });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "The reference image could not be stored.");
    }
    setIntake(created);
    setLeadSaved(true);
    return created.intakeId;
  };

  const saveForLater = async () => {
    try {
      await saveLead();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "The investigation could not be saved.");
    }
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
            <Image
              src={CANONICAL_LOGO_PATH}
              alt="ShadowScore"
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 object-contain"
            />
            {t.intakeUi.back}
          </Link>
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
            {t.intakeUi.preview}
          </div>
        </div>
      </header>

      <JourneyProgress current={1} />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-red-300">{scanMode === "personal" ? "Identity investigation" : t.intakeUi.investigationEyebrow}</div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">{scanMode === "personal" ? "Investigate a Personal Identity" : t.intakeUi.investigationTitle}</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">{scanMode === "personal" ? "Submit known identity signals. The report separates public discovery leads from resolver-backed identity evidence." : t.intakeUi.investigationPrice}</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="font-bold">{scanMode === "personal" ? "What the identity check covers" : t.intakeUi.investigationTime}</p><ol className="mt-4 space-y-3 text-sm text-zinc-300">{scanMode === "personal" ? <><li>1. Review submitted identity signals</li><li>2. Discover eligible public profile candidates</li><li>3. Compare matches, conflicts, and source provenance</li></> : <><li>1. {t.intakeUi.investigationStepIdentify}</li><li>2. {t.intakeUi.investigationStepReview}</li><li>3. {t.intakeUi.investigationStepReport}</li></>}</ol><p className="mt-4 text-sm text-zinc-400">{scanMode === "personal" ? "Purchase includes one private Personal Identity Investigation report after payment." : t.intakeUi.investigationStartTerms}</p></div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white">{t.intakeUi.investigationTypeTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t.intakeUi.investigationTypeDescription}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">{t.intakeUi.investigationTypeReportDescription}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {scanModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    if (mode.id === "personal" && !personalIdentityEnabled) return;
                    setScanMode(mode.id);
                    setSubmitted(false);
                    setLeadSaved(false);
                    resetFreeScan();
                  }}
                  disabled={mode.id === "personal" && !personalIdentityEnabled}
                  aria-describedby={mode.id === "personal" && !personalIdentityEnabled ? "personal-identity-readiness" : undefined}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${scanMode === mode.id ? "border-red-400/50 bg-red-500/15" : "border-white/10 bg-white/[0.03] hover:border-red-400/25"}`}
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
            {!personalIdentityEnabled && <p id="personal-identity-readiness" className="mt-3 text-xs text-zinc-500">Personal identity investigations will be available after secure evidence storage is activated.</p>}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-red-300">
                {t.intakeUi.selectedInvestigationType}
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
                    {t.intake.field} (required)
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

            {scanMode === "personal" && (
              <fieldset className="mt-6 rounded-2xl border border-white/10 p-5">
                <legend className="px-2 text-sm font-bold text-white">Identity signals</legend>
                <p className="mb-5 text-sm leading-6 text-zinc-400">Add one or more signals for the person you want to investigate. Your account email remains separate and is used for billing and report delivery.</p>
                <div className="grid gap-5 md:grid-cols-2">
                  <label><span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Person&apos;s email</span><input type="email" value={identityEmail} onChange={(event) => setIdentityEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4" autoComplete="off" /></label>
                  <label><span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Person&apos;s phone</span><input type="tel" value={identityPhone} onChange={(event) => setIdentityPhone(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4" autoComplete="off" /></label>
                  <label><span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Full name</span><input value={identityName} onChange={(event) => setIdentityName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4" autoComplete="off" /></label>
                  <label><span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Username</span><input value={identityUsername} onChange={(event) => setIdentityUsername(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4" placeholder="username" autoComplete="off" /></label>
                </div>
                <label className="mt-5 block rounded-2xl border border-dashed border-white/15 p-4"><span className="block text-sm font-bold">Authorized reference image, optional</span><span className="mt-1 block text-xs text-zinc-500">JPG, PNG, or WebP. Maximum 10MB.</span><input className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReferenceImage(event.target.files?.[0] || null)} /></label>
                {referenceImage && <label className="mt-4 flex items-start gap-3 text-sm text-zinc-300"><input className="mt-1" type="checkbox" checked={referenceAuthorized} onChange={(event) => setReferenceAuthorized(event.target.checked)} /><span>I am authorized to use this image for this investigation.</span></label>}
              </fieldset>
            )}

            {scanMode !== "website" && scanMode !== "personal" && (
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

                <label aria-label="Optional customer Evidence" className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-14 text-center hover:border-red-500/40">
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

            {scanMode !== "website" && scanMode !== "personal" && (
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

            {previewStatus === "failed" && freeScanError && (
              <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm text-red-100">
                {freeScanError}
              </div>
            )}

            {submitted && canAnalyze && previewStatus === "ready" && (
              <div className="mt-8 space-y-6">
                {(() => {
                  const submittedTarget = freeScanResult?.targetResolution?.requestedTarget || activeTarget;
                  return <>
                    <QuickCheckResult target={submittedTarget} report={freeScanResult?.quickCheck} />

                    {!checkoutStage ? (
                      <button type="button" onClick={() => setCheckoutStage(true)} className="block w-full rounded-2xl bg-emerald-500 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.12em] text-black hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
                        Run Full Investigation · {BETA_PRODUCT.price}
                      </button>
                    ) : (
                    <section className="rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-6 text-sm leading-7 text-yellow-100" aria-labelledby="paid-intake-title">
                        <div className="text-xs uppercase tracking-[0.22em] text-yellow-200">{scanMode === "personal" ? "Personal identity investigation" : "Business Investigation intake"}</div>
                      <h3 id="paid-intake-title" className="mt-3 text-lg font-bold text-white">Confirm the {scanMode === "personal" ? "person signals" : "business"}, scope, customer account, and purchase.</h3>
                      <p className="mt-2 text-sm text-yellow-100">Your Free Quick Check remains attached to this intake. Payment starts the full investigation. Your Executive Report becomes available after processing completes.</p>
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                        <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-zinc-500">{scanMode === "personal" ? "Identity subject" : "Business"}</dt><dd className="font-bold text-white">{submittedTarget}</dd></div><div><dt className="text-zinc-500">Investigation scope</dt><dd className="font-bold text-white">{activeMode.label}</dd></div><div><dt className="text-zinc-500">Existing result</dt><dd className="font-bold text-white">Free Quick Check</dd></div><div><dt className="text-zinc-500">Purchase</dt><dd className="font-bold text-white">Full {scanMode === "personal" ? "Personal Identity" : "Business"} Investigation · {BETA_PRODUCT.price}</dd></div></dl>
                        <label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Customer email (required)</div><input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setSaveError(""); }} aria-describedby={saveError ? "checkout-email-error" : undefined} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="you@example.com" /></label>
                        {saveError && <p id="checkout-email-error" className="mt-3 text-sm text-red-200" role="alert">{saveError}</p>}
                        <ul className="mt-4 space-y-2 text-sm font-bold leading-6 text-white" aria-label="Purchase confidence"><li>✓ One paid investigation</li><li>✓ One-time payment of {BETA_PRODUCT.price}</li><li>✓ No subscription</li><li>✓ Processing begins after payment</li><li>✓ Executive Report available after completion</li></ul>
                        <div className="mt-5"><PaymentButtons planName={BETA_PRODUCT.name} price={BETA_PRODUCT.price} buttonLabel={`Continue to payment · ${BETA_PRODUCT.price}`} intakeId={intake?.intakeId} email={email} onEmailResolved={setEmail} onPersistIntake={saveLead} /></div>
                        <button type="button" onClick={saveForLater} className="mx-auto mt-4 block text-xs font-bold text-zinc-400 underline underline-offset-4 hover:text-white">Save intake for later</button>
                      </div>
                      {leadSaved && <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">Intake saved. Continue to payment when you are ready.</div>}
                    </section>
                    )}
                  </>;
                })()}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
