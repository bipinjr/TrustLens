"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { analyzeQr, type QrVerdict } from "@/lib/qr";
import type { UnmaskReport, View } from "@/lib/unmask";

type Tone = "bad" | "warn" | "good";
const TONE: Record<Tone, string> = { bad: "text-red", warn: "text-amber", good: "text-teal" };
const toneOf = (v: UnmaskReport["verdict"]): Tone => (v === "scam" ? "bad" : v === "suspicious" ? "warn" : "good");
const host = (u: string) => { try { return new URL(u).hostname; } catch { return u; } };

async function unmaskApi(url: string): Promise<UnmaskReport> {
  const res = await fetch("/api/unmask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Couldn't unmask that link");
  return j;
}

/* ---------- Redirect chain + cloaking report ---------- */
function ViewCard({ who, v, odd }: { who: string; v: View; odd: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${odd ? "border-red/40 bg-red/[0.05]" : "hairline bg-white/[0.02]"}`}>
      <p className="fig">{who}</p>
      <p className="mt-2 truncate font-display text-2xl">{v.error ? "No response" : v.title || host(v.finalUrl)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[0.75rem] text-ink-soft">
        <dt>status</dt><dd className="text-right text-ink">{v.status || "—"}</dd>
        <dt>lands on</dt><dd className="truncate text-right text-ink">{host(v.finalUrl)}</dd>
        <dt>password box</dt><dd className={`text-right ${v.hasPassword ? "text-red" : "text-ink"}`}>{v.hasPassword ? "yes" : "no"}</dd>
        <dt>OTP / PIN ask</dt><dd className={`text-right ${v.hasOtp ? "text-red" : "text-ink"}`}>{v.hasOtp ? "yes" : "no"}</dd>
      </dl>
    </div>
  );
}

export function UnmaskReportView({ r }: { r: UnmaskReport }) {
  const tone = toneOf(r.verdict);
  return (
    <div className="mt-6 space-y-5" role="status" aria-live="polite">
      <div className="flex items-center gap-5">
        <span className={`stamp-in h-24 w-24 shrink-0 text-center font-mono text-[0.68rem] uppercase leading-tight tracking-widest ${TONE[tone]}`}>
          {r.verdict === "scam" ? <>Do not<br />open</> : r.verdict === "suspicious" ? <>Be<br />careful</> : <>Looks<br />safe</>}<br /><b className="text-base">{r.risk}</b>
        </span>
        <div>
          <p className={`blur-in font-display text-4xl leading-none ${TONE[tone]}`}>
            {r.cloak?.cloaked ? "Two-faced page." : r.hidden ? "It doesn't go where it says." : r.verdict === "scam" ? "Phishing." : r.verdict === "suspicious" ? "Be careful." : "Ends where it says."}
          </p>
          <p className="mt-2 text-ink-soft">{r.hops.length - 1} hop{r.hops.length === 2 ? "" : "s"} · really lands on <b className="text-ink">{host(r.final)}</b></p>
        </div>
      </div>

      <div>
        <p className="fig mb-3">Redirect chain</p>
        <ol className="relative space-y-2 border-l border-dashed border-white/15 pl-6">
          {r.hops.map((h, i) => {
            const bad = i === r.hops.length - 1 ? r.risk >= 60 : (r.hopFlags[i]?.risk ?? 0) >= 60;
            return (
              <li key={i} className="rise relative" style={{ "--i": i } as CSSProperties}>
                <span className={`absolute -left-[1.94rem] top-3 grid h-4 w-4 place-items-center rounded-full border ${bad ? "border-red bg-red/20" : i === r.hops.length - 1 ? "border-teal bg-teal/20" : "border-white/25 bg-paper"}`} aria-hidden />
                <div className={`rounded-xl border px-3.5 py-2.5 ${bad ? "border-red/40 bg-red/[0.05]" : "hairline bg-white/[0.02]"}`}>
                  <p className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-ink-soft">
                    {i === 0 ? "You clicked" : i === r.hops.length - 1 ? "You land on" : `Hop ${i}`}
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 normal-case tracking-normal">{h.via === "start" ? "link" : h.via === "http" ? `HTTP ${r.hops[i - 1]?.status ?? ""}` : h.via === "meta" ? "meta refresh" : "JavaScript"}</span>
                    {h.status ? <span className="ml-auto">{h.status}</span> : null}
                  </p>
                  <p className="mt-1 break-all font-mono text-[0.85rem] text-ink">{h.url}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {r.cloak && (
        <div>
          <p className="fig mb-3">Cloaking test: same link, two visitors</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ViewCard who="What a security scanner sees" v={r.cloak.bot} odd={false} />
            <ViewCard who="What a person on a phone sees" v={r.cloak.human} odd={r.cloak.cloaked} />
          </div>
          <ul className="mt-3 space-y-1.5 text-[0.95rem]">
            {!r.cloak.cloaked && <li className="flex gap-2 font-semibold text-teal"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />No cloaking: nobody is shown a hidden login, OTP or PIN form.</li>}
            {r.cloak.reasons.map((x) => (
              <li key={x} className={`flex gap-2 ${r.cloak!.cloaked ? "" : "text-ink-soft"}`}><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${r.cloak!.cloaked ? "bg-red" : "bg-white/30"}`} />{x}</li>
            ))}
          </ul>
        </div>
      )}

      {!!r.link?.signals.length && (
        <div>
          <p className="fig mb-2">Final page red flags</p>
          <ul className="space-y-1.5 text-[0.95rem]">
            {r.link.signals.map((s) => <li key={s.id} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red" /><span><b>{s.label}</b> <span className="font-pen text-lg text-red">“{s.evidence}”</span></span></li>)}
          </ul>
        </div>
      )}
      {r.notes.map((n) => <p key={n} className="text-sm text-ink-soft">{n}</p>)}
    </div>
  );
}

const SAMPLES = ["http://github.com", "http://google.com", "sbi-kyc-update.top/verify"];

export function Unmasker({ initial }: { initial?: string }) {
  const [url, setUrl] = useState(initial || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<UnmaskReport | null>(null);
  async function run(u = url) {
    if (!u.trim()) return setErr("Paste a link first.");
    setBusy(true); setErr(""); setR(null);
    try { setR(await unmaskApi(u)); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); run(); }}>
        <label htmlFor="um" className="fig">Short link, ad link, any link</label>
        <input id="um" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://bit.ly/…" inputMode="url"
          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3.5 font-mono text-[0.95rem] text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-teal focus:shadow-[0_0_0_4px_rgb(94_234_212/.12)]" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { const u = `${location.origin}/lab/go`; setUrl(u); run(u); }} className="rounded-full border border-red/40 bg-red/[0.06] px-3 py-1 font-mono text-xs text-red transition hover:border-red">demo: 3 hops + cloaked login</button>
          {SAMPLES.map((s) => <button key={s} type="button" onClick={() => { setUrl(s); run(s); }} className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-ink-soft transition hover:border-teal hover:text-ink">{s.replace(/^https?:\/\//, "")}</button>)}
        </div>
        <button disabled={busy} className="btn-primary relative mt-4 w-full overflow-hidden rounded-2xl px-5 py-3.5 disabled:cursor-progress">
          {busy ? "Following every hop…" : "Unmask this link"}
          {busy && <span className="absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.2s_linear_infinite] bg-white/30" aria-hidden />}
        </button>
      </form>
      {err && <p className="mt-4 text-red" role="alert">{err}</p>}
      {r && <UnmaskReportView r={r} />}
    </div>
  );
}

/* ---------- QR scanner ---------- */
type JsQR = (d: Uint8ClampedArray, w: number, h: number, o?: { inversionAttempts?: string }) => { data: string } | null;
declare global { interface Window { jsQR?: JsQR; BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } } }

// Accuracy: native BarcodeDetector first, then jsQR over several scales + both polarities + a contrast pass.
async function decode(src: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, w: number, h: number, thorough: boolean): Promise<string | null> {
  if (window.BarcodeDetector) {
    try { const r = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(src); if (r[0]?.rawValue) return r[0].rawValue; } catch {}
  }
  const jsQR = window.jsQR;
  if (!jsQR || !w || !h) return null;
  const c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true })!;
  const scales = thorough ? [1, 1600 / Math.max(w, h), 800 / Math.max(w, h), 2] : [Math.min(1, 720 / Math.max(w, h))];
  for (const s of [...new Set(scales.map((x) => Math.min(x, 3000 / Math.max(w, h))))]) {
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    for (const filter of thorough ? ["none", "grayscale(1) contrast(1.8)"] : ["none"]) {
      g.filter = filter; g.drawImage(src, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height);
      const hit = jsQR(d.data, d.width, d.height, { inversionAttempts: thorough ? "attemptBoth" : "dontInvert" });
      if (hit?.data) return hit.data;
    }
  }
  return null;
}

function QrResult({ raw }: { raw: string }) {
  const v: QrVerdict = analyzeQr(raw);
  const [u, setU] = useState<UnmaskReport | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { setU(null); setErr(""); if (v.url) unmaskApi(v.url).then(setU).catch((e) => setErr(e.message)); }, [raw]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mt-6">
      {v.kind !== "url" && (
        <div className="flex items-center gap-5">
          <span className={`stamp-in h-24 w-24 shrink-0 text-center font-mono text-[0.68rem] uppercase leading-tight tracking-widest ${TONE[v.tone]}`}>{v.kind === "upi" ? <>Takes<br />money</> : v.kind}<br /><b className="text-base">{v.risk}</b></span>
          <p className={`blur-in font-display text-4xl leading-none ${TONE[v.tone]}`}>{v.title}.</p>
        </div>
      )}
      {v.kind !== "url" && (
        <>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-2xl border hairline bg-white/[0.02] p-4 text-sm">
            {v.facts.map(([k, val]) => <div key={k} className="contents"><dt className="fig">{k}</dt><dd className="break-all font-mono">{val}</dd></div>)}
          </dl>
          <ul className="mt-4 space-y-1.5">{v.flags.map((f) => <li key={f} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${v.tone === "good" ? "bg-teal" : "bg-red"}`} />{f}</li>)}</ul>
        </>
      )}
      {v.kind === "url" && !u && !err && <p className="mt-2 font-mono text-sm text-ink-soft">QR opens <b className="text-ink">{v.url}</b>, following every redirect…</p>}
      {err && <p className="mt-2 text-red">{err}</p>}
      {u && <UnmaskReportView r={u} />}
    </div>
  );
}

export function QrScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [over, setOver] = useState(false);
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");

  const stop = useCallback(() => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setLive(false); }, []);
  useEffect(() => () => stop(), [stop]);
  useEffect(() => { if (window.jsQR) setReady(true); }, []);

  async function camera() {
    setErr(""); setRaw("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      const v = video.current!; v.srcObject = stream.current; await v.play(); setLive(true);
      const tick = async () => {
        if (!stream.current) return;
        const hit = v.readyState >= 2 ? await decode(v, v.videoWidth, v.videoHeight, false) : null;
        if (hit) { navigator.vibrate?.(80); setRaw(hit); stop(); return; }
        requestAnimationFrame(tick);
      };
      tick();
    } catch { setErr("Camera blocked or not available. Upload a screenshot of the QR instead."); }
  }

  async function fromFile(f?: File | null) {
    if (!f) return;
    stop(); setErr(""); setRaw("");
    const img = new Image();
    img.src = URL.createObjectURL(f);
    try {
      await img.decode();
      const hit = await decode(img, img.naturalWidth, img.naturalHeight, true);
      hit ? setRaw(hit) : setErr("No QR code found. Try a sharper, closer screenshot.");
    } catch { setErr("Couldn't read that image."); } finally { URL.revokeObjectURL(img.src); }
  }

  useEffect(() => {
    const paste = (e: ClipboardEvent) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/")); if (f) fromFile(f); };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Script src="/vendor/jsQR.js" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl border hairline bg-black ${live ? "" : "hidden"}`}>
        <video ref={video} className="h-full w-full object-cover" playsInline muted />
        <div className="qr-reticle" aria-hidden><i /><i /><i /><i /><span className="qr-laser" /></div>
        <button onClick={stop} className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm backdrop-blur">Stop</button>
      </div>
      {!live && (
        <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); fromFile(e.dataTransfer.files[0]); }}
          className={`drop-zone group relative grid cursor-pointer place-items-center gap-2 overflow-hidden rounded-3xl px-6 py-12 text-center ${over ? "over" : ""}`}>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => fromFile(e.target.files?.[0])} />
          <span className="qr-glyph" aria-hidden><i /><i /><i /><b /></span>
          <b className="font-display text-3xl font-normal">Drop, paste or pick a QR</b>
          <span className="text-sm text-ink-soft">Screenshots from WhatsApp, posters, payment requests. Decoded on your device.</span>
        </label>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={camera} disabled={!ready || live} className="btn-primary rounded-2xl px-4 py-3 disabled:opacity-50">{ready ? "Scan with camera" : "Loading scanner…"}</button>
        <button onClick={() => setRaw("upi://pay?pa=9876543210@ybl&pn=OLX%20Refund%20Desk&am=4999&tn=Receive%20your%20refund&cu=INR")} className="btn-ghost rounded-2xl px-4 py-3">Try a scam QR</button>
      </div>
      {err && <p className="mt-4 text-red" role="alert">{err}</p>}
      {raw && <QrResult raw={raw} />}
    </div>
  );
}
