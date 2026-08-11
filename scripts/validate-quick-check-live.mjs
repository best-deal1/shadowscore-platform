import { performance } from "node:perf_hooks";

import { ProviderManager } from "../lib/providers/ProviderManager.ts";
import { createDefaultProviders } from "../lib/providers/defaultProviders.ts";
import { buildQuickCheckReport } from "../lib/quickCheck/report.ts";

const target = process.argv[2] || "https://www.gadgetdeals.co.il/";
const context = {
  intakeId: `live-quick-check-${Date.now().toString(36)}`,
  scanMode: "website",
  target,
  requestedTarget: target,
  platform: "Website / Business",
  fileNames: [],
  visibleSignalCategories: [],
  executionProfile: "free_preview",
  providerTimeoutMs: { http: 2_500, ssl: 2_000, whois: 2_500, dns: 1_000, reputation: 3_000 },
};

const started = performance.now();
const run = await new ProviderManager().registerMany(createDefaultProviders()).runFreePreview(context, { budgetMs: 12_000, concurrencyLimit: 5 });
const report = buildQuickCheckReport(run.providerResults);
const output = {
  target,
  sourcesSuccessfullyQueried: report.sourcesSuccessfullyQueried,
  actualEvidence: report.categories.filter((category) => category.evidence.length > 0),
  evidenceCoverage: report.evidenceCoverage,
  ShadowScore: report.score,
  decision: report.decision,
  evidenceGaps: report.evidenceGaps,
  runtimeMs: Math.round(performance.now() - started),
  providers: run.providerResults.map((result) => ({ id: result.providerId, status: result.status, durationMs: result.duration, evidenceCount: result.status === "completed" ? result.evidence.length : 0, error: result.errors[0] })),
};

console.log(JSON.stringify(output, null, 2));

if (report.decision === "PROCEED" && (report.evidenceCoverage < 70 || !report.categories.some((category) => category.id === "legal_identity" && category.status === "Verified"))) {
  throw new Error("Quick Check produced PROCEED without sufficient coverage and verified legal identity.");
}
