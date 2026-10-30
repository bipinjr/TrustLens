import type { CSSProperties } from "react";

// Decorative explainers for the hurdle: a two-faced (cloaked) page and an example redirect chain.
export function TwoFaces() {
  return (
    <div className="two-faces relative aspect-[5/4] w-full overflow-hidden rounded-3xl border hairline bg-[#0b0f10]" aria-hidden>
      <div className="face face-bot">
        <p className="fig">Scanner sees</p>
        <p className="mt-3 font-display text-3xl">Mom&apos;s Kitchen</p>
        <p className="mt-1 text-sm text-ink-soft">Easy dal tadka in 20 minutes</p>
        <span className="mt-4 block h-2 w-4/5 rounded bg-white/10" /><span className="mt-2 block h-2 w-3/5 rounded bg-white/10" /><span className="mt-2 block h-2 w-2/3 rounded bg-white/10" />
        <span className="mt-5 inline-block rounded-full bg-teal/15 px-3 py-1 font-mono text-xs text-teal">verdict: clean</span>
      </div>
      <div className="face face-human">
        <p className="fig !text-red">You see</p>
        <p className="mt-3 font-display text-3xl">SBI NetBanking</p>
        <p className="mt-1 text-sm text-ink-soft">Your KYC expires today</p>
        <span className="mt-4 block rounded-lg border border-white/15 px-3 py-2 text-xs text-ink-soft">User ID</span>
        <span className="mt-2 block rounded-lg border border-red/50 px-3 py-2 text-xs text-red">Password ••••••</span>
        <span className="mt-2 block rounded-lg border border-red/50 px-3 py-2 text-xs text-red">OTP</span>
      </div>
      <span className="face-split" />
    </div>
  );
}

export function Chain() {
  const hops = ["bit.ly/kyc-sbi", "t.co/x8fQ", "ads-track.click/r", "sbi-kyc-update.top/login"];
  return (
    <ol className="chain flex flex-wrap items-center gap-2 font-mono text-[0.8rem]" aria-label="Example redirect chain">
      {hops.map((h, i) => (
        <li key={h} className="flex items-center gap-2" style={{ "--i": i } as CSSProperties}>
          <span className={`chain-node rounded-full border px-3 py-1.5 ${i === hops.length - 1 ? "border-red/60 bg-red/10 text-red" : "border-white/12 bg-white/[0.03] text-ink-soft"}`}>{h}</span>
          {i < hops.length - 1 && <span className="chain-arrow text-teal">→</span>}
        </li>
      ))}
    </ol>
  );
}

