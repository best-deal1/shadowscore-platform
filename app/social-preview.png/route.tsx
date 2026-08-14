import { createSocialPreviewImage } from "../../lib/socialPreviewImage";

export const dynamic = "force-static";

export async function GET() {
  const response = await createSocialPreviewImage();
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
