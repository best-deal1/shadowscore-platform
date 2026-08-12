import type { Metadata } from "next";
import { AuthenticatedLayout } from "@/components/workspace/AuthenticatedLayout";
import { requireAdministrator } from "@/lib/admin.server";
import { pageMetadata, seoPages } from "../lib/seo";

export const metadata: Metadata = pageMetadata(seoPages.admin);

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdministrator();
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
