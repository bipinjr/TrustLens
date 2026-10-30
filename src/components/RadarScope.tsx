import type { CSSProperties } from "react";

const BLIPS = [
  { x: 68, y: 26, t: 0.16, label: "KYC · Pune" },
  { x: 80, y: 58, t: 1.01, label: "Digital arrest" },
  { x: 58, y: 78, t: 1.75, label: "Task job · Delhi" },
  { x: 26, y: 70, t: 2.58, label: "UPI collect" },
  { x: 20, y: 34, t: 3.43, label: "Courier ₹49" },
  { x: 42, y: 14, t: 4.04, label: "" },
];

// Decorative radar: rings, rotating sweep and blips that ping as the beam passes.
export function RadarScope({ className = "", style, labels = true }: { className?: string; style?: CSSProperties; labels?: boolean }) {
  return (
    <div className={`radar ${className}`} style={style} aria-hidden>
      <div className="radar-sweep" />
      {BLIPS.map((b) => (
        <span key={`${b.x}-${b.y}`} style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%` }}>
          <span className="blip" style={{ "--t": `${b.t}s` } as CSSProperties} />
          {labels && b.label && <span className="blip-label" style={{ "--t": `${b.t}s` } as CSSProperties}>{b.label}</span>}
        </span>
      ))}
    </div>
  );
}
