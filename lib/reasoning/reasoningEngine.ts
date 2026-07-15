import type { EvidenceItem } from "../evidence";
import { buildReasoningGraph } from "./reasoningGraph";
import { summarizeReasoning } from "./reasoningSummary";
import { validateReasoning } from "./reasoningValidation";
import type { ReasoningContradiction, ReasoningEvidenceReference, ReasoningInput, ReasoningOutput, ReasoningStep } from "./reasoningTypes";

export const REASONING_ENGINE_VERSION = "reasoning-engine-v1";

function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "item"; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function ref(item: EvidenceItem): ReasoningEvidenceReference { return { evidenceId: item.id, provider: item.provider, source: item.source, title: item.title, category: item.category, confidence: item.confidence, refs: item.evidenceRefs }; }
function independentProviderBonus(items: EvidenceItem[]) { return Math.max(0, new Set(items.map((item) => item.provider)).size - 1) * 6; }
function assumptionPenalty(assumptions: string[]) { return assumptions.length * 12; }

function inferPositiveFact(item: EvidenceItem) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (/mx|google workspace|microsoft 365|email/.test(text)) return "Business communication capability appears operational.";
  if (/spf|dmarc|email authentication/.test(text)) return "Email security controls are present.";
  if (/dns|name server|a record|website domain/.test(text)) return "Domain infrastructure appears operational.";
  if (/whois|registration|legal name|business name|registry/.test(text)) return "Business identity context is supported by public evidence.";
  if (/marketplace|seller/.test(text)) return "Marketplace participation is supported by available evidence.";
  return `${item.title} supports a verified business trust signal.`;
}

function contributionFor(item: EvidenceItem): ReasoningStep["contribution"] {
  if (item.category === "Verified") return "positive";
  if (item.category === "Negative") return "negative";
  if (item.category === "Missing" || item.category === "Unavailable" || item.category === "Not Checked") return "missing";
  return "neutral";
}

function kindFor(item: EvidenceItem): ReasoningStep["kind"] {
  if (item.category === "Verified") return "Verified Fact";
  if (item.category === "Negative") return "Contradiction";
  if (item.category === "Missing") return "Missing Evidence";
  if (item.category === "Unavailable" || item.category === "Not Checked") return "Unknown";
  return "Observed Fact";
}

function buildStep(item: EvidenceItem, all: EvidenceItem[]): ReasoningStep {
  const related = all.filter((candidate) => candidate.id !== item.id && candidate.category === item.category && candidate.title.toLowerCase() === item.title.toLowerCase());
  const supporting = [item, ...related].sort((a, b) => a.id.localeCompare(b.id));
  const assumptions = item.category === "Verified" ? ["Provider observation is current and accurately normalized."] : [];
  const unresolvedQuestions = item.category === "Missing" || item.category === "Unavailable" || item.category === "Not Checked"
    ? [`Resolve ${item.title} before treating this area as verified.`]
    : [];
  const base = item.category === "Negative" ? Math.max(item.confidence, 80) : item.confidence;
  const confidence = clamp(base + independentProviderBonus(supporting) - assumptionPenalty(assumptions));
  const inferredFact = item.category === "Verified" ? inferPositiveFact(item) : item.category === "Negative" ? `${item.title} conflicts with a clean trust conclusion.` : item.category === "Missing" ? `${item.title} is unresolved and should not be treated as risk.` : `${item.title} remains unknown and should produce a question, not a negative conclusion.`;
  return { id: `reason-${slug(item.id)}`, kind: kindFor(item), observation: item.description || item.title, supportingEvidence: supporting.map(ref), inferredFact, confidence, assumptions, unresolvedQuestions, contribution: contributionFor(item) };
}

function contradictionKey(item: EvidenceItem) { return item.title.toLowerCase().replace(/confirmed|possible|missing|mismatch|conflict/g, "").trim(); }
function detectContradictions(items: EvidenceItem[]): ReasoningContradiction[] {
  const positives = items.filter((item) => item.category === "Verified");
  return items.filter((item) => item.category === "Negative").map((negative) => {
    const conflicts = positives.filter((positive) => contradictionKey(positive).split(/\s+/).some((part) => part.length > 3 && contradictionKey(negative).includes(part))).slice(0, 2);
    const evidence = [negative, ...conflicts].sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
    const stronger = evidence[0] || negative;
    return {
      id: `contradiction-${slug(negative.id)}`,
      why: `${negative.title} conflicts with evidence that otherwise supports verification.`,
      conflictingEvidence: evidence.map(ref),
      strongerEvidence: ref(stronger),
      affectsDecision: true,
      explanation: `${stronger.title} is strongest because it has ${stronger.confidence >= 85 ? "Very High" : stronger.confidence >= 65 ? "High" : stronger.confidence >= 40 ? "Medium" : "Low"} inferred confidence; confirmed negative evidence affects the final decision while missing or unknown evidence does not.`,
    };
  });
}

export function buildReasoning(input: ReasoningInput): ReasoningOutput {
  const evidenceItems = [...input.evidenceItems].sort((a, b) => a.id.localeCompare(b.id));
  const steps = evidenceItems.map((item) => buildStep(item, evidenceItems));
  const contradictions = detectContradictions(evidenceItems);
  const output = { engineVersion: REASONING_ENGINE_VERSION, steps, contradictions, graph: buildReasoningGraph({ steps, contradictions, decision: input.decision }), summary: summarizeReasoning({ steps, contradictions, decision: input.decision }) };
  validateReasoning(output);
  return output;
}
