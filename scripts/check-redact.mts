// Privacy self-check: nothing personal survives redaction before a report is stored.
// Run: node --experimental-strip-types scripts/check-redact.mts
import assert from "node:assert/strict";
import { redact } from "../src/lib/redact.ts";

const red = redact(
  "Call 9876543210 or +91 98765 43210, OTP 483920, PIN 4821, a/c 123456789012, " +
    "mail a.b@okaxis or x@gmail.com. Pay Rs 25,00,000 at sbi-kyc.xyz",
);
for (const leak of ["9876543210", "98765 43210", "483920", "4821", "123456789012", "a.b@okaxis", "x@gmail.com"])
  assert.ok(!red.includes(leak), `leaked: ${leak}`);
assert.ok(red.includes("sbi-kyc.xyz"), "scam domain should be kept");
console.log("redact: all checks passed ->", red);
