import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export const FEATURES = [
  { href: "/phishing", n: "01", label: "Phishing", cia: "Confidentiality" },
  { href: "/malware", n: "02", label: "Malware", cia: "Integrity" },
  { href: "/signature", n: "03", label: "Verify", cia: "Integrity" },
  { href: "/extension", n: "04", label: "Extension", cia: "Availability" },
] as const;

export function FeaturePage({ n, fig, title, lead, cia, ciaNote, tool, steps, notes, current }: {
  n: string; fig: string; title: ReactNode; lead: string; cia: string; ciaNote: string;
  tool: ReactNode; steps: { t: string; d: string }[]; notes?: ReactNode; current: string;
}) {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-wash" aria-hidden />
      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <nav aria-label="Features" className="mb-12 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} aria-current={f.href === current ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${f.href === current ? "border-teal/60 bg-teal/10 text-teal" : "border-white/10 text-ink-soft hover:border-white/30 hover:text-ink"}`}>
              {f.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <h1 className="blur-in text-6xl sm:text-7xl lg:text-[5.6rem]">{title}</h1>
            <p className="rise mt-6 max-w-xl text-lg text-ink-soft" style={{ "--i": 2 } as CSSProperties}>{lead}</p>
            <div className="rise mt-8 inline-flex items-center gap-4 rounded-2xl border hairline bg-white/[0.02] px-5 py-4" style={{ "--i": 3 } as CSSProperties}>
              <span className="font-display text-5xl leading-none text-teal">{cia[0]}</span>
              <span>
                <span className="block font-semibold text-ink">Protects {cia.toLowerCase()}</span>
                <span className="text-sm text-ink-soft">{ciaNote}</span>
              </span>
            </div>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border hairline bg-white/[0.06] sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.t} className="rise bg-paper p-5" style={{ "--i": i + 4 } as CSSProperties}>
                  <span className="font-display text-4xl italic text-teal">{["i.", "ii.", "iii."][i]}</span>
                  <p className="mt-3 font-semibold">{s.t}</p>
                  <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="spotlight card relative self-start p-6 sm:p-8">{tool}</div>
        </div>
        {notes && <div className="mt-16">{notes}</div>}
      </section>
    </main>
  );
}
