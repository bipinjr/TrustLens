import { checkLink } from "@/lib/intel";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const url = typeof b?.url === "string" ? b.url.trim() : "";
  if (!url || url.length > 2048) return Response.json({ error: "Enter a link to check." }, { status: 400 });
  const report = await checkLink(url);
  if (!report) return Response.json({ error: "That doesn't look like a web link." }, { status: 400 });
  return Response.json(report);
}
