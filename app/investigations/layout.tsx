import type { Metadata } from "next";
import { pageMetadata, seoPages } from "../lib/seo";

export const metadata: Metadata = pageMetadata(seoPages.investigations);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
