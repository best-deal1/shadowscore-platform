import { supabaseFetch, isSupabaseConfigured } from "./supabase";
import { SITE_URL } from "./config";
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
const EMAIL_AUTH_REDIRECT_URL = SITE_URL;

function emailAuthPath(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}redirect_to=${encodeURIComponent(EMAIL_AUTH_REDIRECT_URL)}`;
}

async function persistSession(session: ShadowScoreSession) {
  if (typeof window === "undefined") return;
  if (session.accessToken) {
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: session.accessToken }) });
    if (!response.ok) throw new Error("Could not establish the workspace session.");
  }
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user: { id: string; email?: string; user_metadata?: { name?: string }; created_at?: string; last_sign_in_at?: string };
};

function toSession(response: SupabaseAuthResponse, fallbackName: string): ShadowScoreSession {
  if (!response.access_token) {
    throw new Error("Check your email to confirm your account, then sign in.");
  }
  const user = response.user;
  return {
    userId: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || fallbackName,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
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
    const auth = await supabaseFetch<SupabaseAuthResponse>(emailAuthPath("/auth/v1/signup"), {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword, data: { name: cleanName } }),
    });
    const session = toSession(auth, cleanName);
    await persistSession(session);
    return getCurrentUserFromSession(session);
  }

  throw new Error("Authentication is not configured.");
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

  throw new Error("Authentication is not configured.");
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
    if (!parsed?.userId || !parsed?.email) return null;
    if (!parsed.accessToken || (typeof parsed.expiresAt === "number" && parsed.expiresAt <= Date.now())) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getCurrentUser(): ShadowScoreUser | null {
  const session = getCurrentSession();
  return session ? getCurrentUserFromSession(session) : null;
}

export async function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "DELETE", cache: "no-store" });
  } catch {
    // Local credentials must still be removed when the network is unavailable.
  } finally {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
