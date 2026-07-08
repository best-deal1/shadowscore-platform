import { buildDecision, evaluateDecisionEvidence } from "./decisionEngine";
import { rememberBusinessScan } from "./businessMemory";
import { classifyTarget } from "./targetClassifier";
import { planFromClassification } from "./orchestrator";
import { buildTrustInsights } from "./insightEngine";
import { buildIdentityProfile } from "./identityEngine";
import { buildBusinessProfile } from "./businessProfileEngine";
import { BusinessKnowledgeGraph } from "./knowledgeGraph";
import { buildBusinessNarrative } from "./narrative";
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
  const startedAt = Date.now();
  const executionFlow: string[] = [];
  const classification = classifyTarget(intake.target);
  executionFlow.push(`✓ Target classified as ${classification.targetType}`);
  const executionPlan = planFromClassification(classification);
  executionFlow.push("✓ Execution plan created");
  const { providerResults, executionRecords } = await providerManager.runExecutionPlan(providerContext, executionPlan.executionPlan, executionPlan.skippedEngines);
  executionRecords
    .filter((record) => ["executed", "skipped", "failed"].includes(record.status))
    .forEach((record) => {
      const symbol = record.status === "failed" ? "✕" : "✓";
      const verb = record.status === "executed" ? "completed" : record.status;
      executionFlow.push(`${symbol} ${record.label} ${verb}`);
    });
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
  const now = new Date().toISOString();
  const insightOutput = buildTrustInsights({ providerResults, riskOutput: riskEnginePreview, audience: "paid" });
  const identityProfile = buildIdentityProfile({ providerResults, insights: insightOutput.insights, target: intake.target, email: intake.email, generatedAt: now });
  const businessProfile = buildBusinessProfile({ providerResults, target: intake.target, generatedAt: now });
  const knowledgeGraph = new BusinessKnowledgeGraph();
  knowledgeGraph.applyScan({
    scanId: `report-${intake.intakeId}`,
    entities: [
      { type: "Business", value: businessProfile.businessName === "Insufficient Public Evidence" ? intake.target : businessProfile.businessName },
      { type: "Domain", value: businessProfile.primaryDomain || intake.target },
      ...(intake.email ? [{ type: "Email" as const, value: intake.email }] : []),
    ],
    relationships: [
      {
        type: "OWNS",
        from: { type: "Business", value: businessProfile.businessName === "Insufficient Public Evidence" ? intake.target : businessProfile.businessName },
        to: { type: "Domain", value: businessProfile.primaryDomain || intake.target },
        context: "Business profile domain relationship",
      },
    ],
  });
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
  const decisionIntelligence = evaluateDecisionEvidence({
    businessProfile,
    executionPlan,
    evidenceItems: businessProfile.evidenceItems,
    contradictionSignals: businessProfile.contradictionSignals,
  });
  executionFlow.push("✓ Decision generated");
  const businessMemory = rememberBusinessScan({
    scanId: `report-${intake.intakeId}`,
    identity: {
      name: businessProfile.businessName === "Insufficient Public Evidence" ? intake.target : businessProfile.businessName,
      domain: businessProfile.primaryDomain || intake.target,
      emails: intake.email ? [intake.email] : [],
    },
    entities: knowledgeGraph.snapshot().entities.map((entity) => ({ type: entity.type, value: entity.label, label: entity.label })),
    relationships: knowledgeGraph.snapshot().relationships.map((relationship) => ({ type: relationship.type, from: relationship.from, to: relationship.to, context: relationship.context })),
    evidence: businessProfile.evidenceItems.map((item) => ({ id: item.id, type: item.type, label: item.label, value: item.value, source: item.source, observedAt: item.observedAt })),
    decision: { decision: decisionIntelligence.decision, confidence: decisionIntelligence.confidenceLevel, recommendation: decisionIntelligence.recommendation },
    timestamp: now,
  });
  executionFlow.push("✓ Knowledge graph updated");
  executionFlow.push("✓ Business memory updated");
  const businessNarrative = buildBusinessNarrative({
    decision: decisionIntelligence,
    evidence: businessProfile.evidenceItems,
    businessProfile,
    knowledgeGraph: knowledgeGraph.snapshot(),
    businessMemory,
    generatedAt: now,
  });
  executionFlow.push("✓ Narrative generated");

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
      businessNarrative,
      execution: {
        completedInSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
        providersExecuted: executionRecords.filter((record) => record.status === "executed").length,
        evidenceCollected: providerResults.reduce((sum, result) => sum + result.evidence.length, 0),
        decisionConfidence: decisionIntelligence.confidenceLevel,
      },
      executionFlow,
      technicalDetails: {
        executed: executionRecords.filter((record) => record.status === "executed"),
        skipped: executionRecords.filter((record) => record.status === "skipped"),
        pending: executionRecords.filter((record) => record.status === "pending"),
        failed: executionRecords.filter((record) => record.status === "failed"),
      },
    },
    riskScore: undefined,
    confidenceScore: undefined,
    stage: riskEnginePreview.stage,
    topFactors: [],
  };
}
