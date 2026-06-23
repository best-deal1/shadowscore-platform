"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { signupUser } from "../../lib/auth";

export default function SignupPage() {
  const router = useRouter();
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
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      await signupUser(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl shadow-black/40">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">Create Workspace</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Create your ShadowScore account</h1>
          <p className="mt-4 text-zinc-400">Save reports, track watched entities and keep your legal acceptance history in one place.</p>

          <form onSubmit={handleSignup} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-zinc-300">
              Confirm Password
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none focus:border-red-400/50" />
            </label>

            <label className="flex gap-3 rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-6 text-zinc-400">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                I agree to the <Link href="/terms" className="font-bold text-white hover:text-red-200">Terms of Service</Link> and <Link href="/privacy" className="font-bold text-white hover:text-red-200">Privacy Policy</Link>. I understand ShadowScore provides analytical risk intelligence only and does not guarantee business outcomes.
              </span>
            </label>

            {error && <div className="rounded-2xl border border-red-400/30 bg-red-600/10 px-4 py-3 text-sm text-red-100">{error}</div>}
            <button disabled={loading || !accepted} className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500">
            Already have an account? <Link href="/login" className="font-bold text-white hover:text-red-200">Sign in</Link>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
