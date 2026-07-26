import { runtime } from "@/lib/continuousResolution/demo";

export function GET(request: Request) {
  const url=new URL(request.url),cursor=url.searchParams.get("cursor"),limit=Number(url.searchParams.get("limit")??50);
  return Response.json(runtime.eventPage(cursor,Number.isFinite(limit)?limit:50));
}
