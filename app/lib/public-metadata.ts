import type { Metadata } from "next";
import { SOCIAL_PREVIEW_PATH } from "../../lib/brand";
import type { PublicPage } from "./public-pages";

export function publicMetadata(page: PublicPage): Metadata {
  return { title: page.title, description: page.description, alternates: { canonical: page.path }, robots: { index: true, follow: true }, openGraph: { title: page.title, description: page.description, url: page.path, siteName: "ShadowScore", type: "website", images: [{ url: SOCIAL_PREVIEW_PATH, width: 1200, height: 630, alt: "ShadowScore entity intelligence platform" }] }, twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [SOCIAL_PREVIEW_PATH] } };
}
