import type { BusinessNarrative } from "../narrative/types";
import type { OntologyGraph } from "../ontology/types";
import type { ProviderExecutionRecord } from "../providers/ProviderManager";
import type { ProviderResult } from "../providers/types";
import type { ShadowScoreIntake, ShadowScoreReport } from "../workspace";
import type { Investigation, InvestigationDecision, InvestigationTechnicalStatus } from "./types";

export function mapIntakeToInvestigationPatch(intake: ShadowScoreIntake) {
  return {
    target: intake.target,
    userId: intake.userId,
    intakeId: intake.intakeId,
    createdAt: intake.createdAt,
    paymentIntentId: undefined,
  };
}

export function mapReportToInvestigationPatch(report: ShadowScoreReport) {
  return {
    reportId: report.reportId,
    intakeId: report.intakeId,
    paymentIntentId: report.paymentIntentId,
    userId: report.userId,
    decision: report.reportSummary?.decision || null,
    verificationScore: report.reportSummary?.decision?.confidenceScore ?? report.confidenceScore,
    narrativeSummary: report.reportSummary?.businessNarrative ? summarizeNarrative(report.reportSummary.businessNarrative) : report.reportSummary?.message,
    technicalStatus: report.reportSummary?.technicalDetails,
    evidenceRefs: mapProviderResultsToEvidenceRefs(report.providerResults || []),
  };
}

export function mapDecisionToInvestigation(investigation: Investigation, decision: InvestigationDecision, verificationScore?: number): Investigation {
  return {
    ...investigation,
    decision,
    verificationScore: verificationScore ?? extractDecisionScore(decision) ?? investigation.verificationScore,
  };
}

export function mapOntologyGraphToInvestigation(investigation: Investigation, ontologyGraph: OntologyGraph): Investigation {
  return {
    ...investigation,
    ontologyGraph,
    evidenceRefs: uniqueStrings([
      ...investigation.evidenceRefs,
      ...ontologyGraph.entities.flatMap((entity) => entity.evidenceRefs),
      ...ontologyGraph.relationships.flatMap((relationship) => relationship.evidenceRefs),
    ]),
  };
}

export function mapNarrativeToInvestigation(investigation: Investigation, narrative: BusinessNarrative | string): Investigation {
  return {
    ...investigation,
    narrativeSummary: typeof narrative === "string" ? narrative : summarizeNarrative(narrative),
  };
}

export function mapProviderExecutionToTechnicalStatus(records: ProviderExecutionRecord[]): InvestigationTechnicalStatus {
  return {
    executed: records.filter((record) => record.status === "executed"),
    skipped: records.filter((record) => record.status === "skipped"),
    pending: records.filter((record) => record.status === "pending"),
    failed: records.filter((record) => record.status === "failed"),
  };
}

export function mapProviderExecutionToInvestigation(investigation: Investigation, records: ProviderExecutionRecord[], providerResults: ProviderResult[] = []): Investigation {
  return {
    ...investigation,
    technicalStatus: mapProviderExecutionToTechnicalStatus(records),
    evidenceRefs: uniqueStrings([...investigation.evidenceRefs, ...mapProviderResultsToEvidenceRefs(providerResults)]),
  };
}

export function mapProviderResultsToEvidenceRefs(results: ProviderResult[]) {
  return uniqueStrings(results.flatMap((result) => result.evidence.map((evidence) => evidence.id)));
}

function summarizeNarrative(narrative: BusinessNarrative) {
  const executiveSummary = narrative.sections.find((section) => section.id === "executiveSummary");
  return executiveSummary?.body.join(" ") || `${narrative.businessName}: ${narrative.decision} (${narrative.confidence})`;
}

function extractDecisionScore(decision: InvestigationDecision) {
  if (decision && typeof decision === "object" && "confidenceScore" in decision && typeof decision.confidenceScore === "number") {
    return decision.confidenceScore;
  }
  return undefined;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
