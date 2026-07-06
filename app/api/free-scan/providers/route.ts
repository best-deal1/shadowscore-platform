import { NextResponse } from "next/server";

import { buildTrustInsights } from "../../../../lib/insightEngine";
import { buildIdentityProfile } from "../../../../lib/identityEngine";
import { buildTrustTimeline } from "../../../../lib/trustTimeline";
import { buildDecision } from "../../../../lib/decisionEngine";
import { analyzeRisk } from "../../../../lib/riskEngine";
import { DNSProvider } from "../../../../lib/providers/DNSProvider";
import { WHOISProvider } from "../../../../lib/providers/WHOISProvider";
import { ProviderManager } from "../../../../lib/providers/ProviderManager";
import type { ProviderExecutionContext, ProviderResult } from "../../../../lib/providers/types";

const productionProviderManager = new ProviderManager().registerMany([
  new DNSProvider(),
  new WHOISProvider(),
]);

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
    };

    const providerResults = await productionProviderManager.runProviders(context);

    const riskOutput = analyzeRisk({
      marketplace: context.platform,
      caseType: context.caseType,
      store: context.target,
      email: context.email,
      fileNames: context.fileNames,
      providerResults,
    });
    const insightOutput = buildTrustInsights({ providerResults, riskOutput, audience: "free" });
    const identityProfile = buildIdentityProfile({ providerResults, insights: insightOutput.insights });
    const timeline = buildTrustTimeline({
      providerResults,
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      audience: "free",
    });
    const decisionPreview = buildDecision({
      providerResults,
      riskOutput,
      insights: insightOutput.insights,
      timeline,
      audience: "free",
    });

    const dnsResult = providerResults.find((result) => result.providerId === "dns");
    const whoisResult = providerResults.find((result) => result.providerId === "whois");

    return NextResponse.json({
      executedAt: new Date().toISOString(),
      providers: [
        ...(dnsResult ? [summarizeDns(dnsResult)] : []),
        ...(whoisResult ? [summarizeWhois(whoisResult)] : []),
      ],
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      timeline,
      decisionPreview,
      identityProfile,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run free provider scan." }, { status: 500 });
  }
}
