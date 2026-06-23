export type ShadowScoreUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type ShadowScoreSession = {
  userId: string;
  email: string;
  name: string;
  startedAt: string;
};

export const USERS_STORAGE_KEY = "shadowscoreUsers";
export const SESSION_STORAGE_KEY = "shadowscoreSession";

function readUsers(): ShadowScoreUser[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: ShadowScoreUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function makeId(prefix: string) {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${now}-${rand}`;
}

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(normalized);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return btoa(normalized);
}

export async function signupUser(name: string, email: string, password: string) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanName) throw new Error("Name is required.");
  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("A valid email is required.");
  if (cleanPassword.length < 8) throw new Error("Password must be at least 8 characters.");

  const users = readUsers();
  if (users.some((user) => user.email === cleanEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const user: ShadowScoreUser = {
    id: makeId("SSU"),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(cleanPassword),
    createdAt: now,
    lastLoginAt: now,
  };

  writeUsers([user, ...users]);
  setCurrentSession(user);
  return user;
}

export async function loginUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const users = readUsers();
  const user = users.find((item) => item.email === cleanEmail && item.passwordHash === passwordHash);

  if (!user) throw new Error("Invalid email or password.");

  const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
  writeUsers(users.map((item) => (item.id === user.id ? updatedUser : item)));
  setCurrentSession(updatedUser);
  return updatedUser;
}

export function setCurrentSession(user: ShadowScoreUser) {
  if (typeof window === "undefined") return;
  const session: ShadowScoreSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    startedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getCurrentSession(): ShadowScoreSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    return parsed?.userId && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): ShadowScoreUser | null {
  const session = getCurrentSession();
  if (!session) return null;
  const users = readUsers();
  return users.find((user) => user.id === session.userId) || null;
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
