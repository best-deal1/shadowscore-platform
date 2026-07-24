import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { pageMetadata, seoPages } from "../lib/seo";

export const metadata: Metadata = pageMetadata(seoPages.workspace);

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [actor, cookieStore] = await Promise.all([requireWorkspaceActor(), cookies()]);
  const localeCookie = cookieStore.get("shadowscore_locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;

  return <WorkspaceShell actor={actor} locale={locale}>{children}</WorkspaceShell>;
}
