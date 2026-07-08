import { attachPaymentIntent, createPreviewInvestigation, markFailed, markGenerating, markReady, saveInvestigation } from "./lifecycle";
import { mapProviderExecutionToInvestigation } from "./mapper";
import type { Investigation } from "./types";

export const INVESTIGATION_LIFECYCLE_DIAGRAM = [
  "draft -> preview -> saved -> payment_pending -> generating -> ready",
  "generating -> failed",
  "ready -> monitoring -> archived",
  "failed -> archived",
].join("\n");

const exampleAt = "2026-01-01T00:00:00.000Z";
const providerFailure = {
  engineId: "whois",
  label: "WHOIS",
  order: 1,
  status: "failed" as const,
  providerId: "whois",
  reason: "Provider timeout",
  evidenceCount: 0,
  findingCount: 0,
  errors: ["timeout"],
};

export const sampleInvestigations: Record<string, Investigation> = (() => {
  const preview = createPreviewInvestigation({ target: "example.com", userId: "user-demo", createdAt: exampleAt });
  const saved = saveInvestigation(preview, "2026-01-01T00:01:00.000Z");
  const paymentPending = attachPaymentIntent(saved, "pi-demo", "2026-01-01T00:02:00.000Z");
  const generating = markGenerating(paymentPending, "2026-01-01T00:03:00.000Z");
  const ready = markReady(generating, {
    reportId: "rpt-demo",
    decision: "Verified enough to proceed",
    verificationScore: 82,
    narrativeSummary: "Public evidence supports proceeding with normal verification controls.",
    evidenceRefs: ["ev-demo-dns", "ev-demo-whois"],
  }, "2026-01-01T00:04:00.000Z");
  const failed = markFailed(mapProviderExecutionToInvestigation(generating, [providerFailure]), {
    narrativeSummary: "The investigation could not complete because a required provider failed.",
  }, "2026-01-01T00:05:00.000Z");
  const monitored = { ...ready, status: "monitoring" as const, outcome: "monitored" as const, updatedAt: "2026-01-01T00:06:00.000Z" };

  return {
    freePreview: preview,
    savedReport: saved,
    paymentPending,
    ready,
    failedProvider: failed,
    monitored,
  };
})();

export const INVESTIGATION_KNOWN_GAPS = [
  "No database persistence or cross-session hydration yet.",
  "Existing workspace reports are mapped, not replaced, so legacy report screens continue to use their current shape.",
  "Provider execution is summarized deterministically; no new providers are introduced.",
  "Ontology graph storage remains delegated to the existing ontology layer.",
] as const;
