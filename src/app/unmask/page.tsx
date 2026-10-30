import type { Metadata } from "next";
import { HurdleSection } from "@/components/HurdleSection";
import { ProtectTabs } from "@/components/ProtectTabs";

export const metadata: Metadata = { title: "Unmask: redirects, cloaking and QR codes" };

export default function UnmaskPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-wash" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20"><ProtectTabs current="/unmask" /></div>
      <HurdleSection />
    </main>
  );
}
