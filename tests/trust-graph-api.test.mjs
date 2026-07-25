import assert from "node:assert/strict";
import test from "node:test";
import { createTrustGraphRouteHandlers } from "../lib/trustGraph/routes.ts";
import { InMemoryTrustGraphStore } from "../lib/trustGraph/store.ts";
import { TrustGraphService } from "../lib/trustGraph/service.ts";
import { WorkspaceAccessError } from "../lib/workspace/actor.ts";

const analyst = (organizationId) => ({ userId: `user-${organizationId}`, organizationId, role: "analyst", name: "Analyst", email: `${organizationId}@example.com` });
const entity = (canonicalName) => ({
  type: "Business",
  canonicalName,
  attributes: {},
  provenance: { source: "test", engine: "test", observedAt: "2026-07-25T00:00:00.000Z", ingestedAt: "2026-07-25T00:00:00.000Z" },
  confidence: 0.9,
});

function setup(role = "analyst") {
  const store = new InMemoryTrustGraphStore();
  const actors = { tokenA: { ...analyst("org-a"), role }, tokenB: analyst("org-b") };
  const handlers = createTrustGraphRouteHandlers({
    resolveActor: async (token) => {
      if (!token || !actors[token]) throw new WorkspaceAccessError("A workspace session is required.");
      return actors[token];
    },
    service: (actor) => new TrustGraphService(store, actor),
  });
  return { handlers, store };
}

const request = (path, token, method = "GET", body) => new Request(`https://example.test${path}`, {
  method,
  headers: { ...(token ? { cookie: `shadowscore_access_token=${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

test("every Trust Graph API operation requires a server-authenticated session", async () => {
  const { handlers } = setup();
  const calls = [
    handlers.getEntity(request("/api/entities/entity-1"), "entity-1"),
    handlers.upsertEntity(request("/api/entities/entity-1", undefined, "PUT", entity("Acme")), "entity-1"),
    handlers.getTimeline(request("/api/entities/entity-1/timeline"), "entity-1"),
    handlers.getTrust(request("/api/entities/entity-1/trust"), "entity-1"),
    handlers.getRelationships(request("/api/entities/entity-1/relationships"), "entity-1"),
    handlers.getDecisions(request("/api/entities/entity-1/decisions"), "entity-1"),
    handlers.setTrust(request("/api/trust", undefined, "POST", {})),
    handlers.createRelationship(request("/api/relationships", undefined, "POST", {})),
    handlers.recordDecision(request("/api/decisions", undefined, "POST", {})),
  ];
  for (const response of await Promise.all(calls)) assert.equal(response.status, 401);
});

test("entity data is isolated by the authenticated actor's organization", async () => {
  const { handlers } = setup();
  assert.equal((await handlers.upsertEntity(request("/api/entities/shared", "tokenA", "PUT", entity("Tenant A")), "shared")).status, 200);
  assert.equal((await handlers.getEntity(request("/api/entities/shared", "tokenB"), "shared")).status, 404);
  assert.equal((await handlers.getTimeline(request("/api/entities/shared/timeline", "tokenB"), "shared")).status, 404);

  assert.equal((await handlers.upsertEntity(request("/api/entities/shared", "tokenB", "PUT", entity("Tenant B")), "shared")).status, 200);
  const tenantA = await (await handlers.getEntity(request("/api/entities/shared", "tokenA"), "shared")).json();
  const tenantB = await (await handlers.getEntity(request("/api/entities/shared", "tokenB"), "shared")).json();
  assert.equal(tenantA.canonicalName, "Tenant A");
  assert.equal(tenantB.canonicalName, "Tenant B");
});

test("viewer membership can read but cannot modify the Trust Graph", async () => {
  const { handlers, store } = setup("viewer");
  new TrustGraphService(store, analyst("org-a")).upsertEntity({ ...entity("Acme"), id: "entity-1" });
  assert.equal((await handlers.getEntity(request("/api/entities/entity-1", "tokenA"), "entity-1")).status, 200);
  const response = await handlers.upsertEntity(request("/api/entities/entity-1", "tokenA", "PUT", entity("Changed")), "entity-1");
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "This role cannot modify the Trust Graph." });
});
