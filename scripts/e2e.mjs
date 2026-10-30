// End-to-end smoke test against a running server: node scripts/e2e.mjs [baseUrl]
const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`); if (!cond) fails++; };
const post = async (path, body) => { const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };

for (const p of ["/", "/hurdle", "/check", "/phishing", "/malware", "/signature", "/extension", "/radar", "/learn", "/research", "/icon.svg", "/vendor/jsQR.js"]) {
  const r = await fetch(BASE + p);
  ok(`GET ${p}`, r.status === 200, String(r.status));
}
ok("GET /nope is 404", (await fetch(BASE + "/nope")).status === 404);

let r = await post("/api/link-check", { url: "https://sbi-kyc-update.top/verify" });
ok("link-check flags sbi-kyc-update.top", r.j.verdict === "scam", `${r.j.verdict} ${r.j.risk}`);
r = await post("/api/link-check", { url: "https://www.google.com" });
ok("link-check google is safe", r.j.verdict === "likely_safe", r.j.verdict);

r = await post("/api/file-check", { sha256: "fe772622d60738fdaa56d7460d9ebab026f43d38b553174321c0b796419b9462" });
ok("file-check demo sample = malware", r.j.verdict === "malware", r.j.verdict);
r = await post("/api/file-check", { sha256: "nothex" });
ok("file-check rejects bad hash", r.status === 400);

r = await post("/api/unmask", { url: `${BASE}/lab/go` });
ok("unmask lab: 3 hops", r.j.hops?.length === 4, r.j.hops?.map((h) => h.via).join(">"));
ok("unmask lab: cloaking caught", r.j.cloak?.cloaked === true && r.j.verdict === "scam", `${r.j.verdict} ${r.j.risk}`);
r = await post("/api/unmask", { url: "http://github.com" });
ok("unmask github: safe, not cloaked", r.j.verdict === "likely_safe" && !r.j.cloak?.cloaked, `${r.j.verdict} ${r.j.final}`);
r = await post("/api/unmask", { url: "http://169.254.169.254/latest/meta-data" });
ok("unmask blocks cloud metadata (SSRF)", !r.j.hops || r.j.hops.length === 1 && r.j.cloak === null, JSON.stringify(r.j.notes || r.j.error));
r = await post("/api/unmask", { url: "" });
ok("unmask rejects empty", r.status === 400);

r = await post("/api/analyze", { text: "Dear customer your SBI account will be blocked today. Update KYC at sbi-kyc-update.top and share OTP", language: "English" });
ok("analyze scam message", r.status === 200 && r.j.verdict === "scam", `${r.status} ${r.j.verdict ?? r.j.error}`);
r = await fetch(BASE + "/api/radar");
ok("radar feed", r.status === 200);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
