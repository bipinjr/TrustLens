"use client";

import { useEffect, useState } from "react";
import { QrScanner, Unmasker, type DemoTrigger } from "./HurdleTools";
import { Chain, TwoFaces } from "./HurdleVisuals";

const HINTS = [
  { hint: "The link you check may not be the page the user ends up on.", answer: "We follow every hop (HTTP redirects, meta refresh, JavaScript) and judge the page you actually land on.", show: "Show the redirect chain", target: "tl-chain" as const },
  { hint: "A phishing page can show one face to scanners and another to people.", answer: "We open the link twice, as a security scanner and as a phone user from WhatsApp, and compare what each is shown.", show: "Show the cloaking test", target: "tl-cloak" as const },
  { hint: "In India, many scams don't use links at all.", answer: "We decode QR codes on your device and tell you who a UPI request pays, how much, and what bait it uses.", show: "Show a QR payment scam", target: "qr" as const },
];

// The hurdle, inline on the home page: brief + hints, the two visual explainers, and one tool card with tabs.
export function HurdleSection() {
  const [tab, setTab] = useState<"link" | "qr">("link");
  const [demo, setDemo] = useState<DemoTrigger | null>(null);
  const [qrKey, setQrKey] = useState(0);
  const showMe = (target: "tl-chain" | "tl-cloak" | "qr") => {
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (target === "qr") { setTab("qr"); setQrKey(Date.now()); }
    else { setTab("link"); setDemo({ key: Date.now(), focus: target }); }
  };
  useEffect(() => {
    const pick = () => { if (location.hash === "#qr") { setTab("qr"); document.getElementById("tools")?.scrollIntoView(); } };
    pick(); addEventListener("hashchange", pick);
    return () => removeEventListener("hashchange", pick);
  }, []);
  return (
    <section id="unmask" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pb-28 pt-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <p className="fig">Unmask: the hurdle we were set</p>
          <h1 className="blur-in mt-3 text-6xl sm:text-7xl">Redirects, <em className="text-teal">cloaking</em> and QR codes.</h1>
        </div>
        <p className="text-lg text-ink-soft">
          Phishing links hide behind chains of redirects, show scanners a harmless page and people the fake login, and in India often skip links entirely
          for a QR code that takes money. TrustLens checks all three.
        </p>
      </div>

      <details className="hurdle-brief card mt-10 p-6 sm:p-7" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span className="font-semibold">The organisers&apos; three hints, and how we answer each</span>
          <span className="hurdle-plus grid h-8 w-8 shrink-0 place-items-center rounded-full border hairline text-teal" aria-hidden>+</span>
        </summary>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {HINTS.map((h, i) => (
            <li key={h.hint} className="border-t hairline pt-5">
              <p className="font-display text-2xl leading-snug">{h.hint}</p>
              <p className="mt-3 text-ink-soft"><span className="text-teal">Hint {i + 1}.</span> {h.answer}</p>
              <button onClick={() => showMe(h.target)} className="btn-ghost mt-4 rounded-xl px-4 py-2 text-sm">{h.show}</button>
            </li>
          ))}
        </ol>
      </details>

      <div id="tools" className="mt-8 grid scroll-mt-24 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="fig mb-4">A real chain: four hops from SMS to fake login</p>
            <Chain />
          </div>
          <TwoFaces />
        </div>

        <div className="spotlight card relative p-6 sm:p-8">
          <div className="relative grid grid-cols-2 rounded-2xl border hairline bg-white/[0.03] p-1" role="tablist" aria-label="Hurdle tools">
            <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-teal transition-transform duration-500" style={{ transform: tab === "qr" ? "translateX(100%)" : "none", transitionTimingFunction: "cubic-bezier(.3,1.45,.5,1)" }} aria-hidden />
            {([["link", "Unmask a link"], ["qr", "Scan a QR"]] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`relative z-10 rounded-xl py-2.5 font-semibold transition-colors ${tab === k ? "text-[#04211d]" : "text-ink-soft hover:text-ink"}`}>{label}</button>
            ))}
          </div>
          <div className="mt-6" hidden={tab !== "link"}><Unmasker demo={demo} /></div>
          <div id="qr" className="mt-6" hidden={tab !== "qr"}><QrScanner sampleKey={qrKey} /></div>
        </div>
      </div>
    </section>
  );
}
