import { createObservation } from "../entityIntelligence/resolver";
import { demoEntities, demoObservations } from "../entityIntelligence/seed";
import { ContinuousResolutionEngine } from "./runtime";
import { ResolutionScheduler } from "./scheduler";

export const runtime = new ContinuousResolutionEngine({ entities: demoEntities, observations: demoObservations });
export const scheduler = new ResolutionScheduler(runtime);

runtime.addObservation(createObservation({
  observationId: "runtime-atlas-domain", workspaceId: "demo-workspace", source: "dns-monitor",
  sourceRecordId: "atlas.co.il/2026-07-26", attribute: "domain", observedValue: "atlas.co.il",
  observedAt: "2026-07-26T10:05:00.000Z", jurisdiction: "IL",
  evidenceReference: "evidence://dns-monitor/atlas.co.il/2026-07-26", reliability: .93,
}), "ent-atlas-il");

scheduler.enqueue({ idempotencyKey: "monitor-atlas-2026-07-27", reason: "new_observation", workspaceId: "demo-workspace", entityId: "ent-atlas-il", maxAttempts: 3,
  observation: createObservation({ observationId: "runtime-atlas-email", workspaceId: "demo-workspace", source: "website", sourceRecordId: "atlas/contact", attribute: "email", observedValue: "legal@atlas.co.il", observedAt: "2026-07-27T08:15:00.000Z", jurisdiction: "IL", evidenceReference: "evidence://website/atlas/contact", reliability: .81 }) });
