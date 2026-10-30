// Offline link heuristics shared by the background worker. Mirrors the server rule engine's domain checks.
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "is.gd", "rb.gy", "shorturl.at", "tiny.cc", "ow.ly", "rebrand.ly", "t.ly", "s.id", "v.gd"];
const RISKY_TLDS = ["xyz", "top", "click", "live", "icu", "buzz", "shop", "online", "site", "rest", "monster", "cyou", "cfd", "sbs", "lol", "work", "support", "vip"];
const BRANDS = {
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"], hdfc: ["hdfcbank.com", "hdfc.bank.in"], icici: ["icicibank.com", "icici.bank.in"],
  axis: ["axisbank.com", "axis.bank.in"], kotak: ["kotak.com", "kotak.bank.in"], paytm: ["paytm.com"], phonepe: ["phonepe.com"],
  amazon: ["amazon.in", "amazon.com", "amazon.co.uk", "amazonaws.com"], flipkart: ["flipkart.com"], indiapost: ["indiapost.gov.in"],
  incometax: ["incometax.gov.in"], uidai: ["uidai.gov.in"], aadhaar: ["uidai.gov.in"], paypal: ["paypal.com"], netflix: ["netflix.com"],
  whatsapp: ["whatsapp.com", "whatsapp.net"], google: ["google.com", "google.co.in", "googleusercontent.com", "googleapis.com", "gstatic.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "microsoftonline.com"], apple: ["apple.com", "icloud.com"],
};
const endsWith = (h, d) => h === d || h.endsWith(`.${d}`);

// Returns a list of reasons; empty means nothing suspicious.
function linkReasons(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return []; }
  if (!/^https?:$/.test(u.protocol)) return [];
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  // Never interfere with local networks (routers, dev servers).
  if (host === "localhost" || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith(".local")) return [];
  const reasons = [];
  const rawIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const risky = RISKY_TLDS.includes(host.split(".").pop());
  if (rawIp) reasons.push({ label: "Link to a raw IP address instead of a website name", weight: 20 });
  if (risky) reasons.push({ label: `Throwaway domain (.${host.split(".").pop()})`, weight: 12 });
  if ((rawIp || risky) && /(log-?in|sign-?in|verify|kyc|otp|password|account|wallet|bank)/i.test(u.pathname + u.search))
    reasons.push({ label: "Asks you to log in or verify on an untrusted address", weight: 12 });
  if (/(sb1|amaz0n|amazom|paytrn|paypa1|g00gle|micros0ft|app1e|faceb00k|netf1ix|whatsap\b|flipkrt)/.test(host)) reasons.push({ label: "Fake look-alike of a well-known brand name", weight: 30 });
  else if (/(-kyc|kyc-|secure-?login|verify-?account|update-?kyc|account-?verify|login-?verify)/.test(host)) reasons.push({ label: "Lookalike / spoofed domain", weight: 22 });
  if (/xn--/.test(host)) reasons.push({ label: "Disguised characters in the address (punycode)", weight: 18 });
  for (const [brand, official] of Object.entries(BRANDS)) {
    if (host.includes(brand) && !official.some((d) => endsWith(host, d))) {
      reasons.push({ label: `Uses the name "${brand.toUpperCase()}" but is not ${brand.toUpperCase()}'s official site`, weight: 30 });
      break;
    }
  }
  if (u.username || u.password) reasons.push({ label: "Hides the real address behind an @ sign", weight: 20 });
  if (SHORTENERS.some((s) => endsWith(host, s))) reasons.push({ label: "Shortened link that hides where it goes", weight: 10 });
  return reasons;
}

// Block only when the evidence is strong enough; shorteners alone never block.
function shouldBlock(reasons) {
  return reasons.reduce((a, r) => a + r.weight, 0) >= 30;
}

if (typeof self !== "undefined") Object.assign(self, { linkReasons, shouldBlock });
if (typeof module !== "undefined") module.exports = { linkReasons, shouldBlock };
