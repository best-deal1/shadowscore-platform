import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";

const SESSION_KEY = "shadowscore.session.v19";

function storageWith(session) {
  const values = new Map(session ? [[SESSION_KEY, JSON.stringify(session)]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function protectedRequest(path = "/workspace", token) {
  return new NextRequest(`https://shadowscore.test${path}`, {
    headers: token ? { cookie: `shadowscore_access_token=${token}` } : {},
  });
}

test("logout clears the authenticated browser session after requesting server revocation", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  const sessionStorage = storageWith({ userId: "user-1", email: "person@example.com", accessToken: "token", startedAt: new Date().toISOString() });
  globalThis.window = { sessionStorage };
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input, init };
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const { logoutUser } = await import(`../lib/auth.ts?logout=${Date.now()}`);

  await logoutUser();

  assert.equal(request.input, "/api/auth/session");
  assert.equal(request.init.method, "DELETE");
  assert.equal(sessionStorage.getItem(SESSION_KEY), null);
});

test("refresh and browser Back requests redirect to login after logout", async () => {
  for (const path of ["/workspace", "/archive?from=back"]) {
    const response = await proxy(protectedRequest(path));
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location")).pathname, "/login");
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});

test("an expired Supabase session is cleared and redirected", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "expired" }), { status: 401 });

  const response = await proxy(protectedRequest("/investigations", "expired-token"));

  assert.equal(response.status, 307);
  assert.match(response.headers.get("set-cookie"), /shadowscore_access_token=;/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/i);
});

test("protected APIs reject access when the logout cookie is absent", async () => {
  const { resolveWorkspaceActor, WorkspaceAccessError } = await import("../lib/workspace/actor.ts");
  await assert.rejects(() => resolveWorkspaceActor(undefined, async () => assert.fail("Supabase must not be called without a session.")), WorkspaceAccessError);
  const route = await readFile(new URL("../app/api/collectors/route.ts", import.meta.url), "utf8");
  assert.match(route, /getWorkspaceAccessToken\(\)/);
  assert.match(route, /WorkspaceAccessError/);
  assert.match(route, /status:401/);
});
