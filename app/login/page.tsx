"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { loginUser } from "../../lib/auth";
import { useLocale } from "../../components/LocaleProvider";
import { getUserPageCopy } from "../../lib/i18n";

export default function LoginPage() {
  const { locale } = useLocale();
  const page = getUserPageCopy(locale).login;
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
      const requested = new URLSearchParams(window.location.search).get("returnTo") || "/workspace";
      window.location.assign(requested.startsWith("/") && !requested.startsWith("//") ? requested : "/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : page.unavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">{page.eyebrow}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{page.title}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">{page.description}</p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            {page.benefits.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-bold">{item}</div>)}
          </div>
        </div>
        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl shadow-black/40">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">{page.account}</div>
          <h2 className="mt-4 text-4xl font-black tracking-tight">{page.signIn}</h2>
          <p className="mt-4 text-zinc-400">{page.access}</p>

          <form onSubmit={handleLogin} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.email}
              <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.password}
              <input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <Link href="/forgot-password" className="justify-self-end text-sm font-bold text-zinc-300 hover:text-white">Forgot password?</Link>
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-600/10 px-4 py-3 text-sm text-red-100">{error}</div>}
            <button type="submit" disabled={loading} className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? page.signingIn : page.signIn}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500">
            {page.newAccount} <Link href={typeof window === "undefined" ? "/signup" : `/signup${window.location.search}`} className="font-bold text-white hover:text-red-200">{page.createAccount}</Link>
          </div>
          <p className="mt-6 text-xs leading-6 text-zinc-600">{page.authentication}</p>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
