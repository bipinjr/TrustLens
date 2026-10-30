const API = "http://localhost:3000";
const $ = (s) => document.querySelector(s);
const VERDICT = { scam: "SCAM", suspicious: "BE CAREFUL", likely_safe: "LOOKS SAFE" };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function checkMessage() {
  const text = $("#msg").value.trim();
  if (text.length < 5) { $("#result").innerHTML = `<p class="err">Paste a message first.</p>`; return; }
  const btn = $("#check-msg");
  btn.disabled = true; btn.textContent = "Checking…";
  try {
    const res = await fetch(`${API}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, language: "English" }) });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error || "Check failed.");
    $("#result").innerHTML = `<div class="verdict ${esc(r.verdict)}"><b>${VERDICT[r.verdict] || "RESULT"}</b><span>${r.risk}/100</span></div><p class="summary">${esc(r.summary)}</p>`;
  } catch (e) {
    $("#result").innerHTML = `<p class="err">${esc(e.message)}</p>`;
  } finally { btn.disabled = false; btn.textContent = "Check message"; }
}
$("#check-msg").addEventListener("click", checkMessage);
