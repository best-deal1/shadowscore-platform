import { InvestigationWorkspace } from "@/components/workspace/InvestigationWorkspace";
import { getWorkspaceLocale } from "@/components/workspace/server-locale";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { listWorkspaceQueue } from "@/lib/workspace/queue.server";

export default async function WorkspacePage() {
  const [actor, locale] = await Promise.all([requireWorkspaceActor(), getWorkspaceLocale()]);
  const queue = await listWorkspaceQueue(actor);

  return <InvestigationWorkspace cases={queue.cases} locale={locale} />;
}
