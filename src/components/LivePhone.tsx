"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Tilt } from "./fx";

type Scenario = {
  sender: string;
  sub: string;
  app: string;
  parts: { t: string; m?: number }[];
  chips: string[];
  risk: number;
};

const SCENARIOS: Scenario[] = [
  {
    sender: "VK-SBIBNK", sub: "SMS · not in contacts", app: "SMS",
    parts: [
      { t: "Dear SBI customer, your YONO account will be " }, { t: "BLOCKED today", m: 0 },
      { t: " due to pending KYC. Update PAN: " }, { t: "sbi-kyc-update.xyz", m: 1 },
      { t: " or " }, { t: "share the OTP", m: 2 }, { t: " with our officer." },
    ],
    chips: ["Fake deadline", "Spoofed SBI link", "Asks for your OTP", "Pretends to be the bank"],
    risk: 94,
  },
  {
    sender: "+91 98XXX XX310", sub: "WhatsApp video call", app: "WhatsApp",
    parts: [
      { t: "This is " }, { t: "Customs Officer Sharma", m: 0 }, { t: ". Drugs found in a parcel in your name. " },
      { t: "Stay on this video call", m: 1 }, { t: " and " }, { t: "don't tell your family", m: 2 },
      { t: ". Pay the clearance amount now." },
    ],
    chips: ["Borrowed authority", "Keeps you on the line", "Demands secrecy", "Digital arrest script"],
    risk: 97,
  },
  {
    sender: "HR · Priya", sub: "Telegram · new contact", app: "Telegram",
    parts: [
      { t: "Part-time job! " }, { t: "Earn ₹3,000 daily", m: 0 }, { t: " by liking YouTube videos. " },
      { t: "25,000 members already earning", m: 1 }, { t: ". Pay a " }, { t: "refundable deposit", m: 2 }, { t: " to start." },
    ],
    chips: ["Too good to be true", "Fake crowd proof", "Pay to get paid", "Task job scam"],
    risk: 91,
  },
];

const CHIP_POS: CSSProperties[] = [
  { top: "22%", left: "-18%" },
  { top: "44%", right: "-36%" },
  { top: "57%", left: "-24%" },
  { top: "-4%", right: "-6%" },
];

// Timeline (ms) for one scenario
const T = { typing: 0, message: 1100, flag0: 2100, gap: 650, verdict: 4300, end: 7600 };

export function LivePhone() {
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(T.end); // start fully shown; first effect run restarts the clock
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const start = useRef(0);
  const pausedAt = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStill(true); return; }
    start.current = performance.now();
    setT(0);
  }, [idx]);

  // ~12 updates a second is plenty for this timeline and keeps low-end phones cool.
  useEffect(() => {
    if (still || paused) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const el = performance.now() - start.current;
      if (el >= T.end) { setIdx((i) => (i + 1) % SCENARIOS.length); return; }
      setT(el);
    }, 80);
    return () => clearInterval(id);
  }, [idx, paused, still]);

  function pause(on: boolean) {
    if (still) return;
    if (on) { pausedAt.current = performance.now(); setPaused(true); }
    else { start.current += performance.now() - pausedAt.current; setPaused(false); }
  }

  const s = SCENARIOS[idx];
  const time = still ? T.end - 1 : t;
  const showMsg = time >= T.message;
  const flagOn = (m: number) => time >= T.flag0 + m * T.gap;
  const flags = [0, 1, 2].filter(flagOn).length;
  const showVerdict = time >= T.verdict;
  const leaving = !still && time >= T.end - 450;
  const shownRisk = showVerdict ? Math.round(s.risk * Math.min(1, (time - T.verdict) / 700)) : 0;

  return (
    <div className="relative mx-auto w-[min(21rem,82vw)]" onPointerEnter={() => pause(true)} onPointerLeave={() => pause(false)}>
      {s.chips.map((c, i) => {
        const on = i < 3 ? flagOn(i) : showVerdict;
        return (
          <span
            key={`${idx}-${c}`}
            className="chip hidden transition-[opacity,transform] duration-500 sm:inline-flex"
            style={{ ...CHIP_POS[i], opacity: on && !leaving ? 1 : 0, transform: on && !leaving ? "scale(1)" : "scale(.5)", animation: "none" }}
          >
            <span className="dot" aria-hidden />{c}
          </span>
        );
      })}

      <div>
        <Tilt className="relative z-[1]">
          <div className="phone phone-in">
            <div className="phone-screen">
              <div className="phone-notch" aria-hidden />
              <div className="flex items-center gap-3 border-b hairline px-4 pb-3 pt-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-ink-soft" aria-hidden>{s.sender[0] === "+" ? "?" : s.sender[0]}</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-white">{s.sender}</p>
                  <p className="text-xs text-ink-soft">{s.sub}</p>
                </div>
                <span className={`ml-auto shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-xs font-bold transition-colors duration-300 ${flags ? "bg-red-wash text-red" : "bg-white/[0.06] text-ink-soft"}`}>
                  {flags} red flag{flags === 1 ? "" : "s"}
                </span>
              </div>

              <div className={`chat-wall relative h-[19.5rem] overflow-hidden px-4 py-5 transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}>
                {showMsg && !still && time < T.verdict && <span className="scanline" style={{ animationDelay: "0s", animationDuration: "2.2s" }} aria-hidden />}

                {!showMsg ? (
                  <div className="bubble inline-flex gap-1.5 bg-chat px-4 py-3.5" style={{ "--bubble-bg": "var(--color-chat)" } as CSSProperties} aria-label={`${s.sender} is typing`}>
                    {[0, 1, 2].map((d) => <span key={d} className="typing-dot h-2 w-2 rounded-full bg-ink-soft" style={{ animationDelay: `${d * 0.15}s` }} />)}
                  </div>
                ) : (
                  <div className="msg-in bubble max-w-[94%] bg-chat px-4 py-3 text-[0.95rem] leading-[1.9] text-ink" style={{ "--bubble-bg": "var(--color-chat)" } as CSSProperties}>
                    {s.parts.map((p, i) =>
                      p.m === undefined ? (
                        <span key={i}>{p.t}</span>
                      ) : (
                        <span key={i} className={`rounded-[3px] transition-all duration-300 ${flagOn(p.m) ? "pen-mark live" : ""}`}>
                          {p.t}{flagOn(p.m) && <span className="pen-num">{p.m + 1}</span>}
                        </span>
                      ),
                    )}
                  </div>
                )}

                {showVerdict && (
                  <div className="verdict-in mt-4 flex items-center gap-3 rounded-2xl border border-red/40 bg-red-wash px-4 py-3">
                    <span className="stamp px-2 py-0.5 text-sm font-bold uppercase text-red">Scam</span>
                    <span className="font-pen text-3xl font-bold tabular-nums text-red">{shownRisk}</span>
                    <span className="text-xs leading-tight text-ink-soft">risk<br />out of 100</span>
                    <span className="ml-auto text-xs font-semibold text-white">Don&apos;t reply</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tilt>
      </div>

      <div className="relative z-[2] mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Example scams">
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.app}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Show the ${sc.app} example`}
            onClick={() => setIdx(i)}
            className="group grid h-8 min-w-8 place-items-center px-1"
          >
            <span className={`block h-2.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-teal" : "w-2.5 bg-white/25 group-hover:bg-white/50"}`} />
          </button>
        ))}
        <span className="ml-1 font-mono text-xs text-ink-soft">{paused ? "paused" : SCENARIOS[idx].app}</span>
      </div>
    </div>
  );
}
