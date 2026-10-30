"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Every way to get TrustLens: the extension for desktop browsers and Firefox on Android, and the installable phone app.
export function GetTrustLens() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setInstalled(matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const onInstalled = () => setInstalled(true);
    addEventListener("beforeinstallprompt", onPrompt); addEventListener("appinstalled", onInstalled);
    return () => { removeEventListener("beforeinstallprompt", onPrompt); removeEventListener("appinstalled", onInstalled); };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border hairline bg-white/[0.02] p-5">
        <p className="font-semibold">On a laptop: Chrome, Edge or Brave</p>
        <p className="mt-1 text-sm text-ink-soft">Download, unzip, then open <code className="font-mono text-ink">chrome://extensions</code>, switch on Developer mode, click Load unpacked and pick the folder.</p>
        <a href="/downloads/trustlens-chrome.zip" download className="btn-primary mt-4 inline-flex rounded-xl px-5 py-3">Download the extension</a>
      </div>

      <div className="rounded-2xl border hairline bg-white/[0.02] p-5">
        <p className="font-semibold">On an Android phone: install the app</p>
        <p className="mt-1 text-sm text-ink-soft">
          Then long-press any link or QR screenshot in WhatsApp, SMS or your browser, tap Share and pick TrustLens to check it instantly.
          {ios && " On iPhone: tap the Share button in Safari, then Add to Home Screen."}
        </p>
        {installed ? (
          <p className="mt-4 font-semibold text-teal">TrustLens is installed on this device.</p>
        ) : evt ? (
          <button onClick={async () => { await evt.prompt(); const c = await evt.userChoice; if (c.outcome === "accepted") setInstalled(true); setEvt(null); }} className="btn-primary mt-4 inline-flex rounded-xl px-5 py-3">Install the TrustLens app</button>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">Open this page in Chrome on your phone and choose <b className="text-ink">Install app</b> from the menu.</p>
        )}
      </div>

      <div className="rounded-2xl border hairline bg-white/[0.02] p-5">
        <p className="font-semibold">Automatic blocking on Android: Firefox</p>
        <p className="mt-1 text-sm text-ink-soft">Chrome on phones doesn&apos;t run extensions; Firefox does. This build blocks dangerous links on the phone exactly like the laptop. During the beta it loads through Firefox Nightly&apos;s add-on debugging.</p>
        <a href="/downloads/trustlens-firefox.zip" download className="btn-ghost mt-4 inline-flex rounded-xl px-5 py-3">Download the Firefox build</a>
      </div>
    </div>
  );
}
