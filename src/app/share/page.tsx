import type { Metadata } from "next";
import { ShareInbox } from "@/components/ShareInbox";

export const metadata: Metadata = { title: "Check what you shared" };

export default function SharePage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-wash" aria-hidden />
      <section className="relative mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <ShareInbox />
      </section>
    </main>
  );
}
