// TrustLens service worker: receives "Share → TrustLens" from other apps and hands it to /share.
// Everything else goes straight to the network (always fresh verdicts).
const BOX = "trustlens-share";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "POST" || url.pathname !== "/share-target") return;
  e.respondWith((async () => {
    const form = await e.request.formData();
    const cache = await caches.open(BOX);
    const text = [form.get("title"), form.get("text"), form.get("url")].filter(Boolean).join(" ").trim();
    await cache.put("/shared/text", new Response(text));
    const image = form.get("image");
    if (image && typeof image !== "string" && image.size) await cache.put("/shared/image", new Response(image, { headers: { "content-type": image.type } }));
    else await cache.delete("/shared/image");
    return Response.redirect("/share?shared=1", 303);
  })());
});
