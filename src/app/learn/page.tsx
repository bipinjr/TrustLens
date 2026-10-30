import type { Metadata } from "next";
import Link from "next/link";
import { LearnPractice } from "./LearnPractice";
import { CITATIONS, PRINCIPLES, PRINCIPLE_IDS } from "@/lib/principles";
import { SpotlightGroup } from "@/components/fx";

export const metadata: Metadata = { title: "Learn & practise" };

export default function LearnPage() {
  return (
    <main className="relative isolate">
      <div className="mesh opacity-40" aria-hidden />
      <header className="relative mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6">
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          <span className="text-gradient">The seven levers every scam pulls</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-soft">
          Cambridge researchers Frank Stajano and Paul Wilson studied how real con artists work and found seven principles
          that every scam relies on. Learn to see the lever, and the wording stops mattering.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={CITATIONS.stajano.pdf} target="_blank" rel="noreferrer" className="btn-ghost rounded-xl px-5 py-3">Read the paper (PDF)</a>
          <Link href="#practice" className="btn-primary rounded-xl px-5 py-3">Practise spotting them</Link>
        </div>
      </header>

      <SpotlightGroup className="relative mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {PRINCIPLE_IDS.map((id, i) => {
          const p = PRINCIPLES[id];
          return (
            <article key={id} className="spotlight card reveal flex flex-col p-7">
              <span className="font-pen text-3xl font-bold leading-none text-red">{i + 1}</span>
              <h2 className="mt-3 text-2xl font-semibold text-white">{p.name}</h2>
              <p className="mt-3 text-ink-soft">{p.long}</p>
              <p className="mt-auto rounded-xl bg-chat px-4 py-3 pt-3 text-ink">
                <span className="pen-mark scroll-draw">&ldquo;{p.example}&rdquo;</span>
              </p>
            </article>
          );
        })}
        <article className="card reveal relative flex flex-col justify-between overflow-hidden p-7">
          <div className="mesh opacity-70" aria-hidden />
          <p className="relative font-pen text-3xl leading-snug text-white">Know the lever, and the next scam stops working on you.</p>
          <p className="relative mt-6 text-sm text-ink-soft">{CITATIONS.stajano.label}. {CITATIONS.stajano.venue}</p>
        </article>
      </SpotlightGroup>

      <div className="mt-24"><LearnPractice /></div>
    </main>
  );
}
