import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Report Analysis", description: "Analyze a ShadowScore business risk assessment report.", path: "/report/analysis", index: false });

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
