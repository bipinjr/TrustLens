// Self-check for the extension's offline link guard. Run: node scripts/check-guard.cjs
const assert = require("node:assert/strict");
const { linkReasons, shouldBlock } = require("../extension/guard.js");
const block = (u) => shouldBlock(linkReasons(u));

for (const u of ["http://sbi-kyc-update.xyz/verify", "https://hdfc-netbanking-login.top", "http://45.137.21.9/login", "https://paypa1-secure-login.com", "https://amazon-gift-rewards.shop/claim"])
  assert.ok(block(u), `should block ${u}`);
for (const u of ["https://www.google.com", "https://onlinesbi.sbi", "https://www.hdfcbank.com/personal", "https://github.com/bipinjr/TrustLens", "https://bit.ly/abc", "https://www.amazon.in/deals", "chrome://settings", "http://192.168.1.1/login", "http://localhost:3000/check"])
  assert.ok(!block(u), `should allow ${u}`);
console.log("check-guard: all passed");
