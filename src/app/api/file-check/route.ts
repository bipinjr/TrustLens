import { checkHash } from "@/lib/intel";

export const runtime = "nodejs";
export const maxDuration = 20;

// Receives only the SHA-256 hash. The file itself never leaves the user's device.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const sha256 = typeof b?.sha256 === "string" ? b.sha256.trim().toLowerCase() : "";
  if (!/^[0-9a-f]{64}$/.test(sha256)) return Response.json({ error: "Send a SHA-256 hash (64 hex characters)." }, { status: 400 });
  return Response.json(await checkHash(sha256));
}
