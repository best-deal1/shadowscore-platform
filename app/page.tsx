import type { Metadata } from "next";
import { pageMetadata } from "./lib/seo";
import HomeClient from "./HomeClient";

export const metadata: Metadata = pageMetadata({ title: "ShadowScore | Trust Intelligence and Business Verification", description: "ShadowScore provides source-backed business verification, due diligence, vendor risk assessment, fraud detection, and continuous monitoring.", path: "/" });

export default function Home() {
  return <HomeClient />;
}
