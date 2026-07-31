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

test("login stores the browser session only after the server accepts its access token", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  const sessionStorage = storageWith(null);
  globalThis.window = { sessionStorage };
  globalThis.fetch = async (input) => {
    if (input === "https://example.supabase.co/auth/v1/token?grant_type=password") {
      return Response.json({ access_token: "access-token", refresh_token: "refresh-token", user: { id: "user-1", email: "person@example.com" } });
    }
    if (input === "/api/auth/session") return new Response(null, { status: 401 });
    throw new Error(`Unexpected request: ${input}`);
  };
  const { loginUser } = await import(`../lib/auth.ts?rejected=${Date.now()}`);

  await assert.rejects(() => loginUser("person@example.com", "password"), /Could not establish the workspace session/);
  assert.equal(sessionStorage.getItem("shadowscore.session.v19"), null);
});

test("signup without a Supabase access token does not create an authenticated browser session", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  const sessionStorage = storageWith(null);
  globalThis.window = { sessionStorage };
  globalThis.fetch = async () => Response.json({ user: { id: "user-1", email: "person@example.com" } });
  const { signupUser } = await import(`../lib/auth.ts?confirmation=${Date.now()}`);

  await assert.rejects(() => signupUser("Person", "person@example.com", "password"), /confirm your account/);
  assert.equal(sessionStorage.getItem("shadowscore.session.v19"), null);
});
