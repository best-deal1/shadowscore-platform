"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useLocale } from "./LocaleProvider";
import { localeNames, locales, type Locale } from "../lib/i18n";
import {
  CONTACT_EMAIL,
  SUPPORT_EMAIL,
  LINKEDIN_URL,
  TIKTOK_URL,
  X_URL,
  YOUTUBE_URL,
} from "../lib/config";
import { getCurrentUser, type ShadowScoreUser } from "../lib/auth";

const primaryNav = [
  { href: "/investigations", label: "Investigations", key: "investigations" },
  { href: "/reports", label: "Reports", key: "reports" },
  { href: "/monitoring", label: "Monitoring", key: "monitoring" },
  { href: "/upgrade", label: "Plans", key: "plans" },
  { href: "/workspace", label: "Workspace", key: "workspace" },
  { href: "/account", label: "Account", key: "account" },
];

const mobilePublicNav = [
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
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

export default function ShadowScoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const { locale, t } = useLocale();
  const footerGroups = [
    {
      title: t.footer.product,
      links: [
        { href: "/intake", label: t.footer.start },
        { href: "/example-report", label: t.footer.example },
        { href: "/upgrade", label: t.nav.plans },
        { href: "/about", label: t.footer.methodology },
      ],
    },
    {
      title: t.footer.trust,
      links: [
        { href: "/security", label: t.footer.security },
        { href: "/privacy", label: t.footer.privacy },
        { href: "/terms", label: t.footer.terms },
      ],
    },
    {
      title: t.footer.access,
      links: [
        { href: "/contact", label: t.footer.contact },
        { href: "/login", label: t.footer.login },
        { href: "/signup", label: t.footer.account },
      ],
    },
  ];
  const setLocale = async (next: Locale) => {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    window.location.reload();
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useState<ShadowScoreUser | null>(() => getCurrentUser());

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="ShadowScore home"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <img
              src="/shadowscore-shield-v8.png"
              alt=""
              className="h-9 w-9 rounded-xl bg-black object-contain p-1"
            />
            <div className="text-xl font-black tracking-tight">
              Shadow<span className="text-red-500">Score</span>
            </div>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 text-sm font-bold lg:flex"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(pathname === item.href)}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {t.nav[item.key as keyof typeof t.nav] || item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <label className="sr-only" htmlFor="language-selector">
              {t.nav.language}
            </label>
            <select
              id="language-selector"
              aria-label={t.nav.language}
              value={locale}
              onChange={(event) => void setLocale(event.target.value as Locale)}
              className="rounded-full border border-white/15 bg-black px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {locales.map((item) => (
                <option key={item} value={item}>
                  {localeNames[item]}
                </option>
              ))}
            </select>
            {user ? (
              <span className="max-w-[180px] truncate rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">
                Connected: {user.email}
              </span>
            ) : (
              <Link href="/login" className={linkClass(pathname === "/login")}>
                {t.nav.signIn}
              </Link>
            )}
            <Link
              href="/intake"
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {t.nav.start}
            </Link>
          </div>

          <button
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-red-300 lg:hidden"
          >
            {t.nav.menu}
          </button>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            onClick={() => setMenuOpen(false)}
            className="border-t border-white/10 bg-black px-4 py-4 lg:hidden"
          >
            <div className="grid gap-2">
              <label className="sr-only" htmlFor="mobile-language-selector">
                {t.nav.language}
              </label>
              <select
                id="mobile-language-selector"
                aria-label={t.nav.language}
                value={locale}
                onChange={(event) =>
                  void setLocale(event.target.value as Locale)
                }
                className="rounded-xl border border-white/15 bg-black px-4 py-3 text-sm font-bold text-white"
              >
                {locales.map((item) => (
                  <option key={item} value={item}>
                    {localeNames[item]}
                  </option>
                ))}
              </select>
              <Link
                href="/intake"
                className="rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white"
              >
                {t.nav.start}
              </Link>
              {user ? (
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-100">
                  Connected: {user.email}
                </div>
              ) : (
                <Link
                  href="/login"
                  className={linkClass(pathname === "/login")}
                >
                  {t.nav.signIn}
                </Link>
              )}
              {[...primaryNav, ...mobilePublicNav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(pathname === item.href)}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {"key" in item
                    ? t.nav[item.key as keyof typeof t.nav]
                    : item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-black px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          {footerGroups.map((group) => (
            <nav
              key={group.title}
              aria-label={group.title}
              className="space-y-3"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
                {group.title}
              </h2>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-bold text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
          <nav aria-label={t.footer.connect} className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
              {t.footer.connect}
            </h2>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-bold text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap gap-3 text-xs text-zinc-500">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
            {CONTACT_EMAIL}
          </a>
          <span>•</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <p className="mx-auto mt-5 max-w-7xl text-xs leading-6 text-zinc-600">
          {t.footer.disclaimer}
        </p>
      </footer>
    </div>
  );
}
