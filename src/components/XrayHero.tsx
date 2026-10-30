"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HeroField } from "./HeroField";

/* Two pixel-identical layers. The top "truth" layer is only visible inside the lens (CSS mask).
   Desktop: the lens follows the cursor. Touch / idle: it drifts on its own. */

function Surface() {
  return (
    <div className="xr-layer xr-surface">
      <div className="xr-msg">
        <p className="xr-from"><span className="xr-av">S</span><span><b>SBI Care</b><small>Verified business</small></span></p>
        <p className="xr-bubble">Dear customer, complete your KYC today to keep your account active. Update securely at <u className="text-sky-300">sbi.co.in/kyc-update</u></p>
        <p className="xr-time">10:42 ✓✓</p>
      </div>
      <div className="xr-poster">
        <p className="xr-poster-h">OLX Refund Desk</p>
        <div className="xr-qr" aria-hidden />
        <p className="xr-poster-cta">Scan to <b>receive</b> ₹4,999</p>
      </div>
      <div className="xr-site">
        <p className="xr-url">https://secure-pay.in/checkout</p>
        <p className="xr-site-h">Mom&apos;s Kitchen</p>
        <p className="xr-site-p">Easy dal tadka in 20 minutes</p>
      </div>
    </div>
  );
}

function Truth() {
  return (
    <div className="xr-layer xr-truth" aria-hidden>
      <div className="xr-msg">
        <p className="xr-from"><span className="xr-av xr-bad">?</span><span><b>+91 98XXX 41207</b><small>Not in contacts, display name faked</small></span></p>
        <p className="xr-bubble">Dear customer, complete your KYC <mark>today</mark> to keep your account active. Update securely at <mark>bit.ly/k9 → t.co → sbi-kyc-update.top</mark></p>
        <p className="xr-note">3 hidden redirects</p>
      </div>
      <div className="xr-poster">
        <p className="xr-poster-h">upi://pay?pa=98765…@ybl</p>
        <div className="xr-qr" />
        <p className="xr-poster-cta"><mark>SENDS ₹4,999</mark> from you</p>
        <p className="xr-note">A QR can only take money</p>
      </div>
      <div className="xr-site">
        <p className="xr-url"><mark>sbi-kyc-update.top/login</mark></p>
        <p className="xr-site-h">SBI NetBanking</p>
        <p className="xr-field">Password ••••••</p>
        <p className="xr-field">OTP</p>
        <p className="xr-note">Cloaked: scanners see a recipe</p>
      </div>
    </div>
  );
}

export function XrayHero({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0, x = 0.5, y = 0.45, tx = x, ty = y, t0 = performance.now();
    const set = () => { el.style.setProperty("--lx", `${(x * 100).toFixed(2)}%`); el.style.setProperty("--ly", `${(y * 100).toFixed(2)}%`); };
    const loop = (t: number) => {
      if (t - last > 2200) { const k = (t - t0) / 1000; tx = 0.5 + Math.sin(k * 0.55) * 0.33; ty = 0.5 + Math.sin(k * 0.9 + 1) * 0.3; } // idle drift (Lissajous)
      x += (tx - x) * 0.12; y += (ty - y) * 0.12; set();
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); last = performance.now();
    };
    set();
    if (!reduce) { raf = requestAnimationFrame(loop); el.addEventListener("pointermove", move); }
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting && !reduce) raf = requestAnimationFrame(loop); });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", move); io.disconnect(); };
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="hero-wash" aria-hidden />
      <HeroField />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pb-24 lg:pt-20">
        <div>{children}</div>
        <div ref={stage} className="xr-stage" role="img" aria-label="A friendly-looking SBI message, a refund QR poster and a recipe site. Under the TrustLens lens: a spoofed sender, a link that redirects three times to sbi-kyc-update.top, a QR that sends ₹4,999, and a cloaked fake login.">
          <Surface />
          <Truth />
          <div className="xr-lens" aria-hidden><span className="xr-lens-ring" /><span className="xr-lens-label">TrustLens</span></div>
          <p className="xr-hint" aria-hidden>Move the lens to see what it hides</p>
        </div>
      </div>
    </section>
  );
}
