// node --experimental-strip-types scripts/check-qr.mts
import assert from "node:assert/strict";
import { analyzeQr } from "../src/lib/qr.ts";

const scam = analyzeQr("upi://pay?pa=9876543210@ybl&pn=OLX%20Refund&am=4999&tn=Receive%20refund&cu=INR");
assert.equal(scam.kind, "upi"); assert.equal(scam.tone, "bad"); assert.ok(scam.risk >= 90, String(scam.risk));
const shop = analyzeQr("upi://pay?pa=chaiwala.store@okaxis&pn=Chai%20Wala&cu=INR");
assert.equal(shop.tone, "warn"); assert.ok(shop.risk < 60);
assert.equal(analyzeQr("https://sbi-kyc-update.top/verify").url, "https://sbi-kyc-update.top/verify");
assert.equal(analyzeQr("bit.ly/abc").url, "http://bit.ly/abc");
assert.equal(analyzeQr("tel:+919999999999").kind, "tel");
assert.equal(analyzeQr("WIFI:S:FreeAirport;T:nopass;;").kind, "wifi");
assert.equal(analyzeQr("Hello table 4").tone, "good");
console.log("qr ok");
