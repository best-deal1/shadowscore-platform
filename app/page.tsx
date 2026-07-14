import HomeClient from "./HomeClient";
import { buildReadyReport } from "../lib/reportPipeline";
import type { PaymentIntent, ShadowScoreIntake } from "../lib/workspace";

export default async function Home() {
  const createdAt = new Date().toISOString();
  const intake: ShadowScoreIntake = {
    intakeId: "homepage-live-engine",
    userId: "homepage",
    scanMode: "website",
    target: "shadowscore.example",
    platform: "Website",
    caseType: "business_identity",
    email: "investigations@shadowscore.example",
    fileNames: [],
    visibleSignalCategories: ["domain", "identity", "infrastructure"],
    paymentStatus: "paid",
    reportStatus: "ready",
    createdAt,
  };
  const paymentIntent: PaymentIntent = { id: "pi-homepage-live-engine", intakeId: intake.intakeId, planName: "Homepage Engine Window", price: "$0", method: "internal", paymentStatus: "paid", createdAt };
  const report = await buildReadyReport({ intake, paymentIntent, reportId: "rpt-homepage-live-engine", createdAt });

  return <HomeClient report={report} />;
}
