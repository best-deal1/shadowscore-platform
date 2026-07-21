import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/admin-lite", "/analysis", "/dashboard", "/intake", "/investigations", "/leads", "/login", "/monitoring", "/quality", "/radar", "/report", "/reports", "/signup", "/workspace"] }, sitemap: "https://shadowscore.io/sitemap.xml" };
}
