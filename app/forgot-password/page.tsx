"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await requestPasswordReset(email);
      setStatus("sent");
      setMessage("If an account matches this address, password recovery instructions will arrive by email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Password recovery is temporarily unavailable.");
    }
  }

  return <ShadowScoreLayout><main className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:py-24">
    <section><p className="text-xs font-black uppercase tracking-[.3em] text-red-300">Account recovery</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Reset your password</h1><p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">Enter the email used for your ShadowScore account. We will request a secure recovery link from the authentication service.</p><Link href="/login" className="mt-7 inline-flex font-bold text-white hover:text-red-200">← Return to sign in</Link></section>
    <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-7 shadow-2xl shadow-black/40 sm:p-9" aria-labelledby="recovery-form-title"><h2 id="recovery-form-title" className="text-2xl font-black">Send recovery instructions</h2><p className="mt-3 text-sm leading-6 text-zinc-400">For account privacy, the confirmation does not disclose whether an email address is registered.</p>
      <form className="mt-7 grid gap-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold text-zinc-300">Email address<input required autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-300/30" /></label><button type="submit" disabled={status === "loading" || status === "sent"} className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{status === "loading" ? "Sending instructions" : status === "sent" ? "Instructions requested" : "Send recovery instructions"}</button></form>
      {message ? <p role="status" aria-live="polite" className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${status === "sent" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>{message}</p> : null}
      <p className="mt-6 text-sm text-zinc-500">Still need help? <Link href="/contact" className="font-bold text-white hover:text-red-200">Contact support</Link>.</p>
    </section>
  </main></ShadowScoreLayout>;
}
