import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "../components/LocaleProvider";
import { defaultLocale, directionForLocale, isLocale } from "../lib/i18n";
import "./globals.css";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "ShadowScore",
      url: "https://shadowscore.io",
      logo: "https://shadowscore.io/shadowscore-shield-v8.png",
      description: "Trust intelligence for source-backed business verification, due diligence, and vendor risk assessment.",
    },
    {
      "@type": "WebSite",
      name: "ShadowScore",
      url: "https://shadowscore.io",
      description: "Business verification and risk intelligence platform.",
    },
  ],
};

export const metadata: Metadata = {
  title: "ShadowScore | Business Due Diligence and Company Verification",
  description:
    "Verify companies, suppliers, sellers, partners, and investment opportunities with source-backed business identity, risk, relationship, and evidence intelligence.",
  metadataBase: new URL("https://shadowscore.io"),
  openGraph: {
    title: "ShadowScore | Business Due Diligence and Company Verification",
    description:
      "Verify companies, suppliers, sellers, partners, and investment opportunities with source-backed business identity, risk, relationship, and evidence intelligence.",
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
    title: "ShadowScore | Business Due Diligence and Company Verification",
    description:
      "Verify companies, suppliers, sellers, partners, and investment opportunities with source-backed business identity, risk, relationship, and evidence intelligence.",
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
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
