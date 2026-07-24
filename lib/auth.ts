import { supabaseFetch, isSupabaseConfigured } from "./supabase";
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
const devUsers = new Map<string, ShadowScoreUser & { password: string }>();

function makeId(prefix: string) {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${now}-${rand}`;
}

async function persistSession(session: ShadowScoreSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  if (session.accessToken) {
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: session.accessToken }) });
    if (!response.ok) throw new Error("Could not establish the workspace session.");
  }
}

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user: { id: string; email?: string; user_metadata?: { name?: string }; created_at?: string; last_sign_in_at?: string };
};

function toSession(response: SupabaseAuthResponse, fallbackName: string): ShadowScoreSession {
  const user = response.user;
  return {
    userId: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || fallbackName,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    startedAt: new Date().toISOString(),
  };
}

export async function signupUser(name: string, email: string, password: string) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanName) throw new Error("Name is required.");
  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("A valid email is required.");
  if (cleanPassword.length < 8) throw new Error("Password must be at least 8 characters.");

  if (isSupabaseConfigured()) {
    const auth = await supabaseFetch<SupabaseAuthResponse>("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword, data: { name: cleanName } }),
    });
    const session = toSession(auth, cleanName);
    await persistSession(session);
    return getCurrentUserFromSession(session);
  }

  if (devUsers.has(cleanEmail)) throw new Error("An account with this email already exists.");
  const now = new Date().toISOString();
  const user = { id: makeId("SSU"), name: cleanName, email: cleanEmail, password: cleanPassword, createdAt: now, lastLoginAt: now };
  devUsers.set(cleanEmail, user);
  await persistSession({ userId: user.id, email: user.email, name: user.name, startedAt: now });
  return user;
}

export async function loginUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (isSupabaseConfigured()) {
    const auth = await supabaseFetch<SupabaseAuthResponse>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });
    const session = toSession(auth, cleanEmail);
    await persistSession(session);
    return getCurrentUserFromSession(session);
  }

  const user = devUsers.get(cleanEmail);
  if (!user || user.password !== cleanPassword) throw new Error("Invalid email or password.");
  const updated = { ...user, lastLoginAt: new Date().toISOString() };
  devUsers.set(cleanEmail, updated);
  persistSession({ userId: updated.id, email: updated.email, name: updated.name, startedAt: new Date().toISOString() });
  return updated;
}

function getCurrentUserFromSession(session: ShadowScoreSession): ShadowScoreUser {
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    createdAt: session.startedAt,
    lastLoginAt: session.startedAt,
  };
}

export function getCurrentSession(): ShadowScoreSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || "null");
    return parsed?.userId && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): ShadowScoreUser | null {
  const session = getCurrentSession();
  return session ? getCurrentUserFromSession(session) : null;
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
