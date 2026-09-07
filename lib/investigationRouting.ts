import { classifyEmailInvestigation, type EmailInvestigationRouting } from "./emailDomains";

export type InvestigationType = "PERSON_IDENTITY" | "DOMAIN_BUSINESS_LEGAL_ENTITY" | "MARKETPLACE_ENTITY" | "EVIDENCE_REVIEW";
export type InvestigationRouting = {
  version: "1";
  submittedSeed: string;
  primaryInvestigationEntity: string;
  primaryInvestigationType: InvestigationType;
  emailClassification?: EmailInvestigationRouting["emailClassification"];
  domainInvestigated?: string;
  localPartIdentityExpansionPermitted: boolean;
  routingReason: string;
};

type RoutingInput = { target: string; scanMode?: string; investigationRouting?: InvestigationRouting | null; submittedSeed?: string | null };

function isValidRouting(value: InvestigationRouting | null | undefined): value is InvestigationRouting {
  return Boolean(value?.submittedSeed && value.primaryInvestigationEntity && value.primaryInvestigationType);
}

/** Resolve intent once at intake. Persisted intent wins over legacy scan mode. */
export function resolveInvestigationRouting(input: RoutingInput): InvestigationRouting {
  if (isValidRouting(input.investigationRouting)) return input.investigationRouting;
  const submittedSeed = (input.submittedSeed || input.target).trim();
  const email = classifyEmailInvestigation(submittedSeed);
  if (email) return { version: "1", submittedSeed: email.submittedSeed, primaryInvestigationEntity: email.primaryInvestigationEntity, primaryInvestigationType: email.primaryInvestigationType, emailClassification: email.emailClassification, domainInvestigated: email.domainInvestigated, localPartIdentityExpansionPermitted: email.localPartIdentityExpansionPermitted, routingReason: email.routingReason };
  if (input.scanMode === "personal") return { version: "1", submittedSeed, primaryInvestigationEntity: submittedSeed, primaryInvestigationType: "PERSON_IDENTITY", localPartIdentityExpansionPermitted: false, routingReason: "The intake requested a personal identity investigation." };
  if (input.scanMode === "marketplace") return { version: "1", submittedSeed, primaryInvestigationEntity: submittedSeed, primaryInvestigationType: "MARKETPLACE_ENTITY", localPartIdentityExpansionPermitted: false, routingReason: "The intake requested a marketplace entity investigation." };
  if (input.scanMode === "evidence") return { version: "1", submittedSeed, primaryInvestigationEntity: submittedSeed, primaryInvestigationType: "EVIDENCE_REVIEW", localPartIdentityExpansionPermitted: false, routingReason: "The intake requested an evidence review." };
  return { version: "1", submittedSeed, primaryInvestigationEntity: submittedSeed.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase(), primaryInvestigationType: "DOMAIN_BUSINESS_LEGAL_ENTITY", localPartIdentityExpansionPermitted: false, routingReason: "The intake requested a domain, business, or legal entity investigation." };
}

export function reportRendererForRouting(routing: InvestigationRouting): "personal" | "business" {
  return routing.primaryInvestigationType === "PERSON_IDENTITY" ? "personal" : "business";
}
