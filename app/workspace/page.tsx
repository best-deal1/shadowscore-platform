import { CaseQueue } from "@/components/workspace/CaseQueue";
import { getWorkspaceLocale } from "@/components/workspace/server-locale";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { listWorkspaceQueue } from "@/lib/workspace/queue.server";

export default async function WorkspacePage() {
  const [actor, locale] = await Promise.all([requireWorkspaceActor(), getWorkspaceLocale()]);
  const queue = await listWorkspaceQueue(actor);

  return <CaseQueue cases={queue.cases} locale={locale} />;
}
