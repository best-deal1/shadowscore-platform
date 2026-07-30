"use client";

import Link from "next/link";
import Image from "next/image";
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
  { href: "/business-due-diligence", label: "Product" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/methodology", label: "Methodology" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
];

const routeLabels: Record<string, string> = {
  "/business-due-diligence": "Product", "/sample-report": "Sample report",
  "/methodology": "Methodology", "/pricing": "Pricing", "/security": "Security",
  "/login": "Sign in", "/signup": "Create account", "/intake": "Start investigation",
  "/contact": "Contact", "/about": "About", "/privacy": "Privacy", "/terms": "Terms",
};

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
  return `min-h-11 rounded-full px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-red-300 ${active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`;
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
        { href: "/sample-report", label: t.footer.example },
        { href: "/pricing", label: t.nav.plans },
        { href: "/methodology", label: t.footer.methodology },
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
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 font-bold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="ShadowScore home"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <Image
              src="/brand/shadowscore-infinity.svg"
              alt=""
              width={160}
              height={80}
              className="h-9 w-14 object-contain"
            />
            <div className="text-xl font-black tracking-tight text-white">
              ShadowScore
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
                {item.label}
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
              className="rounded-full bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
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
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-red-300 lg:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">{menuOpen ? "×" : "☰"}</span>
            {t.nav.menu}
          </button>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-white/10 bg-black px-4 py-4 shadow-2xl lg:hidden"
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
                className="min-h-12 rounded-xl border border-white/15 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                {locales.map((item) => (
                  <option key={item} value={item}>
                    {localeNames[item]}
                  </option>
                ))}
              </select>
              <Link
                href="/intake"
                className="min-h-12 rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-red-300"
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
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      {pathname !== "/" && routeLabels[pathname] ? (
        <nav aria-label="Breadcrumb" className="border-b border-white/[.07] bg-zinc-950/80 px-5 py-3">
          <ol className="mx-auto flex max-w-7xl items-center gap-2 text-xs font-bold text-zinc-400">
            <li><Link href="/" className="rounded text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300">Home</Link></li>
            <li aria-hidden="true" className="text-zinc-600">/</li>
            <li aria-current="page" className="text-zinc-500">{routeLabels[pathname]}</li>
          </ol>
        </nav>
      ) : null}
      <div id="main-content">{children}</div>

      <footer className="border-t border-white/10 bg-black px-5 py-12 sm:px-6">
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
