import type { Metadata } from "next";
import { SOCIAL_PREVIEW_PATH } from "../lib/brand";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const title = "ShadowScore | Business Trust Intelligence | Due Diligence";
const description = "Source-backed business verification, risk signals, and evidence for due diligence decisions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://shadowscore.io/", languages: { en: "/", he: "/he", "x-default": "/" } },
  openGraph: { title, description, url: `${siteUrl}/`, type: "website", images: [SOCIAL_PREVIEW_PATH] },
  twitter: { card: "summary_large_image", title, description, images: [SOCIAL_PREVIEW_PATH] },
};

export default function Home() {
  return <MarketingHome />;
}
