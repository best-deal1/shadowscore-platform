import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { WorkspaceShell } from "./WorkspaceShell";

export async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [actor, cookieStore] = await Promise.all([requireWorkspaceActor(), cookies()]);
  const localeCookie = cookieStore.get("shadowscore_locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;

  return <WorkspaceShell actor={actor} locale={locale}>{children}</WorkspaceShell>;
}
