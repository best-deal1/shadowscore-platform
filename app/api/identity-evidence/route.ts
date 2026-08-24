import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { getSupabaseConfig } from "@/lib/supabase";
import { IDENTITY_EVIDENCE_BUCKET, identityReadinessIssues } from "@/lib/personalIdentity";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const authenticated = await resolveServerSession();
  if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const issues = identityReadinessIssues(process.env);
  if (issues.length) return NextResponse.json({ error: "Personal identity evidence storage is not ready.", readinessIssues: issues }, { status: 503 });
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Evidence storage is unavailable." }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  const intakeId = String(form.get("intakeId") || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const authorized = form.get("authorized") === "true";
  if (!(file instanceof File) || !intakeId || !authorized) return NextResponse.json({ error: "An authorized image and intake reference are required." }, { status: 400 });
  if (!allowedTypes.has(file.type) || file.size < 1 || file.size > maxBytes) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 10MB." }, { status: 400 });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `${authenticated.user.id}/${intakeId}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${config.url}/storage/v1/object/${IDENTITY_EVIDENCE_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { apikey: config.anonKey, Authorization: `Bearer ${authenticated.accessToken}`, "Content-Type": file.type, "x-upsert": "false" },
    body: file,
  });
  if (!response.ok) {
    console.error("identity_evidence_upload_failed", { userId: authenticated.user.id, intakeId, status: response.status });
    return NextResponse.json({ error: "The reference image could not be stored." }, { status: 502 });
  }
  console.info("identity_evidence_uploaded", { userId: authenticated.user.id, intakeId, objectPath });
  const result = NextResponse.json({ bucket: IDENTITY_EVIDENCE_BUCKET, objectPath }, { status: 201 });
  if (authenticated.refreshedAuth) setAuthCookies(result, authenticated.refreshedAuth);
  return result;
}
