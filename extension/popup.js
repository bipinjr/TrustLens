const DEFAULT_API = "http://localhost:3000";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const show = (html) => { $("#result").innerHTML = html; };
const fail = (msg) => show(`<p class="err">${esc(msg)}</p>`);
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "now" : m < 60 ? `${m}m` : `${Math.round(m / 60)}h`; };

async function apiBase() {
  const { api } = await chrome.storage.local.get("api");
  return (api || DEFAULT_API).replace(/\/$/, "");
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${await apiBase()}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Can't reach the TrustLens server. Check Settings.");
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Check failed. Try again.");
  return j;
}

async function busy(btn, label, fn) {
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = label;
  try { await fn(); } catch (e) { fail(e.message); } finally { btn.disabled = false; btn.textContent = old; }
}

// ---------- Views ----------
function slideIn(el, dir) {
  el.classList.remove("in-right", "in-left");
  void el.offsetWidth; // restart the animation
  el.classList.add(dir);
}
function openTool(name) {
  $("#home").hidden = true;
  $("#tool").hidden = false;
  slideIn($("#tool"), "in-right");
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  show("");
  $(`[data-panel=${name}] textarea, [data-panel=${name}] input`)?.focus();
}
function goHome() { $("#tool").hidden = true; $("#home").hidden = false; slideIn($("#home"), "in-left"); renderHome(); }

// Check the page the user is on right now, with the same offline rules the guard uses.
async function checkSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  const url = tab?.url || "";
  const verdict = $("#site-verdict"), reasonsEl = $("#site-reasons");
  let host = "";
  try { host = new URL(url).hostname; } catch {}
  $("#site").classList.remove("bad");
  if (!/^https?:/.test(url)) {
    $("#site-host").textContent = url.startsWith("chrome-extension://") && url.includes("warning.html") ? "Blocked page" : "Browser page";
    $("#site-ic").textContent = "·";
    verdict.className = "site-verdict na"; verdict.textContent = "Not a website";
    reasonsEl.hidden = true;
    return;
  }
  $("#site-host").textContent = host;
  $("#site-ic").textContent = (host.replace(/^www\./, "")[0] || "?").toUpperCase();
  const reasons = linkReasons(url);
  const score = reasons.reduce((a, r) => a + r.weight, 0);
  const tone = shouldBlock(reasons) ? "bad" : score > 0 ? "warn" : "good";
  verdict.className = `site-verdict ${tone}`;
  verdict.textContent = tone === "bad" ? "Dangerous" : tone === "warn" ? "Be careful" : "Looks safe";
  $("#site").classList.toggle("bad", tone === "bad");
  reasonsEl.hidden = !reasons.length;
  reasonsEl.innerHTML = "";
  reasons.forEach((r) => { const li = document.createElement("li"); li.textContent = r.label; reasonsEl.appendChild(li); });
}

async function renderHome() {
  const { enabled = true, blocked = 0, recent = [], feedSize } = await chrome.storage.local.get(["enabled", "blocked", "recent", "feedSize"]);
  $("#enabled").checked = enabled;
  document.body.classList.toggle("is-off", !enabled);
  $("#pill-text").textContent = enabled ? "Guarding" : "Paused";
  $("#state").textContent = enabled ? "You're protected" : "Protection is off";
  $("#state-sub").textContent = enabled ? "Dangerous links are blocked before they open." : "Links aren't being checked. Switch it back on.";
  countUp($("#stat-blocked"), blocked);
  $("#stat-feed").textContent = feedSize ? feedSize.toLocaleString("en-IN") : "Loading…";
  $("#recent-wrap").hidden = !recent.length;
  $("#recent").innerHTML = recent.map((r) => {
    let h = r.url; try { h = new URL(r.url).hostname; } catch {}
    return `<li><code>${esc(h)}</code><time>${ago(r.at)}</time></li>`;
  }).join("");
}

function countUp(el, to) {
  const from = Number(el.textContent) || 0;
  if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  setTimeout(() => (el.textContent = to), 700); // frames pause in hidden pages; always land on the real value
}

// ---------- Result card ----------
const TONE = { scam: "bad", suspicious: "warn", likely_safe: "good", malware: "bad", not_found: "good", tampered: "bad", verified: "good", valid_unknown: "warn", signed: "good" };
const TITLE = { scam: "Scam", suspicious: "Be careful", likely_safe: "Looks safe", malware: "Known malware", not_found: "Not a known threat", tampered: "Tampered", verified: "Verified", valid_unknown: "Unchanged, unknown signer", signed: "Signed" };
const MARK = { bad: "!", warn: "?", good: "✓" };

function card({ verdict, score, sub, items = [], ok = false, sources }) {
  const tone = TONE[verdict] || "warn";
  const head = score == null
    ? `<span class="badge ${tone}">${MARK[tone]}</span>`
    : `<span class="score ${tone}"><svg viewBox="0 0 56 56"><circle class="bg" cx="28" cy="28" r="24"/><circle class="fg" cx="28" cy="28" r="24"/></svg><b>0</b></span>`;
  const src = sources?.length
    ? `<ul class="sources">${sources.map((s) => `<li class="${s.status}"><span>${esc(s.source)}</span><em>${s.status === "hit" ? esc(s.detail || "flagged") : s.status === "clean" ? "not listed" : "skipped"}</em></li>`).join("")}</ul>`
    : "";
  show(`<div class="verdict"><span>${head}</span><div><p class="v-title ${tone}">${esc(TITLE[verdict] || verdict)}</p>${sub ? `<p class="v-sub">${esc(sub)}</p>` : ""}</div></div>
    ${items.length ? `<ul class="flags${ok ? " ok" : ""}">${items.map((h, i) => `<li style="--i:${i}">${h}</li>`).join("")}</ul>` : ""}${src}`);
  if (score != null) {
    const ring = $("#result .fg"), num = $("#result .score b");
    ring.getBoundingClientRect(); // commit the empty ring so the fill transitions
    ring.style.strokeDashoffset = String(151 - (151 * score) / 100);
    countUp(num, score);
  }
}

// ---------- Message ----------
async function checkMessage() {
  const text = $("#msg").value.trim();
  if (text.length < 5) return fail("Paste a message first.");
  await busy($("#check-msg"), "Checking…", async () => {
    const r = await post("/api/analyze", { text, language: "English" });
    card({ verdict: r.verdict, score: r.risk, sub: r.summary, items: (r.tactics || []).map((t) => `<b>${esc(t.name)}</b>${t.quote ? `: <q>${esc(t.quote)}</q>` : ""}`) });
  });
}

// ---------- Link ----------
// Follows every redirect hop and runs the cloaking test, then judges the page you actually land on.
async function unmaskCard(url) {
  const r = await post("/api/unmask", { url });
  const host = (u) => { try { return new URL(u).hostname; } catch { return u; } };
  const hops = r.hops.map((h, i) => `<span class="hop${i === r.hops.length - 1 ? " end" : ""}">${esc(host(h.url))}</span>`).join('<i class="hop-arrow">→</i>');
  card({
    verdict: r.verdict, score: r.risk,
    sub: r.cloak?.cloaked ? "Two-faced page: shows scanners one thing and you another." : r.hidden ? `Really lands on ${host(r.final)}.` : `Lands on ${host(r.final)}.`,
    items: [`<span class="hops">${hops}</span>`, ...(r.cloak?.cloaked ? r.cloak.reasons.map(esc) : []), ...(r.link?.signals || []).map((s) => `<b>${esc(s.label)}</b>: <q>${esc(s.evidence)}</q>`)],
    sources: r.link?.sources,
  });
}
async function checkLink() {
  const url = $("#link").value.trim();
  if (!url) return fail("Paste a link first.");
  await busy($("#check-link"), "Following every hop…", () => unmaskCard(url));
}

// ---------- QR ----------
async function checkQr(src) {
  show(`<p class="v-sub">Reading the QR code…</p>`);
  try {
    const img = new Image();
    img.src = URL.createObjectURL(typeof src === "string" ? await (await fetch(src)).blob() : src); // blob avoids a cross-origin (tainted) canvas
    await img.decode();
    const raw = await decodeQr(img);
    if (!raw) return fail("No QR code found in that image. Try a sharper screenshot.");
    if (/^upi:/i.test(raw)) {
      const u = analyzeUpi(raw);
      return card({ verdict: u.risk >= 60 ? "scam" : "suspicious", score: u.risk, sub: `This QR pays ${u.pn || u.pa || "someone"}${u.am ? ` ₹${u.am}` : ""}.`, items: [`Pays to <code>${esc(u.pa)}</code>`, ...u.flags.map(esc)] });
    }
    if (/^https?:|^[\w-]+(\.[\w-]+)+\//i.test(raw)) return unmaskCard(raw);
    card({ verdict: "likely_safe", sub: "This QR only contains text.", items: [esc(raw.slice(0, 200))], ok: true });
  } catch (e) { fail(e.message || "Couldn't read that image."); }
}

// ---------- File ----------
async function checkFile(file) {
  if (!file) return;
  show(`<p class="v-sub">Fingerprinting ${esc(file.name)}…</p>`);
  try {
    const sha256 = hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
    const r = await post("/api/file-check", { sha256 });
    card({
      verdict: r.verdict,
      sub: r.verdict === "malware" ? `${file.name} matches known malware. Don't open it. Delete it.` : `${file.name} isn't in any known-malware list. Still, only open files you expect.`,
      items: [`SHA-256 <code>${sha256.slice(0, 12)}…${sha256.slice(-6)}</code>`], ok: r.verdict !== "malware", sources: r.sources,
    });
  } catch (e) { fail(e.message); }
}

// ---------- Sign & verify (ECDSA P-256, Web Crypto) ----------
const ALG = { name: "ECDSA", namedCurve: "P-256" };
const SIGN = { name: "ECDSA", hash: "SHA-256" };
const fingerprint = async (jwk) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${jwk.crv}:${jwk.x}:${jwk.y}`))).slice(0, 16);

async function myKeys() {
  let { keys } = await chrome.storage.local.get("keys");
  if (!keys) {
    const kp = await crypto.subtle.generateKey(ALG, true, ["sign", "verify"]);
    keys = { priv: await crypto.subtle.exportKey("jwk", kp.privateKey), pub: await crypto.subtle.exportKey("jwk", kp.publicKey) };
    await chrome.storage.local.set({ keys });
  }
  return keys;
}

async function signFile() {
  const file = $("#s-file").files[0], name = $("#s-name").value.trim();
  if (!name) return fail("Enter your name or organisation.");
  if (!file) return fail("Choose a document to sign.");
  await busy($("#sign"), "Signing…", async () => {
    const { priv, pub } = await myKeys();
    const data = await file.arrayBuffer();
    const sig = await crypto.subtle.sign(SIGN, await crypto.subtle.importKey("jwk", priv, ALG, false, ["sign"]), data);
    const bundle = {
      format: "trustlens-signature/1", alg: "ECDSA-P256-SHA256", signer: name,
      publicKey: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y },
      file: { name: file.name, size: file.size, sha256: hex(await crypto.subtle.digest("SHA-256", data)) },
      signedAt: new Date().toISOString(), signature: b64(sig),
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
    a.download = `${file.name}.sig`;
    a.click();
    card({ verdict: "signed", sub: `Share ${file.name} together with ${file.name}.sig.`, items: [`Signed as <b>${esc(name)}</b>`, `Key fingerprint <code>${await fingerprint(pub)}</code>`], ok: true });
  });
}

async function verifyFile() {
  const file = $("#v-file").files[0], sigFile = $("#v-sig").files[0];
  if (!file || !sigFile) return fail("Choose both the document and its .sig file.");
  await busy($("#verify"), "Verifying…", async () => {
    let b;
    try { b = JSON.parse(await sigFile.text()); } catch { throw new Error("That .sig file isn't valid."); }
    if (b.format !== "trustlens-signature/1" || !b.publicKey || !b.signature) throw new Error("That .sig file isn't a TrustLens signature.");
    const key = await crypto.subtle.importKey("jwk", { ...b.publicKey, ext: true }, ALG, false, ["verify"]);
    const ok = await crypto.subtle.verify(SIGN, key, unb64(b.signature), await file.arrayBuffer());
    const fp = await fingerprint(b.publicKey);
    const { trusted = {} } = await chrome.storage.local.get("trusted");
    const known = trusted[fp];
    const items = [
      `Signed by <b>${esc(b.signer)}</b> · ${esc(new Date(b.signedAt).toLocaleString())}`,
      `Key <code>${fp}</code> ${known ? `<span class="tag ok">trusted</span>` : `<span class="tag">not trusted yet</span>`}`,
    ];
    if (!ok) return card({ verdict: "tampered", sub: "Changed after signing, or the signature isn't for this file. Don't trust it.", items });
    card({ verdict: known ? "verified" : "valid_unknown", sub: known ? "Original and unchanged, from a signer you trust." : "Unchanged since signing. Add the signer if you know them.", items, ok: true });
    if (!known) {
      $("#result").insertAdjacentHTML("beforeend", `<button class="ghost" id="trust">Trust ${esc(b.signer)}</button>`);
      $("#trust").onclick = async () => { trusted[fp] = b.signer; await chrome.storage.local.set({ trusted }); refreshTrusted(); verifyFile(); };
    }
  });
}

async function refreshTrusted() {
  const { trusted = {} } = await chrome.storage.local.get("trusted");
  $("#trusted-count").textContent = Object.keys(trusted).length;
}

// ---------- Wiring ----------
document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openTool(b.dataset.open)));
$("#back").addEventListener("click", goHome);
$("#enabled").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  chrome.runtime.sendMessage({ type: "toggle" }).catch(() => {});
  renderHome();
});
document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  $(".seg").classList.toggle("right", b.dataset.mode === "sign");
  document.querySelectorAll("[data-mode-panel]").forEach((p) => (p.hidden = p.dataset.modePanel !== b.dataset.mode));
  show("");
}));
$("#check-msg").addEventListener("click", checkMessage);
$("#check-link").addEventListener("click", checkLink);
$("#link").addEventListener("keydown", (e) => e.key === "Enter" && checkLink());
$("#file").addEventListener("change", (e) => checkFile(e.target.files[0]));
$("#qr-file").addEventListener("change", (e) => checkQr(e.target.files[0]));
addEventListener("paste", (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/")); if (f) { openTool("qr"); checkQr(f); } });
const drop = $(".drop");
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); checkFile(e.dataTransfer.files[0]); });
$("#sign").addEventListener("click", signFile);
$("#verify").addEventListener("click", verifyFile);
$("#api").addEventListener("change", (e) => chrome.storage.local.set({ api: e.target.value.trim() }));
$("#open-app").addEventListener("click", async (e) => { e.preventDefault(); chrome.tabs.create({ url: `${await apiBase()}/check` }); });

(async () => {
  if (new URLSearchParams(location.search).has("full")) document.body.classList.add("full");
  $("#api").value = (await chrome.storage.local.get("api")).api || "";
  $("#my-fp").textContent = await fingerprint((await myKeys()).pub);
  refreshTrusted();
  renderHome();
  checkSite();
  const { pending } = await chrome.storage.session.get("pending");
  if (!pending) return;
  await chrome.storage.session.remove("pending");
  if (pending.kind === "text") { openTool("message"); $("#msg").value = pending.value; checkMessage(); }
  else if (pending.kind === "qr") { openTool("qr"); checkQr(pending.value); }
  else { openTool("link"); $("#link").value = pending.value; checkLink(); }
})();

// Cursor-lit UI: page spotlight, per-card glow, tile tilt, magnetic primary buttons.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.addEventListener("pointermove", (e) => {
    document.body.style.setProperty("--mx", e.clientX + "px");
    document.body.style.setProperty("--my", e.clientY + "px");
    const lit = e.target.closest?.(".lit");
    if (lit) {
      const r = lit.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      lit.style.setProperty("--x", x + "px");
      lit.style.setProperty("--y", y + "px");
      if (lit.classList.contains("tile")) {
        lit.style.setProperty("--ry", ((x / r.width) - .5) * 10 + "deg");
        lit.style.setProperty("--rx", (.5 - (y / r.height)) * 10 + "deg");
      }
    }
    const btn = e.target.closest?.(".primary");
    if (btn) {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--tx", (e.clientX - r.left - r.width / 2) * .08 + "px");
      btn.style.setProperty("--ty", (e.clientY - r.top - r.height / 2) * .2 + "px");
    }
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const t = e.target.closest?.(".tile, .primary");
    if (t && !t.contains(e.relatedTarget)) ["--rx", "--ry", "--tx", "--ty"].forEach((v) => t.style.removeProperty(v));
  });
}
