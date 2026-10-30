import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";
import { RadarScope } from "@/components/RadarScope";

export const metadata: Metadata = { title: "Scam Radar" };

export default function RadarPage() {
  return (
    <main className="relative isolate overflow-x-clip">
      <div className="mesh opacity-40" aria-hidden />
      <header className="relative mx-auto max-w-7xl overflow-visible px-4 pb-8 pt-16 sm:px-6">
        <RadarScope labels={false} className="-right-24 -top-28 hidden w-[36rem] opacity-70 md:block" />
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl"><span className="text-gradient">Scam Radar</span></h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          What people across India are reporting right now. Every report is anonymised: phone numbers, OTPs and account numbers
          are removed before anything is saved.
        </p>
      </header>
      <div className="relative"><Dashboard /></div>
    </main>
  );
}
