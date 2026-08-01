"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { logoutUser } from "@/lib/auth";
import type { WorkspaceActor } from "@/lib/workspace/actor";
import { workspaceCopy } from "./workspace-copy";
import { workspaceActorDisplayName } from "./actor-display";

const navItems = [
  { label: "Investigations", href: "/workspace", paths: ["/workspace", "/cases", "/investigations"], icon: "▣" },
  { label: "Reports", href: "/reports", paths: ["/reports", "/report"], icon: "▤" },
  { label: "Monitoring", href: "/workspace/monitoring", paths: ["/workspace/monitoring", "/monitoring", "/watchlist"], icon: "◉" },
  { label: "Alerts", href: "/alerts", paths: ["/alerts"], icon: "!" },
  { label: "Archive", href: "/archive", paths: ["/archive"], icon: "↺" },
] as const;

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
          <span aria-hidden="true" className="workspace-mark">S</span><span>{copy.productName}</span>
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
              return <li key={item.href}><Link onClick={() => setMenuOpen(false)} className={`workspace-nav-link${current ? " is-current" : ""}`} href={item.href} aria-current={current ? "page" : undefined}><span aria-hidden="true" className="workspace-nav-icon">{item.icon}</span>{item.label}</Link></li>;
            })}
          </ul>
          {canOpenAdmin ? <div className="workspace-admin-nav"><p className="workspace-nav-label">Administration</p><Link onClick={() => setMenuOpen(false)} className={`workspace-nav-link${matchesPath(pathname, ["/admin"]) ? " is-current" : ""}`} href="/admin" aria-current={matchesPath(pathname, ["/admin"]) ? "page" : undefined}><span aria-hidden="true" className="workspace-nav-icon">⚙</span>Admin</Link></div> : null}
        </nav>
        <main className="workspace-content" id="workspace-content">{children}</main>
      </div>
    </div>
  );
}
