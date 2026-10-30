const q = new URLSearchParams(location.search);
const url = q.get("u") || "";
const $ = (s) => document.querySelector(s);
let host = "";
try { host = new URL(url).hostname; } catch {}

$("#url").textContent = url || "unknown";

(async () => {
  let reasons = [];
  if (q.get("src") === "feed") reasons = [{ label: "Listed on the live OpenPhish phishing feed" }];
  else {
    const key = `why:${q.get("tab")}`;
    reasons = (await chrome.storage.session.get(key))[key] || [];
  }
  if (!reasons.length) reasons = [{ label: "Matches known scam patterns" }];
  $("#reasons").innerHTML = reasons.map((_, i) => `<li style="--i:${i}"></li>`).join("");
  document.querySelectorAll("#reasons li").forEach((li, i) => (li.textContent = reasons[i].label));
  chrome.runtime.sendMessage({ type: "blocked", url });
})();

$("#back").addEventListener("click", async () => {
  const tab = await chrome.tabs.getCurrent();
  chrome.runtime.sendMessage({ type: "back", tabId: tab.id });
});

$("#proceed").addEventListener("click", async () => {
  if (!host) return;
  await chrome.runtime.sendMessage({ type: "allow", host });
  location.replace(url);
});

addEventListener("pointermove", (e) => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); }, { passive: true });
