import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Investigation Details", description: "Review a private ShadowScore investigation workspace.", path: "/investigations", index: false });

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
