import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "../components/LocaleProvider";
import { defaultLocale, directionForLocale, isLocale } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShadowScore | Trust Intelligence",
  description:
    "Business due diligence and risk intelligence powered by AI-assisted evidence analysis, relationship mapping, and source-backed recommendations.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Trust Intelligence",
    description:
      "Business due diligence and risk intelligence with AI-assisted evidence analysis, relationship mapping, and a recorded source trail.",
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
    title: "ShadowScore | Trust Intelligence",
    description:
      "Business due diligence and risk intelligence powered by AI-assisted evidence analysis and relationship mapping.",
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
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: "ShadowScore", url: "https://shadowscore.io", logo: "https://shadowscore.io/shadowscore-shield-v8.png", description: "Trust intelligence for source-backed business verification, due diligence, and vendor risk assessment." }, { "@type": "WebSite", name: "ShadowScore", url: "https://shadowscore.io", description: "Business verification and risk intelligence platform." }] }) }} /></body>
    </html>
  );
}
