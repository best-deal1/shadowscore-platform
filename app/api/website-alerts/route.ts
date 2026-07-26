import { createWebsiteServerRepositories, resolveWebsiteSession, websiteApiError } from "@/lib/websiteIntelligence/server";
export async function GET(request: Request) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams; const allowed = new Set(["severity", "category", "status", "domain", "scanId"]);
    if ([...params.keys()].some((key) => !allowed.has(key))) return Response.json({ error: "An alert filter is invalid." }, { status: 400 });
    const filters = Object.fromEntries([...params].map(([key,value]) => [key,value.toLowerCase()]));
    const alerts = (await createWebsiteServerRepositories(session).alerts.list(session.userId)).filter((alert) => Object.entries(filters).every(([key,value]) => String(alert[key === "scanId" ? "currentScanId" : key as keyof typeof alert]).toLowerCase().includes(value)));
    return Response.json({ alerts });
  } catch (error) { return websiteApiError(error); }
}
