import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "@/lib/i18n";

export async function getWorkspaceLocale() {
  const localeCookie = (await cookies()).get("shadowscore_locale")?.value;
  return isLocale(localeCookie) ? localeCookie : defaultLocale;
}
