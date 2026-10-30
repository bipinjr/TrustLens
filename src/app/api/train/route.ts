import { groq, CHAT_MODELS } from "@/lib/groq";
import { LANGUAGES } from "@/lib/shared";
import { PRINCIPLE_IDS, type PrincipleId } from "@/lib/principles";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You write short PRACTICE scam messages for a prebunking (psychological inoculation) exercise that teaches people in India to spot manipulation tricks.

Rules:
- The message is clearly fictional: invented person and company names, phone numbers written like 98XXXXXX21, and only obviously fake web addresses ending in .xyz or .top.
- Realistic tone and length of an Indian SMS or WhatsApp message (40-70 words).
- Contain exactly the requested number of distinct tricks, each carried by a short exact phrase (2-6 words) that appears verbatim in the message. Phrases must not overlap.
- Never include real bank account numbers, real UPI IDs, real URLs, or instructions that would work as a real scam.

Each trick's "principle" must be one of: time, social_compliance, need_greed, distraction, kindness, herd, dishonesty (Stajano & Wilson's seven scam principles).

Reply with ONLY JSON: {"message": string, "tricks": [{"quote": exact phrase from message, "principle": id, "why": one simple sentence explaining how this phrase manipulates the reader}]}
Write the message and every "why" in {LANG}.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const language = LANGUAGES.includes(body.language) ? body.language : "English";
  const wanted: PrincipleId[] = Array.isArray(body.principles)
    ? [...new Set<PrincipleId>(body.principles.filter((p: unknown) => PRINCIPLE_IDS.includes(p as PrincipleId)))].slice(0, 4)
    : [];
  const principles = wanted.length >= 2
    ? wanted
    : [...PRINCIPLE_IDS].sort(() => Math.random() - 0.5).slice(0, 3);

  for (const model of CHAT_MODELS) {
    try {
      const res = await groq.chat.completions.create({
        model,
        temperature: 0.9,
        max_tokens: 1200,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM.replace("{LANG}", language === "Hinglish" ? "Hinglish (Hindi written in English letters, the way people text)" : language) },
          { role: "user", content: `Write one practice message with ${principles.length} tricks using these principles: ${principles.join(", ")}. Pick a fresh scenario.` },
        ],
      });
      const j = JSON.parse(res.choices[0]?.message?.content ?? "{}");
      const message = String(j.message ?? "").trim();
      const tricks = (Array.isArray(j.tricks) ? j.tricks : [])
        .map((t: Record<string, unknown>) => ({
          quote: String(t.quote ?? ""),
          principle: PRINCIPLE_IDS.includes(t.principle as PrincipleId) ? t.principle : undefined,
          why: String(t.why ?? ""),
        }))
        .filter((t: { quote: string }) => t.quote && message.toLowerCase().includes(t.quote.toLowerCase().replace(/^["'“”]+|["'“”]+$/g, "")));
      if (message && tricks.length) return Response.json({ message, tricks });
    } catch (e) {
      console.error(`[train] ${model} failed:`, (e as Error).message);
    }
  }
  return Response.json({ error: "Couldn't make a practice message right now. Try again." }, { status: 502 });
}
