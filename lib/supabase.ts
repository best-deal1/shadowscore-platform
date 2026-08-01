export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ""), anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function requireSupabaseInProduction() {
  if (process.env.NODE_ENV === "production" && !isSupabaseConfigured()) {
    throw new Error("Persistent workspace storage is not configured.");
  }
}

export function requirePersistentSessionInProduction(accessToken?: string) {
  requireSupabaseInProduction();
  if (process.env.NODE_ENV === "production" && !accessToken) {
    throw new Error("An authenticated persistent workspace session is required.");
  }
}

export async function supabaseFetch<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const headers = new Headers(init.headers);
  headers.set("apikey", config.anonKey);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${config.url}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.msg || body?.message || body?.error_description || body?.error || "Supabase request failed.";
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Supabase returned an invalid JSON response (${response.status}).`);
  }
}
