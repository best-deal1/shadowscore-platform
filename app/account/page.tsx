import Link from "next/link";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { listWorkspaceQueue } from "@/lib/workspace/queue.server";

function AccountIcon({ name }: { name: "profile" | "organization" | "billing" | "security" | "support" | "access" }) {
  const paths = {
    profile: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></>,
    organization: <><path d="M4 20V7l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M9 20v-3h6v3" /></>,
    billing: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    security: <><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    support: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 0 1 5.2 1c0 2-2.7 2.2-2.7 4M12 17h.01" /></>,
    access: <><path d="M12 3 4 7v5c0 4 3 7.5 8 9 5-1.5 8-5 8-9V7l-8-4Z" /><path d="M9 12h6M12 9v6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default async function AccountPage() {
  const actor = await requireWorkspaceActor();
  const queue = await listWorkspaceQueue(actor);
  const displayRole = actor.role.charAt(0).toUpperCase() + actor.role.slice(1);

  return <section className="account-center" aria-labelledby="account-title">
    <header className="account-hero">
      <div>
        <p className="workspace-eyebrow">Account center</p>
        <h1 id="account-title">Your ShadowScore account</h1>
        <p>Review your profile, organization access, purchases, and support options.</p>
      </div>
      <span className="account-session-status"><span aria-hidden="true" /> Secure session</span>
    </header>

    <section className="account-identity" aria-labelledby="profile-heading">
      <div className="account-avatar-large" aria-hidden="true">{actor.name.slice(0, 1).toUpperCase()}</div>
      <div><p>Personal information</p><h2 id="profile-heading">{actor.name}</h2><a href={`mailto:${actor.email}`}>{actor.email}</a></div>
      <dl><div><dt>Account role</dt><dd>{displayRole}</dd></div><div><dt>Account status</dt><dd><span className="account-good">Active</span></dd></div></dl>
    </section>

    <div className="account-grid">
      <article className="account-card account-card-wide">
        <div className="account-card-icon"><AccountIcon name="organization" /></div>
        <div className="account-card-heading"><div><p>Organization</p><h2>Workspace access</h2></div><span className="account-badge">{displayRole}</span></div>
        <p>Your account belongs to one active organization. Organization management is available to authorized account roles.</p>
        <dl className="account-details"><div><dt>Organization ID</dt><dd title={actor.organizationId}>{actor.organizationId}</dd></div><div><dt>Investigations</dt><dd>{queue.cases.length}</dd></div></dl>
        <Link href="/workspace">Open organization workspace <span aria-hidden="true">→</span></Link>
      </article>

      <article className="account-card">
        <div className="account-card-icon"><AccountIcon name="billing" /></div>
        <div className="account-card-heading"><div><p>Billing</p><h2>Purchases and reports</h2></div></div>
        <p>ShadowScore investigations are one-time purchases. Purchased reports remain in your report library.</p>
        <div className="account-link-stack"><Link href="/reports">View purchased reports <span aria-hidden="true">→</span></Link><Link href="/workspace">Review investigation status <span aria-hidden="true">→</span></Link></div>
      </article>

      <article className="account-card">
        <div className="account-card-icon"><AccountIcon name="security" /></div>
        <div className="account-card-heading"><div><p>Security</p><h2>Account protection</h2></div></div>
        <p>Your workspace uses an authenticated session and organization-based access. Review current data and security practices.</p>
        <Link href="/security">Review security and trust <span aria-hidden="true">→</span></Link>
      </article>

      <article className="account-card">
        <div className="account-card-icon"><AccountIcon name="access" /></div>
        <div className="account-card-heading"><div><p>Commercial access</p><h2>Current entitlements</h2></div></div>
        <ul className="account-check-list"><li><span aria-hidden="true">✓</span> Organization workspace</li><li><span aria-hidden="true">✓</span> Purchased report access</li><li><span aria-hidden="true">✓</span> Investigation archive</li></ul>
        <p className="account-card-note">Access to individual reports depends on completed payment and report readiness.</p>
      </article>

      <article className="account-card">
        <div className="account-card-icon"><AccountIcon name="support" /></div>
        <div className="account-card-heading"><div><p>Support</p><h2>Get account help</h2></div></div>
        <p>Contact the ShadowScore team for account, purchase, report, privacy, or security questions.</p>
        <Link href="/contact">Contact support <span aria-hidden="true">→</span></Link>
      </article>
    </div>

    <aside className="account-trust" aria-label="Account trust information"><strong>Account data and access</strong><p>Workspace records are scoped to your organization. Report access is checked against investigation payment and readiness status.</p><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></div></aside>
  </section>;
}
