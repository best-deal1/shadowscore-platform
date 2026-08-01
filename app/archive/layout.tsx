import type { Metadata } from "next";
import { AuthenticatedLayout } from "@/components/workspace/AuthenticatedLayout";

export const metadata: Metadata = { title: "Archive | ShadowScore", description: "Archived investigations in your ShadowScore workspace." };

export default function ArchiveLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
