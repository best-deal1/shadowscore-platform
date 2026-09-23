import type { TrustGraphEntity, TrustGraphRelationship } from "@/lib/trustGraph";
import type { IntelligenceGraphReader, IntelligenceResult, IntelligenceType, RecommendedAction, RecommendationType, ReasoningStep, Severity } from "./types";

const ENGINE = "trust-graph-intelligence";
const VERSION = "1.0.0";
const REQUIRED_EVIDENCE: Record<string, { attribute: string; label: string; action: string }[]> = {
  Business: [
    { attribute: "governmentRegistration", label: "government registration", action: "Collect an authoritative government registration record." },
    { attribute: "ownershipVerified", label: "verified ownership", action: "Collect beneficial ownership evidence from an authoritative source." },
    { attribute: "paymentIdentityVerified", label: "verified payment identity", action: "Verify the payment identity used by this business." },
  ],
};

export class IntelligenceService {
  private readonly graph: IntelligenceGraphReader;
  private readonly now: () => string;

  constructor(graph: IntelligenceGraphReader, now: () => string = () => new Date().toISOString()) {
    this.graph = graph;
    this.now = now;
  }

  trustExplanation(entityId: string) {
    const entity = this.entity(entityId); const trust = this.graph.getTrust(entityId); const relationships = this.graph.getRelationships(entityId);
    const missing = this.missingItems(entity); const risky = this.riskyRelationships(entityId, relationships);
    const steps: ReasoningStep[] = trust ? [step("trust", "Stored trust assessment", "trust-engine", trust.evidenceIds, [], trust.explanation, "trust", trust.score >= 60 ? "positive" : "negative", trust.score)] : [];
    if (missing.length) steps.push(step("missing-evidence", `${missing.length} required evidence item(s) are missing`, "intelligence-rule", [], [], "The assessment is incomplete.", "confidence", "negative"));
    if (risky.length) steps.push(step("connected-risk", `${risky.length} connected entity or relationship has a risk signal`, "intelligence-rule", ids(risky.flatMap((item) => item.evidenceIds)), ids(risky.map((item) => item.id)), "Connected risk lowers confidence in the current trust state.", "risk", "negative"));
    const score = trust?.score ?? 0; const confidence = normalize(trust ? trust.confidence - missing.length * 0.1 - risky.length * 0.05 : 0.2);
    return this.result(entityId, "trust_explanation", trust ? `Trust score is ${score}. ${trust.explanation}` : "No trust assessment is available.", confidence, score < 40 ? "high" : score < 60 ? "medium" : "low", steps, missing.length ? [action("request_evidence", "high", "Collect the missing evidence before relying on this assessment.")] : [action("monitor", "low", "Monitor the entity for material graph changes.")], { trustScore: score, supportingEvidence: trust?.evidenceIds ?? [], conflictingEvidence: ids(risky.flatMap((item) => item.evidenceIds)), relevantRelationships: ids(relationships.map((item) => item.id)) });
  }

  riskExplanation(entityId: string) {
    this.entity(entityId); const relationships = this.graph.getRelationships(entityId); const risky = this.riskyRelationships(entityId, relationships);
    const steps = risky.map((relationship) => step("risk-relationship", `Relationship ${relationship.type}`, relationship.provenance.source, relationship.evidenceIds, [relationship.id], "The connected entity carries a high-risk signal or the relationship is weakly supported.", "risk", "negative", relationship.confidence));
    return this.result(entityId, "risk_explanation", risky.length ? `${risky.length} principal relationship risk factor(s) require review.` : "No deterministic relationship risk factors were detected.", normalize(risky.length ? average(risky.map((item) => item.confidence)) : 0.8), risky.length > 1 ? "high" : risky.length ? "medium" : "low", steps, risky.length ? [action("manual_review", "high", "Review the connected entities and their supporting evidence.")] : [action("monitor", "low", "Continue monitoring for new risk signals.")], { riskFactors: risky.map((item) => ({ relationshipId: item.id, type: item.type, source: item.provenance.source, evidenceIds: item.evidenceIds, potentialBusinessImpact: "Connected entity risk can affect the entity assessment." })) });
  }

  missingEvidence(entityId: string) {
    const entity = this.entity(entityId); const missing = this.missingItems(entity);
    const steps = missing.map((item) => step("required-evidence", item.label, "intelligence-rule", [], [], `${item.label} is required for a complete ${entity.type} assessment.`, "confidence", "negative"));
    return this.result(entityId, "missing_evidence", missing.length ? `${missing.length} evidence item(s) should be collected.` : "Required deterministic evidence is present.", normalize(1 - missing.length * 0.2), missing.length ? "medium" : "low", steps, missing.map((item) => action("collect_evidence", "medium", item.action, item.label)), { missingEvidence: missing.map((item) => ({ item: item.label, whyItMatters: `It improves confidence in the ${entity.type} assessment.`, collectionAction: item.action })) });
  }

  conflicts(entityId: string) {
    const entity = this.entity(entityId); const relationships = this.graph.getRelationships(entityId); const conflicts: Array<Record<string, unknown>> = [];
    for (const [key, value] of Object.entries(entity.attributes)) {
      if (Array.isArray(value) && new Set(value.map(String)).size > 1) conflicts.push({ attribute: key, values: value, sources: [entity.provenance.source], timestamps: [entity.updatedAt], confidence: entity.confidence });
    }
    const grouped = new Map<string, TrustGraphRelationship[]>();
    for (const relationship of relationships) { const other = relationship.fromEntityId === entityId ? relationship.toEntityId : relationship.fromEntityId; const key = `${relationship.type}:${other}`; grouped.set(key, [...(grouped.get(key) ?? []), relationship]); }
    for (const values of grouped.values()) if (values.length > 1 && new Set(values.map((item) => item.confidence)).size > 1) conflicts.push({ relationshipIds: values.map((item) => item.id), values: values.map((item) => item.confidence), sources: values.map((item) => item.provenance.source), timestamps: values.map((item) => item.validFrom), confidence: average(values.map((item) => item.confidence)) });
    const steps = conflicts.map((conflict, index) => step("conflict", `Conflict ${index + 1}`, "intelligence-rule", [], Array.isArray(conflict.relationshipIds) ? conflict.relationshipIds as string[] : [], "Conflicting values require source resolution before a conclusive assessment.", "confidence", "negative"));
    return this.result(entityId, "conflicts", conflicts.length ? `${conflicts.length} conflict(s) require resolution.` : "No deterministic conflicts were detected.", normalize(1 - conflicts.length * 0.2), conflicts.length ? "high" : "low", steps, conflicts.length ? [action("resolve_conflict", "high", "Compare authoritative source records and record the resolution workflow.")] : [], { conflicts: conflicts.map((conflict) => ({ ...conflict, severity: "high", recommendedResolutionWorkflow: "Validate authoritative records, supersede stale evidence, and record the analyst decision." })) });
  }

  relationshipInsights(entityId: string) {
    this.entity(entityId); const relationships = this.graph.getRelationships(entityId); const insights = relationships.map((relationship) => {
      const otherId = relationship.fromEntityId === entityId ? relationship.toEntityId : relationship.fromEntityId; const other = this.graph.getEntity(otherId);
      return { relationship, otherId, meaning: `${relationship.type} links this entity to ${other?.canonicalName ?? otherId}; it is supported by ${relationship.evidenceIds.length} evidence reference(s).` };
    });
    const steps = insights.map(({ relationship, meaning }) => step("relationship", relationship.type, relationship.provenance.source, relationship.evidenceIds, [relationship.id], meaning, "risk", relationship.confidence < 0.5 ? "negative" : "neutral", relationship.confidence));
    return this.result(entityId, "relationship_insights", insights.length ? `${insights.length} relationship insight(s) were found.` : "No relationships are available for analysis.", normalize(insights.length ? average(insights.map((item) => item.relationship.confidence)) : 0.3), insights.some((item) => item.relationship.confidence < 0.5) ? "medium" : "low", steps, insights.some((item) => item.relationship.confidence < 0.5) ? [action("verify_relationship", "medium", "Verify weakly supported relationships with authoritative evidence.")] : [], { insights: insights.map(({ relationship, otherId, meaning }) => ({ relationshipId: relationship.id, connectedEntityId: otherId, type: relationship.type, meaning, source: relationship.provenance.source })) });
  }

  changeImpact(entityId: string) {
    this.entity(entityId); const events = this.graph.getTimeline(entityId); const latestDecision = this.graph.getDecisions(entityId)[0]; const changes = events.filter((event) => !latestDecision || event.occurredAt > latestDecision.decidedAt);
    const steps = changes.map((event) => step("graph-change", event.type, "trust-graph-timeline", event.evidenceIds, [], event.reason, "recommendation", "neutral"));
    const reassessment = changes.some((event) => ["trust_changed", "evidence_added", "relationship_created", "entity_updated"].includes(event.type));
    return this.result(entityId, "change_impact", latestDecision ? (changes.length ? `${changes.length} graph change(s) occurred after the previous decision. Reassessment ${reassessment ? "is required" : "is not required"}.` : "No graph changes occurred after the previous decision.") : "No previous decision is available for comparison.", normalize(changes.length ? 0.8 : 0.9), reassessment ? "medium" : "low", steps, reassessment ? [action("reassess", "medium", "Re-run the decision process using the changed graph evidence.")] : [], { previousDecisionId: latestDecision?.id, previousDecisionValid: !reassessment, reassessmentRequired: reassessment, changes: changes.map((event) => ({ eventId: event.id, type: event.type, occurredAt: event.occurredAt, evidenceIds: event.evidenceIds })) });
  }

  recommendation(entityId: string, policyVersion = "intelligence-policy-1.0") {
    const trust = this.trustExplanation(entityId); const risk = this.riskExplanation(entityId); const missing = this.missingEvidence(entityId); const conflicts = this.conflicts(entityId);
    const type: RecommendationType = conflicts.severity === "high" || risk.severity === "high" ? "manual_review" : missing.recommendedActions.length ? "request_additional_evidence" : Number(trust.details.trustScore) >= 70 ? "approve" : "approve_with_conditions";
    const confidence = normalize(average([trust.confidence, risk.confidence, missing.confidence, conflicts.confidence]));
    return this.result(entityId, "recommendation", `Recommendation: ${type.replaceAll("_", " ")}.`, confidence, type === "manual_review" ? "high" : type === "request_additional_evidence" ? "medium" : "low", [...trust.reasoningPath, ...risk.reasoningPath, ...missing.reasoningPath, ...conflicts.reasoningPath], type === "approve" ? [action("record_decision", "low", "Submit this recommendation to the Decision Engine if a permanent decision is required.")] : [...missing.recommendedActions, ...conflicts.recommendedActions, ...risk.recommendedActions], { recommendation: type, policyVersion, businessImpact: type === "approve" ? "Suitable for the configured policy." : "Requires further review or evidence before a permanent decision.", unresolvedConcerns: [...missing.recommendedActions, ...conflicts.recommendedActions].map((item) => item.description) });
  }

  private entity(id: string) { const entity = this.graph.getEntity(id); if (!entity) throw new Error(`Unknown Trust Graph entity: ${id}`); return entity; }
  private missingItems(entity: TrustGraphEntity) { return (REQUIRED_EVIDENCE[entity.type] ?? []).filter((item) => !entity.attributes[item.attribute]); }
  private riskyRelationships(entityId: string, relationships: TrustGraphRelationship[]) { return relationships.filter((relationship) => relationship.confidence < 0.5 || Boolean(this.graph.getEntity(relationship.fromEntityId === entityId ? relationship.toEntityId : relationship.fromEntityId)?.attributes.riskFlag)); }
  private result(entityId: string, intelligenceType: IntelligenceType, conclusion: string, confidence: number, severity: Severity, reasoningPath: ReasoningStep[], recommendedActions: RecommendedAction[], details: Record<string, unknown>): IntelligenceResult { const relationships = ids(reasoningPath.flatMap((item) => item.relationshipIds)); const evidence = ids(reasoningPath.flatMap((item) => item.evidenceIds)); return { id: `${intelligenceType}:${entityId}:${this.now()}`, entityId, intelligenceType, conclusion, confidence: normalize(confidence), severity, evidenceIds: evidence, relationshipIds: relationships, affectedEntityIds: ids(this.graph.getRelationships(entityId).flatMap((item) => [item.fromEntityId, item.toEntityId]).filter((id) => id !== entityId)), reasoningPath, recommendedActions, generatedAt: this.now(), engine: ENGINE, engineVersion: VERSION, details }; }
}

function step(id: string, input: string, source: string, evidenceIds: string[], relationshipIds: string[], interpretation: string, target: ReasoningStep["effect"]["target"], direction: ReasoningStep["effect"]["direction"], value?: number): ReasoningStep { return { id, input, source, evidenceIds: ids(evidenceIds), relationshipIds: ids(relationshipIds), interpretation, effect: { target, direction, value } }; }
function action(type: string, priority: Severity, description: string, collectionTarget?: string): RecommendedAction { return { type, priority, description, collectionTarget }; }
function ids(values: string[]) { return [...new Set(values.filter(Boolean))]; }
function average(values: number[]) { return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0; }
function normalize(value: number) { return Math.max(0, Math.min(1, value)); }
