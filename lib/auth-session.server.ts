import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { supabaseFetch } from "./supabase";

export const ACCESS_TOKEN_COOKIE = "shadowscore_access_token";
export const REFRESH_TOKEN_COOKIE = "shadowscore_refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  priority: "high" as const,
};

export type SupabaseAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: { name?: string; full_name?: string };
};

export type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user: SupabaseAuthUser;
};

export function publicUser(user: SupabaseAuthUser) {
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || "Account",
    createdAt: user.created_at || "",
    lastLoginAt: user.last_sign_in_at,
  };
}

export function setAuthCookies(response: NextResponse, auth: SupabaseAuthResponse) {
  if (!auth.access_token || !auth.refresh_token) return;
  response.cookies.set(ACCESS_TOKEN_COOKIE, auth.access_token, { ...cookieOptions, maxAge: auth.expires_in ?? 3600 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function resolveServerSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    try {
      const user = await supabaseFetch<SupabaseAuthUser>("/auth/v1/user", {}, accessToken);
      return { accessToken, user };
    } catch {
      // Continue to the server-owned refresh token.
    }
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;
  try {
    const auth = await supabaseFetch<SupabaseAuthResponse>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!auth.access_token) return null;
    return { accessToken: auth.access_token, user: auth.user, refreshedAuth: auth };
  } catch {
    return null;
  }
}
