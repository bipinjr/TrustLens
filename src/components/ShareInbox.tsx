"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrScanner, Unmasker } from "./HurdleTools";

type Inbox = { kind: "link"; url: string } | { kind: "text"; text: string } | { kind: "image"; file: File } | { kind: "pick-image" } | { kind: "empty" };
const URL_RE = /(https?:\/\/[^\s<>"']+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?)/i;

function classify(text: string): Inbox {
  const m = text.match(URL_RE);
  if (m) return { kind: "link", url: m[1].replace(/[).,]+$/, "") };
  return text.trim() ? { kind: "text", text } : { kind: "empty" };
}

// Landing screen of the installed app: whatever was shared to TrustLens is checked right away.
export function ShareInbox() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [clipErr, setClipErr] = useState("");

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(location.search);
      const direct = [q.get("title"), q.get("text"), q.get("url")].filter(Boolean).join(" ");
      if (direct) return setInbox(classify(direct));
      if (q.get("shared") === "2") {
        let t = ""; try { t = sessionStorage.getItem("trustlens-share") || ""; sessionStorage.removeItem("trustlens-share"); } catch {}
        if (t) return setInbox(classify(t));
      }
      if (q.get("image")) return setInbox({ kind: "pick-image" });
      if (q.get("shared") && "caches" in window) {
        const box = await caches.open("trustlens-share");
        const img = await box.match("/shared/image");
        const txt = await (await box.match("/shared/text"))?.text();
        await box.delete("/shared/image"); await box.delete("/shared/text");
        if (img) return setInbox({ kind: "image", file: new File([await img.blob()], "shared-image", { type: img.headers.get("content-type") || "image/png" }) });
        if (txt) return setInbox(classify(txt));
      }
      setInbox({ kind: "empty" });
    })();
  }, []);

  async function fromClipboard() {
    setClipErr("");
    try { const t = await navigator.clipboard.readText(); t.trim() ? setInbox(classify(t)) : setClipErr("Your clipboard is empty. Copy a link or message first."); }
    catch { setClipErr("Allow clipboard access, or paste the link into a checker below."); }
  }

  if (!inbox) return <p className="text-ink-soft">Opening what you shared…</p>;
  return (
    <div>
      <h1 className="blur-in text-5xl sm:text-6xl">{inbox.kind === "empty" ? <>Check before you <em className="text-teal">tap.</em></> : inbox.kind === "image" || inbox.kind === "pick-image" ? "Reading your QR code" : inbox.kind === "link" ? "Where this link really goes" : "Checking your message"}</h1>
      {inbox.kind === "empty" && (
        <>
          <p className="mt-5 text-lg text-ink-soft">On WhatsApp, SMS or any browser, long-press a link or a QR screenshot, tap <b className="text-ink">Share</b>, then choose <b className="text-ink">TrustLens</b>. Or copy it and tap below.</p>
          <button onClick={fromClipboard} className="btn-primary mt-8 w-full rounded-2xl px-5 py-4 text-lg">Check what I copied</button>
          {clipErr && <p className="mt-3 text-red" role="alert">{clipErr}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[["/#qr", "Scan a QR"], ["/phishing", "Check a link"], ["/check", "Check a message"]].map(([h, t]) => (
              <Link key={h} href={h} className="btn-ghost rounded-2xl px-4 py-3 text-center">{t}</Link>
            ))}
          </div>
        </>
      )}
      <div className="mt-8">
        {inbox.kind === "link" && <div className="card p-5 sm:p-7"><Unmasker initial={inbox.url} autoRun /></div>}
        {inbox.kind === "image" && <div className="card p-5 sm:p-7"><QrScanner initialFile={inbox.file} /></div>}
        {inbox.kind === "pick-image" && <div className="card p-5 sm:p-7"><p className="mb-4 text-ink-soft">Tap the box below and choose the screenshot you just shared.</p><QrScanner /></div>}
        {inbox.kind === "text" && (
          <div className="card p-6">
            <p className="whitespace-pre-wrap text-ink-soft">{inbox.text.slice(0, 600)}</p>
            <Link href="/check" onClick={() => { try { sessionStorage.setItem("trustlens-prefill", inbox.text.slice(0, 4000)); } catch {} }} className="btn-primary mt-6 inline-flex rounded-2xl px-5 py-3">Decode this message</Link>
          </div>
        )}
      </div>
    </div>
  );
}
