import { getRadar } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getRadar());
  } catch (e) {
    console.error("[radar]", (e as Error).message);
    return Response.json({ error: "Radar is unavailable right now." }, { status: 502 });
  }
}
