// Self-check for the rule engine. Run: node --experimental-strip-types scripts/check-signals.mts
import assert from "node:assert/strict";
import { detectSignals, findMatches, ruleScore } from "../src/lib/signals.ts";

const scam = "Dear SBI customer, your account will be BLOCKED today. Update KYC: http://sbi-kyc-update.xyz/verify or call 9876543210";
const hits = findMatches(scam).map((m) => scam.slice(m.start, m.end));
assert.ok(hits.some((h) => h.includes("sbi-kyc-update.xyz")), "spoofed link not highlighted");
assert.ok(hits.some((h) => /blocked/i.test(h)), "threat not highlighted");
assert.ok(ruleScore(detectSignals(scam)) >= 65, "classic KYC scam should score high on rules alone");

const otp = "483920 is your OTP for login to HDFC Bank NetBanking. Do not share this OTP with anyone. -HDFC Bank";
assert.ok(ruleScore(detectSignals(otp)) < 35, "genuine OTP should stay low on rules");

const hindi = "आपका बिजली कनेक्शन आज रात काट दिया जाएगा। तुरंत संपर्क करें 8123456789";
assert.ok(detectSignals(hindi).length >= 2, "Hindi rules should fire");

console.log("signals: all checks passed;", hits.length, "highlights on KYC sample");
