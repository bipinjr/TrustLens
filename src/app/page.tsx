import Link from "next/link";
import type { CSSProperties } from "react";
import { CountUp, DecodeText, SpotlightGroup } from "@/components/fx";
import { XrayHero } from "@/components/XrayHero";
import { WordReveal } from "@/components/WordReveal";
import { Dissection } from "@/components/Dissection";
import { Ticker } from "@/components/Ticker";
import { CITATIONS } from "@/lib/principles";
import { BENCHMARK } from "@/lib/benchmark";

const FEATURES = [
  {
    href: "/hurdle", tag: "The hurdle", span: "md:col-span-2",
    title: "Redirects, cloaking and QR codes",
    body: "We walk every redirect hop, visit the page as a scanner and as a person to catch two-faced pages, and decode UPI QR codes that take money.",
    art: (
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.72rem]" aria-hidden>
        {["bit.ly/k9", "t.co/x8", "ads.click/r", "sbi-kyc-update.top"].map((h, i, a) => (
          <li key={h} className="flex items-center gap-2"><span className={`bar-grow rounded-full border px-2.5 py-1 ${i === a.length - 1 ? "border-red/60 text-red" : "border-white/12 text-ink-soft"}`} style={{ "--i": i } as CSSProperties}>{h}</span>{i < a.length - 1 && <span className="text-teal">→</span>}</li>
        ))}
      </ol>
    ),
  },
  {
    href: "/phishing", tag: "Confidentiality", title: "Scam & phishing protection",
    body: "Known scam patterns plus live OSINT phishing feeds, with every reason named.",
    art: <p className="font-mono text-sm"><span className="text-ink-soft">https://</span><span className="pen-mark live">paypa1</span><span className="text-ink-soft">-secure-login.com</span></p>,
  },
  {
    href: "/malware", tag: "Integrity", title: "Malware & virus check",
    body: "Files are fingerprinted on your device and matched against known malware. Nothing is uploaded.",
    art: <p className="break-all font-mono text-[0.7rem] text-teal">sha256 fe7726…9462 <span className="ml-1 rounded bg-red/15 px-1.5 py-0.5 text-red">known malware</span></p>,
  },
  {
    href: "/signature", tag: "Integrity", title: "Digital signatures",
    body: "Sign a circular or certificate. Anyone can prove it is original, down to a single comma.",
    art: <span className="stamp-in inline-grid h-14 w-14 place-items-center text-center font-mono text-[0.55rem] uppercase leading-tight text-teal">Verified<br />original</span>,
  },
  {
    href: "/extension", tag: "Availability", title: "Always-on browser extension",
    body: "Blocks phishing before the page loads, brings you back with one tap, and needs no install on the computer.",
    art: <div className="flex items-center gap-3 text-sm" aria-hidden><span className="relative h-6 w-11 rounded-full bg-teal"><span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-night" /></span><span className="text-teal">Guarding every tab</span></div>,
  },
  {
    href: "/check", tag: "Messages, calls and screenshots", span: "md:col-span-3", title: "Decode any message",
    body: "Paste an SMS or WhatsApp, record a call or drop a screenshot. Every trick underlined, in 9 Indian languages.",
    art: <p className="rounded-xl bg-chat px-3 py-2 text-sm leading-7 text-ink">Your parcel is held. <span className="pen-mark live">Pay ₹49 within 2 hours</span></p>,
  },
];

const STEPS = [
  { title: "Rule engine finds hard evidence", body: "Fake bank links, hidden short links, lookalike domains, OTP or PIN requests, threats and deadlines in English and Hindi. It runs instantly in your browser, while you type." },
  { title: "AI reads it like a fraud investigator", body: "A large language model quotes the exact words doing the damage and tags each trick with the psychological principle it exploits. Messages that try to talk to the AI get flagged as a trick too." },
  { title: "You get an answer you understand", body: "A clear verdict and score, the message marked up in red pen, what the sender wants, and what to do now: call 1930, report it, or warn your family on WhatsApp." },
  { title: "You practise, so next time you won't need us", body: "A fresh practice scam made of the same tricks. Tap the traps yourself, then see what you caught." },
];

export default function Home() {
  return (
    <main>
      <div className="scroll-iris" aria-hidden />
      <XrayHero>
        <h1 className="text-[3.4rem] leading-[.95] sm:text-[5.2rem] lg:text-[6.2rem]">
          <DecodeText text="Every scam" /><br />
          <span className="text-ink-soft"><DecodeText text="has a" delay={150} /></span>{" "}
          <em className="text-teal"><DecodeText text="second face." delay={300} duration={1300} /></em>
        </h1>
        <p className="mt-7 max-w-xl text-lg text-ink-soft sm:text-xl">
          A friendly SMS, a refund QR, a recipe site. TrustLens looks behind each one: the redirects, the cloaked login, the QR that takes money.
          Then it blocks it in your browser before you tap.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/check" className="aurora btn-primary rounded-xl px-6 py-3.5 text-lg">Check something now</Link>
          <Link href="/hurdle" className="btn-ghost rounded-xl px-6 py-3.5 text-lg">See the hurdle</Link>
        </div>
        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
          <div><dt className="sr-only">Detection</dt><dd><b className="text-white">{BENCHMARK.detection}</b> of unseen scams caught</dd></div>
          <div><dt className="sr-only">Phishing feed</dt><dd><b className="text-white">Live</b> phishing feed, every 30 min</dd></div>
          <div><dt className="sr-only">Privacy</dt><dd><b className="text-white">0</b> files uploaded</dd></div>
        </dl>
      </XrayHero>

      <Ticker />

      {/* Numbers */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <WordReveal
          className="max-w-4xl font-display text-4xl leading-tight text-white sm:text-6xl"
          text="Indians lost ₹22,845 crore to cyber fraud in a single year. Most of it started with one message."
          hl={["₹22,845", "crore", "one", "message"]}
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border hairline bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: <CountUp to={36} suffix=" lakh" />, l: "fraud cases reported in 2024" },
            { n: <CountUp to={206} suffix="%" />, l: "jump in money lost vs 2023" },
            { n: <CountUp to={7} />, l: "psychological levers every scam pulls" },
            { n: <CountUp to={9} />, l: "Indian languages supported" },
          ].map((s, i) => (
            <div key={i} className="reveal bg-paper p-7">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-white">{s.n}</p>
              <p className="mt-2 text-ink-soft">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Source: <a className="underline underline-offset-4 hover:text-white" href={CITATIONS.mha.url} target="_blank" rel="noreferrer">{CITATIONS.mha.label}</a>
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="reveal max-w-3xl text-5xl sm:text-6xl">
          One lens. <em>Every</em> way a scam reaches you.
        </h2>
        <SpotlightGroup className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className={`spotlight card reveal group flex flex-col gap-6 p-7 transition-transform duration-500 hover:-translate-y-1 ${f.span ?? ""}`}>
              <p className="fig">{f.tag}</p>
              <div className="min-h-12">{f.art}</div>
              <div className="mt-auto">
                <h3 className="text-3xl text-white">{f.title}</h3>
                <p className="mt-2 text-ink-soft">{f.body}</p>
              </div>
            </Link>
          ))}
        </SpotlightGroup>
      </section>

      <Dissection />

      {/* How it works */}
      <section className="mx-auto mt-28 grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-5xl sm:text-6xl">How it reads <em>a message</em></h2>
          <p className="mt-4 text-lg text-ink-soft">Two independent checks, one plain answer. If the AI is ever unavailable, the rule engine still answers.</p>
          <Link href="/research" className="btn-ghost mt-8 inline-flex rounded-xl px-5 py-3">See the accuracy test</Link>
        </div>
        <ol className="steps-track relative space-y-16 pl-16">
          <svg className="absolute left-[1.15rem] top-2 h-[calc(100%-1rem)] w-6 overflow-visible" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f766e" /><stop offset="1" stopColor="#5eead4" /></linearGradient></defs>
            <path className="pen-path" pathLength={1} d="M12 0 C 2 12, 22 22, 12 34 S 2 56, 12 67 S 22 88, 12 100" fill="none" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal relative">
              <span className="absolute -left-16 -top-1 grid h-10 w-10 place-items-center rounded-full border-2 border-teal bg-paper font-pen text-2xl font-bold text-teal">{i + 1}</span>
              <h3 className="text-3xl text-white">{s.title}</h3>
              <p className="mt-2 max-w-2xl text-lg text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Research teaser */}
      <section className="mx-auto mt-32 max-w-7xl px-4 sm:px-6">
        <div className="card zoom-in relative overflow-hidden p-8 sm:p-14">
          <div className="mesh opacity-60" aria-hidden />
          <div className="relative">
            <WordReveal
              className="max-w-4xl font-display text-4xl leading-tight text-white sm:text-6xl"
              text="Every scam pulls the same seven levers in your head. Learn them once, and the next scam stops working."
              hl={["seven", "levers", "stops", "working"]}
            />
            <p className="mt-6 max-w-2xl text-lg text-ink-soft">
              Built on Cambridge research into how con artists think, and on the science of psychological inoculation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" className="btn-primary rounded-xl px-6 py-3.5">Learn the 7 levers</Link>
              <a href={CITATIONS.stajano.pdf} target="_blank" rel="noreferrer" className="btn-ghost rounded-xl px-6 py-3.5">Read the paper (PDF)</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
