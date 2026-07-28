"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { signupUser } from "../../lib/auth";
import { useLocale } from "../../components/LocaleProvider";
import { getUserPageCopy } from "../../lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const page = getUserPageCopy(locale).signup;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(page.passwordMismatch);
      return;
    }
    if (!accepted) {
      setError(page.acceptanceRequired);
      return;
    }
    setLoading(true);
    try {
      await signupUser(name, email, password);
      const requested = new URLSearchParams(window.location.search).get("returnTo") || "/workspace";
      router.push(requested.startsWith("/") && !requested.startsWith("//") ? requested : "/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : page.unavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl shadow-black/40">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">{page.eyebrow}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{page.title}</h1>
          <p className="mt-4 text-zinc-400">{page.description}</p>

          <form onSubmit={handleSignup} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.name}
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.email}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.password}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              {page.confirmPassword}
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>

            <label className="flex gap-3 rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-6 text-zinc-400">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                {page.agreementStart} <Link href="/terms" className="font-bold text-white hover:text-red-200">{page.terms}</Link> {page.agreementJoin} <Link href="/privacy" className="font-bold text-white hover:text-red-200">{page.privacy}</Link>. {page.agreementEnd}
              </span>
            </label>

            {error && <div className="rounded-2xl border border-red-400/30 bg-red-600/10 px-4 py-3 text-sm text-red-100">{error}</div>}
            <button type="submit" disabled={loading || !accepted} className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? page.creating : page.create}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500">
            {page.existing} <Link href={typeof window === "undefined" ? "/login" : `/login${window.location.search}`} className="font-bold text-white hover:text-red-200">{page.signIn}</Link>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
