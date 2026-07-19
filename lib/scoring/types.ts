import type { EvidenceItem } from "../evidence";
export type ScoreLevel = "strong" | "adequate" | "limited" | "needs_review" | "unavailable";
export type ExplainableScore = { dimension: "Website Intelligence" | "Security Posture" | "Identity Confidence" | "Infrastructure Maturity" | "Business Trust" | "Overall ShadowScore"; level: ScoreLevel; confidence: "high" | "medium" | "low"; supportingEvidence: string[]; positiveContributors: string[]; negativeContributors: string[]; evidenceGaps: string[]; recommendedImprovements: string[] };
export type ShadowScorecard = { scores: ExplainableScore[]; generatedAt: string };
export type ScoreInput = { evidenceItems: EvidenceItem[]; websiteEvidence?: EvidenceItem[] };
