import type { Metadata } from "next";
import { AuthenticatedLayout } from "@/components/workspace/AuthenticatedLayout";
import { pageMetadata, seoPages } from "../lib/seo";

export const metadata: Metadata = pageMetadata(seoPages.reports);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
