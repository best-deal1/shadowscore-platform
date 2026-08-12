import assert from "node:assert/strict";
import test from "node:test";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function storageWith(session) {
  const values = new Map(session ? [["shadowscore.session.v19", JSON.stringify(session)]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test.afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  delete globalThis.window;
  delete globalThis.fetch;
});

test("configured Supabase rejects a legacy browser session without an access token", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  const sessionStorage = storageWith({ userId: "user-1", email: "person@example.com", name: "Person", startedAt: new Date().toISOString() });
  globalThis.window = { sessionStorage };
  const { getCurrentSession } = await import(`../lib/auth.ts?legacy=${Date.now()}`);

  assert.equal(getCurrentSession(), null);
  assert.equal(sessionStorage.getItem("shadowscore.session.v19"), null);
});

test("login uses only the same-origin server route", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  const sessionStorage = storageWith(null);
  globalThis.window = { sessionStorage };
  let request;
  globalThis.fetch = async (input, init) => {
    request = { input, init };
    return Response.json({ user: { id: "user-1", email: "person@example.com", name: "Person", createdAt: "" } });
  };
  const { loginUser } = await import(`../lib/auth.ts?rejected=${Date.now()}`);

  await loginUser("person@example.com", "password");
  assert.equal(request.input, "/api/auth/login");
  assert.deepEqual(JSON.parse(request.init.body), { email: "person@example.com", password: "password" });
  assert.doesNotMatch(sessionStorage.getItem("shadowscore.session.v19"), /accessToken|refreshToken/);
});

test("signup invokes exactly one same-origin request", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  const sessionStorage = storageWith(null);
  globalThis.window = { sessionStorage };
  let count = 0;
  globalThis.fetch = async (input, init) => {
    count += 1;
    assert.equal(input, "/api/auth/signup");
    assert.deepEqual(JSON.parse(init.body), { name: "Person", email: "person@example.com", password: "password" });
    return Response.json({ user: { id: "user-1", email: "person@example.com", name: "Person", createdAt: "" } });
  };
  const { signupUser } = await import(`../lib/auth.ts?confirmation=${Date.now()}`);

  await signupUser("Person", "person@example.com", "password");
  assert.equal(count, 1);
});

test("the public site restores a user from the server session after browser storage is cleared", async () => {
  const sessionStorage = storageWith(null);
  globalThis.window = { sessionStorage };
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/api/auth/session");
    assert.deepEqual(init, { cache: "no-store" });
    return Response.json({ user: { id: "user-1", email: "person@example.com", name: "Person", createdAt: "2026-08-03T00:00:00.000Z" } });
  };
  const { getAuthenticatedUser } = await import(`../lib/auth.ts?continuity=${Date.now()}`);

  assert.deepEqual(await getAuthenticatedUser(), {
    id: "user-1",
    email: "person@example.com",
    name: "Person",
    createdAt: "2026-08-03T00:00:00.000Z",
  });
});

test("an expired server session clears stale browser credentials", async () => {
  const sessionStorage = storageWith({ userId: "user-1", email: "person@example.com", accessToken: "expired" });
  globalThis.window = { sessionStorage };
  globalThis.fetch = async () => Response.json({ user: null }, { status: 401 });
  const { getAuthenticatedUser } = await import(`../lib/auth.ts?expired=${Date.now()}`);

  assert.equal(await getAuthenticatedUser(), null);
  assert.equal(sessionStorage.getItem("shadowscore.session.v19"), null);
});
