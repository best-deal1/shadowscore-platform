import type { Metadata } from "next";
import MarketingHome from "./components/MarketingHome";
import { siteUrl } from "./lib/marketing";

const description = "Organize business due diligence cases, review active investigations, and track each case's next action.";

export const metadata: Metadata = {
  title: "ShadowScore | Investigation Workspace",
  description,
  alternates: { canonical: "/", languages: { en: "/", he: "/he", "x-default": "/" } },
  openGraph: { title: "ShadowScore | Investigation Workspace", description, url: siteUrl, type: "website" },
  twitter: { card: "summary_large_image", title: "ShadowScore | Investigation Workspace", description },
};

export default function Home() {
  return <MarketingHome />;
}
