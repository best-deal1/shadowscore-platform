import { NextResponse } from "next/server";
import { isSupportedLocale } from "../../../lib/i18n/localization";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isSupportedLocale(body.locale)) return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set("shadowscore_locale", body.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
