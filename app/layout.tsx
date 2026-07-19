import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "../components/LocaleProvider";
import { defaultLocale, directionForLocale, isLocale } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | AI Business Due Diligence",
  description:
    "Evidence-based Business Trust Intelligence with source provenance, evidence gaps, and clear next actions.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | AI Business Due Diligence",
    description:
      "Evidence-based Business Trust Intelligence with a recorded source trail and decision context.",
    url: "https://shadowscore.io",
    siteName: "ShadowScore",
    images: [
      { url: "/marketplaces-monitor-enterprise-v5.png", width: 1200, height: 630, alt: "ShadowScore auditable business investigations" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowScore | AI Business Due Diligence",
    description: "AI Business Due Diligence with source provenance and clear next actions.",
    images: ["/marketplaces-monitor-enterprise-v5.png"],
  },
  icons: {
    icon: "/shadowscore-shield-v8.png",
    shortcut: "/shadowscore-shield-v8.png",
    apple: "/shadowscore-shield-v8.png",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const localeCookie = (await cookies()).get("shadowscore_locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  return (
    <html lang={locale} dir={directionForLocale(locale)}>
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider></body>
    </html>
  );
}
