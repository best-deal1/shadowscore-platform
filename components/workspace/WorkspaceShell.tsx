import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { workspaceCopy } from "./workspace-copy";

const navItems = [
  { key: "cases", href: "/workspace", icon: "▣" },
  { key: "alerts", href: "/alerts", icon: "!" },
  { key: "monitoring", href: "/monitoring", icon: "◌" },
  { key: "evidence", href: "/workspace#evidence", icon: "◇" },
  { key: "timeline", href: "/workspace#timeline", icon: "↗" },
] as const;

export function WorkspaceShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const copy = workspaceCopy[locale];
  return (
    <div className="workspace-shell">
      <a className="workspace-skip-link" href="#workspace-content">{copy.skipToContent}</a>
      <header className="workspace-header">
        <Link className="workspace-brand" href="/workspace" aria-label={`${copy.productName} ${copy.workspace}`}>
          <span aria-hidden="true" className="workspace-mark">S</span>
          <span>{copy.productName}</span>
        </Link>
        <p className="workspace-context">{copy.workspace}</p>
        <div className="workspace-account">
          <span className="workspace-avatar" aria-hidden="true">A</span>
          <span className="workspace-account-name">Analyst</span>
        </div>
      </header>
      <div className="workspace-frame">
        <nav className="workspace-sidebar" aria-label={`${copy.workspace} navigation`}>
          <p className="workspace-nav-label">{copy.workspace}</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.key}>
                <Link className={`workspace-nav-link${item.key === "cases" ? " is-current" : ""}`} href={item.href} aria-current={item.key === "cases" ? "page" : undefined}>
                  <span aria-hidden="true" className="workspace-nav-icon">{item.icon}</span>
                  {copy[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="workspace-content" id="workspace-content">{children}</main>
      </div>
    </div>
  );
}
