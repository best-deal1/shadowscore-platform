import assert from "node:assert/strict";

import {
  DecisionAccessError,
  DecisionConflictError,
  DecisionService,
  DecisionValidationError,
} from "../lib/workspace/decisions.ts";

const now = "2026-07-24T00:00:00Z";
const finding = {
  id: "i",
  publicId: "finding-1",
  title: "Registry mismatch",
  severity: "high",
  confidence: "high",
};
const actor = (role = "analyst", org = "org-a") => ({
  userId: "u",
  organizationId: org,
  role,
  name: "A",
  email: "a@x.com",
});

class Store {
  decision = null;

  async get(actorContext) {
    return actorContext.organizationId === "org-a"
      ? {
          decision: this.decision && this.dto(this.decision),
          availableFindings: [finding],
        }
      : null;
  }

  dto(decision) {
    const safe = { ...decision };
    delete safe.caseId;
    delete safe.organizationId;
    delete safe.createdBy;
    delete safe.updatedBy;
    return safe;
  }

  async create(actorContext, caseId, input) {
    if (this.decision) return null;
    this.decision = {
      id: "d",
      publicId: "decision-1",
      caseId,
      organizationId: actorContext.organizationId,
      ...input,
      findings: [finding],
      version: 1,
      createdBy: actorContext.userId,
      updatedBy: actorContext.userId,
      createdAt: now,
      updatedAt: now,
    };
    return this.decision;
  }

  async update(actorContext, caseId, input) {
    void actorContext;
    void caseId;
    if (!this.decision) return null;
    if (input.version !== this.decision.version) return "conflict";
    return Object.assign(this.decision, input, { version: input.version + 1 });
  }
}

const store = new Store();
const service = new DecisionService(store);
const valid = {
  outcome: "review",
  rationale: "Manual review is required for the ownership mismatch.",
  risk: "high",
  confidence: "high",
  recommendedActions: ["Verify ownership"],
  conditions: [],
  findingIds: ["finding-1"],
};

const decision = await service.create(actor(), "case-1", valid);
assert.equal(decision.version, 1);
assert.equal("organizationId" in decision, false);
await assert.rejects(
  () => service.create(actor("viewer"), "case-2", valid),
  DecisionAccessError,
);
await assert.rejects(
  () =>
    new DecisionService(new Store()).create(actor(), "case-1", {
      ...valid,
      findingIds: [],
    }),
  DecisionValidationError,
);
assert.equal(
  (
    await new DecisionService(new Store()).create(actor(), "case-1", {
      ...valid,
      outcome: "no_decision",
      findingIds: [],
    })
  ).outcome,
  "no_decision",
);
const updated = await service.update(actor(), "case-1", {
  ...valid,
  outcome: "pass",
  version: 1,
});
assert.equal(updated.version, 2);
await assert.rejects(
  () => service.update(actor(), "case-1", { ...valid, version: 1 }),
  DecisionConflictError,
);
await assert.rejects(() => service.get(actor("analyst", "org-b"), "case-1"));

console.log("decision workspace behavioral tests passed");
