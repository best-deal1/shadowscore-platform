import Link from "next/link";
import { notFound } from "next/navigation";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";
import { SupabaseInvestigationRepository } from "@/lib/investigation";
import { getWorkspaceAccessToken, requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { supabaseFetch } from "@/lib/supabase";

export default async function InvestigationDetailsPage({ params }: PageProps<"/investigations/[investigationId]">) {
  const { investigationId } = await params;
  const [actor, accessToken] = await Promise.all([requireWorkspaceActor(), getWorkspaceAccessToken()]);
  if (!accessToken) notFound();
  const repository = new SupabaseInvestigationRepository(supabaseFetch, accessToken, actor);
  const investigation = await repository.get(investigationId);
  if (!investigation) notFound();

  const reportReady = investigation.status === "ready" && investigation.reportId;
  return <ShadowScoreLayout><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <Link href="/workspace" className="text-sm font-bold text-sky-300 hover:text-sky-200">Back to workspace</Link>
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.035] p-7 sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Investigation status</p>
      <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{investigation.target}</h1>
      <dl className="mt-7 grid gap-5 border-t border-white/10 pt-6 text-sm sm:grid-cols-2">
        <div><dt className="text-zinc-500">Investigation reference</dt><dd className="mt-1 font-mono text-zinc-200">{investigation.investigationId}</dd></div>
        <div><dt className="text-zinc-500">Status</dt><dd className="mt-1 font-bold capitalize text-zinc-200">{investigation.status.replaceAll("_", " ")}</dd></div>
      </dl>
      {reportReady ? <Link href={`/reports/${encodeURIComponent(investigation.reportId!)}`} className="mt-8 inline-block rounded-xl bg-sky-400 px-5 py-3 font-black text-slate-950">View report</Link> : <p className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">Your investigation is being prepared. Return here to check its status.</p>}
    </section>
  </main></ShadowScoreLayout>;
}
