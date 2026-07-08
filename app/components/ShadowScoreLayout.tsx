import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, SUPPORT_EMAIL, LINKEDIN_URL, TIKTOK_URL, X_URL, YOUTUBE_URL } from "../lib/config";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/security", label: "Security" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/upgrade", label: "Upgrade" },
  { href: "/contact", label: "Contact" },
];

export default function ShadowScoreLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <img src="/shadowscore-shield-v8.png" alt="ShadowScore" className="h-9 w-9 rounded-xl object-contain bg-black p-1" />
            <div>
              <div className="text-xl font-black tracking-tight">Shadow<span className="text-red-500">Score</span></div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Trust Intelligence</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <Link href="/intake" className="hover:text-white">Scan</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/monitoring" className="hover:text-white">Monitoring</Link>
            <Link href="/upgrade" className="hover:text-white">Upgrade</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
          <Link href="/intake" className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-950/40 hover:bg-red-500">Search a business</Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10 bg-black px-6 py-12 text-center">
        <Link href="/" className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-red-400/30 hover:text-white">
          Back to ShadowScore
        </Link>
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-500">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
          <span className="text-zinc-700">•</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">{SUPPORT_EMAIL}</a>
        </div>
        <div className="mt-7 text-xs font-bold uppercase tracking-[0.28em] text-zinc-700">Follow ShadowScore</div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:border-red-400/30 hover:text-white">LinkedIn</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:border-red-400/30 hover:text-white">TikTok</a>
          <a href={X_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:border-red-400/30 hover:text-white">X</a>
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:border-red-400/30 hover:text-white">YouTube</a>
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-xs leading-6 text-zinc-600">
          ShadowScore provides independent marketplace, reputation and payout risk intelligence only. It does not guarantee account recovery, payment release or legal outcomes.
        </p>
      </footer>
    </main>
  );
}
