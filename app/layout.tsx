import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "../components/LocaleProvider";
import { ProductFeedbackProvider } from "../components/ProductFeedback";
import { defaultLocale, directionForLocale, isLocale } from "../lib/i18n";
import "./globals.css";
import { CANONICAL_LOGO_PATH, CANONICAL_LOGO_URL, SOCIAL_PREVIEW_URL } from "../lib/brand";

const socialTitle = "ShadowScore | Business Due Diligence & Company Verification";
const socialDescription = "Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "ShadowScore",
      url: "https://shadowscore.io",
      logo: CANONICAL_LOGO_URL,
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
  title: socialTitle,
  description: socialDescription,
  metadataBase: new URL("https://shadowscore.io"),
  alternates: { canonical: "https://shadowscore.io/" },
  openGraph: {
    title: socialTitle,
    description: socialDescription,
    url: "https://shadowscore.io/",
    siteName: "ShadowScore",
    images: [
      { url: SOCIAL_PREVIEW_URL, width: 1200, height: 630, type: "image/png", alt: "ShadowScore business due diligence and company verification" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: socialDescription,
    images: [SOCIAL_PREVIEW_URL],
  },
  icons: {
    icon: [{ url: CANONICAL_LOGO_PATH, type: "image/svg+xml", sizes: "any" }],
    shortcut: [{ url: CANONICAL_LOGO_PATH, type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const localeCookie = (await cookies()).get("shadowscore_locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;

  return (
    <html lang={locale} dir={directionForLocale(locale)}>
      <body>
        <LocaleProvider locale={locale}><ProductFeedbackProvider>{children}</ProductFeedbackProvider></LocaleProvider>
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
