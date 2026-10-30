// Self-check for the hurdle engine: node --experimental-strip-types scripts/check-unmask.mts
import assert from "node:assert/strict";
import { nextFromHtml, viewOf, compareViews, assertPublic, unmask } from "../src/lib/unmask.ts";

assert.equal(nextFromHtml('<meta http-equiv="refresh" content="0; url=https://evil.top/login">', "https://a.com")?.url, "https://evil.top/login");
assert.equal(nextFromHtml('<script>window.location.href = "/step2"</script>', "https://a.com/x")?.url, "https://a.com/step2");
assert.equal(nextFromHtml("<p>hello</p>", "https://a.com"), null);

const bot = viewOf(200, "https://a.com", "<title>Recipe blog</title><p>" + "tasty ".repeat(80) + "</p>");
const human = viewOf(200, "https://a.com", '<title>SBI Login</title><form><input type="password"><p>Enter OTP</p></form>');
const r = compareViews(bot, human);
assert.ok(r.some((x) => x.includes("password")), "password-only-for-people flagged");
assert.ok(r.some((x) => x.includes("OTP")), "otp flagged");
assert.deepEqual(compareViews(bot, bot), [], "identical views are not cloaking");

for (const bad of ["http://127.0.0.1/", "http://localhost:3000/", "http://192.168.1.1/", "http://169.254.169.254/latest", "file:///etc/passwd"])
  await assert.rejects(assertPublic(new URL(bad)), bad);

for (const u of ["http://github.com", "http://google.com"]) {
  const r = await unmask(u);
  assert.equal(r.cloak?.cloaked ?? false, false, `${u} must not be flagged as cloaking`);
  assert.equal(r.verdict, "likely_safe", `${u} verdict`);
}
const live = await unmask("http://github.com");
assert.ok(live.hops.length >= 2 && live.final.startsWith("https://github.com"), "follows http->https redirect");
console.log("unmask ok:", live.hops.map((h) => `${h.status} ${h.url}`).join(" -> "), "| cloaked:", live.cloak?.cloaked, "| verdict:", live.verdict);
