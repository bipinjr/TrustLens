import { extractHosts } from "./signals";
import { redact } from "./redact";
export { redact };
import { PRINCIPLE_IDS, type PrincipleId } from "./principles";

// Tolerate copy-paste slips in hosting env settings: whitespace, wrapping quotes, trailing slash.
const clean = (v = "") => v.trim().replace(/^["']|["']$/g, "").trim();
const URL = clean(process.env.SUPABASE_URL).replace(/\/+$/, "");
const KEY = clean(process.env.SUPABASE_KEY);
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

export const CHANNELS = ["sms", "whatsapp", "email", "call", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

export type ReportInput = {
  text: string;
  scamType: string;
  verdict: "scam" | "suspicious" | "likely_safe";
  risk: number;
  principles: string[];
  channel: string;
  language: string;
  state?: string;
};

export async function saveReport(r: ReportInput) {
  const row = {
    scam_type: r.scamType.slice(0, 80) || "Unknown",
    verdict: r.verdict,
    risk: Math.max(0, Math.min(100, Math.round(r.risk))),
    principles: [...new Set(r.principles)].filter((p): p is PrincipleId => PRINCIPLE_IDS.includes(p as PrincipleId)),
    channel: (CHANNELS as readonly string[]).includes(r.channel) ? r.channel : "other",
    language: r.language.slice(0, 20),
    state: r.state ? r.state.slice(0, 40) : null,
    excerpt: redact(r.text),
    domains: extractHosts(r.text).slice(0, 5),
  };
  const res = await fetch(`${URL}/rest/v1/reports`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (!res.ok) throw new Error(`save failed: ${res.status} ${await res.text()}`);
}

export type RadarSummary = {
  total: number; scams: number; avg_risk: number; seeded: number;
  by_type: { label: string; n: number }[];
  by_principle: { id: PrincipleId; n: number }[];
  by_channel: { label: Channel; n: number }[];
  by_day: { day: string; n: number }[];
  top_domains: { label: string; n: number }[];
};
export type RadarReport = {
  id: string; created_at: string; scam_type: string; verdict: string; risk: number;
  channel: Channel; language: string; state: string | null; excerpt: string; principles: PrincipleId[]; is_seed: boolean;
};

export async function getRadar(): Promise<{ summary: RadarSummary; recent: RadarReport[] }> {
  const [s, r] = await Promise.all([
    fetch(`${URL}/rest/v1/rpc/radar_summary`, { method: "POST", headers, body: JSON.stringify({ days: 14 }), cache: "no-store" }),
    fetch(`${URL}/rest/v1/reports?select=id,created_at,scam_type,verdict,risk,channel,language,state,excerpt,principles,is_seed&verdict=neq.likely_safe&order=created_at.desc&limit=12`, { headers, cache: "no-store" }),
  ]);
  if (!s.ok || !r.ok) throw new Error(`radar fetch failed: ${s.status}/${r.status}`);
  return { summary: await s.json(), recent: await r.json() };
}
