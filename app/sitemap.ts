import type { MetadataRoute } from "next";
import { supportedLocales, localizedPath } from "../lib/i18n/localization";
import { englishPages } from "./lib/marketing";

const origin = "https://shadowscore.io";
const publicRoutes = ["", "/business-due-diligence", "/company-check", "/company-registry-search", "/company-extract", "/supplier-verification", "/business-background-check", "/marketplace-seller-verification", "/sample-report", "/methodology", "/security", "/privacy", "/terms", "/contact"];
const localizedMarketingRoutes = Object.keys(englishPages).flatMap((slug) => supportedLocales.map((locale) => localizedPath(`/${slug}`, locale)));
const routes = [...new Set([...publicRoutes, ...localizedMarketingRoutes])];
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: "monthly", priority: path === "" ? 1 : 0.8 }));
}
