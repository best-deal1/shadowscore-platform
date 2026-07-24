import type { Metadata } from "next";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const title = "ShadowScore | Investigation Workspace";
const description = "Organize business due diligence cases, review active investigations, and track each case's next action.";

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
