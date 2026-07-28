import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { WorkspaceActor } from "@/lib/workspace/actor";
import { workspaceCopy } from "./workspace-copy";
import { workspaceActorDisplayName } from "./actor-display";

const navItems = [{ label: "Cases", href: "/workspace", icon: "▣" }, { label: "Monitoring", href: "/workspace/monitoring", icon: "◉" }] as const;

export function WorkspaceShell({ children, locale, actor }: { children: React.ReactNode; locale: Locale; actor: WorkspaceActor }) {
  const copy = workspaceCopy[locale];
  const accountName = workspaceActorDisplayName(actor);
  const avatarInitial = accountName.slice(0, 1).toUpperCase();
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
          <span className="workspace-avatar" aria-hidden="true">{avatarInitial}</span>
          <span className="workspace-account-name">{accountName}</span>
        </div>
      </header>
      <div className="workspace-frame">
        <nav className="workspace-sidebar" aria-label={`${copy.workspace} navigation`}>
          <p className="workspace-nav-label">{copy.workspace}</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="workspace-nav-link" href={item.href}>
                  <span aria-hidden="true" className="workspace-nav-icon">{item.icon}</span>
                  {item.label}
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
