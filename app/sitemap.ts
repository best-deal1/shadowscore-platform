import type { MetadataRoute } from "next";
const origin = "https://shadowscore.io";
import { publicPaths } from "./lib/public-pages";
const legacyPublicRoutes = ["", "/about", "/pricing", "/business-due-diligence", "/company-check", "/company-registry-search", "/company-extract", "/supplier-verification", "/business-background-check", "/marketplace-seller-verification", "/sample-report", "/methodology", "/security", "/privacy", "/terms", "/contact", "/he", "/he/business-due-diligence", "/he/company-check", "/he/company-registry", "/he/company-extract", "/he/supplier-check", "/he/business-information", "/he/sample-report"];
export default function sitemap(): MetadataRoute.Sitemap { return [...new Set([...legacyPublicRoutes, ...publicPaths])].map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: "monthly", priority: path === "" ? 1 : 0.8 })); }
