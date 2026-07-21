import { getPlatformCapabilityCatalog } from "@/lib/platform";

/**
 * A stable discovery boundary for the Command Center and future integrations.
 * This route exposes capability metadata only. It never exposes business data.
 */
export function GET() {
  return Response.json(getPlatformCapabilityCatalog());
}
