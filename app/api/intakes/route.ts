import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { createIntake, type ShadowScoreIntake, type WorkspaceSession } from "@/lib/workspace";
import { identityReadinessIssues, normalizeIdentitySignals } from "@/lib/personalIdentity";

type IntakeInput = Omit<ShadowScoreIntake, "intakeId" | "userId" | "paymentStatus" | "reportStatus" | "createdAt">;

function authenticatedResponse<T>(body: T, status: number, refreshedAuth?: Parameters<typeof setAuthCookies>[1]) {
  const response = NextResponse.json(body, { status });
  if (refreshedAuth) setAuthCookies(response, refreshedAuth);
  return response;
}

export async function POST(request: Request) {
  try {
    const authenticated = await resolveServerSession();
    if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const body = await request.json().catch(() => null) as Partial<IntakeInput> | null;
    if (!body || !["website", "marketplace", "evidence", "personal"].includes(String(body.scanMode)) || typeof body.target !== "string" || !body.target.trim() || typeof body.email !== "string" || !body.email.includes("@")) {
      return authenticatedResponse({ error: "A valid investigation target and email are required." }, 400, authenticated.refreshedAuth);
    }
    const identitySignals = normalizeIdentitySignals(body.identitySignals);
    if (body.scanMode === "personal") {
      const readinessIssues = identityReadinessIssues(process.env);
      if (readinessIssues.length) return authenticatedResponse({ error: "Personal identity investigations are not available.", readinessIssues }, 503, authenticated.refreshedAuth);
      if (![identitySignals.emails, identitySignals.phones, identitySignals.names, identitySignals.usernames].some((signals) => signals.length)) {
        return authenticatedResponse({ error: "Add at least one identity signal." }, 400, authenticated.refreshedAuth);
      }
    }
    const session: WorkspaceSession = { userId: authenticated.user.id, accessToken: authenticated.accessToken, name: "", email: authenticated.user.email || "", startedAt: new Date().toISOString() };
    const intake = await createIntake(session, {
      scanMode: body.scanMode as IntakeInput["scanMode"],
      target: body.target.trim(),
      platform: typeof body.platform === "string" ? body.platform : "",
      caseType: typeof body.caseType === "string" ? body.caseType : undefined,
      email: body.email.trim().toLowerCase(),
      identitySignals: body.scanMode === "personal" ? identitySignals : undefined,
      fileNames: Array.isArray(body.fileNames) ? body.fileNames.filter((item): item is string => typeof item === "string") : [],
      visibleSignalCategories: Array.isArray(body.visibleSignalCategories) ? body.visibleSignalCategories.filter((item): item is string => typeof item === "string") : [],
    });
    return authenticatedResponse({ intake }, 201, authenticated.refreshedAuth);
  } catch (error) {
    console.error("Authenticated intake persistence failed.", { error });
    return NextResponse.json({ error: "The investigation could not be saved. Try again." }, { status: 500 });
  }
}
