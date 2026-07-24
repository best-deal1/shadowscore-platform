import type { Metadata } from "next";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const title = "ShadowScore | Business Due Diligence & Company Verification";
const description = "Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/", languages: { en: "/", he: "/he", "x-default": "/" } },
  openGraph: { title, description, url: siteUrl, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function Home() {
  return <MarketingHome />;
}
