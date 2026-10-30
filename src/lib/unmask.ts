// Hurdle engine: follow redirect chains hop by hop and detect cloaking (different page for scanners vs people).
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { checkLink, type LinkReport } from "./intel.ts";

export type Hop = { url: string; status: number; via: "start" | "http" | "meta" | "js"; host: string };
export type View = { status: number; finalUrl: string; title: string; hasPassword: boolean; hasOtp: boolean; forms: number; words: number; error?: string };
export type UnmaskReport = {
  input: string; hops: Hop[]; final: string; hidden: boolean; shortener: boolean;
  cloak: { bot: View; human: View; cloaked: boolean; reasons: string[] } | null;
  link: LinkReport | null; hopFlags: { url: string; risk: number }[];
  verdict: "scam" | "suspicious" | "likely_safe"; risk: number; notes: string[];
};

const MAX_HOPS = 8, TIMEOUT = 6000, MAX_BYTES = 400_000;
const UA_BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const UA_HUMAN = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const SHORTENERS = /^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|ow\.ly|rebrand\.ly|tiny\.cc|s\.id|bitly\.com|t\.ly|v\.gd)$/i;

// SSRF guard: only public http(s) hosts. Checked on every hop, after DNS resolution.
function privateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:") && privateIp(v.slice(7));
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
export async function assertPublic(u: URL) {
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http and https links can be followed.");
  if (u.username || u.password) return; // userinfo trick is flagged by signals; host check below still applies
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("Private addresses can't be checked.");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (!ips.length || ips.some(privateIp)) throw new Error("Private addresses can't be checked.");
}

let SELF = ""; // this app's own origin; only its /lab/ demo pages may skip the public-host check
async function get(url: string, ua: string, referer?: string) {
  const u = new URL(url);
  if (!(SELF && u.origin === SELF && u.pathname.startsWith("/lab/"))) await assertPublic(u);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(u, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": ua, accept: "text/html,*/*;q=0.8", "accept-language": "en-IN,en;q=0.9,hi;q=0.8", ...(referer ? { referer } : {}) } });
    let body = "";
    if ((res.headers.get("content-type") || "").includes("html") && res.body) {
      const reader = res.body.getReader();
      let size = 0;
      const chunks: Uint8Array[] = [];
      while (size < MAX_BYTES) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); size += value.length; }
      reader.cancel().catch(() => {});
      body = new TextDecoder().decode(Buffer.concat(chunks));
    } else res.body?.cancel().catch(() => {});
    return { status: res.status, location: res.headers.get("location"), body };
  } finally { clearTimeout(t); }
}

// Client-side hops that scanners often miss: <meta refresh> and simple location assignments.
export function nextFromHtml(html: string, base: string): { url: string; via: "meta" | "js" } | null {
  const meta = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\s*\d*\s*;?\s*url=([^"'>\s]+)/i);
  if (meta) try { return { url: new URL(meta[1], base).href, via: "meta" }; } catch {}
  if (html.replace(/<script[\s\S]*?<\/script>|<[^>]+>/gi, " ").split(/\s+/).filter(Boolean).length > 60) return null; // only bare redirector pages
  const js = html.match(/(?:window\.|document\.|top\.)?location(?:\.href)?\s*(?:=|\.replace\(|\.assign\()\s*["'`]([^"'`]+)["'`]/i);
  if (js && !js[1].startsWith("#")) try { return { url: new URL(js[1], base).href, via: "js" }; } catch {}
  return null;
}

export function viewOf(status: number, finalUrl: string, html: string, error?: string): View {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  return {
    status, finalUrl, error,
    title: (html.match(/<title[^>]*>([^<]{0,120})/i)?.[1] || "").trim(),
    hasPassword: /<input[^>]+type=["']?password/i.test(html),
    hasOtp: /otp|one[-\s]?time\s?pass|cvv|card\s?number|upi\s?pin|aadhaar/i.test(`${text} ${(html.match(/<input[^>]+/gi) || []).join(" ")}`),
    forms: (html.match(/<form\b/gi) || []).length,
    words: text.split(/\s+/).filter(Boolean).length,
  };
}

export function compareViews(bot: View, human: View): string[] {
  const r: string[] = [];
  if (bot.error || human.error) return r;
  try { if (new URL(bot.finalUrl).hostname !== new URL(human.finalUrl).hostname) r.push(`Scanners are sent to ${new URL(bot.finalUrl).hostname}, people to ${new URL(human.finalUrl).hostname}`); } catch {}
  if (bot.status !== human.status && (bot.status >= 400 || human.status >= 400)) r.push(`Scanners get HTTP ${bot.status}, people get HTTP ${human.status}`);
  if (human.hasPassword && !bot.hasPassword) r.push("A password box appears only for people, not for scanners");
  if (human.hasOtp && !bot.hasOtp) r.push("OTP / card / UPI PIN fields appear only for people");
  if (human.forms > bot.forms) r.push(`People see ${human.forms} form(s), scanners see ${bot.forms}`);
  if (bot.title && human.title && bot.title.toLowerCase() !== human.title.toLowerCase()) r.push(`Different page titles: “${bot.title}” vs “${human.title}”`);
  if (bot.words > 30 && human.words > 30 && Math.abs(bot.words - human.words) / Math.max(bot.words, human.words) > 0.6) r.push("The page content changes a lot depending on who is asking");
  return r;
}

async function follow(start: string, ua: string, referer?: string) {
  const hops: Hop[] = [{ url: start, status: 0, via: "start", host: new URL(start).hostname }];
  let url = start, html = "", status = 0;
  for (let i = 0; i < MAX_HOPS; i++) {
    const r = await get(url, ua, referer);
    status = r.status; hops[hops.length - 1].status = r.status; html = r.body;
    let next: { url: string; via: Hop["via"] } | null = null;
    if (r.status >= 300 && r.status < 400 && r.location) next = { url: new URL(r.location, url).href, via: "http" };
    else if (r.status === 200 && html) next = nextFromHtml(html, url);
    if (!next || hops.some((h) => h.url === next!.url)) break;
    url = next.url;
    hops.push({ url, status: 0, via: next.via, host: new URL(url).hostname });
  }
  return { hops, final: url, html, status };
}

export async function unmask(raw: string, self = ""): Promise<UnmaskReport> {
  SELF = self;
  const input = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `http://${raw.trim()}`;
  new URL(input); // throws on garbage
  const notes: string[] = [];
  let hops: Hop[] = [{ url: input, status: 0, via: "start", host: new URL(input).hostname }], final = input, human: View | null = null, bot: View | null = null;
  try {
    const h = await follow(input, UA_HUMAN, "https://web.whatsapp.com/");
    hops = h.hops; final = h.final; human = viewOf(h.status, h.final, h.html);
  } catch (e) { notes.push(`Couldn't open the link live (${e instanceof Error ? e.message : "network error"}). Judged on the address alone.`); }
  if (human) {
    try { const b = await follow(input, UA_BOT); bot = viewOf(b.status, b.final, b.html); }
    catch (e) { bot = viewOf(0, input, "", e instanceof Error ? e.message : "failed"); }
  }
  const reasons = bot && human ? compareViews(bot, human) : [];
  // Cloaking = people get a credential/OTP form while scanners get a different, form-free page (or an error).
  const credsForPeople = !!human && (human.hasPassword || human.hasOtp) && human.forms > 0;
  const cloaked = !!(bot && human && !bot.error && credsForPeople && bot.forms === 0 && !bot.hasPassword &&
    (bot.status >= 400 || (bot.title || "").toLowerCase() !== (human.title || "").toLowerCase()));
  const [link, ...hopReports] = await Promise.all([checkLink(final), ...hops.slice(0, -1).map((h) => checkLink(h.url))]);
  const hopFlags = hopReports.map((r, i) => ({ url: hops[i].url, risk: r?.risk ?? 0 }));
  const hidden = new URL(final).hostname !== new URL(input).hostname;
  const shortener = hops.some((h) => SHORTENERS.test(h.host));
  let risk = link?.risk ?? 0;
  if (cloaked) risk = Math.max(risk, 70 + Math.min(25, reasons.length * 8));
  if (hidden && hops.length > 3) risk = Math.max(risk, Math.min(risk + 15, 100));
  if (hopFlags.some((f) => f.risk >= 60)) risk = Math.max(risk, 75);
  const verdict = risk >= 60 ? "scam" : risk >= 25 || (hidden && shortener && hops.length > 2) ? "suspicious" : "likely_safe";
  return { input, hops, final, hidden, shortener, cloak: bot && human ? { bot, human, cloaked, reasons } : null, link, hopFlags, verdict, risk, notes };
}
