import { saveReport } from "@/lib/radar";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.text !== "string" || b.text.trim().length < 5 || b.text.length > 4000)
    return Response.json({ error: "Nothing to report." }, { status: 400 });
  if (!["scam", "suspicious", "likely_safe"].includes(b.verdict) || typeof b.risk !== "number")
    return Response.json({ error: "Check the message first, then report it." }, { status: 400 });
  try {
    await saveReport({
      text: b.text, scamType: String(b.scamType ?? ""), verdict: b.verdict, risk: b.risk,
      principles: Array.isArray(b.principles) ? b.principles.map(String) : [],
      channel: String(b.channel ?? "other"), language: String(b.language ?? "English"),
      state: typeof b.state === "string" ? b.state : undefined,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[report]", (e as Error).message);
    return Response.json({ error: "Couldn't save the report. Try again." }, { status: 502 });
  }
}
