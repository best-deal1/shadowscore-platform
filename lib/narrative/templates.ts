import type { NarrativeFacts } from "./types";

function sentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function executiveSummaryTemplate(facts: NarrativeFacts): string[] {
  const opening = facts.decision === "High caution" || facts.decision === "Conflicting evidence detected"
    ? `${facts.businessName} needs additional review before important business activity because the available public record is not yet strong enough for confident reliance.`
    : facts.decision === "Safe to proceed" || facts.decision === "Strong public evidence"
      ? `${facts.businessName} shows a credible public business footprint with enough supporting signals to continue normal due diligence.`
      : `${facts.businessName} has some useful public signals, but the profile should be verified before larger commitments.`;

  const support = facts.positiveFindings.length > 0
    ? facts.positiveFindings.slice(0, 2).join(" ")
    : "The available review found limited confirmed public information.";

  const caution = facts.verificationNeeds.length > 0
    ? `The main follow-up is to confirm ${facts.verificationNeeds[0].toLowerCase()}`
    : "Routine documentation should still be retained for accountability";

  return [sentence(opening), sentence(`${support} ${caution}`)];
}

export function whatWeFoundTemplate(facts: NarrativeFacts): string[] {
  return [
    `${facts.businessName} is presented as ${facts.businessType.toLowerCase()} associated with ${facts.primaryDomain}.`,
    ...facts.positiveFindings.slice(0, 5),
    facts.relationshipCount > 0 ? `Public relationship mapping connected ${facts.relationshipCount} business relationship${facts.relationshipCount === 1 ? "" : "s"} across ${facts.entityCount} known entit${facts.entityCount === 1 ? "y" : "ies"}.` : "No broader public relationship map was confirmed from the supplied information.",
  ].map(sentence);
}

export function confidenceTemplate(facts: NarrativeFacts): string[] {
  const items = facts.positiveFindings.length > 0 ? facts.positiveFindings : ["There is at least some structured evidence available for review"];
  return [
    `The current confidence level is ${facts.confidence.toLowerCase()} with ${facts.coverage.toLowerCase()} coverage.`,
    ...items.slice(0, 4),
    facts.stabilitySummary ? `Prior business memory indicates ${facts.stabilitySummary.toLowerCase()}` : "No prior business memory was supplied to compare stability over time.",
  ].map(sentence);
}

export function verificationTemplate(facts: NarrativeFacts): string[] {
  const needs = facts.verificationNeeds.length > 0 ? facts.verificationNeeds : ["independent business identity and transaction documentation"];
  return [
    facts.hasContradictions ? "Inconsistent information was found." : "Some public information could not be independently verified.",
    ...needs.slice(0, 5),
  ].map(sentence);
}

export function nextStepsTemplate(facts: NarrativeFacts): string[] {
  const nextActions = facts.nextActions.length > 0 ? facts.nextActions : [facts.recommendation];
  return Array.from(new Set(nextActions.filter(Boolean))).slice(0, 5).map(sentence);
}

export function evidenceUsedTemplate(facts: NarrativeFacts): string[] {
  const evidence = facts.evidenceUsed.length > 0 ? facts.evidenceUsed : ["No named evidence item was supplied"];
  return evidence.slice(0, 8).map(sentence);
}
