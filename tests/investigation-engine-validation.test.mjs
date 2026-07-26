import assert from "node:assert/strict";
import test from "node:test";

import { buildDecision } from "../lib/decisionEngine/index.ts";
import { companyEvidenceFor, resolveCompanyTarget } from "../lib/providers/companyEvidenceCatalog.ts";
import { ReputationProvider } from "../lib/providers/productionProviders.ts";

const companies = ["Microsoft", "Apple", "NVIDIA", "OpenAI", "Stripe", "PayPal", "Amazon", "Google", "FTX", "Theranos", "Wirecard", "Celsius"];
const highRisk = new Set(["FTX", "Theranos", "Wirecard", "Celsius"]);

async function investigate(name) {
  const resolution = resolveCompanyTarget(name);
  const providerResult = await new ReputationProvider().execute({
    intakeId: `validation-${resolution.company?.id}`,
    scanMode: "company",
    target: resolution.resolvedTarget,
    requestedTarget: resolution.requestedTarget,
    companyId: resolution.company?.id,
    companyTicker: resolution.company?.ticker,
    platform: "validation",
    fileNames: [],
    visibleSignalCategories: [],
  });
  const decision = buildDecision({ providerResults: [providerResult], audience: "paid", targetType: "business" });
  return { resolution, providerResult, decision };
}

test("company names resolve to distinct provider targets and execute evidence collection", async () => {
  const reports = await Promise.all(companies.map(investigate));
  assert.equal(new Set(reports.map((report) => report.resolution.resolvedTarget)).size, companies.length);
  assert.ok(reports.every((report) => report.providerResult.status === "completed"));
  assert.ok(reports.every((report) => report.providerResult.metadata.lookupPerformed === true));
  assert.equal(new Set(reports.map((report) => JSON.stringify(report.providerResult.evidence))).size, companies.length);
});

test("official historical risk evidence changes findings and trust decisions", async () => {
  for (const name of companies) {
    const report = await investigate(name);
    if (highRisk.has(name)) {
      assert.equal(report.decision.decision, "FAIL", `${name} should be blocked by confirmed official evidence`);
      assert.ok(report.providerResult.findings.length > 0, `${name} should include a historical risk finding`);
      assert.match(report.providerResult.evidence.at(-1)?.source || "", /^https:\/\/(www\.)?(sec\.gov|justice\.gov)/);
    } else {
      assert.notEqual(report.decision.decision, "FAIL", `${name} should not inherit another company's risk evidence`);
      assert.equal(report.providerResult.findings.length, 0);
    }
  }
});

test("unknown company names do not receive fabricated identity resolution", () => {
  const resolution = resolveCompanyTarget("Unlisted Example Company");
  assert.equal(resolution.resolvedTarget, "Unlisted Example Company");
  assert.equal(companyEvidenceFor("Unlisted Example Company"), undefined);
});
