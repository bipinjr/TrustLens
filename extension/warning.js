const q = new URLSearchParams(location.search);
const url = q.get("u") || "";
const $ = (s) => document.querySelector(s);
let parsed = null;
try { parsed = new URL(url); } catch {}
const host = parsed?.hostname || "";

// Reasons travel inside the warning link (robust to Chrome swapping tabs on prerender).
let reasons = [];
try { reasons = JSON.parse(q.get("why") || "[]"); } catch {}
if (q.get("src") === "feed") reasons = [{ label: "Listed on the live OpenPhish phishing feed right now", weight: 90 }, ...reasons];
if (!reasons.length) reasons = [{ label: "Matches known scam patterns", weight: 40 }];

// Address: highlight the part of the host that pretends to be someone else
const BRANDS = /(sbi|hdfc|icici|axis|kotak|paytm|phonepe|gpay|amazon|amaz0n|amazom|flipkart|flipkrt|paypal|paypa1|google|g00gle|microsoft|micros0ft|apple|app1e|facebook|faceb00k|netflix|netf1ix|whatsapp|irctc|uidai|aadhaar|kyc|login|verify|secure)/i;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
$("#host").innerHTML = host ? esc(host).replace(BRANDS, "<mark>$1</mark>") : "unknown address";
$("#path").textContent = parsed ? `${parsed.protocol}//…${parsed.pathname}${parsed.search}`.slice(0, 140) : url;

// Blocking starts at 30 guard points; show that as high risk, not "30/100".
const score = Math.min(99, 55 + reasons.reduce((a, r) => a + (r.weight || 20), 0));
$("#reasons").innerHTML = reasons.map((r, i) => `<li style="--i:${i}"><span></span><small>+${r.weight || 20}</small></li>`).join("");
document.querySelectorAll("#reasons li > span").forEach((el, i) => (el.textContent = reasons[i].label));
requestAnimationFrame(() => setTimeout(() => $("#meter-fill").style.setProperty("--w", `${score}%`), 500));
let n = 0; const tick = setInterval(() => { n = Math.min(score, n + 3); $("#risk").textContent = n; if (n >= score) clearInterval(tick); }, 24);

chrome.runtime.sendMessage({ type: "blocked", url });

const back = async () => {
  const tab = await chrome.tabs.getCurrent();
  chrome.runtime.sendMessage({ type: "back", tabId: tab.id });
};
$("#back").addEventListener("click", back);
$("#back").focus({ preventScroll: true }); // Enter = go back, without jumping past the header
addEventListener("keydown", (e) => { if (e.key === "Escape") back(); });

$("#proceed").addEventListener("click", async () => {
  if (!host) return;
  await chrome.runtime.sendMessage({ type: "allow", host });
  location.replace(url);
});

addEventListener("pointermove", (e) => {
  const bg = $(".bg");
  bg.style.setProperty("--mx", `${e.clientX}px`); bg.style.setProperty("--my", `${e.clientY}px`);
}, { passive: true });
