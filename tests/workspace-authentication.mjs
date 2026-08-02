import assert from "node:assert/strict";
import { resolveWorkspaceActor, WorkspaceAccessError } from "../lib/workspace/actor.ts";
import { fetchOrganizationQueue } from "../lib/workspace/queue.ts";
import { workspaceActorDisplayName } from "../components/workspace/actor-display.ts";

const activeMembership = { organization_id: "org-a", role: "analyst", status: "active" };
const user = { id: "user-a", email: "alex@example.com", user_metadata: { name: "Alex" } };

async function actorRequest(path) {
  if (path === "/auth/v1/user") return user;
  if (path.includes("organization_memberships")) return [activeMembership];
  if (path.includes("profiles")) return [{ full_name: "Alex Morgan" }];
  throw new Error(`Unexpected path: ${path}`);
}

await assert.rejects(() => resolveWorkspaceActor(undefined, actorRequest), WorkspaceAccessError);
await assert.rejects(
  () => resolveWorkspaceActor("token", async (path) => path === "/auth/v1/user" ? user : path.includes("organization_memberships") ? [{ ...activeMembership, status: "disabled" }] : []),
  WorkspaceAccessError,
);

const queriedPaths = [];
const queue = await fetchOrganizationQueue({ organizationId: "org-a" }, "token", async (path) => {
  queriedPaths.push(path);
  return [{ public_id: "case-a", title: "Organization A case", investigation_id: "Target A", status: "active", priority: "high", due_at: null, updated_at: "2026-07-24T00:00:00.000Z" }];
});
assert.match(queriedPaths[0], /organization_id=eq\.org-a/);
assert.doesNotMatch(decodeURIComponent(queriedPaths[0]), /profiles|cases_owner_id_fkey/);
assert.deepEqual(queue.cases.map((item) => item.id), ["case-a"]);
assert.equal(queue.cases[0].ownerName, null);
assert.equal("organization_id" in queue.cases[0], false);
assert.equal("owner_id" in queue.cases[0], false);

const organizationBQueue = await fetchOrganizationQueue({ organizationId: "org-b" }, "token", async (path) => {
  assert.match(path, /organization_id=eq\.org-b/);
  return [];
});
assert.deepEqual(organizationBQueue.cases, []);
assert.equal(workspaceActorDisplayName({ name: "Alex Morgan", email: "alex@example.com" }), "Alex Morgan");
console.log("workspace authentication tests passed");
