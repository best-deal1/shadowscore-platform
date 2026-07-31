import { NextResponse } from "next/server";

import { buildTrustInsights } from "../../../../lib/insightEngine";
import { buildBusinessProfile } from "../../../../lib/businessProfileEngine";
import { buildTrustTimeline } from "../../../../lib/trustTimeline";
import { buildDecision } from "../../../../lib/decisionEngine";
import { analyzeRisk } from "../../../../lib/riskEngine";
import { resolveBusinessIdentity } from "../../../../lib/businessIdentityResolver";
import { ProviderManager, createDefaultProviders } from "../../../../lib/providers";
import type { ProviderExecutionContext } from "../../../../lib/providers/types";

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
      requestedTarget: target,
      platform: body.platform || "Website / Business",
      caseType: body.caseType,
      email: body.email,
      fileNames: body.fileNames || [],
      visibleSignalCategories: body.visibleSignalCategories || [],
      executionProfile: "free_preview",
      providerTimeoutMs: { http: 2_500, ssl: 2_000, whois: 2_500, dns: 1_000 },
    };

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
    const businessProfile = buildBusinessProfile({ providerResults: completedProviderResults, target: context.target, generatedAt });
    const canonicalIdentity = resolveBusinessIdentity(context.target, { providerResults: completedProviderResults, businessProfile, observedAt: generatedAt, generatedAt }).canonicalIdentity;
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

    return NextResponse.json({
      status: "ready",
      message: "Preview ready. Additional sources are checked in the full report.",
      reportReadyEvent: { type: "free-preview-ready", status: "ready", ready: true, emittedAt: generatedAt },
      executedAt: generatedAt,
      targetResolution: {
        requestedTarget: target,
        resolvedTarget: context.target,
        legalName: canonicalIdentity.legalName,
      },
      previewSummary: {
        confidence: decisionPreview.confidenceScore,
        providersQueried: providerResults.length,
        evidenceCollected: providerResults.reduce((total, result) => total + result.evidence.length, 0),
        findingsDiscovered: providerResults.reduce((total, result) => total + result.findings.length, 0),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run free provider scan." }, { status: 500 });
  }
}
