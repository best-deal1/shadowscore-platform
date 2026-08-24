import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { createIntake, type ShadowScoreIntake, type WorkspaceSession } from "@/lib/workspace";
import { createPersonalIdentitySignals, hasIdentityField, primaryIdentityTarget } from "@/lib/personalIdentity";

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
    if (!body || !["website", "identity", "marketplace", "evidence"].includes(String(body.scanMode)) || typeof body.email !== "string" || !body.email.includes("@")) {
      return authenticatedResponse({ error: "A valid investigation target and email are required." }, 400, authenticated.refreshedAuth);
    }
    const supplied = body.identitySignals;
    const identitySignals = createPersonalIdentitySignals({
      email: supplied?.email?.value,
      phone: supplied?.phone?.value,
      name: supplied?.name?.value,
      username: supplied?.username?.value,
      referenceImage: supplied?.referenceImage ? { fileName: supplied.referenceImage.fileName, mediaType: supplied.referenceImage.mediaType, size: supplied.referenceImage.size, storagePath: supplied.referenceImage.storagePath?.startsWith(`${authenticated.user.id}/`) ? supplied.referenceImage.storagePath : undefined } : undefined,
    });
    const identityMode = body.scanMode === "identity";
    if (identityMode && !hasIdentityField(identitySignals)) return authenticatedResponse({ error: "Enter at least one identity field." }, 400, authenticated.refreshedAuth);
    if (identitySignals.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identitySignals.email.value)) return authenticatedResponse({ error: "Enter a valid identity email address." }, 400, authenticated.refreshedAuth);
    if (identitySignals.referenceImage && (!/^image\/(?:png|jpeg|webp)$/.test(identitySignals.referenceImage.mediaType) || identitySignals.referenceImage.size > 15 * 1024 * 1024)) return authenticatedResponse({ error: "Reference images must be PNG, JPEG, or WebP and no larger than 15MB." }, 400, authenticated.refreshedAuth);
    if (identitySignals.referenceImage && !identitySignals.referenceImage.storagePath) return authenticatedResponse({ error: "The reference image must be uploaded through authorized storage before intake is saved." }, 400, authenticated.refreshedAuth);
    const target = identityMode ? primaryIdentityTarget(identitySignals) : typeof body.target === "string" ? body.target.trim() : "";
    if (!target) return authenticatedResponse({ error: "A valid investigation target is required." }, 400, authenticated.refreshedAuth);
    const session: WorkspaceSession = { userId: authenticated.user.id, accessToken: authenticated.accessToken, name: "", email: authenticated.user.email || "", startedAt: new Date().toISOString() };
    const intake = await createIntake(session, {
      scanMode: body.scanMode as IntakeInput["scanMode"],
      target,
      platform: typeof body.platform === "string" ? body.platform : "",
      caseType: typeof body.caseType === "string" ? body.caseType : undefined,
      email: body.email.trim().toLowerCase(),
      identitySignals: identityMode ? identitySignals : undefined,
      fileNames: Array.isArray(body.fileNames) ? body.fileNames.filter((item): item is string => typeof item === "string") : [],
      visibleSignalCategories: Array.isArray(body.visibleSignalCategories) ? body.visibleSignalCategories.filter((item): item is string => typeof item === "string") : [],
    });
    return authenticatedResponse({ intake }, 201, authenticated.refreshedAuth);
  } catch (error) {
    console.error("Authenticated intake persistence failed.", { error });
    return NextResponse.json({ error: "The investigation could not be saved. Try again." }, { status: 500 });
  }
}
