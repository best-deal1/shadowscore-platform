import type { MetadataRoute } from "next";

const origin = "https://shadowscore.io";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/example-report`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/upgrade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/security`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${origin}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
