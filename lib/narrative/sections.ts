import { decisionCostTemplate, evidenceUsedTemplate, executiveSummaryTemplate, confidenceTemplate, investigationStoryTemplate, nextStepsTemplate, verificationTemplate, whatWeFoundTemplate } from "./templates";
import type { BusinessNarrativeSection, NarrativeFacts } from "./types";

export function buildNarrativeSections(facts: NarrativeFacts): BusinessNarrativeSection[] {
  return [
    { id: "executiveSummary", title: "Executive Summary", body: executiveSummaryTemplate(facts).slice(0, 3) },
    { id: "whatWeFound", title: "What We Found", body: whatWeFoundTemplate(facts) },
    { id: "whatIncreasesConfidence", title: "What Increases Confidence", body: confidenceTemplate(facts) },
    { id: "whatRequiresVerification", title: "What Requires Verification", body: verificationTemplate(facts) },
    { id: "recommendedNextSteps", title: "Recommended Next Steps", body: nextStepsTemplate(facts) },
    { id: "decisionCost", title: "Cost of Uncertainty", body: decisionCostTemplate(facts) },
    { id: "investigationStory", title: "Investigation Story", body: investigationStoryTemplate(facts) },
    { id: "evidenceUsed", title: "Evidence Used", body: evidenceUsedTemplate(facts) },
  ];
}
