import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { getSupabaseConfig } from "@/lib/supabase";

const MAX_SIZE = 15 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  const authenticated = await resolveServerSession();
  if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Authorized reference-image storage is unavailable." }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || !TYPES.has(image.type) || image.size === 0 || image.size > MAX_SIZE) return NextResponse.json({ error: "Select a PNG, JPEG, or WebP image no larger than 15MB." }, { status: 400 });
  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${authenticated.user.id}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${config.url}/storage/v1/object/identity-references/${storagePath}`, { method: "POST", headers: { apikey: config.anonKey, Authorization: `Bearer ${authenticated.accessToken}`, "Content-Type": image.type, "x-upsert": "false" }, body: image });
  if (!response.ok) {
    console.error("reference_image_upload_failed", { userId: authenticated.user.id, status: response.status });
    return NextResponse.json({ error: "The reference image could not be stored. Try again." }, { status: 502 });
  }
  const result = NextResponse.json({ referenceImage: { fileName: image.name, mediaType: image.type, size: image.size, storagePath } }, { status: 201 });
  if (authenticated.refreshedAuth) setAuthCookies(result, authenticated.refreshedAuth);
  return result;
}
