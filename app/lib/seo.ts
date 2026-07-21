import type { Metadata } from "next";

const siteUrl = "https://shadowscore.io";
const defaultImage = "/marketplaces-monitor-enterprise-v5.png";

type SeoPage = { title: string; description: string; path: string; index?: boolean };

export function pageMetadata({ title, description, path, index = true }: SeoPage): Metadata {
  const url = `${siteUrl}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, url, siteName: "ShadowScore", type: "website", images: [{ url: defaultImage, width: 1200, height: 630, alt: "ShadowScore trust intelligence investigation workspace" }] },
    twitter: { card: "summary_large_image", title, description, images: [defaultImage] },
  };
}

export const seoPages = {
  about: { title: "About ShadowScore | Trust Intelligence Platform", description: "Learn how ShadowScore supports source-backed business verification, due diligence, and business risk intelligence.", path: "/about" },
  contact: { title: "Contact ShadowScore | Trust Intelligence", description: "Contact ShadowScore to discuss business verification, vendor risk assessment, and due diligence workflows.", path: "/contact" },
  security: { title: "Security | ShadowScore", description: "Review ShadowScore security information for enterprise trust intelligence workflows.", path: "/security" },
  privacy: { title: "Privacy Policy | ShadowScore", description: "Read the ShadowScore privacy policy.", path: "/privacy" },
  terms: { title: "Terms of Service | ShadowScore", description: "Read the ShadowScore terms of service.", path: "/terms" },
  intake: { title: "Start a Business Investigation | ShadowScore", description: "Start a source-backed business verification and vendor risk investigation with ShadowScore.", path: "/intake", index: false },
  reports: { title: "Investigation Reports | ShadowScore", description: "Review source-backed due diligence reports and business risk assessments in ShadowScore.", path: "/reports", index: false },
  exampleReport: { title: "Business Due Diligence Report Example | ShadowScore", description: "View an example source-backed business due diligence report from ShadowScore.", path: "/example-report" },
  upgrade: { title: "ShadowScore Plans | Trust Intelligence", description: "Choose a ShadowScore plan for business verification, vendor risk assessment, and continuous monitoring.", path: "/upgrade" },
  monitoring: { title: "Continuous Monitoring | ShadowScore", description: "Monitor business risk signals and investigation updates with ShadowScore.", path: "/monitoring", index: false },
  dashboard: { title: "Trust Intelligence Dashboard | ShadowScore", description: "Manage business verification and due diligence work in ShadowScore.", path: "/dashboard", index: false },
  investigations: { title: "Investigations | ShadowScore", description: "Manage source-backed business investigations in ShadowScore.", path: "/investigations", index: false },
  workspace: { title: "Investigation Workspace | ShadowScore", description: "Work through business risk intelligence investigations in ShadowScore.", path: "/workspace", index: false },
  account: { title: "Account | ShadowScore", description: "Manage your ShadowScore account.", path: "/account", index: false },
  login: { title: "Sign In | ShadowScore", description: "Sign in to ShadowScore.", path: "/login", index: false },
  signup: { title: "Create Account | ShadowScore", description: "Create a ShadowScore account.", path: "/signup", index: false },
  analysis: { title: "Risk Analysis | ShadowScore", description: "Review business risk analysis in ShadowScore.", path: "/analysis", index: false },
  report: { title: "Risk Assessment Report | ShadowScore", description: "Review a ShadowScore business risk assessment report.", path: "/report", index: false },
  radar: { title: "Risk Radar | ShadowScore", description: "Review business risk intelligence signals in ShadowScore.", path: "/radar", index: false },
  quality: { title: "Quality Review | ShadowScore", description: "Review investigation quality controls in ShadowScore.", path: "/quality", index: false },
  leads: { title: "Leads | ShadowScore", description: "Manage ShadowScore leads.", path: "/leads", index: false },
  admin: { title: "Administration | ShadowScore", description: "Manage ShadowScore administration.", path: "/admin", index: false },
  adminLite: { title: "Administration | ShadowScore", description: "Manage ShadowScore administration.", path: "/admin-lite", index: false },
} satisfies Record<string, SeoPage>;
