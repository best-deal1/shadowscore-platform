import type { ShadowScoreUser } from "./auth";
import type { ProviderMetadata } from "./providers/metadata";
import type { PaymentIntent, ShadowScoreIntake, ShadowScoreReport } from "./workspace";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  reports: number;
  payments: number;
  lastActivity: string;
};

export type AdminConsoleData = {
  currentUser: ShadowScoreUser;
  users: AdminUserRow[];
  intakes: ShadowScoreIntake[];
  paymentIntents: PaymentIntent[];
  reports: ShadowScoreReport[];
  providerResults: Array<NonNullable<ShadowScoreReport["providerResults"]>[number] & { reportId: string; target: string; userId?: string }>;
  evidence: Array<{ reportId: string; target: string; userId?: string; evidenceSummary: unknown; providerEvidenceCount: number }>;
  systemStatus: {
    providerFrameworkVersion: string;
    riskEngineVersion: string;
    reportEngineVersion: string;
    workspaceMode: string;
    supabaseConnected: boolean;
    paymentProviderStatus: string;
    registeredProviders: ProviderMetadata[];
  };
};
