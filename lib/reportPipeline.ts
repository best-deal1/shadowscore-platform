import { correlateEvidence } from "./correlation";
import { buildDecision, evaluateDecisionEvidence } from "./decisionEngine";
import { buildEvidenceItems, summarizeEvidence } from "./evidence";
import { applicableEvidence } from "./evidence/applicability";
import { rememberBusinessScan } from "./businessMemory";
import { classifyTarget } from "./targetClassifier";
import { planFromClassification } from "./orchestrator";
import { buildTrustInsights } from "./insightEngine";
import { buildIdentityProfile } from "./identityEngine";
import { buildBusinessProfile } from "./businessProfileEngine";
import { buildBusinessIdentityIntelligence } from "./businessIdentityIntelligence";
import { buildBusinessIntelligence } from "./businessIntelligence";
import { normalizeWebsiteEvidence, toCanonicalWebsiteReport } from "./websiteIntelligence";
import { investigateAndRecordWebsite } from "./websiteIntelligence/monitoring";
import type { WebsiteScanHistoryRepository } from "./websiteIntelligence/history";
import type { WebsiteAlertRepository } from "./websiteIntelligence/alerts";
import type { WebsiteWatchlistRepository } from "./websiteIntelligence/watchlist";
import { buildShadowScorecard } from "./scoring";
import { buildInvestigationTimeline } from "./investigation/timeline";
import { buildBusinessIdentityKnowledgeScan, BusinessKnowledgeGraph } from "./knowledgeGraph";
import { buildBusinessNarrative } from "./narrative";
import { buildTrustTimeline } from "./trustTimeline";
import { buildReasoning } from "./reasoning";
import { ProviderManager, createDefaultProviders } from "./providers";
import type { ProviderExecutionContext } from "./providers/types";
import type { ExternalIdentityCandidate } from "./providers/externalIdentityProvider";
import { analyzeRisk } from "./riskEngine";
import type { PaymentIntent, ShadowScoreIntake, ShadowScoreReport } from "./workspace";
import { resolveBusinessIdentity } from "./businessIdentityResolver";
import { applyCanonicalIdentityToBusinessProfile, applyCanonicalIdentityToIdentityProfile } from "./canonicalReportIdentity";
import { buildInvestigationIntelligence } from "./investigationIntelligence";
import { isolateProviderResults } from "./targetIntegrity";
import { resolveFirstPartyEntities, resolutionTarget } from "./entityResolution/firstParty";
import { identityObjective, normalizeIntakeIdentitySignals } from "./personalIdentity";

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
  websiteHistoryRepository?: WebsiteScanHistoryRepository;
  websiteAlertRepository?: WebsiteAlertRepository;
  websiteWatchlistRepository?: WebsiteWatchlistRepository;
  websiteTenantId?: string;
}): Promise<ShadowScoreReport> {
  const { intake, paymentIntent } = input;

  if (!canGenerateReport(paymentIntent)) {
    throw new Error("Report generation requires paymentStatus == paid.");
  }

  const submittedTarget = intake.target.trim();
  const submittedClassification = classifyTarget(submittedTarget);
  const resolvableTarget = ["Email", "Website"].includes(submittedClassification.targetType);
  const resolution = resolvableTarget ? resolutionTarget(submittedTarget) : undefined;
  const emailInvestigation = submittedClassification.targetType === "Email" && intake.scanMode !== "personal";
  const providerTarget = intake.scanMode === "website" && resolution && !emailInvestigation ? resolution.domain : submittedTarget;
  const canonicalTarget = submittedTarget;
  const personalSignals = intake.scanMode === "personal" ? normalizeIntakeIdentitySignals(intake.identitySignals, { target: intake.target, email: intake.email }) : undefined;
  const investigationEmail = emailInvestigation ? submittedTarget : intake.scanMode === "personal" ? personalSignals?.emails[0] : intake.scanMode === "website" ? undefined : intake.email;
  const providerContext: ProviderExecutionContext = {
    intakeId: intake.intakeId,
    scanMode: intake.scanMode,
    target: providerTarget,
    requestedTarget: submittedTarget,
    investigationId: intake.intakeId,
    canonicalTarget,
    platform: intake.platform,
    caseType: intake.caseType,
    email: investigationEmail,
    identitySignals: personalSignals,
    fileNames: intake.fileNames,
    visibleSignalCategories: intake.visibleSignalCategories,
    paymentIntentId: paymentIntent.id,
  };
  const startedAt = Date.now();
  const executionFlow: string[] = [];
  const classification = submittedClassification;
  executionFlow.push(`✓ Target classified as ${classification.targetType}`);
  const classifiedPlan = planFromClassification(classification);
  const executionPlan = intake.scanMode === "personal" ? {
    ...classifiedPlan,
    executionPlan: classifiedPlan.executionPlan.filter((step) => ["email-intelligence", "external-identity"].includes(step.engineId)),
    skippedEngines: [...classifiedPlan.skippedEngines, ...classifiedPlan.executionPlan.filter((step) => !["email-intelligence", "external-identity"].includes(step.engineId)).map((step) => ({ engineId: step.engineId, label: step.label, reason: "Personal identity scope excludes organization and infrastructure checks." }))],
    reasoning: [...classifiedPlan.reasoning, "Personal scan mode is authoritative. Only person-specific identity providers are eligible."],
  } : classifiedPlan;
  executionFlow.push("✓ Execution plan created");
  const execution = await providerManager.runExecutionPlan(providerContext, executionPlan.executionPlan, executionPlan.skippedEngines);
  const isolated = intake.scanMode === "website" && resolution?.inputType !== "email" ? isolateProviderResults({ investigationId: intake.intakeId, submittedTarget, providerResults: execution.providerResults }) : undefined;
  const providerResults = isolated?.providerResults || execution.providerResults;
  const targetResolution = isolated?.resolution;
  const executionRecords = execution.executionRecords;
  console.info("investigation_target_resolution", { investigationId: intake.intakeId, submittedTarget: intake.target, canonicalTarget, providerTargets: providerResults.map((item) => item.metadata.providerTarget), evidenceTargets: providerResults.flatMap((item) => item.evidence.map((evidence) => evidence.canonicalTarget || canonicalTarget)), reportTarget: canonicalTarget, redirectDomainMismatch: targetResolution?.redirectDomainMismatch, rejectedEvidenceCount: targetResolution?.rejectedEvidenceCount });
  const resolvedEntities = resolution ? await resolveFirstPartyEntities(submittedTarget) : undefined;
  const alerting = input.websiteTenantId && input.websiteAlertRepository ? { tenantId: input.websiteTenantId, repository: input.websiteAlertRepository, watchlistRepository: input.websiteWatchlistRepository } : undefined;
  const websiteMonitoring = intake.scanMode === "website" && !emailInvestigation ? await investigateAndRecordWebsite({ target: providerTarget }, input.websiteHistoryRepository, alerting) : undefined;
  const websiteIntelligence = websiteMonitoring?.report;
  const canonicalWebsiteReport = websiteIntelligence ? toCanonicalWebsiteReport(websiteIntelligence) : undefined;
  const websiteEvidenceItems = websiteIntelligence ? normalizeWebsiteEvidence(websiteIntelligence) : [];
  const providerEvidenceItems = buildEvidenceItems({
    providerResults,
    notCheckedProviders: executionRecords
      .filter((record) => record.status === "pending" || record.status === "skipped")
      .map((record) => ({ providerId: record.providerId || record.engineId, reason: record.reason || "Provider was not checked in this execution plan." })),
  });
  const investigationType = emailInvestigation ? "email" : intake.scanMode;
  const evidenceItems = applicableEvidence([...providerEvidenceItems, ...websiteEvidenceItems], investigationType);
  const correlationSummary = correlateEvidence({ evidenceItems, targetType: investigationType });
  const externalIdentityMetadata = providerResults.find((result) => result.providerId === "external-identity")?.metadata as Record<string, unknown> | undefined;
  const publicIdentityCandidates = (externalIdentityMetadata?.externalIdentityCandidates || []) as ExternalIdentityCandidate[];
  const externalIdentityResult = providerResults.find((result) => result.providerId === "external-identity");
  const searches = (externalIdentityMetadata?.identityDiscoverySearches || []) as import("./providers/externalIdentityProvider").IdentityDiscoverySearchDiagnostic[];
  const discoveryDiagnostics = intake.scanMode === "personal" ? {
    searches,
    budgetExhaustionReason: String((externalIdentityMetadata?.identityDiscoveryMetrics as { budgetExhaustionReason?: string } | undefined)?.budgetExhaustionReason || (externalIdentityResult?.status !== "completed" ? "provider_failed" : searches.length === 0 ? "no_search_executed" : publicIdentityCandidates.length === 0 ? "no_eligible_candidates" : "closure_reached")),
    providerStatus: externalIdentityResult?.status || "not_scheduled",
    providerFailure: externalIdentityResult?.errors[0],
  } : undefined;
  if (intake.scanMode === "personal") console.info("personal_identity_discovery_execution", { investigationId: intake.intakeId, submittedSignalCounts: Object.fromEntries(Object.entries(personalSignals || {}).map(([key, values]) => [key, values.length])), providerStatus: discoveryDiagnostics?.providerStatus, searchCount: searches.length, candidateCount: publicIdentityCandidates.length, emptyResultReason: discoveryDiagnostics?.budgetExhaustionReason, providerFailure: discoveryDiagnostics?.providerFailure });
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
    store: canonicalTarget,
    email: investigationEmail,
    fileNames: intake.fileNames,
    evidencePresent: intake.visibleSignalCategories.length,
    evidenceRequired: intake.scanMode === "website" ? 0 : 4,
    providerResults,
  };
  const riskEnginePreview = analyzeRisk(engineInput);
  const now = new Date().toISOString();
  const insightOutput = buildTrustInsights({ providerResults, riskOutput: riskEnginePreview, audience: "paid" });
  const baseIdentityProfile = buildIdentityProfile({ providerResults, insights: insightOutput.insights, target: canonicalTarget, email: investigationEmail, generatedAt: now });
  const businessProfile = buildBusinessProfile({ providerResults, target: canonicalTarget, generatedAt: now });
  const businessIdentityResolution = resolveBusinessIdentity(canonicalTarget, { providerResults, businessProfile, observedAt: now, generatedAt: now });
  const canonicalIdentity = businessIdentityResolution.canonicalIdentity;
  const providerResultsWithCanonicalIdentity = providerResults.map((result) => result.providerId === "business-profile" && canonicalIdentity?.canonicalDisplayName ? {
    ...result,
    evidence: result.evidence.some((item) => /business name|profile title|organization/i.test(item.label) && String(item.value || "").trim() && String(item.value).toLowerCase() !== "unavailable") ? result.evidence : [...result.evidence, { id: "canonical-business-name", type: "document" as const, label: "Business name", value: canonicalIdentity.canonicalDisplayName, source: "canonical-identity-resolution" }],
  } : result);
  const canonicalBusinessProfile = applyCanonicalIdentityToBusinessProfile(businessProfile, canonicalIdentity);
  const identityProfile = applyCanonicalIdentityToIdentityProfile(baseIdentityProfile, canonicalIdentity);
  const businessIdentityIntelligence = buildBusinessIdentityIntelligence({ providerResults: providerResultsWithCanonicalIdentity, target: canonicalTarget, claimedBusinessName: canonicalBusinessProfile.businessName, canonicalIdentity, generatedAt: now });
  const businessIntelligence = buildBusinessIntelligence(providerResultsWithCanonicalIdentity, now);
  const knowledgeGraph = new BusinessKnowledgeGraph();
  knowledgeGraph.applyScan(buildBusinessIdentityKnowledgeScan({
    scanId: `report-${intake.intakeId}`,
    target: canonicalTarget,
    businessProfile: canonicalBusinessProfile,
    identityIntelligence: businessIdentityIntelligence,
    email: investigationEmail,
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
  const reasoning = buildReasoning({ evidenceItems, providerResults, correlationSummary, decision });
  const decisionIntelligence = evaluateDecisionEvidence({
    businessProfile: canonicalBusinessProfile,
    executionPlan,
    evidenceItems: canonicalBusinessProfile.evidenceItems,
    correlationFindings: correlationSummary.findings,
    contradictionSignals: canonicalBusinessProfile.contradictionSignals,
    businessTrustIntelligence: businessIdentityIntelligence,
  });
  const investigationIntelligence = buildInvestigationIntelligence({
    evidenceItems,
    correlationSummary,
    businessFindings: businessIntelligence.findings,
    knowledgeGraph: knowledgeGraph.snapshot(),
    generatedAt: now,
  });
  executionFlow.push("✓ Decision generated");
  const scorecard = buildShadowScorecard({ evidenceItems: providerEvidenceItems, websiteEvidence: websiteEvidenceItems });
  const investigationTimeline = intake.scanMode === "personal" ? [
    { id: "submitted-signals", label: "Submitted identity signals", status: "completed" as const, source: "Personal identity intake", observedAt: now },
    { id: "public-discovery", label: "Public identity discovery", status: "completed" as const, source: "Identity discovery", observedAt: now },
    { id: "identity-resolution", label: "Identity matching evidence", status: "completed" as const, source: "Entity resolver", observedAt: now },
    { id: "provenance-review", label: "Source provenance review", status: "completed" as const, source: "Investigation pipeline", observedAt: now },
  ] : buildInvestigationTimeline({ websiteIntelligence, completedAt: now, identityCompleted: true, correlationCompleted: true, businessCompleted: true, decisionCompleted: true, executiveCompleted: true });
  const businessMemory = rememberBusinessScan({
    scanId: `report-${intake.intakeId}`,
    identity: {
      name: canonicalBusinessProfile.businessName === "Insufficient Public Evidence" ? canonicalTarget : canonicalBusinessProfile.businessName,
      domain: canonicalBusinessProfile.primaryDomain || canonicalTarget,
      emails: investigationEmail ? [investigationEmail] : [],
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
    title: `${intake.scanMode === "personal" ? "Personal Identity" : emailInvestigation ? "Email" : intake.scanMode === "website" ? "Website" : "Trust"} Intelligence Report`,
    entity: canonicalTarget,
    platform: intake.platform,
    scanMode: intake.scanMode,
    target: canonicalTarget,
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
      message: intake.scanMode === "personal" ? "Report generated from the submitted identity signals and source-backed public evidence." : "Report generated from paid intake, provider evidence and Insight Engine business-trust analysis.",
      objective: personalSignals ? identityObjective(personalSignals) : undefined,
      identitySignals: personalSignals,
      primaryRiskDomain: intake.scanMode === "personal" ? undefined : riskEnginePreview.primaryRiskDomain,
      findingCount: intake.scanMode === "personal" ? undefined : riskEnginePreview.findings.length,
      insights: intake.scanMode === "personal" ? undefined : insightOutput.insights,
      insightEngineVersion: insightOutput.engineVersion,
      decision: intake.scanMode === "personal" ? undefined : decision,
      reasoning: intake.scanMode === "personal" ? undefined : reasoning,
      correlationSummary,
      identityProfile,
      businessNarrative: intake.scanMode === "personal" ? undefined : businessNarrative,
      businessIdentityResolution: intake.scanMode === "personal" ? undefined : businessIdentityResolution,
      businessIdentityIntelligence: intake.scanMode === "personal" ? undefined : businessIdentityIntelligence,
      businessIntelligence: intake.scanMode === "personal" ? undefined : businessIntelligence,
      investigationIntelligence: intake.scanMode === "personal" ? undefined : investigationIntelligence,
      websiteIntelligence,
      canonicalWebsiteReport,
      websiteChangeReport: websiteMonitoring?.snapshot.changeReport,
      websiteAlertSummary: websiteMonitoring ? { count: websiteMonitoring.alerts.length, severities: websiteMonitoring.alerts.reduce<Record<string, number>>((summary, alert) => ({ ...summary, [alert.severity]: (summary[alert.severity] || 0) + 1 }), {}) } : undefined,
      websiteChangeTimeline: websiteMonitoring?.history.map((snapshot) => ({ scanId: snapshot.scanId, scannedAt: snapshot.scannedAt, summary: snapshot.changeReport.summary, changeCount: snapshot.changeReport.changes.length, alertIds: websiteMonitoring.alerts.filter((alert) => alert.currentScanId === snapshot.scanId).map((alert) => alert.id) })),
      scorecard: intake.scanMode === "personal" ? undefined : scorecard,
      investigationTimeline,
      execution: {
        completedInSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
        providersExecuted: executionRecords.filter((record) => record.status === "executed").length,
        evidenceCollected: evidenceItems.length,
        decisionConfidence: decisionIntelligence.confidenceLevel,
      },
      executionFlow,
      knowledgeGraph: intake.scanMode === "personal" ? undefined : knowledgeGraph.snapshot(),
      technicalDetails: {
        executed: executionRecords.filter((record) => record.status === "executed"),
        skipped: executionRecords.filter((record) => record.status === "skipped"),
        pending: executionRecords.filter((record) => record.status === "pending"),
        failed: executionRecords.filter((record) => record.status === "failed"),
      },
      sourceProvenance: providerResultsWithCanonicalIdentity
        .filter((provider) => provider.status === "completed")
        .map((provider) => ({ label: provider.providerId.replace(/[-_]/g, " "), completedAt: provider.completedAt })),
      targetResolution,
      resolvedEntities,
      investigationType: emailInvestigation ? "EMAIL" : intake.scanMode === "personal" ? "PERSONAL_IDENTITY" : intake.scanMode.toUpperCase(),
      mailboxProviderDomain: emailInvestigation && resolution ? resolution.domain : undefined,
      publicIdentityCandidates,
      discoveryDiagnostics,
    },
    riskScore: undefined,
    confidenceScore: undefined,
    stage: riskEnginePreview.stage,
    topFactors: [],
  };
}
