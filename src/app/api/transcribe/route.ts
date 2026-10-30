import { groq } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept at most 4.5 MB request bodies

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    file = f instanceof File ? f : null;
  } catch {
    return Response.json({ error: "Upload an audio file." }, { status: 400 });
  }
  if (!file || file.size === 0) return Response.json({ error: "Upload an audio file." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Audio is too long. Keep it under about 3 minutes (4 MB)." }, { status: 413 });
  if (file.type && !file.type.startsWith("audio/") && !file.type.startsWith("video/webm"))
    return Response.json({ error: "That file isn't audio." }, { status: 415 });

  try {
    const res = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      temperature: 0,
    });
    const text = res.text?.trim() ?? "";
    if (text.length < 5) return Response.json({ error: "Couldn't hear any words in that clip. Try a clearer recording." }, { status: 422 });
    return Response.json({ text });
  } catch (e) {
    console.error("[transcribe]", (e as Error).message);
    return Response.json({ error: "Transcription failed. Try again in a moment." }, { status: 502 });
  }
}
