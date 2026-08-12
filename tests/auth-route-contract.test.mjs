import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("signup has one browser call and one server Supabase signup request", async () => {
  const [page, client, route] = await Promise.all([read("app/signup/page.tsx"), read("lib/auth.ts"), read("app/api/auth/signup/route.ts")]);
  assert.equal((page.match(/signupUser\(/g) || []).length, 1);
  assert.equal((client.match(/authenticate\("\/api\/auth\/signup"/g) || []).length, 1);
  assert.equal((route.match(/supabaseFetch<SupabaseAuthResponse>/g) || []).length, 1);
  assert.equal((route.match(/\/auth\/v1\/signup/g) || []).length, 1);
});

test("auth tokens remain in server-owned cookies", async () => {
  const [client, session, server] = await Promise.all([read("lib/auth.ts"), read("app/api/auth/session/route.ts"), read("lib/auth-session.server.ts")]);
  assert.doesNotMatch(client, /access_token|refresh_token|supabaseFetch/);
  assert.match(server, /httpOnly: true/);
  assert.match(server, /REFRESH_TOKEN_COOKIE/);
  assert.match(session, /clearAuthCookies/);
});

test("admin page and API authorize independently from the server profile role", async () => {
  const [layout, route, authorization] = await Promise.all([read("app/admin/layout.tsx"), read("app/api/admin/console/route.ts"), read("lib/admin.server.ts")]);
  assert.match(layout, /requireAdministrator/);
  assert.match(route, /authorizeAdministrator/);
  assert.match(authorization, /profiles\?id=eq\./);
  assert.match(authorization, /profiles\[0\]\?\.role !== "admin"/);
  assert.doesNotMatch(`${layout}\n${route}\n${authorization}`, /NEXT_PUBLIC_ADMIN/);
});
