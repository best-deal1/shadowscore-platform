import assert from "node:assert/strict";
import test from "node:test";

import { classifyEmailInvestigation } from "../lib/emailDomains.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";
import { ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";

const corporateEmail = "sharon@shl.co.il";

test("corporate email routes to its domain and business without local-part identity expansion", () => {
  const routing = classifyEmailInvestigation(corporateEmail);
  assert.deepEqual(routing, {
    submittedSeed: corporateEmail,
    emailClassification: "CORPORATE_DOMAIN",
    primaryInvestigationEntity: "shl.co.il",
    primaryInvestigationType: "DOMAIN_BUSINESS_LEGAL_ENTITY",
    routingReason: "The address uses a custom domain, so the domain and associated business or legal entity are investigated before any mailbox identity.",
    domainInvestigated: "shl.co.il",
    localPartIdentityExpansionPermitted: false,
    localPartIdentityExpansionReason: "Mailbox identity expansion is withheld until independent evidence connects the mailbox to a person at the domain or associated organization.",
  });

  const plan = createExecutionPlan({ targetType: "Email", normalizedTarget: corporateEmail, confidence: 1, reasoning: "email", detectedPlatform: null });
  assert.deepEqual(plan.executionPlan.map((step) => step.engineId), ["email-intelligence", "domain", "whois", "ssl", "business-profile", "authoritative-company"]);
  assert.equal(plan.executionPlan.some((step) => step.engineId === "external-identity"), false);
  assert.equal(plan.emailRouting?.primaryInvestigationEntity, "shl.co.il");
});

test("corporate email identity provider fails closed before search even when invoked outside the planner", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => { fetchCount += 1; return Response.json({ web: { results: [{ title: "Sharon", url: "https://linkedin.com/in/unrelated-sharon", description: "Unrelated profile" }] } }); };
  try {
    const result = await new ExternalIdentityProvider().execute({ intakeId: "corporate-route", scanMode: "personal", target: corporateEmail, requestedTarget: corporateEmail, email: corporateEmail, platform: "Personal Identity", fileNames: [], visibleSignalCategories: [] });
    assert.equal(result.status, "completed");
    assert.equal(result.metadata.lookupPerformed, false);
    assert.equal(result.metadata.candidateCount, 0);
    assert.deepEqual(result.metadata.externalIdentityCandidates, []);
    assert.equal(result.evidence.length, 0);
    assert.equal(fetchCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("free-mail routing remains identity-first and never investigates provider infrastructure", () => {
  const routing = classifyEmailInvestigation("person@gmail.com");
  assert.equal(routing?.emailClassification, "FREE_MAIL");
  assert.equal(routing?.primaryInvestigationType, "PERSON_IDENTITY");
  assert.equal(routing?.localPartIdentityExpansionPermitted, true);
  const plan = createExecutionPlan({ targetType: "Email", normalizedTarget: "person@gmail.com", confidence: 1, reasoning: "email", detectedPlatform: null });
  assert.deepEqual(plan.executionPlan.map((step) => step.engineId), ["email-intelligence", "external-identity"]);
});
