import type { Metadata } from "next";
import { CANONICAL_LOGO_PATH } from "../lib/brand";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const title = "ShadowScore | Business Due Diligence & Company Verification";
const description = "Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/", languages: { en: "/", he: "/he", "x-default": "/" } },
  openGraph: { title, description, url: siteUrl, type: "website", images: [CANONICAL_LOGO_PATH] },
  twitter: { card: "summary_large_image", title, description, images: [CANONICAL_LOGO_PATH] },
};

export default function Home() {
  return <MarketingHome />;
}
