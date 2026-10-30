// OSINT threat-intelligence lookups for links and file hashes.
// Every source is optional: a missing key or a failed request is reported as "skipped", never as "safe".
import { detectSignals, ruleScore, type Signal } from "./signals.ts";

export type SourceResult = { source: string; status: "hit" | "clean" | "skipped"; detail?: string };

const TIMEOUT = 6000;
const withTimeout = (ms = TIMEOUT) => AbortSignal.timeout(ms);

// ---------- Links ----------

let feed: { at: number; urls: Set<string>; hosts: Set<string> } | null = null;

// shortcut: whole OpenPhish feed cached in memory for 30 min per server instance; use a DB table if traffic grows.
async function openPhish(url: string, host: string): Promise<SourceResult> {
  try {
    if (!feed || Date.now() - feed.at > 30 * 60_000) {
      const txt = await fetch("https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt", { signal: withTimeout(8000) }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
      const urls = txt.split("\n").map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
      if (urls.length < 10) throw new Error("feed looks broken"); // never treat a broken feed as "clean"
      feed = { at: Date.now(), urls: new Set(urls), hosts: new Set(urls.map((u) => hostOf(u)).filter(Boolean) as string[]) };
    }
    if (feed.urls.has(url) || feed.urls.has(url.replace(/\/$/, ""))) return { source: "OpenPhish", status: "hit", detail: "Exact URL is on the OpenPhish phishing feed" };
    if (feed.hosts.has(host)) return { source: "OpenPhish", status: "hit", detail: "This domain hosts phishing pages on the OpenPhish feed" };
    return { source: "OpenPhish", status: "clean" };
  } catch {
    return { source: "OpenPhish", status: "skipped", detail: "Feed unavailable" };
  }
}

async function safeBrowsing(url: string): Promise<SourceResult> {
  const key = process.env.SAFE_BROWSING_KEY;
  if (!key) return { source: "Google Safe Browsing", status: "skipped", detail: "No API key set" };
  try {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: "POST", signal: withTimeout(),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "trustlens", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"], threatEntryTypes: ["URL"], threatEntries: [{ url }],
        },
      }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const m = j.matches?.[0];
    return m ? { source: "Google Safe Browsing", status: "hit", detail: `Flagged as ${String(m.threatType).toLowerCase().replace(/_/g, " ")}` } : { source: "Google Safe Browsing", status: "clean" };
  } catch {
    return { source: "Google Safe Browsing", status: "skipped", detail: "Lookup failed" };
  }
}

async function urlhaus(url: string): Promise<SourceResult> {
  const key = process.env.ABUSECH_KEY;
  if (!key) return { source: "URLhaus", status: "skipped", detail: "No API key set" };
  try {
    const r = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST", signal: withTimeout(), headers: { "Auth-Key": key }, body: new URLSearchParams({ url }),
    });
    const j = await r.json();
    if (j.query_status === "ok") return { source: "URLhaus", status: "hit", detail: `Known malware URL (${j.url_status}${j.threat ? `, ${j.threat.replace(/_/g, " ")}` : ""})` };
    return { source: "URLhaus", status: j.query_status === "no_results" ? "clean" : "skipped" };
  } catch {
    return { source: "URLhaus", status: "skipped", detail: "Lookup failed" };
  }
}

export function hostOf(raw: string): string | null {
  try { return new URL(raw.startsWith("http") ? raw : `http://${raw}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
}

export type LinkReport = { url: string; host: string; verdict: "scam" | "suspicious" | "likely_safe"; risk: number; signals: Signal[]; sources: SourceResult[] };

export async function checkLink(raw: string): Promise<LinkReport | null> {
  const url = raw.trim().startsWith("http") ? raw.trim() : `http://${raw.trim()}`;
  const host = hostOf(url);
  if (!host || !/\.[a-z]{2,}$/i.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
  const signals = detectSignals(url);
  const sources = await Promise.all([openPhish(url, host), safeBrowsing(url), urlhaus(url)]);
  const hits = sources.filter((s) => s.status === "hit").length;
  // A threat-feed hit is hard evidence; rule signals alone cap at "suspicious" unless strong.
  // A spoofed brand domain is a scam on its own (same rule the extension guard blocks on).
  const spoofed = signals.some((s) => s.id === "lookalike" || s.id.startsWith("spoof-"));
  const base = Math.min(80, ruleScore(signals) * 2);
  const risk = hits ? Math.min(100, 85 + hits * 5) : spoofed ? Math.max(base, 75) : base;
  const verdict = hits || risk >= 60 ? "scam" : risk >= 25 ? "suspicious" : "likely_safe";
  return { url, host, verdict, risk, signals, sources };
}

// ---------- File hashes ----------

// Hashes we always treat as known-bad, so the demo never depends on one API. EICAR = harmless antivirus test file.
const KNOWN_BAD: Record<string, string> = {
  "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f": "EICAR antivirus test file",
  // Harmless demo file (Demo-Files/trustlens-demo-malware-sample.txt): Windows Defender deletes EICAR on sight, so demos use this.
  "fe772622d60738fdaa56d7460d9ebab026f43d38b553174321c0b796419b9462": "TrustLens demo sample (harmless, listed for demonstration)",
};

async function malwareBazaar(sha256: string): Promise<SourceResult> {
  const key = process.env.ABUSECH_KEY;
  if (!key) return { source: "MalwareBazaar", status: "skipped", detail: "No API key set" };
  try {
    const r = await fetch("https://mb-api.abuse.ch/api/v1/", {
      method: "POST", signal: withTimeout(), headers: { "Auth-Key": key }, body: new URLSearchParams({ query: "get_info", hash: sha256 }),
    });
    const j = await r.json();
    if (j.query_status === "ok") {
      const d = j.data?.[0] ?? {};
      return { source: "MalwareBazaar", status: "hit", detail: `Known malware${d.signature ? `: ${d.signature}` : ""}${d.file_type ? ` (${d.file_type})` : ""}` };
    }
    return { source: "MalwareBazaar", status: j.query_status === "hash_not_found" ? "clean" : "skipped" };
  } catch {
    return { source: "MalwareBazaar", status: "skipped", detail: "Lookup failed" };
  }
}

export type FileReport = { sha256: string; verdict: "malware" | "not_found"; sources: SourceResult[] };

export async function checkHash(sha256: string): Promise<FileReport> {
  const local: SourceResult = KNOWN_BAD[sha256]
    ? { source: "TrustLens known-bad list", status: "hit", detail: KNOWN_BAD[sha256] }
    : { source: "TrustLens known-bad list", status: "clean" };
  const sources = [local, await malwareBazaar(sha256)];
  return { sha256, verdict: sources.some((s) => s.status === "hit") ? "malware" : "not_found", sources };
}
