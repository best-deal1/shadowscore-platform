import type { WorkspaceSession } from "./workspace";

export type ShadowScoreUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type ShadowScoreSession = WorkspaceSession;

const SESSION_STORAGE_KEY = "shadowscore.session.v19";

function storedUser(): ShadowScoreUser | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (parsed?.id && parsed?.email) return parsed;
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

function storeUser(user: ShadowScoreUser) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

async function authenticate(path: "/api/auth/signup" | "/api/auth/login", body: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { user?: ShadowScoreUser; error?: string };
  if (!response.ok || !payload.user) throw new Error(payload.error || "Authentication failed.");
  storeUser(payload.user);
  return payload.user;
}

export async function signupUser(name: string, email: string, password: string) {
  return authenticate("/api/auth/signup", { name: name.trim(), email: email.trim().toLowerCase(), password: password.trim() });
}

export async function loginUser(email: string, password: string) {
  return authenticate("/api/auth/login", { email: email.trim().toLowerCase(), password: password.trim() });
}

export function getCurrentSession(): ShadowScoreSession | null {
  const user = storedUser();
  if (!user) return null;
  return { userId: user.id, email: user.email, name: user.name, startedAt: user.lastLoginAt || user.createdAt || new Date(0).toISOString() };
}

export function getCurrentUser() {
  return storedUser();
}

export async function getAuthenticatedUser(): Promise<ShadowScoreUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (response.status === 401) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
  if (!response.ok) throw new Error("Could not confirm the account session.");
  const payload = await response.json() as { user?: ShadowScoreUser | null };
  if (payload.user) storeUser(payload.user);
  return payload.user || null;
}

export async function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "DELETE", cache: "no-store" });
  } finally {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
