import type { Metadata } from "next";
import Link from "next/link";
import { CITATIONS } from "@/lib/principles";
import { BENCHMARK } from "@/lib/benchmark";

export const metadata: Metadata = { title: "Research & accuracy" };

const PAPERS = [
  { c: CITATIONS.stajano, use: "Our taxonomy. Every trick TrustLens finds is tagged with one of these seven principles." },
  { c: CITATIONS.inoculation, use: "Why we teach the pattern: learning a manipulation technique protects against new content that uses it." },
  { c: CITATIONS.prebunking, use: "Why practice uses a weakened, made-up example, and why it works across cultures and languages." },
  { c: CITATIONS.mha, use: "The scale of the problem in India." },
];

const H = BENCHMARK.heldout, T = BENCHMARK.tuning;

export default function ResearchPage() {
  return (
    <main className="relative isolate">
      <div className="mesh opacity-40" aria-hidden />
      <header className="relative mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6">
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          <span className="text-gradient">Built on research. Measured honestly.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-soft">
          The papers behind the design, and how accurate TrustLens really is, including where it still gets things wrong.
        </p>
      </header>

      {/* Papers */}
      <section className="relative mx-auto mt-10 max-w-7xl px-4 sm:px-6" aria-labelledby="papers">
        <h2 id="papers" className="text-2xl font-semibold text-white">The research</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {PAPERS.map(({ c, use }) => (
            <li key={c.label} className="card reveal flex flex-col p-6">
              <p className="font-mono text-sm text-red">{c.label}</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-white">{c.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{c.venue}</p>
              <p className="mt-4 text-ink">{use}</p>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                {c.pdf ? (
                  <a href={c.pdf} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
                    Open PDF
                  </a>
                ) : (
                  <a href={c.url} target="_blank" rel="noreferrer" className="btn-primary rounded-xl px-4 py-2.5 text-sm">Read the report</a>
                )}
                {c.pdf && <a href={c.url} target="_blank" rel="noreferrer" className="inline-block py-2 text-sm text-ink-soft underline underline-offset-4 hover:text-white">Publisher page</a>}
                <span className="text-xs text-ink-soft">{c.note}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm text-ink-soft">
          The inoculation studies tested misinformation, not scams. We apply the same method to scams; we do not claim it has been
          proven for scams specifically.
        </p>
      </section>

      {/* Accuracy */}
      <section className="relative mx-auto mt-24 max-w-7xl px-4 sm:px-6" aria-labelledby="accuracy">
        <h2 id="accuracy" className="text-2xl font-semibold text-white">How accurate is it?</h2>
        <p className="mt-3 max-w-3xl text-ink-soft">
          We wrote {H.cases} realistic messages <b className="text-white">after</b> finishing the AI instructions and never used them
          to tune anything: {H.scams} scams across 15 families (8 in Hindi, Hinglish or Tamil) and {H.genuine} genuine messages chosen
          to be tricky, like real bank alerts that mention OTP, KYC or a blocked card.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: `${H.detection}%`, l: `of unseen scams caught (${Math.round((H.detection / 100) * H.scams)} of ${H.scams})` },
            { v: `${H.falseAlarms}%`, l: `false alarms on genuine messages (1 of ${H.genuine})` },
            { v: `${H.accuracy}%`, l: "overall accuracy on the unseen set" },
            { v: `${(H.medianMs / 1000).toFixed(1)} s`, l: "median time to a full answer" },
          ].map((k) => (
            <div key={k.l} className="card reveal p-6">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-white">{k.v}</p>
              <p className="mt-2 text-sm text-ink-soft">{k.l}</p>
            </div>
          ))}
        </div>

        <div className="card reveal mt-4 overflow-x-auto p-6">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="mb-4 text-left font-semibold text-white">Unseen (held-out) test set, {H.cases} messages</caption>
            <thead className="text-ink-soft">
              <tr className="border-b hairline"><th className="py-2 font-medium">System</th><th className="font-medium">Scams caught</th><th className="font-medium">False alarms</th><th className="font-medium">Precision</th><th className="font-medium">Accuracy</th></tr>
            </thead>
            <tbody className="text-ink">
              <tr className="border-b hairline"><th className="py-3 font-semibold text-white">TrustLens (AI + rules)</th><td>{H.detection}%</td><td>{H.falseAlarms}%</td><td>{H.precision}%</td><td>{H.accuracy}%</td></tr>
              <tr><th className="py-3 font-normal">Rule engine alone</th><td>{H.rulesDetection}%</td><td>5.6%</td><td>85.7%</td><td>57.5%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card reveal p-6">
            <h3 className="font-semibold text-white">What we fixed along the way</h3>
            <p className="mt-3 text-ink-soft">
              Our first version caught every scam but raised false alarms on <b className="text-white">{T.v1FalseAlarms}%</b> of genuine
              messages: real bank alerts mentioning “OTP” or “blocked card” looked scary. We taught the rule engine to recognise official
              domains (like <span className="font-mono text-ink">uidai.gov.in</span>) and gave the AI clear examples of what genuine
              messages look like. On the {T.cases}-message development set, false alarms fell to {T.falseAlarms}% with detection unchanged.
              Because that set guided the fix, we only quote the unseen-set numbers above as our accuracy.
            </p>
          </div>
          <div className="card reveal p-6">
            <h3 className="font-semibold text-white">Where it still gets it wrong</h3>
            <ul className="mt-3 space-y-3 text-ink-soft">
              <li><b className="text-white">Long-con openers.</b> “Sorry, wrong number, I live in Singapore” messages ask for nothing yet, so it rated two of them safe. These pig-butchering scams only show their hand days later.</li>
              <li><b className="text-white">Real fraud checks.</b> A genuine bank message asking “did you make this transaction? Reply Y/N” was flagged as a scam.</li>
              <li><b className="text-white">One run, one model.</b> Scores near the 35-point line can shift slightly between runs.</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Every test message, the runner script and the raw results are in the project repository under <span className="font-mono text-ink">eval/</span>.
        </p>
      </section>

      <section className="relative mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="card flex flex-wrap items-center justify-between gap-6 p-8">
          <p className="max-w-xl text-2xl font-semibold text-white">See it work on a message you received.</p>
          <Link href="/check" className="btn-primary rounded-xl px-6 py-3.5">Check a message</Link>
        </div>
      </section>
    </main>
  );
}
