// Deterministic scam signals. Runs before the LLM: gives hard, explainable evidence
// and a fallback verdict if the model call fails.

export type Signal = {
  id: string;
  label: string;
  evidence: string;
  weight: number; // 0-30, contribution to rule score
};

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "is.gd", "rb.gy",
  "shorturl.at", "tiny.cc", "ow.ly", "rebrand.ly", "t.ly", "s.id", "v.gd",
];

const RISKY_TLDS = [
  "xyz", "top", "click", "live", "icu", "buzz", "shop", "online", "site",
  "rest", "monster", "cyou", "cfd", "sbs", "lol", "work", "support", "vip",
];

// brand keyword -> official domains (suffix match)
const BRANDS: Record<string, string[]> = {
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"],
  hdfc: ["hdfcbank.com", "hdfc.bank.in"],
  icici: ["icicibank.com", "icici.bank.in"],
  axis: ["axisbank.com", "axis.bank.in"],
  kotak: ["kotak.com", "kotak.bank.in"],
  paytm: ["paytm.com"],
  phonepe: ["phonepe.com"],
  amazon: ["amazon.in", "amazon.com"],
  flipkart: ["flipkart.com"],
  "india post": ["indiapost.gov.in"],
  indiapost: ["indiapost.gov.in"],
  "income tax": ["incometax.gov.in"],
  aadhaar: ["uidai.gov.in"],
  uidai: ["uidai.gov.in"],
  electricity: [".gov.in", ".nic.in"],
  fedex: ["fedex.com"],
  dhl: ["dhl.com"],
  netflix: ["netflix.com"],
  whatsapp: ["whatsapp.com"],
};

type Rule = { id: string; label: string; weight: number; re: RegExp };

const RULES: Rule[] = [
  {
    id: "urgency",
    label: "Manufactured urgency",
    weight: 12,
    re: /\b(urgent(ly)?|immediately|right now|today itself|within \d+\s*(hours?|hrs?|minutes?|mins?)|expire[sd]?|expiring|last (chance|date|warning)|final (notice|warning)|act now|before midnight|aaj hi|turant)\b/gi,
  },
  {
    id: "threat",
    label: "Threat of loss or penalty",
    weight: 12,
    re: /\b(block(ed)?|suspend(ed)?|deactivat(e|ed)|disconnect(ed)?|frozen|freeze|terminat(e|ed)|penalty|legal action|fine of|will be cut|band ho)\b/gi,
  },
  {
    id: "credentials",
    label: "Asks for secret credentials",
    weight: 25,
    re: /\b(otp|one[- ]time password|upi pin|atm pin|\bpin\b|cvv|password|net ?banking (id|password)|card number|expiry date|share the code)\b/gi,
  },
  {
    id: "kyc",
    label: "Fake KYC / identity update",
    weight: 15,
    re: /\b(kyc|re-?kyc|pan (card )?(update|link)|aadhaa?r (update|link|verify)|update your (details|pan|kyc))\b/gi,
  },
  {
    id: "authority",
    label: "Impersonates police / govt agency",
    weight: 22,
    re: /\b(cbi|police|cyber ?crime|customs|narcotics|ncb|enforcement directorate|\bed\b officer|trai|rbi officer|income tax officer|arrest warrant|digital arrest|money laundering|drug(s)? (found|parcel)|illegal parcel|fir (registered|lodged)|court (notice|summons))\b/gi,
  },
  {
    id: "secrecy",
    label: "Demands secrecy / isolation",
    weight: 15,
    re: /\b(do ?n[o']t (tell|inform|share with) (anyone|family|bank)|keep (this )?(confidential|secret)|stay on (the )?(video )?call|don't disconnect|kisi ko mat batana)\b/gi,
  },
  {
    id: "prize",
    label: "Too-good-to-be-true reward",
    weight: 14,
    re: /\b(you (have )?won|winner|lottery|lucky draw|prize|jackpot|cash ?back of|reward points? (expir|redeem)|free gift|claim (your|now)|congratulations)\b/gi,
  },
  {
    id: "job",
    label: "Easy-money job / task scam",
    weight: 16,
    re: /\b(work from home|part[- ]time job|earn (rs\.?|₹|inr)?\s?\d[\d,]*\s*(per|\/)\s*(day|hour)|daily (income|payout)|like (youtube )?videos|rate (hotels|products)|prepaid task|telegram (group|channel)|investment (plan|scheme) .{0,20}(guaranteed|double))\b/gi,
  },
  {
    id: "payment",
    label: "Asks you to pay or transfer money",
    weight: 14,
    re: /\b(pay (now|rs|₹|inr)|processing fee|registration fee|refundable deposit|transfer (rs|₹|inr|the amount)|scan (this|the) qr|collect request|approve the request|security deposit)\b/gi,
  },
  {
    id: "apk",
    label: "Pushes an app / file install",
    weight: 22,
    re: /(\.apk\b|download (this|the) app|install (anydesk|teamviewer|quicksupport|rustdesk)|screen ?shar(e|ing))/gi,
  },
  {
    id: "callback",
    label: "Pushes you to call an unknown number",
    weight: 8,
    re: /\b(call|contact|whatsapp)\b[^.\n]{0,25}(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/gi,
  },
  // Hindi (Devanagari): no , JS word boundaries are ASCII-only. Same ids, so de-dupe merges them.
  { id: "urgency", label: "Manufactured urgency", weight: 12, re: /(तुरंत|आज ही|आज रात|अभी तुरंत|जल्दी करें)/g },
  { id: "threat", label: "Threat of loss or penalty", weight: 12, re: /(काट दिया जाएगा|बंद कर दिया|ब्लॉक|निलंबित|जुर्माना)/g },
  { id: "credentials", label: "Asks for secret credentials", weight: 25, re: /(ओटीपी|पिन नंबर|पासवर्ड)/g },
  { id: "kyc", label: "Fake KYC / identity update", weight: 15, re: /(केवाईसी|पैन कार्ड अपडेट|आधार अपडेट|आधार लिंक)/g },
  { id: "authority", label: "Impersonates police / govt agency", weight: 22, re: /(पुलिस|सीबीआई|गिरफ्तारी|वारंट|कस्टम विभाग)/g },
  { id: "prize", label: "Too-good-to-be-true reward", weight: 14, re: /(लॉटरी|इनाम|आपने जीत)/g },
  { id: "callback", label: "Pushes you to call an unknown number", weight: 8, re: /(संपर्क|कॉल)[^।\n]{0,40}[6-9]\d{9}/g },
];

const URL_RE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;

function hostOf(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function extractHosts(text: string): string[] {
  const hosts = new Set<string>();
  for (const m of text.matchAll(URL_RE)) {
    const h = hostOf(m[1]);
    // skip things like "Rs.500" or "a.m" that look domain-ish
    if (h && /\.[a-z]{2,}$/.test(h) && !/^\d+\.\d+$/.test(h)) hosts.add(h);
  }
  return [...hosts];
}

const endsWithDomain = (host: string, d: string) =>
  d.startsWith(".") ? host.endsWith(d) : host === d || host.endsWith(`.${d}`);

export function detectSignals(text: string): Signal[] {
  const out: Signal[] = [];
  const lower = text.toLowerCase();

  for (const r of RULES) {
    const hits = [...new Set([...text.matchAll(r.re)].map((m) => m[0].trim()))];
    if (hits.length) {
      out.push({
        id: r.id,
        label: r.label,
        evidence: hits.slice(0, 3).map((h) => `"${h}"`).join(", "),
        weight: r.weight,
      });
    }
  }

  const hosts = extractHosts(text);

  for (const h of hosts) {
    if (SHORTENERS.some((s) => endsWithDomain(h, s))) {
      out.push({ id: "shortener", label: "Hidden link (URL shortener)", evidence: h, weight: 15 });
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
      out.push({ id: "ip-link", label: "Link to a raw IP address", evidence: h, weight: 20 });
    }
    const tld = h.split(".").pop()!;
    if (RISKY_TLDS.includes(tld)) {
      out.push({ id: "risky-tld", label: "Link on a throwaway domain", evidence: h, weight: 12 });
    }
    // lookalike digits: sb1, amaz0n, paytrn, hdfcbank-secure, etc.
    if (/(sb1|amaz0n|amazom|paytrn|paypa1|g00gle|micros0ft|app1e|faceb00k|netf1ix|flipkrt|hdfc-|icici-|-kyc|kyc-|secure-?login|verify-?account|update-?kyc)/.test(h)) {
      out.push({ id: "lookalike", label: "Lookalike / spoofed domain", evidence: h, weight: 22 });
    }
  }

  // brand mentioned + a link that is not the brand's official domain
  for (const [brand, official] of Object.entries(BRANDS)) {
    if (!new RegExp(`\\b${brand}\\b`, "i").test(lower)) continue;
    const bad = hosts.filter((h) => !official.some((d) => endsWithDomain(h, d)));
    if (bad.length && hosts.length) {
      out.push({
        id: `spoof-${brand.replace(/\s/g, "-")}`,
        label: `Claims to be ${brand.toUpperCase()} but links elsewhere`,
        evidence: bad.slice(0, 2).join(", "),
        weight: 22,
      });
    }
  }

  // de-dupe by id (keep first)
  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

// ponytail: additive weights capped at 100; calibrate weights against a labeled set if time allows
export function ruleScore(signals: Signal[]): number {
  return Math.min(100, signals.reduce((a, s) => a + s.weight, 0));
}

// Character ranges of rule hits, for live in-browser highlighting while the user types.
export type Match = { start: number; end: number; label: string };

export function findMatches(text: string): Match[] {
  const out: Match[] = [];
  for (const r of RULES) {
    for (const m of text.matchAll(r.re)) {
      if (m.index !== undefined) out.push({ start: m.index, end: m.index + m[0].length, label: r.label });
    }
  }
  const bad = new Set(detectSignals(text).filter((s) => !RULES.some((r) => r.id === s.id)).flatMap((s) => s.evidence.split(", ")));
  for (const m of text.matchAll(URL_RE)) {
    const h = hostOf(m[1]);
    if (h && m.index !== undefined && bad.has(h)) out.push({ start: m.index, end: m.index + m[0].length, label: "Suspicious link" });
  }
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Match[] = [];
  for (const m of out) if (!merged.length || m.start >= merged[merged.length - 1].end) merged.push(m);
  return merged;
}

// Positive evidence: links that resolve to a known official domain. Fed to the AI so it
// doesn't flag genuine bank / government messages just for containing words like "KYC" or "OTP".
const OFFICIAL_SUFFIXES = [".gov.in", ".nic.in", ".bank.in", ...new Set(Object.values(BRANDS).flat().filter((d) => !d.startsWith(".")))];

export function officialHosts(text: string): string[] {
  return extractHosts(text).filter((h) => OFFICIAL_SUFFIXES.some((d) => (d.startsWith(".") ? h.endsWith(d) : h === d || h.endsWith(`.${d}`))));
}
