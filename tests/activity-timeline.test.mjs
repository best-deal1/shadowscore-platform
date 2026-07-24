import assert from "node:assert/strict";
import { TimelineRepository } from "../lib/workspace/timelineRepository.ts";
import { TimelineService, TimelineValidationError } from "../lib/workspace/timeline.ts";
import { createTimelineRouteHandlers } from "../lib/workspace/timelineRoutes.ts";

const actor = { userId: "user-a", organizationId: "org-a", role: "analyst", name: "Alex", email: "alex@example.com" };
const event = (id, occurredAt, eventType = "case.updated") => ({ id, occurred_at: occurredAt, recorded_at: occurredAt, event_type: eventType, actor_type: "user", actor_id: "user-a", payload: { title: "Case updated", detail: "Priority changed" }, reference_ids: [] });

class MemoryTimelineStore {
  async list(_actor, caseId, query) {
    if (caseId === "missing") return null;
    return { events: [{ id: "event-a", occurredAt: "2026-07-24T01:00:00.000Z", recordedAt: "2026-07-24T01:01:00.000Z", eventType: "case.created", category: "case", actorType: "user", actorId: "user-a", title: "Case created", detail: "Case A", referenceIds: [] }], nextCursor: query.cursor || null };
  }
}
const service = new TimelineService(new MemoryTimelineStore());
assert.equal((await service.list(actor, "case-a")).events[0].category, "case");
await assert.rejects(() => service.list(actor, "case-a", { category: "invalid" }), TimelineValidationError);
await assert.rejects(() => service.list(actor, "case-a", { limit: 101 }), TimelineValidationError);
await assert.rejects(() => service.list(actor, "bad case"), TimelineValidationError);

const paths = [];
const repository = new TimelineRepository(async (path) => {
  paths.push(path);
  if (path.includes("/cases?")) return [{ id: "11111111-1111-1111-1111-111111111111" }];
  return [event("22222222-2222-2222-2222-222222222222", "2026-07-24T02:00:00.000Z"), event("33333333-3333-3333-3333-333333333333", "2026-07-24T01:00:00.000Z", "decision.recorded")];
}, "token");
const firstPage = await repository.list(actor, "case-a", { category: "all", cursor: "", limit: 1 });
assert.equal(firstPage.events.length, 1);
assert.match(firstPage.nextCursor, /^[A-Za-z0-9_-]+$/);
assert.match(paths[0], /public_id=eq\.case-a.*organization_id=eq\.org-a/);
assert.match(paths[1], /order=occurred_at.desc,id.desc/);
const decisionPage = await repository.list(actor, "case-a", { category: "decision", cursor: "", limit: 50 });
assert.equal(decisionPage.events[0].eventType, "decision.recorded");

const handlers = createTimelineRouteHandlers({ resolveActor: async (token) => { if (!token) throw new Error("no session"); return actor; }, service: () => service });
const response = await handlers.GET(new Request("http://localhost/api/cases/case-a/timeline?category=case&limit=10", { headers: { authorization: "Bearer token" } }), "case-a");
assert.equal(response.status, 200);
assert.equal((await response.json()).events[0].title, "Case created");
assert.equal((await handlers.GET(new Request("http://localhost/api/cases/case-a/timeline?limit=0", { headers: { authorization: "Bearer token" } }), "case-a")).status, 400);

console.log("activity timeline behavioral tests passed");
