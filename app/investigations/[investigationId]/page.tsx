import Link from "next/link";
import { InvestigationDetailService } from "@/lib/investigation";
import { getInvestigationRepository } from "@/lib/investigation/server";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";
import { InvestigationDetailsWorkspace } from "../_components/InvestigationDetailsWorkspace";

export const dynamic = "force-dynamic";

export default async function InvestigationDetailsPage({ params }: PageProps<"/investigations/[investigationId]">) {
  const { investigationId } = await params;
  const detail = await new InvestigationDetailService(await getInvestigationRepository()).get(investigationId);

  if (!detail) {
    return <InvestigationNotFound />;
  }

  return <InvestigationDetailsWorkspace detail={detail} />;
}

function InvestigationNotFound() {
  return <ShadowScoreLayout><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16"><section className="rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Investigation workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Investigation not found</h1><p className="mt-3 text-sm leading-6 text-zinc-400">This investigation may have been removed or the link may be incomplete.</p><Link href="/investigations" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 hover:bg-sky-400">Return to investigations</Link></section></main></ShadowScoreLayout>;
}
