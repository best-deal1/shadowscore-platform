import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveWorkspaceActor } from "../lib/workspace/actor.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("a confirmed customer with a missing membership receives a default owner workspace", async () => {
  const requests = [];
  let provisioned = false;
  const actor = await resolveWorkspaceActor("customer-token", async (path, init) => {
    requests.push({ path, method: init?.method || "GET" });
    if (path === "/auth/v1/user") return { id: "customer-1", email: "customer@example.com", user_metadata: { name: "Customer" } };
    if (path.includes("organization_memberships")) return provisioned ? [{ organization_id: "workspace-1", role: "owner", status: "active" }] : [];
    if (path === "/rest/v1/rpc/ensure_customer_workspace") { provisioned = true; return undefined; }
    if (path.includes("profiles")) return [{ full_name: "Customer" }];
    throw new Error(`Unexpected path: ${path}`);
  });

  assert.equal(actor.organizationId, "workspace-1");
  assert.equal(actor.role, "owner");
  assert.deepEqual(requests.find(({ path }) => path.includes("ensure_customer_workspace")), { path: "/rest/v1/rpc/ensure_customer_workspace", method: "POST" });
});

test("admin console trusts the authenticated cookie and persisted role, not request JSON or email", async () => {
  const [route, service, migration, legacyRoute] = await Promise.all([
    read("app/api/admin/console/route.ts"),
    read("lib/admin.ts"),
    read("supabase/migrations/20260811000000_auth_roles_and_workspace_recovery.sql"),
    read("app/admin-lite/page.tsx"),
  ]);
  assert.match(route, /resolveWebsiteSession\(request\)/);
  assert.match(route, /export async function GET/);
  assert.doesNotMatch(route, /request\.json|body\.session|body\.user/);
  assert.match(service, /getAdministratorRole\(session\)/);
  assert.doesNotMatch(service, /ADMIN_ALLOWLIST|ADMIN_EMAILS/);
  assert.match(migration, /role set default 'user'/);
  assert.match(migration, /public\.is_administrator\(\)/);
  assert.match(migration, /grant execute on function public\.ensure_customer_workspace\(\) to authenticated/);
  assert.match(legacyRoute, /redirect\("\/admin"\)/);
});

test("customers cannot replace a profile to promote their own persisted role", async () => {
  const migration = await read("supabase/migrations/20260811000000_auth_roles_and_workspace_recovery.sql");
  assert.match(migration, /drop policy if exists "Users can manage own profile"/);
  assert.match(migration, /for select to authenticated/);
  assert.match(migration, /for update to authenticated/);
  assert.doesNotMatch(migration, /for (?:all|insert|delete) to authenticated/);
});
