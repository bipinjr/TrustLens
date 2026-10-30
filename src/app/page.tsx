import Link from "next/link";
import { CountUp, DecodeText } from "@/components/fx";
import { XrayHero } from "@/components/XrayHero";
import { HurdleSection } from "@/components/HurdleSection";
import { Ticker } from "@/components/Ticker";
import { CITATIONS } from "@/lib/principles";
import { BENCHMARK } from "@/lib/benchmark";

// The four things the brief asked for, each mapped to the part of security it protects.
const PILLARS = [
  { k: "C", href: "/phishing", title: "Scam and phishing protection", body: "Known scam patterns and live OSINT phishing feeds, with every reason named in plain words.", cia: "Confidentiality" },
  { k: "I", href: "/malware", title: "Malware and virus check", body: "Files are fingerprinted on your device and matched against known malware. Nothing is uploaded.", cia: "Integrity" },
  { k: "I", href: "/signature", title: "Digital signature verification", body: "Sign a circular or certificate; anyone can prove it is original, down to a single comma.", cia: "Integrity" },
  { k: "A", href: "/extension", title: "An always-on browser extension", body: "Blocks phishing before the page loads and brings you back with one tap. Nothing to install on the computer.", cia: "Availability" },
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
          <Link href="/#hurdle" className="btn-ghost rounded-xl px-6 py-3.5 text-lg">See the hurdle</Link>
        </div>
        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
          <div><dt className="sr-only">Detection</dt><dd><b className="text-white">{BENCHMARK.detection}</b> of unseen scams caught</dd></div>
          <div><dt className="sr-only">Phishing feed</dt><dd><b className="text-white">Live</b> phishing feed, every 30 min</dd></div>
          <div><dt className="sr-only">Privacy</dt><dd><b className="text-white">0</b> files uploaded</dd></div>
        </dl>
      </XrayHero>

      <Ticker />

      {/* Statement: one sentence, three numbers, no cards */}
      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6">
        <p className="reveal max-w-4xl font-display text-4xl leading-[1.1] sm:text-6xl">
          Indians lost <span className="text-red">₹22,845 crore</span> to cyber fraud in a single year. Most of it started with one message.
        </p>
        <dl className="mt-14 grid gap-10 border-t hairline pt-10 sm:grid-cols-3">
          {[
            { n: <CountUp to={36} suffix=" lakh" />, l: "fraud cases reported in 2024" },
            { n: <CountUp to={206} suffix="%" />, l: "rise in money lost over 2023" },
            { n: <CountUp to={9} />, l: "Indian languages TrustLens explains in" },
          ].map((s, i) => (
            <div key={i}>
              <dt className="sr-only">{s.l}</dt>
              <dd className="font-display text-6xl leading-none tabular-nums">{s.n}</dd>
              <dd className="mt-3 text-ink-soft">{s.l}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-ink-soft">
          Source: <a className="underline underline-offset-4 hover:text-ink" href={CITATIONS.mha.url} target="_blank" rel="noreferrer">{CITATIONS.mha.label}</a>
        </p>
      </section>

      <HurdleSection />

      {/* The four required capabilities as editorial rows */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <h2 className="text-5xl sm:text-6xl">One lens for every way a scam reaches you.</h2>
          <p className="text-lg text-ink-soft">Each capability guards one side of security: keeping your secrets confidential, your files and documents intact, and protection available on any computer.</p>
        </div>
        <ul className="mt-14 border-t hairline">
          {PILLARS.map((p) => (
            <li key={p.href} className="border-b hairline">
              <Link href={p.href} className="pillar group grid items-center gap-x-8 gap-y-2 py-8 sm:grid-cols-[5rem_1fr_1.3fr_9rem]">
                <span className="font-display text-6xl italic leading-none text-teal/80 transition-colors group-hover:text-teal">{p.k}</span>
                <span className="font-display text-3xl leading-tight sm:text-4xl">{p.title}</span>
                <span className="text-ink-soft">{p.body}</span>
                <span className="text-sm text-ink-soft sm:text-right">{p.cia}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-ink-soft">Got a message, call or screenshot instead? <Link href="/check" className="text-teal underline underline-offset-4">Decode it in 9 Indian languages</Link>.</p>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6">
        <div className="closing card relative overflow-hidden px-6 py-16 text-center sm:px-16 sm:py-24">
          <h2 className="mx-auto max-w-3xl text-5xl sm:text-7xl">Look twice. <em className="text-teal">Tap once.</em></h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">Add the extension to your browser, and install TrustLens on your phone to check anything you are sent.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/extension" className="btn-primary rounded-xl px-6 py-3.5 text-lg">Add the extension</Link>
            <Link href="/share" className="btn-ghost rounded-xl px-6 py-3.5 text-lg">Use it on your phone</Link>
          </div>
          <p className="mx-auto mt-10 max-w-xl text-sm text-ink-soft">Built on Cambridge research into how scams work. <Link href="/learn" className="underline underline-offset-4 hover:text-ink">Learn the 7 levers</Link> or <Link href="/research" className="underline underline-offset-4 hover:text-ink">see how we measured accuracy</Link>.</p>
        </div>
      </section>
    </main>
  );
}
