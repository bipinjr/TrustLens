"use client";

import { useEffect, useRef } from "react";

/* Background for the landing hero: streams of "links" flow left -> right towards the lens.
   As they cross the lens line, scams flare rose and are caught (they burst and stop);
   safe ones turn mint and pass through. Canvas 2D, ~140 particles, paused off-screen. */
type P = { x: number; y: number; v: number; bad: boolean; lane: number; t: number; caught: number };

export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, on = true;
    const ps: P[] = [];
    const lanes = 9;
    const spawn = (p?: P): P => {
      const lane = Math.floor(Math.random() * lanes);
      const o = p ?? ({} as P);
      Object.assign(o, { x: -40 - Math.random() * w * 0.6, y: 0, v: 0.6 + Math.random() * 1.4, bad: Math.random() < 0.28, lane, t: Math.random() * 1000, caught: 0 });
      return o;
    };
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const N = w < 700 ? 70 : 140;
    for (let i = 0; i < N; i++) { const p = spawn(); p.x = Math.random() * w; ps.push(p); }
    const laneY = (lane: number, x: number, t: number) => h * (0.14 + (lane / (lanes - 1)) * 0.74) + Math.sin(x * 0.006 + lane * 1.7 + t * 0.0006) * 26;

    const draw = (time: number) => {
      g.clearRect(0, 0, w, h);
      const gate = w * (w < 900 ? 0.62 : 0.66); // where the lens "reads" links
      // gate: faint vertical scan of the lens
      const grad = g.createLinearGradient(gate - 60, 0, gate + 60, 0);
      grad.addColorStop(0, "rgba(94,234,212,0)"); grad.addColorStop(.5, "rgba(94,234,212,.07)"); grad.addColorStop(1, "rgba(94,234,212,0)");
      g.fillStyle = grad; g.fillRect(gate - 60, 0, 120, h);
      for (const p of ps) {
        if (p.caught) {
          p.caught += 1;
          const r = p.caught * 0.9, a = Math.max(0, 1 - p.caught / 40);
          g.strokeStyle = `rgba(251,113,133,${a})`; g.lineWidth = 1.2;
          g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.stroke();
          if (p.caught > 40) spawn(p);
          continue;
        }
        p.x += p.v * (reduce ? 0 : 1);
        p.y = laneY(p.lane, p.x, time + p.t);
        const past = p.x > gate;
        if (p.bad && past) { p.caught = 1; continue; }
        const near = Math.max(0, 1 - Math.abs(p.x - gate) / 160);
        const len = 10 + p.v * 9;
        const col = past ? "94,234,212" : p.bad ? "251,113,133" : "190,205,201";
        const alpha = (past ? 0.55 : 0.22) + near * 0.5;
        const tail = g.createLinearGradient(p.x - len, p.y, p.x, p.y);
        tail.addColorStop(0, `rgba(${col},0)`); tail.addColorStop(1, `rgba(${col},${alpha})`);
        g.strokeStyle = tail; g.lineWidth = p.bad ? 1.6 : 1.1;
        g.beginPath(); g.moveTo(p.x - len, p.y); g.lineTo(p.x, p.y); g.stroke();
        g.fillStyle = `rgba(${col},${Math.min(1, alpha + 0.2)})`;
        g.beginPath(); g.arc(p.x, p.y, p.bad ? 1.8 : 1.3, 0, Math.PI * 2); g.fill();
        if (p.x > w + 40) spawn(p);
      }
      if (on && !reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(draw); });
    io.observe(c);
    const ro = new ResizeObserver(size); ro.observe(c);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="hero-field" aria-hidden />;
}
