import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { fetchOrganizationQueue } from "../lib/workspace/queue.ts";

function authenticatedRequest(path) {
  return new NextRequest(`https://shadowscore.test${path}`, {
    headers: { cookie: "shadowscore_access_token=valid-token" },
  });
}

test("the investigations index has one server-side canonical redirect for RSC requests", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "user-1" }), { status: 200 });

  const response = await proxy(authenticatedRequest("/investigations?_rsc=flight-request"));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://shadowscore.test/workspace");
  assert.match(response.headers.get("cache-control"), /no-store/);

  const destination = await proxy(authenticatedRequest("/workspace"));
  assert.equal(destination.status, 200);
  assert.equal(destination.headers.get("location"), null);
});

test("workspace navigation contains no automatic investigations retry", async () => {
  const files = await Promise.all([
    readFile(new URL("../app/workspace/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/workspace/error.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/workspace/WorkspaceShell.tsx", import.meta.url), "utf8"),
  ]);
  const workspaceSource = files.join("\n");

  assert.doesNotMatch(workspaceSource, /router\.(?:push|replace|refresh)\([^)]*["'`]\/investigations/);
  assert.doesNotMatch(workspaceSource, /(?:setInterval|setTimeout)\s*\(/);
  assert.doesNotMatch(workspaceSource, /window\.location[^\n]*\/investigations/);
});

test("workspace links use the persisted investigation ID and the status page resolves its report", async () => {
  const queue = await fetchOrganizationQueue({ organizationId: "org-1" }, "token", async () => [{
    public_id: "case-public-1",
    investigation_id: "investigation-persisted-1",
    title: "Example business",
    status: "closed",
    priority: "normal",
    due_at: null,
    version: 1,
    updated_at: "2026-08-10T00:00:00.000Z",
  }]);
  assert.equal(queue.cases[0].id, "case-public-1");
  assert.equal(queue.cases[0].investigationId, "investigation-persisted-1");

  const workspace = await readFile(new URL("../components/workspace/InvestigationWorkspace.tsx", import.meta.url), "utf8");
  const detailsPage = await readFile(new URL("../app/investigations/[investigationId]/page.tsx", import.meta.url), "utf8");
  assert.match(workspace, /`\/investigations\/\$\{encodeURIComponent\(item\.investigationId\)\}`/);
  assert.doesNotMatch(workspace, /`\/investigations\/\$\{(?:item\.target|item\.id)\}`/);
  assert.match(detailsPage, /repository\.get\(investigationId\)/);
  assert.match(detailsPage, /`\/reports\/\$\{encodeURIComponent\(investigation\.reportId!\)\}`/);
  assert.doesNotMatch(detailsPage, /redirect\(`\/cases\//);
});

test("checkout completion has one workspace navigation per component", async () => {
  for (const file of ["../components/PaymentButtons.tsx", "../app/intake/page.tsx"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.equal(source.match(/window\.location\.assign\("\/workspace"\)/g)?.length, 1);
  }
});
