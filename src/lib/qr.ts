// Reads what a QR code actually asks you to do. Pure: works in browser and node.
export type QrVerdict = { kind: "upi" | "url" | "tel" | "wifi" | "text"; tone: "bad" | "warn" | "good"; title: string; risk: number; facts: [string, string][]; flags: string[]; url?: string };

const BAIT = /refund|cashback|prize|lottery|reward|won|winner|receive|kyc|verify|unblock|electricity|bill\s?due|customs|parcel|loan|job|task|bonus|gift|claim|olx|army/i;

export function analyzeQr(raw: string): QrVerdict {
  const text = raw.trim();
  if (/^upi:\/\//i.test(text)) {
    let q: URLSearchParams;
    try { q = new URL(text.replace(/^upi:\/\//i, "https://upi/")).searchParams; } catch { q = new URLSearchParams(); }
    const pa = q.get("pa") || "", pn = q.get("pn") || "", am = q.get("am") || "", tn = q.get("tn") || q.get("purpose") || "";
    const flags = ["Scanning this QR SENDS money from your account. You never need to scan a QR or enter a PIN to receive money."];
    let risk = 45;
    if (am && Number(am) > 0) { flags.push(`The amount ₹${am} is pre-filled, so one tap and PIN sends it.`); risk += 15; }
    if (BAIT.test(`${tn} ${pn}`)) { flags.push(`The note says “${tn || pn}”: refund, prize or KYC wording is a classic QR-scam lure.`); risk += 30; }
    if (pa && !/^[\w.-]{2,64}@[a-z]{2,32}$/i.test(pa)) { flags.push("The UPI ID is malformed."); risk += 10; }
    if (/^\d{10}@/.test(pa)) { flags.push("Payee is a personal phone-number UPI ID, not a registered merchant."); risk += 5; }
    risk = Math.min(100, risk);
    return { kind: "upi", tone: risk >= 60 ? "bad" : "warn", risk, title: risk >= 60 ? "QR payment scam" : "This QR takes money",
      facts: [["Pays to", pa || "unknown"], ["Name shown", pn || "none"], ["Amount", am ? `₹${am}` : "you type it"], ["Note", tn || "none"]], flags };
  }
  if (/^https?:\/\//i.test(text) || /^[\w-]+(\.[\w-]+)+\/?\S*$/.test(text))
    return { kind: "url", tone: "warn", risk: 0, title: "This QR opens a link", facts: [["Link", text]], flags: ["Checking where it really leads…"], url: /^https?:/i.test(text) ? text : `http://${text}` };
  if (/^(tel|sms|smsto):/i.test(text))
    return { kind: "tel", tone: "warn", risk: 30, title: "This QR calls or texts a number", facts: [["Number", text.replace(/^\w+:/, "").split(/[:?]/)[0]]], flags: ["Don't share OTPs or bank details on this call or message."] };
  if (/^WIFI:/i.test(text))
    return { kind: "wifi", tone: "warn", risk: 20, title: "This QR joins a Wi-Fi network", facts: [["Network", text.match(/S:([^;]*)/)?.[1] || "unknown"]], flags: ["Public Wi-Fi from a random QR can watch your traffic. Avoid banking on it."] };
  return { kind: "text", tone: BAIT.test(text) ? "warn" : "good", risk: BAIT.test(text) ? 35 : 5, title: BAIT.test(text) ? "Plain text with scam bait" : "Plain text, no action", facts: [["Text", text.slice(0, 160)]], flags: BAIT.test(text) ? ["It uses lure words. Don't follow instructions in it."] : ["It doesn't open anything or take money."] };
}
