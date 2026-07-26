import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore Trust Intelligence",
  description: "Compare ShadowScore plans for company verification, investigations, continuous monitoring, evidence-backed reporting, and enterprise deployment.",
};

export default function UpgradeLayout({ children }: LayoutProps<"/upgrade">) {
  return children;
}
