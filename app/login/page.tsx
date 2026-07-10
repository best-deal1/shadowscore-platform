"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { loginUser } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      router.push("/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">Secure workspace</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Welcome back to ShadowScore.</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">Sign in to view saved reports, business history, monitoring, account details and upgrade status.</p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            {["Recent scans", "Saved reports", "Business history", "Monitoring"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-bold">{item}</div>)}
          </div>
        </div>
        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl shadow-black/40">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">ShadowScore Account</div>
          <h2 className="mt-4 text-4xl font-black tracking-tight">Sign in</h2>
          <p className="mt-4 text-zinc-400">Access your professional risk workspace.</p>

          <form onSubmit={handleLogin} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-600/10 px-4 py-3 text-sm text-red-100">{error}</div>}
            <button type="submit" disabled={loading} className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500">
            New to ShadowScore? <Link href="/signup" className="font-bold text-white hover:text-red-200">Create an account</Link>
          </div>
          <p className="mt-6 text-xs leading-6 text-zinc-600">Authentication is Supabase-ready and falls back to a local development session when provider variables are not configured.</p>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
