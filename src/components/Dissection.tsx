"use client";

import { useEffect, useRef, useState } from "react";
import { PRINCIPLES, type PrincipleId } from "@/lib/principles";

const PARTS: { t: string; k?: number }[] = [
  { t: "This is " },
  { t: "Inspector Rajesh from Mumbai Cyber Crime", k: 0 },
  { t: ". A parcel in your name with illegal drugs was seized by Customs. " },
  { t: "An arrest warrant is issued", k: 1 },
  { t: ". " },
  { t: "Stay on this video call", k: 2 },
  { t: " and " },
  { t: "do not tell your family", k: 3 },
  { t: ". To clear your name, " },
  { t: "transfer the amount to the RBI verification account now", k: 4 },
  { t: "." },
];

const STEPS: { title: string; p: PrincipleId; body: string }[] = [
  { title: "Borrowed authority", p: "social_compliance", body: "A rank, a name and a real-sounding department. Within one sentence you are talking to “the police”, and questioning the police feels wrong." },
  { title: "A threat with a clock on it", p: "time", body: "An arrest warrant means right now. Fear plus a deadline switches off careful thinking, which is exactly the point." },
  { title: "Keep you on the line", p: "distraction", body: "A live video call keeps your attention locked on them. You can't pause, search, or call anyone to check while they watch you." },
  { title: "Cut you off from help", p: "dishonesty", body: "“Don't tell your family” makes you feel you have something to hide. The people most likely to stop the scam never hear about it." },
  { title: "The real ask", p: "social_compliance", body: "There is no “RBI verification account”. Real police never ask for money on a call. Everything before this line existed to make this request feel normal." },
];

export function Dissection() {
  const [active, setActive] = useState(-1);
  const steps = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const done = active >= STEPS.length;
  return (
    <section className="relative mx-auto mt-32 max-w-7xl px-4 sm:px-6" aria-labelledby="dissect-title">
      <h2 id="dissect-title" className="reveal max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        <span className="text-gradient">Watch a scam get taken apart</span>
      </h2>
      <p className="reveal mt-4 max-w-2xl text-lg text-ink-soft">
        A “digital arrest” script, the costliest scam pattern in India right now. Scroll, and TrustLens pulls out each trick and
        the lever it pulls in your head.
      </p>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Pinned message */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="aurora card overflow-hidden p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b hairline pb-4">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-wash" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><path d="M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14M5 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg>
              </span>
              <div className="leading-tight">
                <p className="font-semibold text-white">Incoming video call</p>
                <p className="text-sm text-ink-soft">“Mumbai Cyber Crime Cell” · unknown number</p>
              </div>
              <span className={`ml-auto rounded-full px-2.5 py-1 font-mono text-xs font-bold transition-colors ${done ? "bg-red text-white" : "bg-white/[0.06] text-ink-soft"}`}>
                {done ? "SCAM · 95" : `${Math.max(0, Math.min(active + 1, STEPS.length))}/${STEPS.length} tricks`}
              </span>
            </div>
            <p className="mt-6 text-xl leading-[2.05] text-ink sm:text-[1.35rem]">
              {PARTS.map((part, i) =>
                part.k === undefined ? (
                  <span key={i}>{part.t}</span>
                ) : (
                  <span key={i} className={`dissect-mark px-0.5 ${active === part.k ? "on" : active > part.k ? "seen" : ""}`}>
                    {part.t}
                    {active >= part.k && <sup className="ml-0.5 font-pen text-lg font-bold text-red">{part.k + 1}</sup>}
                  </span>
                ),
              )}
            </p>
          </div>
        </div>

        {/* Scrolling explanations */}
        <ol className="space-y-6 lg:space-y-[30vh] lg:pb-[16vh] lg:pt-[8vh]">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              data-i={i}
              ref={(el) => { steps.current[i] = el; }}
              className={`card p-7 transition-all duration-500 ${active === i ? "border-red/50 opacity-100 shadow-[0_0_60px_-20px_rgba(255,75,62,.6)]" : "opacity-40"}`}
            >
              <p className="flex items-center gap-3"><span className="font-pen text-3xl font-bold leading-none text-red">{i + 1}</span><span className="rounded-full border border-red/40 px-2.5 py-0.5 text-sm text-[#ffb4ad]">Lever: {PRINCIPLES[s.p].name}</span></p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-lg text-ink-soft">{s.body}</p>
            </li>
          ))}
          <li data-i={STEPS.length} ref={(el) => { steps.current[STEPS.length] = el; }} className={`card p-7 transition-all duration-500 ${done ? "opacity-100" : "opacity-40"}`}>
            <p className="font-pen text-3xl text-red">Five tricks, one request.</p>
            <p className="mt-3 text-lg text-ink-soft">
              Once you can see the levers, the script stops working. If a call like this ever reaches you: hang up, and call
              <a href="tel:1930" className="font-semibold text-white underline decoration-red underline-offset-4"> 1930</a>.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
