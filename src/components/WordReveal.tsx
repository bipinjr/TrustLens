import { Fragment, type CSSProperties } from "react";

// Words light up one by one as the block scrolls through the viewport (CSS scroll-driven).
// `hl` words turn red and get a drawn underline. Plain readable text where unsupported.
export function WordReveal({ text, hl = [], className = "" }: { text: string; hl?: string[]; className?: string }) {
  const words = text.split(" ");
  const total = words.length;
  return (
    <p className={`word-reveal ${className}`}>
      {words.map((w, i) => {
        const key = w.replace(/[^\p{L}\p{N}₹,]/gu, "").toLowerCase();
        const isHl = hl.some((h) => key.includes(h.toLowerCase()));
        return (
          <Fragment key={i}>
            <span className={`word ${isHl ? "hl" : ""}`} style={{ "--w": i / total } as CSSProperties}>{w}</span>
            {i < total - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </p>
  );
}
