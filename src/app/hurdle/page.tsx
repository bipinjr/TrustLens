import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { QrScanner, Unmasker } from "@/components/HurdleTools";

export const metadata: Metadata = { title: "The Hurdle: Redirects, Cloaking & QR codes" };

const HINTS = [
  { n: "01", hint: "The link you check may not be the page the user ends up on.", answer: "We follow every hop (HTTP 30x, meta refresh, JavaScript) and judge the page you actually land on, plus every stop on the way." },
  { n: "02", hint: "A phishing page can show one face to scanners and another to people.", answer: "We visit the link twice, as a security scanner and as a person on an Android phone from WhatsApp, and compare what each is shown." },
  { n: "03", hint: "In India, many scams don't use links at all.", answer: "We read QR codes on your device. UPI requests are decoded: who gets paid, how much, and the bait in the note." },
];

function TwoFaces() {
  return (
    <div className="two-faces relative aspect-[5/4] w-full overflow-hidden rounded-3xl border hairline bg-[#0b0f10]" aria-hidden>
      <div className="face face-bot">
        <p className="fig">Scanner sees</p>
        <p className="mt-3 font-display text-3xl">Mom&apos;s Kitchen</p>
        <p className="mt-1 text-sm text-ink-soft">Easy dal tadka in 20 minutes</p>
        <span className="mt-4 block h-2 w-4/5 rounded bg-white/10" /><span className="mt-2 block h-2 w-3/5 rounded bg-white/10" /><span className="mt-2 block h-2 w-2/3 rounded bg-white/10" />
        <span className="mt-5 inline-block rounded-full bg-teal/15 px-3 py-1 font-mono text-xs text-teal">verdict: clean</span>
      </div>
      <div className="face face-human">
        <p className="fig !text-red">You see</p>
        <p className="mt-3 font-display text-3xl">SBI NetBanking</p>
        <p className="mt-1 text-sm text-ink-soft">Your KYC expires today</p>
        <span className="mt-4 block rounded-lg border border-white/15 px-3 py-2 text-xs text-ink-soft">User ID</span>
        <span className="mt-2 block rounded-lg border border-red/50 px-3 py-2 text-xs text-red">Password ••••••</span>
        <span className="mt-2 block rounded-lg border border-red/50 px-3 py-2 text-xs text-red">OTP</span>
      </div>
      <span className="face-split" />
    </div>
  );
}

function Chain() {
  const hops = ["bit.ly/kyc-sbi", "t.co/x8fQ", "ads-track.click/r", "sbi-kyc-update.top/login"];
  return (
    <ol className="chain flex flex-wrap items-center gap-2 font-mono text-[0.8rem]" aria-label="Example redirect chain">
      {hops.map((h, i) => (
        <li key={h} className="flex items-center gap-2" style={{ "--i": i } as CSSProperties}>
          <span className={`chain-node rounded-full border px-3 py-1.5 ${i === hops.length - 1 ? "border-red/60 bg-red/10 text-red" : "border-white/12 bg-white/[0.03] text-ink-soft"}`}>{h}</span>
          {i < hops.length - 1 && <span className="chain-arrow text-teal">→</span>}
        </li>
      ))}
    </ol>
  );
}

export default function HurdlePage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-wash" aria-hidden />
      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <h1 className="blur-in max-w-5xl text-6xl sm:text-8xl">Redirects, <em>cloaking</em> &amp; QR codes.</h1>
        <p className="rise mt-8 max-w-2xl text-lg text-ink-soft" style={{ "--i": 2 } as CSSProperties}>
          Phishing links hide behind chains of redirects. Phishing pages show a harmless page to scanners and the fake login to real users.
          And in India, many scams arrive as QR codes that request money instead of sending it. Here is how TrustLens clears each one.
        </p>
        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {HINTS.map((h, i) => (
            <li key={h.n} className="spotlight card rise relative p-6" style={{ "--i": i + 3 } as CSSProperties}>
              <span className="fig">Hint {Number(h.n)}</span>
              <p className="mt-3 font-pen text-2xl leading-snug text-amber">“{h.hint}”</p>
              <p className="mt-5 border-t border-dashed hairline pt-4 text-[0.95rem] text-ink-soft"><b className="text-teal">Our answer.</b> {h.answer}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="redirects" className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="font-display text-8xl italic leading-none text-teal/30">i.</span>
          <h2 className="mt-2 text-5xl sm:text-6xl">Unmask the <em>real</em> destination.</h2>
          <p className="mt-5 max-w-lg text-ink-soft">A link in an SMS can bounce through shorteners and ad trackers before it reaches the fake login. Scanners that only check the first link miss it. We walk the whole chain, then run the cloaking test on the final page.</p>
          <div className="mt-8"><Chain /></div>
          <div className="mt-10"><TwoFaces /></div>
        </div>
        <div className="spotlight card relative self-start p-6 sm:p-8"><Unmasker /></div>
      </section>

      <section id="qr" className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-28 pt-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="font-display text-8xl italic leading-none text-teal/30">ii.</span>
          <h2 className="mt-2 text-5xl sm:text-6xl">Scan the QR <em>before</em> it scans your wallet.</h2>
          <p className="mt-5 max-w-lg text-ink-soft">“Scan to receive your refund” is a lie: a UPI QR can only take money. TrustLens decodes the code on your device and tells you plainly who gets paid, how much, and what bait is in the note. If the QR hides a link, it goes through the unmasker.</p>
          <ul className="mt-8 grid gap-3 text-[0.95rem]">
            {["Native BarcodeDetector where available, then jsQR at 4 scales, both polarities and a high-contrast pass", "Camera, upload, drag-and-drop or Ctrl+V a screenshot", "Nothing leaves your device except a link we need to follow"].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="spotlight card relative self-start p-6 sm:p-8"><QrScanner /></div>
      </section>
    </main>
  );
}
