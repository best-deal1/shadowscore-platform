/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
import { getAuthenticatedUser, getCurrentUser, logoutUser, type ShadowScoreUser } from "../lib/auth";
import { CANONICAL_LOGO_PATH } from "../lib/brand";

const primaryNav = [
  { href: "/platform", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/data", label: "Data" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
];

const workspaceNav = [
  { href: "/workspace", label: "Workspace" },
  { href: "/investigations", label: "Investigations" },
  { href: "/reports", label: "Reports" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/account", label: "Account" },
];

const routeLabels: Record<string, string> = {
  "/business-due-diligence": "Platform", "/sample-report": "Sample report",
  "/methodology": "Methodology", "/pricing": "Pricing", "/security": "Security",
  "/login": "Sign in", "/signup": "Create account", "/intake": "Start investigation",
  "/contact": "Contact", "/about": "About", "/privacy": "Privacy", "/terms": "Terms",
  "/account": "Account",
  "/workspace": "Workspace", "/investigations": "Investigations",
  "/reports": "Reports", "/archive": "Archive", "/monitoring": "Monitoring",
};

const mobilePublicNav = [
  { href: "/company", label: "Company" },
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
  return `ss-nav-link ${active ? "ss-nav-link-active" : ""}`;
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export default function ShadowScoreLayout({
  children,
  hideReviewMessaging = false,
}: {
  children: ReactNode;
  hideReviewMessaging?: boolean;
}) {
  const pathname = usePathname() || "/";
  const { locale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<ShadowScoreUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    let active = true;
    getAuthenticatedUser()
      .then((authenticatedUser) => {
        if (active) setUser(authenticatedUser);
      })
      .catch(() => {
        // Keep the local session visible during a temporary network failure.
      })
      .finally(() => {
        if (active) setAuthResolved(true);
      });
    const closeAccountMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("keydown", closeAccountMenu);
    return () => {
      active = false;
      window.removeEventListener("keydown", closeAccountMenu);
    };
  }, []);

  async function signOut() {
    await logoutUser();
    window.location.assign("/");
  }

  const footerGroups = [
    {
      title: t.footer.product,
      links: [
        { href: "/intake", label: t.footer.start },
        { href: "/platform", label: "Platform" },
        { href: "/solutions", label: "Solutions" },
        { href: "/product/executive-reports", label: "Executive Reports" },
        { href: "/product/monitoring", label: "Monitoring" },
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
      links: user
        ? [
            { href: "/workspace", label: "Workspace" },
            { href: "/account", label: "Profile" },
            { href: "/contact", label: t.footer.contact },
          ]
        : [
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
  return (
    <div className="ss-public-shell min-h-screen overflow-x-hidden text-white">
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 font-bold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <header className="ss-site-header sticky top-0 z-50">
        {!hideReviewMessaging ? <div className="ss-platform-bar">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
            <p className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Enterprise readiness review
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">Identity · Evidence · Access controls · Support</p>
          </div>
        </div> : null}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="ShadowScore home"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <Image
              src={CANONICAL_LOGO_PATH}
              alt=""
              width={160}
              height={80}
              unoptimized
              className="h-9 w-14 object-contain"
            />
            <div>
              <div className="text-lg font-black tracking-tight text-white">ShadowScore</div>
              <div className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500">Trust intelligence</div>
            </div>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 text-sm font-bold lg:flex"
          >
            {(user ? workspaceNav : primaryNav).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(isActiveRoute(pathname, item.href))}
                aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
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
            {!authResolved ? (
              <span className="h-10 w-28 animate-pulse rounded-full bg-white/[0.06]" aria-label="Checking account status" />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  aria-controls="public-account-menu"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex min-h-11 max-w-[220px] items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-300 text-[10px] font-black text-emerald-950">{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
                  <span className="truncate">{user.name || user.email}</span>
                  <span aria-hidden="true">⌄</span>
                </button>
                {accountOpen ? (
                  <div id="public-account-menu" className="absolute right-0 top-[calc(100%+0.65rem)] w-72 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/60">
                    <div className="border-b border-white/10 px-3 py-3">
                      <p className="text-xs font-bold text-white">Signed in</p>
                      <p className="mt-1 truncate text-xs text-zinc-400">{user.email}</p>
                    </div>
                    <Link href="/workspace" className="mt-2 block rounded-xl px-3 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-sky-300">Open workspace</Link>
                    <Link href="/account" className="block rounded-xl px-3 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-sky-300">Profile and account</Link>
                    <button type="button" onClick={() => void signOut()} className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-zinc-400 hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300">Sign out</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/login" className={linkClass(pathname === "/login")}>
                {t.nav.signIn}
              </Link>
            )}
            <Link
              href="/intake"
              className="ss-button ss-button-primary"
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
                className="ss-button ss-button-primary min-h-12 justify-center"
              >
                {t.nav.start}
              </Link>
              {!authResolved ? (
                <div className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" aria-label="Checking account status" />
              ) : user ? (
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                  <p className="truncate text-xs font-bold text-emerald-100">Signed in as {user.email}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link href="/workspace" className="rounded-xl bg-emerald-300 px-3 py-3 text-center text-sm font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-100">Workspace</Link>
                    <Link href="/account" className="rounded-xl border border-emerald-300/25 px-3 py-3 text-center text-sm font-bold text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100">Profile</Link>
                  </div>
                  <button type="button" onClick={() => void signOut()} className="mt-2 min-h-11 w-full rounded-xl text-sm font-bold text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100">Sign out</button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className={linkClass(pathname === "/login")}
                >
                  {t.nav.signIn}
                </Link>
              )}
              {[...(user ? workspaceNav : primaryNav), ...mobilePublicNav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(isActiveRoute(pathname, item.href))}
                  aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
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

      {!hideReviewMessaging ? <section className="ss-enterprise-readiness" aria-label="Enterprise readiness signals">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Enterprise review mode</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">ShadowScore is being evaluated as one connected SaaS experience across public pages, purchase, workspace, reporting, and account controls.</p>
          </div>
          <ul className="grid gap-2 text-xs font-bold text-slate-300 sm:grid-cols-2 lg:grid-cols-4" aria-label="Readiness checkpoints">
            <li><span aria-hidden="true">✓</span> Customer journeys</li>
            <li><span aria-hidden="true">✓</span> Trust indicators</li>
            <li><span aria-hidden="true">✓</span> Recovery states</li>
            <li><span aria-hidden="true">✓</span> Mobile access</li>
          </ul>
        </div>
      </section> : null}
      <div id="main-content">{children}</div>

      <footer className="border-t border-white/10 bg-[#070b12] px-5 py-12 sm:px-6">
        <div className="mx-auto mb-10 grid max-w-7xl gap-5 border-b border-white/10 pb-10 md:grid-cols-[1.25fr_1fr] md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">ShadowScore platform</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-white">Investigate businesses, preserve evidence, and deliver decisions from one workspace.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400 md:justify-self-end">The workspace is the product. An investigation is the workflow. A report is the decision-ready output.</p>
        </div>
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
