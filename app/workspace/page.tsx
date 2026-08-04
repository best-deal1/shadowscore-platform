import { InvestigationWorkspace } from "@/components/workspace/InvestigationWorkspace";
import { getWorkspaceLocale } from "@/components/workspace/server-locale";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { listWorkspaceQueue } from "@/lib/workspace/queue.server";

export default async function WorkspacePage() {
  const [actor, locale] = await Promise.all([requireWorkspaceActor(), getWorkspaceLocale()]);
  const queue = await listWorkspaceQueue(actor);

  const workspaceVersion = queue.cases.map(({ id, version }) => `${id}:${version}`).join("|");
  return <InvestigationWorkspace key={workspaceVersion} cases={queue.cases} locale={locale} canDelete={actor.role !== "viewer"} />;
}
