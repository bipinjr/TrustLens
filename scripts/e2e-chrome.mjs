// Full end-to-end run in real Chrome (headless, throwaway profile) over the DevTools protocol.
// Usage: node scripts/e2e-chrome.mjs [baseUrl] [outDir]   (server must be running)
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const OUT = process.argv[3] || "e2e-out";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = "E:/Hackathon/Don Bosco/Code-files";
const DEMO = "E:/Hackathon/Don Bosco/Demo-Files";
mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync("E:/tl-e2e-");
const DL = join(profile, "downloads"); mkdirSync(DL);

const proc = spawn(CHROME, ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-pipe", "--enable-unsafe-extension-debugging",
  "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", "about:blank"], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
const toC = proc.stdio[3], fromC = proc.stdio[4];
let id = 0, buf = "";
const waiting = new Map(), errors = new Map();
fromC.on("data", (d) => {
  buf += d.toString(); let i;
  while ((i = buf.indexOf("\0")) >= 0) {
    const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
    if (m.id && waiting.has(m.id)) { const w = waiting.get(m.id); waiting.delete(m.id); m.error ? w.rej(new Error(JSON.stringify(m.error))) : w.res(m.result); continue; }
    const e = m.method === "Runtime.exceptionThrown" ? m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text
      : m.method === "Runtime.consoleAPICalled" && m.params.type === "error" ? m.params.args.map((a) => a.value ?? a.description).join(" ")
      : m.method === "Log.entryAdded" && m.params.entry.level === "error" ? `${m.params.entry.text} ${m.params.entry.url || ""}` : null;
    if (e && m.sessionId) errors.get(m.sessionId)?.push(e.slice(0, 200));
  }
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const m = { id: ++id, method, params }; if (sessionId) m.sessionId = sessionId; waiting.set(m.id, { res, rej }); toC.write(JSON.stringify(m) + "\0"); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function attach(targetId) {
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  errors.set(sessionId, []);
  for (const d of ["Page.enable", "Runtime.enable", "Log.enable", "DOM.enable"]) await send(d, {}, sessionId).catch(() => {});
  return { targetId, sessionId };
}
const open = async (url) => attach((await send("Target.createTarget", { url })).targetId);
const ev = async (s, expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, s.sessionId); return r.result.value; };
const urlOf = async (t) => (await send("Target.getTargetInfo", { targetId: t.targetId })).targetInfo.url;
const shot = async (s, name) => { const { data } = await send("Page.captureScreenshot", { format: "png" }, s.sessionId); writeFileSync(join(OUT, name), Buffer.from(data, "base64")); };
const go = async (s, url, wait = 2500) => { await send("Page.navigate", { url }, s.sessionId); await sleep(wait); };
const waitFor = async (s, expr, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(s, expr).catch(() => false)) return true; await sleep(300); } return false; };
const setFiles = async (s, selector, files) => { const { root } = await send("DOM.getDocument", {}, s.sessionId); const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector }, s.sessionId); await send("DOM.setFileInputFiles", { nodeId, files }, s.sessionId); };
const text = (s, sel) => ev(s, `(document.querySelector(${JSON.stringify(sel)})?.innerText || "").replace(/\\s+/g, " ").slice(0, 300)`);
const click = (s, js) => ev(s, `(${js})?.click(), true`);
const byText = (sel, t) => `[...document.querySelectorAll(${JSON.stringify(sel)})].find(e => e.textContent.includes(${JSON.stringify(t)}))`;
const viewport = (s, mobile) => send("Emulation.setDeviceMetricsOverride", mobile ? { width: 375, height: 812, deviceScaleFactor: 2, mobile: true } : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, s.sessionId);

let fails = 0; const log = [];
const ok = (name, cond, extra = "") => { const l = `${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  (${String(extra).slice(0, 160)})` : ""}`; console.log(l); log.push(l); if (!cond) fails++; };

try {
  await sleep(1500);
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: DL });

  /* ---------- A. Every page, desktop + phone: loads, no JS errors, no sideways scroll ---------- */
  const pages = ["/", "/share", "/check", "/phishing", "/malware", "/signature", "/extension", "/radar", "/learn", "/research"];
  const t = await open("about:blank");
  for (const mobile of [false, true]) {
    await viewport(t, mobile);
    for (const p of pages) {
      errors.set(t.sessionId, []);
      await go(t, BASE + p, 3000);
      const m = await ev(t, `({ w: document.documentElement.scrollWidth, iw: innerWidth, h1: document.querySelector("h1")?.innerText.slice(0, 50) })`);
      const errs = errors.get(t.sessionId).filter((e) => !/favicon|Download the React DevTools/.test(e));
      ok(`${mobile ? "phone" : "desktop"} ${p} loads, no errors`, !!m.h1 && errs.length === 0, errs[0] || m.h1);
      ok(`${mobile ? "phone" : "desktop"} ${p} no sideways scroll`, m.w <= m.iw + 1, `${m.w} > ${m.iw}`);
      await shot(t, `${mobile ? "m" : "d"}${p.replace(/\//g, "_") || "_home"}.png`);
    }
  }
  await viewport(t, false);

  /* ---------- B. Tools ---------- */
  await go(t, BASE + "/", 2500);
  const lx0 = await ev(t, `getComputedStyle(document.querySelector(".xr-stage")).getPropertyValue("--lx")`);
  const box = await ev(t, `(() => { const r = document.querySelector(".xr-stage").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  for (let i = 0; i < 12; i++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x + box.w * (0.2 + i * 0.05), y: box.y + box.h * 0.3 }, t.sessionId); await sleep(40); }
  await sleep(600);
  const lx1 = await ev(t, `getComputedStyle(document.querySelector(".xr-stage")).getPropertyValue("--lx")`);
  ok("home: X-ray lens follows the cursor", lx0 !== lx1, `${lx0} -> ${lx1}`);
  await shot(t, "tool_home_lens.png");

  await go(t, BASE + "/phishing");
  await click(t, byText("button", "paypa1-secure-login.com"));
  ok("phishing: paypa1 flagged", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Phishing")`), await text(t, "[role=status]"));

  await go(t, BASE + "/malware");
  await setFiles(t, "#file", [`${DEMO}/trustlens-demo-malware-sample.txt`]);
  ok("malware: demo sample is known malware", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Delete this file")`), await text(t, "[role=status]"));
  await setFiles(t, "#file", [`${DEMO}/qr-shop-upi.png`]);
  ok("malware: clean file not flagged", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Not a known threat")`), await text(t, "[role=status]"));

  // Signature: sign a doc, then verify original (pass) and an edited copy (tampered)
  const docA = join(profile, "circular.txt"), docB = join(profile, "circular-edited.txt");
  writeFileSync(docA, "DBIT Exam Cell: Semester exams start 12 Nov 2026."); writeFileSync(docB, "DBIT Exam Cell: Semester exams start 02 Nov 2026.");
  await go(t, BASE + "/signature");
  await click(t, byText("button", "sign"));
  await sleep(500);
  await ev(t, `(() => { const i = document.querySelector("#sname"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "DBIT Exam Cell"); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await setFiles(t, "#sdoc", [docA]);
  await click(t, byText("button[type=submit]", "Sign and download"));
  ok("signature: signed", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Signed and sealed")`), await text(t, "[role=status]"));
  await sleep(1500);
  const sig = readdirSync(DL).find((f) => f.endsWith(".sig"));
  ok("signature: .sig downloaded", !!sig, readdirSync(DL).join(","));
  if (sig) {
    await click(t, byText("button", "verify"));
    await sleep(400);
    await setFiles(t, "#vdoc", [docA]); await setFiles(t, "#vsig", [join(DL, sig)]);
    await click(t, byText("button[type=submit]", "Verify originality"));
    ok("signature: original verifies", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Original and unchanged")`), await text(t, "[role=status]"));
    await setFiles(t, "#vdoc", [docB]);
    await click(t, byText("button[type=submit]", "Verify originality"));
    ok("signature: edited copy = tampered", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Don't trust this")`), await text(t, "[role=status]"));
  }

  await go(t, BASE + "/#unmask", 3500);
  await click(t, byText("button", "demo: 3 hops"));
  ok("hurdle: demo lab -> two-faced page", await waitFor(t, `document.querySelector("[role=status]")?.innerText.includes("Two-faced page")`, 30000), await text(t, "[role=status]"));
  await shot(t, "tool_hurdle_unmask.png");
  const qrInput = "#qr input[type=file]";
  for (const [file, want] of [["qr-upi-refund-scam.png", "QR payment scam"], ["qr-upi-refund-scam-small.png", "QR payment scam"], ["qr-shop-upi.png", "This QR takes money"], ["qr-link-short.png", "QR opens"]]) {
    await go(t, BASE + "/#qr", 3500);
    await setFiles(t, qrInput, [`${DEMO}/${file}`]);
    ok(`hurdle QR: ${file}`, await waitFor(t, `document.querySelector("#qr")?.innerText.includes(${JSON.stringify(want)})`, 15000), (await text(t, "#qr")).slice(-120));
  }
  await shot(t, "tool_hurdle_qr.png");
  await go(t, BASE + "/#qr", 3000);
  await click(t, byText("button", "Try a scam QR"));
  ok("hurdle QR: sample button", await waitFor(t, `document.querySelector("#qr")?.innerText.includes("QR payment scam")`), "");

  await go(t, BASE + "/share?text=" + encodeURIComponent(`check this ${BASE}/lab/go now`), 3500);
  ok("phone app share: shared link auto-unmasked", await waitFor(t, `document.body.innerText.includes("Two-faced page")`, 30000), await text(t, "h1"));
  await go(t, BASE + "/radar", 4000);
  ok("radar renders data (live or snapshot)", await waitFor(t, `/Reports in the last 14 days/.test(document.body.innerText)`, 15000), await text(t, "main"));
  ok("nav has Unmask, Protect, Scam Radar, Learn, Research", await ev(t, `["Unmask","Protect","Scam Radar","Learn","Research"].every((w) => document.querySelector("nav[aria-label=Main]").innerText.includes(w))`));
  await go(t, BASE + "/check", 3500);
  ok("check page renders the checker", await ev(t, `!!document.querySelector("textarea")`));

  /* ---------- C. Extension in real Chrome ---------- */
  const { id: ext } = await send("Extensions.loadUnpacked", { path: `${ROOT}/extension` });
  ok("extension loads", !!ext, ext);
  await sleep(5000);

  // C1. Same tab: safe page -> phishing link -> warning -> Go back = previous page
  const a = await open(BASE + "/learn");
  await sleep(2500);
  await go(a, "http://paypa1-secure-login.com/signin", 3000);
  const w1 = await urlOf(a);
  ok("ext: look-alike blocked in same tab", w1.includes("warning.html"), w1);
  await shot(a, "ext_warning.png");
  ok("ext: warning lists reasons", (await text(a, "#reasons")).length > 10, await text(a, "#reasons"));
  await click(a, `document.querySelector("#back")`);
  await sleep(2500);
  ok("ext: Go back returns to the previous page", (await urlOf(a)).startsWith(BASE + "/learn"), await urlOf(a));

  // C2. Link opens a new tab -> warning -> Go back closes it and returns to the opener
  // a real click on a target=_blank link, like a user opening a link from WhatsApp Web
  await ev(a, `(() => { const l = document.createElement("a"); l.href = "http://paypa1-secure-login.com/new-tab"; l.target = "_blank"; l.id = "tl-test-link"; l.textContent = "open"; l.style.cssText = "position:fixed;left:10px;top:120px;z-index:9999;padding:20px;background:#fff"; document.body.append(l); return true; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: 30, y: 140, button: "left", clickCount: 1 }, a.sessionId);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 30, y: 140, button: "left", clickCount: 1 }, a.sessionId);
  await sleep(3500);
  let targets = (await send("Target.getTargets")).targetInfos.filter((x) => x.type === "page");
  const nt = targets.find((x) => x.url.includes("warning.html"));
  ok("ext: new-tab phishing blocked", !!nt, targets.map((x) => x.url).join(" | "));
  if (nt) {
    const b = await attach(nt.targetId);
    await click(b, `document.querySelector("#back")`);
    await sleep(2500);
    targets = (await send("Target.getTargets")).targetInfos.filter((x) => x.type === "page");
    ok("ext: Go back closes the bad tab, opener kept", !targets.some((x) => x.targetId === nt.targetId) && targets.some((x) => x.targetId === a.targetId), targets.map((x) => x.url).join(" | "));
  }

  // C3. Hidden server redirect to a phishing host
  await go(a, BASE + "/lab/to-phish", 3500);
  const w3 = await urlOf(a);
  ok("ext: phishing reached via redirect is blocked", w3.includes("warning.html"), w3);
  ok("ext: warning says it was a redirect", (await text(a, "#reasons")).includes("redirect"), await text(a, "#reasons"));

  // C4. Safe sites are untouched
  await go(a, BASE + "/learn", 2500);
  ok("ext: safe site not blocked", (await urlOf(a)).startsWith(BASE), await urlOf(a));

  // C5. Popup tools (opened as a tab)
  const pop0 = await open(`chrome-extension://${ext}/popup.html`);
  await sleep(1500);
  await ev(pop0, `chrome.storage.local.set({ api: ${JSON.stringify(BASE)} }).then(() => true)`); // popup talks to the server under test
  await send("Target.closeTarget", { targetId: pop0.targetId });
  const pop = await open(`chrome-extension://${ext}/popup.html`);
  await sleep(2500);
  errors.set(pop.sessionId, []);
  ok("popup: feed count shown (or Offline when the network blocks it)", /\d|Offline/.test(await text(pop, "#stat-feed")) || await waitFor(pop, `/\d|Offline/.test(document.querySelector("#stat-feed").textContent)`, 20000), await text(pop, "#stat-feed"));
  ok("popup: block counter > 0", Number((await text(pop, "#stat-blocked")).replace(/\D/g, "")) > 0, await text(pop, "#stat-blocked"));
  await shot(pop, "ext_popup_home.png");
  await click(pop, `document.querySelector('[data-open="link"]')`);
  await ev(pop, `document.querySelector("#link").value = ${JSON.stringify(BASE + "/lab/go")}, true`);
  await click(pop, `document.querySelector("#check-link")`);
  ok("popup: link unmask finds the cloaked page", await waitFor(pop, `document.querySelector("#result")?.innerText.includes("Two-faced")`, 30000), await text(pop, "#result"));
  await shot(pop, "ext_popup_link.png");
  await click(pop, `document.querySelector("#back")`);
  await click(pop, `document.querySelector('[data-open="qr"]')`);
  await setFiles(pop, "#qr-file", [`${DEMO}/qr-upi-refund-scam.png`]);
  ok("popup: QR UPI scam decoded", await waitFor(pop, `document.querySelector("#result")?.innerText.includes("pays")`, 15000), await text(pop, "#result"));
  await shot(pop, "ext_popup_qr.png");
  await click(pop, `document.querySelector("#back")`);
  await click(pop, `document.querySelector('[data-open="file"]')`);
  await setFiles(pop, "#file", [`${DEMO}/trustlens-demo-malware-sample.txt`]);
  ok("popup: file malware flagged", await waitFor(pop, `document.querySelector("#result")?.innerText.includes("Known malware")`, 15000), await text(pop, "#result"));
  await click(pop, `document.querySelector("#back")`);
  const perr = errors.get(pop.sessionId).filter((e) => !/favicon/.test(e));
  ok("popup: no JS errors", perr.length === 0, perr[0]);

  // C6. Turn protection off -> not blocked; back on -> blocked
  await click(pop, `document.querySelector("#enabled")`);
  await sleep(1500);
  await go(a, "http://paypa1-secure-login.com/off", 3000);
  ok("ext: switched off = not blocked", !(await urlOf(a)).includes("warning.html"), await urlOf(a));
  await click(pop, `document.querySelector("#enabled")`);
  await sleep(1500);
  await go(a, "http://paypa1-secure-login.com/on", 3000);
  ok("ext: switched on = blocked again", (await urlOf(a)).includes("warning.html"), await urlOf(a));
} catch (e) {
  ok("runner crashed", false, e.stack);
} finally {
  writeFileSync(join(OUT, "results.txt"), log.join("\n"));
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  proc.kill();
  await sleep(1500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(fails ? 1 : 0);
}
