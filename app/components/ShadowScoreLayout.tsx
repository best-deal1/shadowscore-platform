"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CONTACT_EMAIL, SUPPORT_EMAIL, LINKEDIN_URL, TIKTOK_URL, X_URL, YOUTUBE_URL } from "../lib/config";
import { getCurrentUser, type ShadowScoreUser } from "../../lib/auth";

const primaryNav = [
  { href: "/investigations", label: "Investigations" },
  { href: "/reports", label: "Reports" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/upgrade", label: "Plans" },
  { href: "/workspace", label: "Workspace" },
  { href: "/account", label: "Account" },
];

const mobilePublicNav = [
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const footerGroups = [
  { title: "Product", links: [
    { href: "/intake", label: "Start Investigation" },
    { href: "/example-report", label: "Example Report" },
    { href: "/upgrade", label: "Plans" },
    { href: "/about", label: "Methodology" },
  ]},
  { title: "Trust & Legal", links: [
    { href: "/security", label: "Security" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ]},
  { title: "Access", links: [
    { href: "/contact", label: "Contact" },
    { href: "/login", label: "Customer Login" },
    { href: "/signup", label: "Create Account" },
  ]},
];

const socialLinks = [
  { href: LINKEDIN_URL, label: "LinkedIn" },
  { href: TIKTOK_URL, label: "TikTok" },
  { href: X_URL, label: "X" },
  { href: YOUTUBE_URL, label: "YouTube" },
];

function linkClass(active: boolean) {
  return `rounded-full px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-red-300 ${active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`;
}

export default function ShadowScoreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useState<ShadowScoreUser | null>(() => getCurrentUser());

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="ShadowScore home" className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300">
            <img src="/shadowscore-shield-v8.png" alt="" className="h-9 w-9 rounded-xl bg-black object-contain p-1" />
            <div className="text-xl font-black tracking-tight">Shadow<span className="text-red-500">Score</span></div>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm font-bold lg:flex">
            {primaryNav.map((item) => <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? <span className="max-w-[180px] truncate rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">Connected: {user.email}</span> : <Link href="/login" className={linkClass(pathname === "/login")}>Sign In</Link>}
            <Link href="/intake" className="rounded-full bg-red-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300">Start Investigation</Link>
          </div>

          <button type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-red-300 lg:hidden">
            Menu
          </button>
        </div>
        {menuOpen ? (
          <nav id="mobile-navigation" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)} className="border-t border-white/10 bg-black px-4 py-4 lg:hidden">
            <div className="grid gap-2">
              <Link href="/intake" className="rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white">Start Investigation</Link>
              {user ? <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-100">Connected: {user.email}</div> : <Link href="/login" className={linkClass(pathname === "/login")}>Sign In</Link>}
              {[...primaryNav, ...mobilePublicNav].map((item) => <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
            </div>
          </nav>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-black px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/shadowscore-shield-v8.png" alt="" className="h-10 w-10 rounded-xl bg-black object-contain p-1" />
              <div className="text-2xl font-black tracking-tight">Shadow<span className="text-red-500">Score</span></div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">Digital trust intelligence for investigating business identity, online reputation signals, and evidence-backed risk before critical decisions.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Ready to investigate?</div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Start with a website, company, seller, email or phone number.</p>
            <Link href="/intake" className="mt-5 inline-flex rounded-full bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-red-500">Start Investigation</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} footer`} className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">{group.title}</h2>
              {group.links.map((link) => <Link key={link.href} href={link.href} className="block text-sm font-bold text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300">{link.label}</Link>)}
            </nav>
          ))}
          <nav aria-label="Connect footer" className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Connect</h2>
            {socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="block text-sm font-bold text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300">{link.label}</a>)}
          </nav>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>© 2026 ShadowScore</span><span>•</span><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a><span>•</span><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">{SUPPORT_EMAIL}</a>
        </div>
        <p className="mx-auto mt-5 max-w-7xl text-xs leading-6 text-zinc-600">ShadowScore provides independent digital business identity intelligence. It does not guarantee account recovery, payment release, legal outcomes or third-party decisions.</p>
      </footer>
    </div>
  );
}
