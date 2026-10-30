import type { Metadata } from "next";
import { Checker } from "@/components/Checker";

export const metadata: Metadata = { title: "Check a message" };

export default function CheckPage() {
  return (
    <main className="relative isolate">
      <div className="mesh opacity-50" aria-hidden />
      <Checker />
    </main>
  );
}
