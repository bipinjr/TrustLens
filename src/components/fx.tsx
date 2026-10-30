"use client";

import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Counts up to `to` the first time it scrolls into view. Renders the final value under reduced motion.
export function CountUp({ to, prefix = "", suffix = "", decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    setV(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

// Sets --mx/--my on hovered .spotlight children so the CSS glow follows the cursor.
export function SpotlightGroup({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={className}
      onPointerMove={(e) => {
        const card = (e.target as HTMLElement).closest?.<HTMLElement>(".spotlight");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

// Tilts its child toward the pointer (desktop only, skipped under reduced motion).
export function Tilt({ children, max = 10, className = "" }: { children: React.ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      style={{ transform: `perspective(1200px) rotateY(-8deg) rotateX(6deg)` }}
      onPointerMove={(e) => {
        if (reduced() || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        ref.current.style.transform = `perspective(1200px) rotateY(${x * max * 2}deg) rotateX(${-y * max}deg)`;
      }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = "perspective(1200px) rotateY(-8deg) rotateX(6deg)"; }}
    >
      {children}
    </div>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ#%&@$₹?!कखगघजतपमरस0123456789";

// Letters scramble through glyphs and lock into place, left to right. Final text is server-rendered,
// screen readers get it via aria-label, and nothing animates under reduced motion.
export function DecodeText({ text, delay = 0, duration = 1100 }: { text: string; delay?: number; duration?: number }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - t0) / duration));
      const locked = Math.floor(p * text.length);
      setShown(
        text.split("").map((ch, i) => (ch === " " || i < locked ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, duration]);
  return (
    <span aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

// Soft red light that follows the cursor across its parent section.
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || reduced()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ref.current!.style.setProperty("--cx", `${e.clientX - r.left}px`);
      ref.current!.style.setProperty("--cy", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="cursor-light" aria-hidden />;
}

const CONFETTI = ["#0f766e", "#14b8a6", "#5eead4", "#f59e0b", "#e11d48", "#0ea5e9"];

// One-shot confetti burst from the middle of the screen. Renders nothing under reduced motion.
export function Confetti({ count = 46, colors = CONFETTI }: { count?: number; colors?: string[] }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const d = 140 + Math.random() * 260;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d - 120, r: (Math.random() * 720 - 360) | 0, c: colors[i % colors.length], delay: Math.random() * 0.15 };
    }),
  );
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 1800); return () => clearTimeout(t); }, []);
  if (!on || reduced()) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ background: p.c, "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, "--d": `${p.delay}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

// Primary buttons lean toward the mouse. Mounted once in the layout; mouse only, off under reduced motion.
export function MagneticButtons() {
  useEffect(() => {
    if (reduced()) return;
    let current: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as HTMLElement).closest?.<HTMLElement>(".btn-primary, .btn-ghost") ?? null;
      if (current && current !== el) { current.style.transform = ""; current = null; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
      current = el;
    };
    const leave = () => { if (current) { current.style.transform = ""; current = null; } };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, []);
  return null;
}

// Page-wide cursor light: one fixed layer follows the pointer (transform only, no page restyle);
// also sets --mx/--my on the .spotlight card under the pointer.
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced()) return;
    let raf = 0, x = 0, y = 0, target: EventTarget | null = null;
    const frame = () => {
      raf = 0;
      if (ref.current) ref.current.style.transform = `translate3d(${x - 520}px, ${y - 520}px, 0)`;
      const card = (target as HTMLElement | null)?.closest?.<HTMLElement>(".spotlight");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${x - r.left}px`);
        card.style.setProperty("--my", `${y - r.top}px`);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY; target = e.target;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden />;
}
