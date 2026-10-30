// QR reading for the popup: decode (BarcodeDetector -> jsQR multi-pass) and explain UPI payment QRs.
// Mirrors src/lib/qr.ts in the web app.
const QR_BAIT = /refund|cashback|prize|lottery|reward|won|winner|receive|kyc|verify|unblock|electricity|bill\s?due|customs|parcel|loan|job|task|bonus|gift|claim|olx|army/i;

async function decodeQr(img) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  if (self.BarcodeDetector) {
    try { const r = await new BarcodeDetector({ formats: ["qr_code"] }).detect(img); if (r[0]?.rawValue) return r[0].rawValue; } catch {}
  }
  const c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true });
  for (const s of [1, 1600 / Math.max(w, h), 800 / Math.max(w, h), 2].map((x) => Math.min(x, 3000 / Math.max(w, h)))) {
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    for (const filter of ["none", "grayscale(1) contrast(1.8)"]) {
      g.filter = filter; g.drawImage(img, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height);
      const hit = jsQR(d.data, d.width, d.height, { inversionAttempts: "attemptBoth" });
      if (hit?.data) return hit.data;
    }
  }
  return null;
}

function analyzeUpi(text) {
  let q;
  try { q = new URL(text.replace(/^upi:\/\//i, "https://upi/")).searchParams; } catch { q = new URLSearchParams(); }
  const pa = q.get("pa") || "", pn = q.get("pn") || "", am = q.get("am") || "", tn = q.get("tn") || "";
  const flags = ["Scanning this QR SENDS money. You never scan a QR or enter a PIN to receive money."];
  let risk = 45;
  if (am && Number(am) > 0) { flags.push(`₹${am} is pre-filled: one tap and your PIN sends it.`); risk += 15; }
  if (QR_BAIT.test(`${tn} ${pn}`)) { flags.push(`Bait in the note: “${tn || pn}”.`); risk += 30; }
  if (/^\d{10}@/.test(pa)) { flags.push("Paid to a personal phone-number UPI ID, not a merchant."); risk += 5; }
  return { risk: Math.min(100, risk), pa, pn, am, flags };
}
