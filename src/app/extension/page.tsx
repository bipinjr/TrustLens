import type { Metadata } from "next";
import { FeaturePage } from "@/components/FeaturePage";
import { GetTrustLens } from "@/components/GetTrustLens";

export const metadata: Metadata = { title: "Browser extension" };

const CIA = [
  { k: "C", t: "Confidentiality", d: "Phishing pages are blocked before you can type an OTP or password. Message text is redacted before AI analysis." },
  { k: "I", t: "Integrity", d: "Files are checked against known malware. Documents carry signatures that break on any edit." },
  { k: "A", t: "Availability", d: "Lives in the browser: no install, no admin rights, works on any laptop and keeps guarding offline with built-in rules." },
];

export default function ExtensionPage() {
  return (
    <FeaturePage current="/extension" n="04" fig="Browser extension"
      title={<>Always on. <em>Always there.</em></>}
      lead="TrustLens runs as a browser extension, so protection is available wherever you browse, with nothing to install on the computer. It watches every tab and blocks dangerous pages before they load."
      cia="Availability" ciaNote="No desktop app, no admin rights. On any machine in seconds."
      tool={<GetTrustLens />}
      steps={[
        { t: "Background guard", d: "Every host on the live OpenPhish feed becomes a blocking rule, refreshed every 30 minutes." },
        { t: "Warn & return", d: "A full-page warning names every reason, with one tap back to safety." },
        { t: "On / off", d: "One switch in the popup. Everything stays on your device." },
      ]}
      notes={
        <div className="grid gap-px overflow-hidden rounded-3xl border hairline bg-white/[0.06] md:grid-cols-3">
          {CIA.map((c) => (
            <div key={c.k} className="spotlight bg-paper p-8">
              <span className="font-display text-7xl italic leading-none text-teal">{c.k}</span>
              <h2 className="mt-4 text-3xl">{c.t}</h2>
              <p className="mt-2 text-ink-soft">{c.d}</p>
            </div>
          ))}
        </div>
      } />
  );
}
