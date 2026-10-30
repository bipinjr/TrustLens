import { getRadar } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getRadar());
  } catch (e) {
    console.error("[radar]", (e as Error).message, (e as Error & { cause?: { code?: string } }).cause?.code ?? "", /^https:\/\/[a-z0-9]+\.supabase\.co$/.test((process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "")) ? "url-shape-ok" : "url-shape-BAD");
    return Response.json({ error: "Radar is unavailable right now." }, { status: 502 });
  }
}
