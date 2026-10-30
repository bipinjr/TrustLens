import type { Metadata } from "next";
import { FeaturePage } from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Browser extension" };

const CIA = [
  { k: "C", t: "Confidentiality", d: "Phishing pages are blocked before you can type an OTP or password. Message text is redacted before AI analysis." },
  { k: "I", t: "Integrity", d: "Files are checked against known malware. Documents carry signatures that break on any edit." },
  { k: "A", t: "Availability", d: "Lives in the browser: no install, no admin rights, works on any laptop and keeps guarding offline with built-in rules." },
];

function Install() {
  return (
    <div>
      <p className="fig">Install in 30 seconds</p>
      <ol className="mt-5 grid gap-4">
        {[
          ["Open", "chrome://extensions and switch on Developer mode"],
          ["Load", "Click Load unpacked and pick the extension folder"],
          ["Pin", "Pin TrustLens. The shield turns mint: you're protected"],
        ].map(([t, d], i) => (
          <li key={t} className="rise flex gap-4 rounded-2xl border hairline bg-white/[0.02] p-4" style={{ ["--i" as string]: i }}>
            <span className="font-display text-3xl italic text-teal">{i + 1}</span>
            <span><b className="block">{t}</b><span className="text-sm text-ink-soft">{d}</span></span>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-2xl border border-red/30 bg-red/[0.06] p-4">
        <p className="fig !text-red">Try it</p>
        <p className="mt-1 text-sm text-ink-soft">With the guard on, open <code className="font-mono text-red">http://paypa1-secure-login.com</code>. TrustLens stops it and takes you back to safety.</p>
      </div>
      <p className="mt-6 text-sm text-ink-soft">Works on Chrome, Edge, Brave and Opera. On phones: Firefox for Android, or add this site to your home screen.</p>
    </div>
  );
}

export default function ExtensionPage() {
  return (
    <FeaturePage current="/extension" n="04" fig="Browser extension"
      title={<>Always on. <em>Always there.</em></>}
      lead="TrustLens runs as a browser extension, so protection is available wherever you browse, with nothing to install on the computer. It watches every tab and blocks dangerous pages before they load."
      cia="Availability" ciaNote="No desktop app, no admin rights. On any machine in seconds."
      tool={<Install />}
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
