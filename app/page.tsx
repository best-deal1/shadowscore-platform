import type { Metadata } from "next";
import { SOCIAL_PREVIEW_URL } from "../lib/brand";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const title = "ShadowScore | Business Due Diligence & Company Verification";
const description = "Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://shadowscore.io/", languages: { en: "/", he: "/he", "x-default": "/" } },
  openGraph: { title, description, url: `${siteUrl}/`, type: "website", images: [{ url: SOCIAL_PREVIEW_URL, width: 1200, height: 630, type: "image/png", alt: "ShadowScore business due diligence and company verification" }] },
  twitter: { card: "summary_large_image", title, description, images: [SOCIAL_PREVIEW_URL] },
};

export default function Home() {
  return <MarketingHome />;
}
