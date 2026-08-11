import { NextResponse } from "next/server";

import { ProviderManager, createDefaultProviders } from "../../../../lib/providers";
import type { ProviderExecutionContext } from "../../../../lib/providers/types";
import { buildQuickCheckReport } from "../../../../lib/quickCheck/report";

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

    const previewRun = await productionProviderManager.runFreePreview(context, { budgetMs: 12_000, concurrencyLimit: 5 });
    const providerResults = previewRun.providerResults;
    const generatedAt = new Date().toISOString();
    const quickCheck = buildQuickCheckReport(providerResults);

    console.info("quick_check.completed", {
      target,
      decision: quickCheck.decision,
      score: quickCheck.score,
      evidenceCoverage: quickCheck.evidenceCoverage,
      elapsedMs: previewRun.telemetry.elapsedMs,
      completedProviders: providerResults.filter((result) => result.status === "completed").length,
      deferredProviders: previewRun.telemetry.deferredProviders.length,
    });

    return NextResponse.json({
      status: "ready",
      message: "Quick Check ready. Review the evidence and gaps before paying.",
      reportReadyEvent: { type: "free-preview-ready", status: "ready", ready: true, emittedAt: generatedAt },
      executedAt: generatedAt,
      targetResolution: {
        requestedTarget: target,
        resolvedTarget: context.target,
      },
      quickCheck,
      providers: providerResults.map((result) => ({
        providerId: result.providerId,
        providerName: result.metadata.providerName,
        status: result.status,
        durationMs: result.duration,
        evidence: result.status === "completed" ? result.evidence : [],
        findings: result.findings,
        error: result.errors[0],
      })),
      previewSummary: {
        score: quickCheck.score,
        decision: quickCheck.decision,
        confidence: quickCheck.confidence,
        evidenceCoverage: quickCheck.evidenceCoverage,
        providersQueried: providerResults.length,
        sourcesSuccessfullyQueried: quickCheck.sourcesSuccessfullyQueried,
        evidenceCollected: providerResults.filter((result) => result.status === "completed").reduce((total, result) => total + result.evidence.length, 0),
        findingsDiscovered: providerResults.reduce((total, result) => total + result.findings.length, 0),
        evidenceGaps: quickCheck.evidenceGaps,
        runtimeMs: previewRun.telemetry.elapsedMs,
      },
    });
  } catch (error) {
    console.error("quick_check.failed", { error: error instanceof Error ? error.message : "Unknown Quick Check error" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run free provider scan." }, { status: 500 });
  }
}
