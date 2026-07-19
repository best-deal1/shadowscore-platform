import { NextResponse } from "next/server";

import { buildTrustInsights } from "../../../../lib/insightEngine";
import { buildIdentityProfile } from "../../../../lib/identityEngine";
import { buildBusinessProfile } from "../../../../lib/businessProfileEngine";
import { buildBusinessIdentityIntelligence } from "../../../../lib/businessIdentityIntelligence";
import { buildBusinessIntelligence } from "../../../../lib/businessIntelligence";
import { investigateWebsite } from "../../../../lib/websiteIntelligence";
import { buildBusinessIdentityKnowledgeScan, BusinessKnowledgeGraph } from "../../../../lib/knowledgeGraph";
import { buildBusinessNarrative } from "../../../../lib/narrative";
import { buildTrustTimeline } from "../../../../lib/trustTimeline";
import { buildDecision } from "../../../../lib/decisionEngine";
import { analyzeRisk } from "../../../../lib/riskEngine";
import { resolveBusinessIdentity } from "../../../../lib/businessIdentityResolver";
import { applyCanonicalIdentityToBusinessProfile, applyCanonicalIdentityToIdentityProfile } from "../../../../lib/canonicalReportIdentity";
import { ProviderManager, createDefaultProviders } from "../../../../lib/providers";
import type { ProviderExecutionContext, ProviderResult } from "../../../../lib/providers/types";

const productionProviderManager = new ProviderManager().registerMany(createDefaultProviders());

type FreeScanRequest = {
  scanMode?: string;
  target?: string;
  platform?: string;
  caseType?: string;
  email?: string;
  fileNames?: string[];
  visibleSignalCategories?: string[];
};

function valueFromEvidence(result: ProviderResult, label: string) {
  return result.evidence.find((item) => item.label.toLowerCase() === label.toLowerCase())?.value;
}

function valueOrUnavailable(value: unknown, fallback = "Unavailable") {
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value === "string") return value.trim() ? value : fallback;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  return fallback;
}

function recordsFromMetadata(result: ProviderResult, recordType: string) {
  const records = result.metadata.records;
  if (!records || typeof records !== "object" || Array.isArray(records)) return [];
  const value = (records as Record<string, unknown>)[recordType];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function summarizeDns(result: ProviderResult) {
  return {
    providerId: result.providerId,
    providerName: "DNS Intelligence",
    status: result.status,
    duration: result.duration,
    error: result.errors[0],
    fields: [
      { label: "Domain resolved", value: result.status === "completed" ? valueOrUnavailable(valueFromEvidence(result, "Normalized domain"), "Not detected") : "Unavailable" },
      { label: "A Records", value: valueOrUnavailable(recordsFromMetadata(result, "A"), "Not detected") },
      { label: "MX Records", value: valueOrUnavailable(recordsFromMetadata(result, "MX"), "Not detected") },
      { label: "Name Servers", value: valueOrUnavailable(recordsFromMetadata(result, "NS"), "Not detected") },
      { label: "TXT Records", value: valueOrUnavailable(recordsFromMetadata(result, "TXT"), "Not detected") },
    ],
  };
}

function summarizeGenericProvider(result: ProviderResult) {
  return {
    providerId: result.providerId,
    providerName: typeof result.metadata.providerName === "string" ? result.metadata.providerName : result.providerId,
    providerVersion: result.providerVersion,
    category: typeof result.metadata.category === "string" ? result.metadata.category : "unknown",
    status: result.status,
    duration: result.duration,
    error: result.errors[0],
    failureReason: typeof result.metadata.failureReason === "string" ? result.metadata.failureReason : undefined,
    lookupPerformed: result.metadata.lookupPerformed === true,
    evidenceCount: result.evidence.length,
    findingCount: result.findings.length,
    fields: result.evidence.slice(0, 5).map((item) => ({ label: item.label, value: valueOrUnavailable(item.value, "Unavailable") })),
  };
}

function formatDomainAge(ageDays: unknown) {
  if (typeof ageDays !== "number" || !Number.isFinite(ageDays)) return "Unavailable";
  const years = Math.floor(ageDays / 365);
  return years > 0 ? `${ageDays} days (${years}+ years)` : `${ageDays} days`;
}

function summarizeWhois(result: ProviderResult) {
  return {
    providerId: result.providerId,
    providerName: "WHOIS Intelligence",
    status: result.status,
    duration: result.duration,
    error: result.errors[0],
    fields: [
      { label: "Registrar", value: valueOrUnavailable(result.metadata.rdapHandle, "Unavailable") },
      { label: "Domain Age", value: formatDomainAge(result.metadata.ageDays) },
      { label: "Creation Date", value: valueOrUnavailable(result.metadata.registrationDate, "Unavailable") },
      { label: "Expiration Date", value: valueOrUnavailable(result.metadata.expirationDate, "Unavailable") },
      { label: "Registration Status", value: valueOrUnavailable(result.metadata.statuses, "Unavailable") },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FreeScanRequest;
    const target = body.target?.trim();

    if (!target) {
      return NextResponse.json({ error: "A website or business target is required." }, { status: 400 });
    }

    const context: ProviderExecutionContext = {
      intakeId: `free-scan-${Date.now().toString(36)}`,
      scanMode: body.scanMode || "website",
      target,
      platform: body.platform || "Website / Business",
      caseType: body.caseType,
      email: body.email,
      fileNames: body.fileNames || [],
      visibleSignalCategories: body.visibleSignalCategories || [],
      executionProfile: "free_preview",
      providerTimeoutMs: { http: 2_500, ssl: 2_000, whois: 2_500, dns: 1_000 },
    };

    const previewStartedAt = Date.now();
    const previewRun = await productionProviderManager.runFreePreview(context, { budgetMs: 8_000, concurrencyLimit: 4 });
    const providerResults = previewRun.providerResults;
    const completedProviderResults = providerResults.filter((result) => result.status === "completed" || result.evidence.length > 0);

    const riskOutput = analyzeRisk({
      marketplace: context.platform,
      caseType: context.caseType,
      store: context.target,
      email: context.email,
      fileNames: context.fileNames,
      providerResults: completedProviderResults,
    });
    const insightOutput = buildTrustInsights({ providerResults: completedProviderResults, riskOutput, audience: "free" });
    const generatedAt = new Date().toISOString();
    const baseIdentityProfile = buildIdentityProfile({ providerResults: completedProviderResults, insights: insightOutput.insights, target: context.target, email: context.email, generatedAt });
    const businessProfile = buildBusinessProfile({ providerResults: completedProviderResults, target: context.target, generatedAt });
    const businessIdentityResolution = resolveBusinessIdentity(context.target, { providerResults: completedProviderResults, businessProfile, observedAt: generatedAt, generatedAt });
    const canonicalIdentity = businessIdentityResolution.canonicalIdentity;
    const canonicalBusinessProfile = applyCanonicalIdentityToBusinessProfile(businessProfile, canonicalIdentity);
    const identityProfile = applyCanonicalIdentityToIdentityProfile(baseIdentityProfile, canonicalIdentity);
    const businessTrustIntelligence = buildBusinessIdentityIntelligence({ providerResults: completedProviderResults, target: context.target, claimedBusinessName: canonicalBusinessProfile.businessName, canonicalIdentity, generatedAt });
    const businessIntelligence = buildBusinessIntelligence(completedProviderResults, generatedAt);
    const websiteIntelligence = context.scanMode === "website" ? await investigateWebsite({ target: context.target, timeoutMs: 2_500, retries: 0 }) : undefined;
    const knowledgeGraph = new BusinessKnowledgeGraph();
    knowledgeGraph.applyScan(buildBusinessIdentityKnowledgeScan({
      scanId: `free-scan-${context.intakeId}`,
      target: context.target,
      businessProfile: canonicalBusinessProfile,
      identityIntelligence: businessTrustIntelligence,
      email: context.email,
    }));
    const timeline = buildTrustTimeline({
      providerResults: completedProviderResults,
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      audience: "free",
    });
    const decisionPreview = buildDecision({
      providerResults: completedProviderResults,
      riskOutput,
      insights: insightOutput.insights,
      timeline,
      audience: "free",
      targetType: context.scanMode === "marketplace" ? "marketplaceSeller" : "website",
    });

    const responseSerializationStartedAt = Date.now();
    const businessNarrative = buildBusinessNarrative({
      decision: decisionPreview,
      evidence: canonicalBusinessProfile.evidenceItems,
      businessProfile: canonicalBusinessProfile,
      knowledgeGraph: knowledgeGraph.snapshot(),
      generatedAt,
    });


    return NextResponse.json({
      status: "ready",
      message: "Preview ready. Additional sources are checked in the full report.",
      reportReadyEvent: { type: "free-preview-ready", status: "ready", ready: true, emittedAt: generatedAt },
      executedAt: generatedAt,
      providerRegistry: productionProviderManager.listProviders(),
      executionBudget: { budgetMs: previewRun.telemetry.budgetMs, elapsedMs: previewRun.telemetry.elapsedMs, hardMaximumMs: 12_000 },
      telemetry: {
        ...previewRun.telemetry,
        phases: {
          dns: previewRun.telemetry.providerTimings.filter((item) => item.providerId === "dns").reduce((total, item) => total + item.duration, 0),
          whoisRdap: previewRun.telemetry.providerTimings.filter((item) => item.providerId === "whois").reduce((total, item) => total + item.duration, 0),
          ssl: previewRun.telemetry.providerTimings.filter((item) => item.providerId === "ssl").reduce((total, item) => total + item.duration, 0),
          httpAcquisition: Math.max(...completedProviderResults.flatMap((result) => Array.isArray(result.metadata.httpAttempts) ? result.metadata.httpAttempts.map((attempt) => typeof attempt === "object" && attempt && "durationMs" in attempt && typeof attempt.durationMs === "number" ? attempt.durationMs : 0) : [0]), 0),
          businessProfileExtraction: previewRun.telemetry.providerTimings.filter((item) => ["business-profile", "website-metadata", "contact-discovery", "social-profile"].includes(item.providerId)).reduce((total, item) => total + item.duration, 0),
          identityResolution: Math.max(0, responseSerializationStartedAt - new Date(generatedAt).getTime()),
          decisionGeneration: Math.max(0, Date.now() - responseSerializationStartedAt),
          responseSerialization: Math.max(0, Date.now() - responseSerializationStartedAt),
        },
        requestDurationMs: Date.now() - previewStartedAt,
      },
      providers: providerResults.map((result) => {
        if (result.providerId === "dns") return { ...summarizeGenericProvider(result), ...summarizeDns(result) };
        if (result.providerId === "whois") return { ...summarizeGenericProvider(result), ...summarizeWhois(result) };
        return summarizeGenericProvider(result);
      }),
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      timeline,
      decisionPreview,
      identityProfile,
      businessNarrative,
      businessIdentityResolution,
      businessTrustIntelligence,
      businessIntelligence,
      websiteIntelligence,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run free provider scan." }, { status: 500 });
  }
}
