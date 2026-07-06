import { buildDecision } from "./decisionEngine";
import { buildTrustInsights } from "./insightEngine";
import { buildIdentityProfile } from "./identityEngine";
import { buildTrustTimeline } from "./trustTimeline";
import { ProviderManager, createDefaultProviders } from "./providers";
import type { ProviderExecutionContext } from "./providers/types";
import { analyzeRisk } from "./riskEngine";
import type { PaymentIntent, ShadowScoreIntake, ShadowScoreReport } from "./workspace";

export const REPORT_ENGINE_VERSION = "report-pipeline-v22";

const providerManager = new ProviderManager().registerMany(createDefaultProviders());

export function canGenerateReport(paymentIntent: PaymentIntent) {
  return paymentIntent.paymentStatus === "paid";
}

export async function buildReadyReport(input: {
  intake: ShadowScoreIntake;
  paymentIntent: PaymentIntent;
  reportId?: string;
  createdAt?: string;
}): Promise<ShadowScoreReport> {
  const { intake, paymentIntent } = input;

  if (!canGenerateReport(paymentIntent)) {
    throw new Error("Report generation requires paymentStatus == paid.");
  }

  const providerContext: ProviderExecutionContext = {
    intakeId: intake.intakeId,
    scanMode: intake.scanMode,
    target: intake.target,
    platform: intake.platform,
    caseType: intake.caseType,
    email: intake.email,
    fileNames: intake.fileNames,
    visibleSignalCategories: intake.visibleSignalCategories,
    paymentIntentId: paymentIntent.id,
  };
  const providerResults = await providerManager.runProviders(providerContext);
  const engineInput = {
    marketplace: intake.platform,
    caseType: intake.caseType,
    store: intake.target,
    email: intake.email,
    fileNames: intake.fileNames,
    evidencePresent: intake.visibleSignalCategories.length,
    evidenceRequired: intake.scanMode === "website" ? 0 : 4,
    providerResults,
  };
  const riskEnginePreview = analyzeRisk(engineInput);
  const insightOutput = buildTrustInsights({ providerResults, riskOutput: riskEnginePreview, audience: "paid" });
  const identityProfile = buildIdentityProfile({ providerResults, insights: insightOutput.insights });
  const trustTimeline = buildTrustTimeline({
    providerResults,
    insights: insightOutput.insights,
    insightEngineVersion: insightOutput.engineVersion,
    audience: "paid",
  });
  const decision = buildDecision({
    providerResults,
    riskOutput: riskEnginePreview,
    insights: insightOutput.insights,
    timeline: trustTimeline,
    audience: "paid",
  });
  const now = new Date().toISOString();

  return {
    reportId: input.reportId || `rpt-${Date.now().toString(36)}`,
    intakeId: intake.intakeId,
    paymentIntentId: paymentIntent.id,
    userId: intake.userId,
    title: `${intake.scanMode === "website" ? "Website" : "Trust"} Intelligence Report`,
    entity: intake.target,
    platform: intake.platform,
    scanMode: intake.scanMode,
    target: intake.target,
    createdAt: input.createdAt || paymentIntent.createdAt,
    readyAt: now,
    paymentStatus: paymentIntent.paymentStatus,
    reportStatus: "ready",
    source: "payment_unlock_pipeline",
    engineVersion: REPORT_ENGINE_VERSION,
    providerVersions: Object.fromEntries(providerResults.map((result) => [result.providerId, result.providerVersion])),
    providerResults,
    evidenceSummary: {
      fileCount: intake.fileNames.length,
      categories: intake.visibleSignalCategories,
      missingEvidence: riskEnginePreview.missingEvidence,
    },
    reportSummary: {
      message: "Report generated from paid intake, provider evidence and Insight Engine business-trust analysis.",
      primaryRiskDomain: riskEnginePreview.primaryRiskDomain,
      findingCount: riskEnginePreview.findings.length,
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      decision,
      identityProfile,
    },
    riskScore: undefined,
    confidenceScore: undefined,
    stage: riskEnginePreview.stage,
    topFactors: [],
  };
}
