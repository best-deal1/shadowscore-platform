import { getTrustGraphService, type TrustGraphTrust } from "@/lib/trustGraph";

export async function POST(request: Request) {
  try {
    const input = await request.json() as TrustGraphTrust;
    return Response.json(getTrustGraphService().setTrust(input));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Trust score could not be recorded." }, { status: 400 });
  }
}
