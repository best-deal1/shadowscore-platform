import { correlateEvidence } from "./correlation";
import { buildDecision, evaluateDecisionEvidence } from "./decisionEngine";
import { buildEvidenceItems, summarizeEvidence } from "./evidence";
import { rememberBusinessScan } from "./businessMemory";
import { classifyTarget } from "./targetClassifier";
import { planFromClassification } from "./orchestrator";
import { buildTrustInsights } from "./insightEngine";
import { buildIdentityProfile } from "./identityEngine";
import { buildBusinessProfile } from "./businessProfileEngine";
import { buildBusinessIdentityIntelligence } from "./businessIdentityIntelligence";
import { buildBusinessIdentityKnowledgeScan, BusinessKnowledgeGraph } from "./knowledgeGraph";
import { buildBusinessNarrative } from "./narrative";
import { buildTrustTimeline } from "./trustTimeline";
import { buildReasoning } from "./reasoning";
import { ProviderManager, createDefaultProviders } from "./providers";
import type { ProviderExecutionContext } from "./providers/types";
import { analyzeRisk } from "./riskEngine";
import type { PaymentIntent, ShadowScoreIntake, ShadowScoreReport } from "./workspace";
import { resolveBusinessIdentity } from "./businessIdentityResolver";
import { applyCanonicalIdentityToBusinessProfile, applyCanonicalIdentityToIdentityProfile } from "./canonicalReportIdentity";

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
  const evidenceItems = buildEvidenceItems({
    providerResults,
    notCheckedProviders: executionRecords
      .filter((record) => record.status === "pending" || record.status === "skipped")
      .map((record) => ({ providerId: record.providerId || record.engineId, reason: record.reason || "Provider was not checked in this execution plan." })),
  });
  const correlationSummary = correlateEvidence({ evidenceItems });
  const providerCategories = Object.fromEntries(providerManager.listProviders().map((provider) => [provider.id, provider.category]));
  const canonicalEvidenceSummary = summarizeEvidence(evidenceItems, providerCategories);
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
  const baseIdentityProfile = buildIdentityProfile({ providerResults, insights: insightOutput.insights, target: intake.target, email: intake.email, generatedAt: now });
  const businessProfile = buildBusinessProfile({ providerResults, target: intake.target, generatedAt: now });
  const businessIdentityResolution = resolveBusinessIdentity(intake.target, { providerResults, businessProfile, observedAt: now, generatedAt: now });
  const canonicalIdentity = businessIdentityResolution.canonicalIdentity;
  const providerResultsWithCanonicalIdentity = providerResults.map((result) => result.providerId === "business-profile" && canonicalIdentity?.canonicalDisplayName ? {
    ...result,
    evidence: result.evidence.some((item) => /business name|profile title|organization/i.test(item.label) && String(item.value || "").trim() && String(item.value).toLowerCase() !== "unavailable") ? result.evidence : [...result.evidence, { id: "canonical-business-name", type: "document" as const, label: "Business name", value: canonicalIdentity.canonicalDisplayName, source: "canonical-identity-resolution" }],
  } : result);
  const canonicalBusinessProfile = applyCanonicalIdentityToBusinessProfile(businessProfile, canonicalIdentity);
  const identityProfile = applyCanonicalIdentityToIdentityProfile(baseIdentityProfile, canonicalIdentity);
  const businessIdentityIntelligence = buildBusinessIdentityIntelligence({ providerResults: providerResultsWithCanonicalIdentity, target: intake.target, claimedBusinessName: canonicalBusinessProfile.businessName, canonicalIdentity, generatedAt: now });
  const knowledgeGraph = new BusinessKnowledgeGraph();
  knowledgeGraph.applyScan(buildBusinessIdentityKnowledgeScan({
    scanId: `report-${intake.intakeId}`,
    target: intake.target,
    businessProfile: canonicalBusinessProfile,
    identityIntelligence: businessIdentityIntelligence,
    email: intake.email,
  }));
  const trustTimeline = buildTrustTimeline({
    providerResults,
    insights: insightOutput.insights,
    insightEngineVersion: insightOutput.engineVersion,
    audience: "paid",
  });
  const decision = buildDecision({
    providerResults,
    evidenceItems,
    correlationSummary,
    riskOutput: riskEnginePreview,
    insights: insightOutput.insights,
    timeline: trustTimeline,
    audience: "paid",
  });
  const reasoning = buildReasoning({ evidenceItems, providerResults, decision });
  const decisionIntelligence = evaluateDecisionEvidence({
    businessProfile: canonicalBusinessProfile,
    executionPlan,
    evidenceItems: canonicalBusinessProfile.evidenceItems,
    correlationFindings: correlationSummary.findings,
    contradictionSignals: canonicalBusinessProfile.contradictionSignals,
    businessTrustIntelligence: businessIdentityIntelligence,
  });
  executionFlow.push("✓ Decision generated");
  const businessMemory = rememberBusinessScan({
    scanId: `report-${intake.intakeId}`,
    identity: {
      name: canonicalBusinessProfile.businessName === "Insufficient Public Evidence" ? intake.target : canonicalBusinessProfile.businessName,
      domain: canonicalBusinessProfile.primaryDomain || intake.target,
      emails: intake.email ? [intake.email] : [],
    },
    entities: knowledgeGraph.snapshot().entities.map((entity) => ({ type: entity.type, value: entity.label, label: entity.label })),
    relationships: knowledgeGraph.snapshot().relationships.map((relationship) => ({ type: relationship.type, from: relationship.from, to: relationship.to, context: relationship.context })),
    evidence: canonicalBusinessProfile.evidenceItems.map((item) => ({ id: item.id, type: item.type, label: item.label, value: item.value, source: item.source, observedAt: item.observedAt })),
    decision: { decision: decisionIntelligence.decision, confidence: decisionIntelligence.confidenceLevel, recommendation: decisionIntelligence.recommendation },
    timestamp: now,
  });
  executionFlow.push("✓ Knowledge graph updated");
  executionFlow.push("✓ Business memory updated");
  const businessNarrative = buildBusinessNarrative({
    decision: decisionIntelligence,
    evidence: canonicalBusinessProfile.evidenceItems,
    businessProfile: canonicalBusinessProfile,
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
    providerVersions: Object.fromEntries(providerResultsWithCanonicalIdentity.map((result) => [result.providerId, result.providerVersion])),
    providerResults: providerResultsWithCanonicalIdentity,
    evidenceSummary: {
      fileCount: intake.fileNames.length,
      categories: intake.visibleSignalCategories,
      ...canonicalEvidenceSummary,
    },
    reportSummary: {
      message: "Report generated from paid intake, provider evidence and Insight Engine business-trust analysis.",
      primaryRiskDomain: riskEnginePreview.primaryRiskDomain,
      findingCount: riskEnginePreview.findings.length,
      insights: insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      decision,
      reasoning,
      correlationSummary,
      identityProfile,
      businessNarrative,
      businessIdentityResolution,
      businessIdentityIntelligence,
      execution: {
        completedInSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
        providersExecuted: executionRecords.filter((record) => record.status === "executed").length,
        evidenceCollected: evidenceItems.length,
        decisionConfidence: decisionIntelligence.confidenceLevel,
      },
      executionFlow,
      knowledgeGraph: knowledgeGraph.snapshot(),
      technicalDetails: {
        executed: executionRecords.filter((record) => record.status === "executed"),
        skipped: executionRecords.filter((record) => record.status === "skipped"),
        pending: executionRecords.filter((record) => record.status === "pending"),
        failed: executionRecords.filter((record) => record.status === "failed"),
      },
      sourceProvenance: providerResultsWithCanonicalIdentity
        .filter((provider) => provider.status === "completed")
        .map((provider) => ({ label: provider.providerId.replace(/[-_]/g, " "), completedAt: provider.completedAt })),
    },
    riskScore: undefined,
    confidenceScore: undefined,
    stage: riskEnginePreview.stage,
    topFactors: [],
  };
}
