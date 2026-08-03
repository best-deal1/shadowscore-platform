"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { logoutUser } from "@/lib/auth";
import type { WorkspaceActor } from "@/lib/workspace/actor";
import { workspaceCopy } from "./workspace-copy";
import { workspaceActorDisplayName } from "./actor-display";

const navItems = [
  { label: "Investigations", href: "/workspace", paths: ["/workspace", "/cases", "/investigations"], icon: "investigations" },
  { label: "Reports", href: "/reports", paths: ["/reports", "/report"], icon: "reports" },
  { label: "Monitoring", href: "/workspace/monitoring", paths: ["/workspace/monitoring", "/monitoring", "/watchlist"], icon: "monitoring" },
  { label: "Alerts", href: "/alerts", paths: ["/alerts"], icon: "alerts" },
  { label: "Archive", href: "/archive", paths: ["/archive"], icon: "archive" },
] as const;

function NavigationIcon({ name }: { name: (typeof navItems)[number]["icon"] | "admin" }) {
  const paths = {
    investigations: <><path d="M4 5.5h16v13H4z" /><path d="M8 9.5h8M8 13h5" /></>,
    reports: <><path d="M6 3.5h9l3 3v14H6z" /><path d="M15 3.5v4h4M9 12h6M9 16h6" /></>,
    monitoring: <><path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0" /><path d="M12 8v4l3 2" /></>,
    alerts: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20h4" /></>,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3z" /><path d="M9 11h6" /></>,
    admin: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" /><path d="M19 15a2 2 0 0 0 .4 2.1l.1.1-2.3 2.3-.1-.1A2 2 0 0 0 15 19a2 2 0 0 0-1 1.7v.2h-4v-.2A2 2 0 0 0 9 19a2 2 0 0 0-2.1.4l-.1.1-2.3-2.3.1-.1A2 2 0 0 0 5 15a2 2 0 0 0-1.7-1h-.2v-4h.2A2 2 0 0 0 5 9a2 2 0 0 0-.4-2.1l-.1-.1 2.3-2.3.1.1A2 2 0 0 0 9 5a2 2 0 0 0 1-1.7v-.2h4v.2A2 2 0 0 0 15 5a2 2 0 0 0 2.1-.4l.1-.1 2.3 2.3-.1.1A2 2 0 0 0 19 9a2 2 0 0 0 1.7 1h.2v4h-.2A2 2 0 0 0 19 15Z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || (path !== "/workspace" && pathname.startsWith(`${path}/`)));
}

export function WorkspaceShell({ children, locale, actor }: { children: React.ReactNode; locale: Locale; actor: WorkspaceActor }) {
  const copy = workspaceCopy[locale];
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountName = workspaceActorDisplayName(actor);
  const avatarInitial = accountName.slice(0, 1).toUpperCase();
  const canOpenAdmin = actor.role === "owner" || actor.role === "manager";

  async function signOut() {
    setSigningOut(true);
    await logoutUser();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="workspace-shell">
      <a className="workspace-skip-link" href="#workspace-content">{copy.skipToContent}</a>
      <header className="workspace-header">
        <Link className="workspace-brand" href="/workspace" aria-label={`${copy.productName} ${copy.workspace}`}>
          <Image src="/brand/shadowscore-infinity.svg" width={44} height={24} alt="" className="workspace-mark" />
          <span className="workspace-brand-name">{copy.productName}<small>Trust intelligence</small></span>
        </Link>
        <p className="workspace-context">{copy.workspace}</p>
        <button className="workspace-menu-button" type="button" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span> Menu
        </button>
        <div className="workspace-account">
          <span className="workspace-avatar" aria-hidden="true">{avatarInitial}</span>
          <span className="workspace-account-name"><strong>{accountName}</strong><small>{actor.role}</small></span>
          <button type="button" className="workspace-sign-out" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out" : "Sign out"}</button>
        </div>
      </header>
      <div className="workspace-frame">
        <nav id="workspace-navigation" className={`workspace-sidebar${menuOpen ? " is-open" : ""}`} aria-label={`${copy.workspace} navigation`}>
          <p className="workspace-nav-label">{copy.workspace}</p>
          <ul>
            {navItems.map((item) => {
              const current = matchesPath(pathname, item.paths);
              return <li key={item.href}><Link onClick={() => setMenuOpen(false)} className={`workspace-nav-link${current ? " is-current" : ""}`} href={item.href} aria-current={current ? "page" : undefined}><span className="workspace-nav-icon"><NavigationIcon name={item.icon} /></span>{item.label}</Link></li>;
            })}
          </ul>
          {canOpenAdmin ? <div className="workspace-admin-nav"><p className="workspace-nav-label">Administration</p><Link onClick={() => setMenuOpen(false)} className={`workspace-nav-link${matchesPath(pathname, ["/admin"]) ? " is-current" : ""}`} href="/admin" aria-current={matchesPath(pathname, ["/admin"]) ? "page" : undefined}><span className="workspace-nav-icon"><NavigationIcon name="admin" /></span>Admin</Link></div> : null}
          <div className="workspace-sidebar-footer">
            <span className="workspace-system-status"><span aria-hidden="true" /> Systems operational</span>
            <Link href="/security" onClick={() => setMenuOpen(false)}>Security and trust</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>Help and support</Link>
          </div>
        </nav>
        <main className="workspace-content" id="workspace-content">{children}</main>
      </div>
    </div>
  );
}
