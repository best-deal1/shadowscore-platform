import { NextResponse } from "next/server";
import { AdminReportAccessError, generateAdministratorReport, getAdministratorRole } from "@/lib/adminReportAccess";
import { resolveWebsiteSession } from "@/lib/websiteIntelligence/server";
import type { WorkspaceSession } from "@/lib/workspace";

function workspaceSession(userId: string, accessToken: string): WorkspaceSession {
  return { userId, accessToken, name: "", email: "", startedAt: new Date().toISOString() };
}

export async function GET(request: Request) {
  const authenticated = await resolveWebsiteSession(request);
  if (!authenticated) return NextResponse.json({ administrator: false }, { status: 401 });
  const role = await getAdministratorRole(workspaceSession(authenticated.userId, authenticated.accessToken));
  return NextResponse.json({ administrator: role === "admin" });
}

export async function POST(request: Request) {
  try {
    const authenticated = await resolveWebsiteSession(request);
    if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const body = await request.json().catch(() => null) as { intakeId?: unknown; reason?: unknown } | null;
    if (typeof body?.intakeId !== "string" || !body.intakeId.trim()) return NextResponse.json({ error: "An Investigation ID is required." }, { status: 400 });
    const reason = body.reason === "internal review" ? "internal review" : "production testing";
    const report = await generateAdministratorReport(workspaceSession(authenticated.userId, authenticated.accessToken), body.intakeId.trim(), reason);
    return NextResponse.json({ report, reportId: report.reportId }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminReportAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Administrator report generation failed.", error);
    return NextResponse.json({ error: "Administrator report generation failed." }, { status: 500 });
  }
}
