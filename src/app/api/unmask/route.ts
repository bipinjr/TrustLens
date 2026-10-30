import { unmask } from "@/lib/unmask";

export const runtime = "nodejs";
export const maxDuration = 30;

// Follows a link's redirect chain and compares what scanners vs people are shown.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const url = typeof b?.url === "string" ? b.url.trim().slice(0, 2000) : "";
  if (!url) return Response.json({ error: "Send a link to unmask." }, { status: 400 });
  try {
    return Response.json(await unmask(url, new URL(req.url).origin));
  } catch (e) {
    return Response.json({ error: e instanceof Error && /Private|Only http/.test(e.message) ? e.message : "That doesn't look like a valid link." }, { status: 400 });
  }
}
