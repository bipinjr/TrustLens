// TrustLens guard: runs in the background and stops dangerous pages before they load.
//  1. Known phishing sites (live OpenPhish feed) -> declarativeNetRequest redirect rules (blocked before any request).
//  2. Every other top-level page -> offline look-alike checks (guard.js) -> redirect to the warning page.
importScripts("guard.js");

const FEED = "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt";
const WARNING = chrome.runtime.getURL("warning.html");
const MAX_RULES = 4500; // stay well under Chrome's dynamic-rule limit

async function settings() {
  const s = await chrome.storage.local.get({ enabled: true, blocked: 0, recent: [] });
  return s;
}

// ---------- Feed -> blocking rules ----------
async function refreshFeed() {
  const { enabled } = await settings();
  const old = (await chrome.declarativeNetRequest.getDynamicRules()).map((r) => r.id);
  if (!enabled) { await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old }); return; }
  try {
    const txt = await (await fetch(FEED, { cache: "no-store" })).text();
    const hosts = [...new Set(txt.split("\n").map((l) => { try { return new URL(l.trim()).hostname.replace(/^www\./, ""); } catch { return null; } }).filter(Boolean))]
      .filter((h) => !/(^|\.)(google|microsoft|github|githubusercontent|cloudflare|amazonaws|vercel|netlify|firebaseapp|web\.app|blogspot|wixsite|weebly)\.[a-z.]+$/.test(h)) // never blanket-block shared hosting
      .slice(0, MAX_RULES);
    if (hosts.length < 10) return; // broken feed: keep the old rules
    const rules = hosts.map((h, i) => ({
      id: i + 1, priority: 1,
      action: { type: "redirect", redirect: { regexSubstitution: `${WARNING}?src=feed&u=\\0` } },
      condition: { regexFilter: `^https?://([a-z0-9-]+\\.)*${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([/:?#].*)?$`, resourceTypes: ["main_frame"] },
    }));
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old, addRules: rules });
    await chrome.storage.local.set({ feedSize: rules.length, feedAt: Date.now() });
  } catch {
    // offline: keep previous rules
  }
}

// ---------- Look-alike check on every top-level navigation ----------
async function guard(tabId, url, extra) {
  const { enabled } = await settings();
  if (!enabled) return false;
  const host = new URL(url).hostname;
  const { allow = [] } = await chrome.storage.session.get("allow");
  if (allow.includes(host)) return false;
  const reasons = linkReasons(url);
  if (!shouldBlock(reasons)) return false;
  await chrome.storage.session.set({ [`why:${tabId}`]: extra ? [extra, ...reasons] : reasons });
  chrome.tabs.update(tabId, { url: `${WARNING}?src=rules&tab=${tabId}&u=${encodeURIComponent(url)}` });
  return true;
}
chrome.webNavigation.onBeforeNavigate.addListener((d) => {
  if (d.frameId === 0 && /^https?:/.test(d.url)) guard(d.tabId, d.url);
});
// Hurdle: a safe-looking link can bounce (server 30x / JS) to the real phishing page. Judge where you LAND.
chrome.webNavigation.onCommitted.addListener((d) => {
  if (d.frameId !== 0 || !/^https?:/.test(d.url)) return;
  const q = d.transitionQualifiers || [];
  const redirected = q.includes("server_redirect") || q.includes("client_redirect");
  (redirected ? guard(d.tabId, d.url, { label: "You were silently redirected here from a different link" }) : Promise.resolve(false))
    .then((blocked) => blocked || chrome.storage.session.set({ [`safe:${d.tabId}`]: d.url })); // last page you were really on, for "Go back""
});
// Server-side redirect hops (30x) never fire onBeforeNavigate and may never commit (dead phishing hosts),
// so watch the redirect itself and judge the next hop before Chrome follows it.
chrome.webRequest.onBeforeRedirect.addListener((d) => {
  if (d.tabId >= 0 && /^https?:/.test(d.redirectUrl)) guard(d.tabId, d.redirectUrl, { label: "A link you opened secretly redirected here" });
}, { urls: ["<all_urls>"], types: ["main_frame"] });

// Remember which tab opened which, so "Go back" can return you to it.
chrome.tabs.onCreated.addListener((t) => t.openerTabId && chrome.storage.session.set({ [`opener:${t.id}`]: t.openerTabId }));
chrome.tabs.onRemoved.addListener((id) => chrome.storage.session.remove([`opener:${id}`, `safe:${id}`, `why:${id}`]));

async function goBack(tabId) {
  const s = await chrome.storage.session.get([`safe:${tabId}`, `opener:${tabId}`]);
  const prev = s[`safe:${tabId}`], opener = s[`opener:${tabId}`];
  if (prev) return chrome.tabs.update(tabId, { url: prev });          // undo: same tab, previous page
  if (opener) {                                                        // link opened a new tab: return to where it came from
    try { const t = await chrome.tabs.update(opener, { active: true }); await chrome.windows.update(t.windowId, { focused: true }); return chrome.tabs.remove(tabId); } catch {}
  }
  return chrome.tabs.update(tabId, { url: "chrome://newtab" });
}

// Count every block (both paths land on the warning page).
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "blocked") {
    settings().then(async (s) => {
      const host = (u) => { try { return new URL(u).hostname; } catch { return u; } };
      const recent = [{ url: msg.url, at: Date.now() }, ...s.recent.filter((r) => host(r.url) !== host(msg.url))].slice(0, 5);
      await chrome.storage.local.set({ blocked: s.blocked + 1, recent });
      chrome.action.setBadgeText({ text: String(s.blocked + 1) });
      chrome.action.setBadgeBackgroundColor({ color: "#d93226" });
    });
  }
  if (msg.type === "allow") {
    chrome.storage.session.get("allow").then(({ allow = [] }) => chrome.storage.session.set({ allow: [...allow, msg.host] }).then(() => reply(true)));
    return true;
  }
  if (msg.type === "toggle") refreshFeed();
  if (msg.type === "back") { goBack(msg.tabId); return; }
});

// ---------- Context menu: check a link / text on demand ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "tl-text", title: "Check with TrustLens", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "tl-link", title: "Unmask this link with TrustLens", contexts: ["link"] });
  chrome.contextMenus.create({ id: "tl-qr", title: "Scan this QR code with TrustLens", contexts: ["image"] });
  chrome.alarms.create("feed", { periodInMinutes: 30 });
  refreshFeed();
});
chrome.runtime.onStartup.addListener(refreshFeed);
chrome.alarms.onAlarm.addListener((a) => a.name === "feed" && refreshFeed());

chrome.contextMenus.onClicked.addListener(async (info) => {
  const pending = info.menuItemId === "tl-link" ? { kind: "link", value: info.linkUrl } : info.menuItemId === "tl-qr" ? { kind: "qr", value: info.srcUrl } : { kind: "text", value: info.selectionText };
  await chrome.storage.session.set({ pending });
  chrome.action.openPopup?.().catch(() => {});
});
