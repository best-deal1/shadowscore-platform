"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { establishSession } from "@/lib/auth";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function confirmAccount() {
      const values = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = values.get("access_token");
      const refreshToken = values.get("refresh_token") || undefined;
      const expiresIn = Number(values.get("expires_in") || 3600);
      if (!accessToken) throw new Error("This confirmation link is invalid or has expired. Sign in to request a new session.");
      await establishSession(accessToken, refreshToken, Number.isFinite(expiresIn) ? expiresIn : 3600);
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace("/workspace");
    }
    void confirmAccount()
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Account confirmation failed."));
  }, []);

  return <main className="mx-auto max-w-xl px-6 py-24"><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8"><h1 className="text-3xl font-black">Confirming your account</h1>{error ? <><p role="alert" className="mt-4 text-red-200">{error}</p><Link href="/login" className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 font-bold text-white">Go to sign in</Link></> : <p role="status" className="mt-4 text-zinc-400">Your Workspace will open when confirmation is complete.</p>}</div></main>;
}
