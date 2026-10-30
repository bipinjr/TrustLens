// Self-check for link and file checks. Run: node --experimental-strip-types scripts/check-intel.mts
import assert from "node:assert/strict";
import { checkHash, checkLink, hostOf } from "../src/lib/intel.ts";

const EICAR = "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f";

assert.equal((await checkHash(EICAR)).verdict, "malware", "EICAR must be flagged");
assert.equal((await checkHash("a".repeat(64))).verdict, "not_found");
assert.equal(hostOf("https://www.SBI.co.in/x"), "sbi.co.in");
assert.equal(await checkLink("hello there"), null, "plain text is not a link");

const spoof = await checkLink("http://sbi-kyc-update.xyz/verify");
assert.ok(spoof && spoof.verdict === "scam", "spoofed SBI KYC link must be a scam");
const paypal = await checkLink("https://paypa1-secure-login.com");
assert.ok(paypal && paypal.verdict === "scam", "paypa1 look-alike must be a scam");
const google = await checkLink("https://www.google.com");
assert.ok(google && google.verdict === "likely_safe", "google.com must look safe");

console.log("check-intel: all passed");
