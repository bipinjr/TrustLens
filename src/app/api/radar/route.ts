import { getRadar } from "@/lib/radar";
import snapshot from "@/lib/radar-snapshot.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getRadar());
  } catch (e) {
    console.error("[radar]", (e as Error).message, (e as Error & { cause?: { code?: string } }).cause?.code ?? "", /^https:\/\/[a-z0-9]+\.supabase\.co$/.test((process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "")) ? "url-shape-ok" : "url-shape-BAD");
    // Live database unreachable: serve the last saved snapshot (sample reports only), clearly flagged.
    return Response.json({ ...snapshot, offline: true });
  }
}
