import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";

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
