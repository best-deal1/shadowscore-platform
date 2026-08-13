import { createSocialPreviewImage } from "../../lib/socialPreviewImage";

export const dynamic = "force-static";

export function GET() {
  const response = createSocialPreviewImage();
  response.headers.set("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
