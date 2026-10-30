"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Source = { source: string; status: "hit" | "clean" | "skipped"; detail?: string };
type Tone = "bad" | "warn" | "good";
const TONE_CLASS: Record<Tone, string> = { bad: "text-red", warn: "text-amber", good: "text-teal" };

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const sha256 = async (data: BufferSource) => hex(await crypto.subtle.digest("SHA-256", data));

/* ---------- Shared result card ---------- */
function Ring({ value, tone }: { value: number; tone: Tone }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(id); }, [value]);
  const C = 2 * Math.PI * 44;
  return (
    <span className={`relative grid h-24 w-24 shrink-0 place-items-center ${TONE_CLASS[tone]}`} style={{ filter: "drop-shadow(0 0 10px currentColor)" }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth="6" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <b className="font-display text-4xl font-normal text-ink">{value}</b>
    </span>
  );
}

function Stamp({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`stamp-in h-24 w-24 shrink-0 text-center font-mono text-[0.68rem] uppercase leading-tight tracking-widest ${TONE_CLASS[tone]}`}>{children}</span>;
}

function Verdict({ head, tone, title, sub, items, sources }: { head: ReactNode; tone: Tone; title: string; sub?: string; items?: ReactNode[]; sources?: Source[] }) {
  return (
    <div className="card mt-6 p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-5">
        {head}
        <div>
          <p className={`blur-in font-display text-4xl leading-none ${TONE_CLASS[tone]}`}>{title}</p>
          {sub && <p className="mt-2 text-ink-soft">{sub}</p>}
        </div>
      </div>
      {!!items?.length && (
        <ul className="mt-5 divide-y divide-white/[0.06] border-t hairline">
          {items.map((it, i) => (
            <li key={i} className="rise flex gap-3 py-3 text-[0.95rem]" style={{ "--i": i } as CSSProperties}>
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tone === "good" ? "bg-teal" : "bg-red"}`} style={{ boxShadow: "0 0 8px currentColor" }} aria-hidden />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
      {!!sources?.length && (
        <div className="mt-5 border-t border-dashed hairline pt-4">
          <p className="fig mb-2">OSINT sources checked</p>
          <ul className="grid gap-1.5 font-mono text-[0.8rem]">
            {sources.map((s) => (
              <li key={s.source} className="flex justify-between gap-4">
                <span className="text-ink-soft">{s.source}</span>
                <span className={s.status === "hit" ? "text-red" : s.status === "clean" ? "text-teal" : "text-ink-soft/60"}>
                  {s.status === "hit" ? s.detail || "flagged" : s.status === "clean" ? "not listed" : `skipped${s.detail ? `: ${s.detail.toLowerCase()}` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Busy({ busy, label, children }: { busy: boolean; label: string; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="btn-primary relative mt-4 w-full overflow-hidden rounded-2xl px-5 py-3.5 text-base disabled:cursor-progress">
      {busy ? label : children}
      {busy && <span className="absolute inset-0 animate-pulse bg-white/20" aria-hidden />}
    </button>
  );
}

/* ---------- 1. Link / phishing check ---------- */
type LinkReport = { url: string; host: string; verdict: "scam" | "suspicious" | "likely_safe"; risk: number; signals: { id: string; label: string; evidence: string }[]; sources: Source[] };
const LINK_SAMPLES = ["https://sbi-kyc-update.top/verify", "http://paypa1-secure-login.com", "https://www.onlinesbi.sbi"];

export function LinkCheck() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<LinkReport | null>(null);
  async function run(e?: React.FormEvent, u = url) {
    e?.preventDefault();
    if (!u.trim()) return setErr("Paste a link first.");
    setBusy(true); setErr(""); setR(null);
    try {
      const res = await fetch("/api/link-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: u }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Check failed");
      setR(j);
    } catch (x) { setErr(x instanceof Error ? x.message : "Check failed"); }
    finally { setBusy(false); }
  }
  const tone: Tone = r?.verdict === "scam" ? "bad" : r?.verdict === "suspicious" ? "warn" : "good";
  return (
    <div>
      <form onSubmit={run}>
        <label htmlFor="link" className="fig">Suspicious link</label>
        <input id="link" type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://sbi-kyc-update.top/verify"
          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3.5 font-mono text-[0.95rem] text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-teal focus:shadow-[0_0_0_4px_rgb(94_234_212/.12)]" />
        <div className="mt-3 flex flex-wrap gap-2">
          {LINK_SAMPLES.map((s) => (
            <button key={s} type="button" onClick={() => { setUrl(s); run(undefined, s); }} className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-ink-soft transition hover:border-teal hover:text-ink">{s.replace(/^https?:\/\//, "")}</button>
          ))}
        </div>
        <Busy busy={busy} label="Checking feeds…">Check this link</Busy>
      </form>
      {err && <p className="mt-4 text-red" role="alert">{err}</p>}
      {r && (
        <Verdict head={<Ring value={r.risk} tone={tone} />} tone={tone}
          title={r.verdict === "scam" ? "Phishing. Don't open it." : r.verdict === "suspicious" ? "Be careful." : "Looks safe."}
          sub={r.host}
          items={r.signals.length ? r.signals.map((s) => <><b>{s.label}</b> <span className="font-pen text-lg text-red">“{s.evidence}”</span></>) : ["No phishing patterns found in this address."]}
          sources={r.sources} />
      )}
    </div>
  );
}

/* ---------- 2. File / malware check ---------- */
type FileReport = { sha256: string; verdict: "malware" | "not_found"; sources: Source[] };

export function FileScan() {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const [hash, setHash] = useState("");
  const [name, setName] = useState("");
  const [r, setR] = useState<FileReport | null>(null);
  async function scan(f?: File | null) {
    if (!f) return;
    setBusy(true); setErr(""); setR(null); setName(f.name); setHash("");
    try {
      const h = await sha256(await f.arrayBuffer());
      setHash(h);
      const res = await fetch("/api/file-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sha256: h }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Check failed");
      setR(j);
    } catch (x) { setErr(x instanceof Error ? x.message : "Check failed"); }
    finally { setBusy(false); }
  }
  const bad = r?.verdict === "malware";
  return (
    <div>
      <label htmlFor="file"
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); scan(e.dataTransfer.files[0]); }}
        className={`drop-zone group grid cursor-pointer place-items-center gap-2 rounded-3xl px-6 py-14 text-center ${over ? "over" : ""}`}>
        <input id="file" type="file" className="sr-only" onChange={(e) => scan(e.target.files?.[0])} />
        <span className="grid h-14 w-14 place-items-center rounded-2xl border hairline bg-white/[0.03] transition-transform duration-500 group-hover:-translate-y-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal" aria-hidden><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
        </span>
        <b className="font-display text-3xl font-normal">Drop a file to scan</b>
        <span className="text-sm text-ink-soft">APK, PDF, images, documents. It never leaves your device.</span>
      </label>
      {(busy || hash) && (
        <div className="mt-5 rounded-2xl border hairline bg-white/[0.02] p-4 font-mono text-xs">
          <p className="text-ink-soft">{name}</p>
          <p className="mt-1 break-all text-teal">sha256 {hash || "hashing on your device…"}</p>
          <span className="mt-3 block h-1 overflow-hidden rounded-full bg-white/[0.06]"><span className={`block h-full bg-teal transition-all duration-1000 ${busy ? "w-2/3" : "w-full"}`} /></span>
        </div>
      )}
      {err && <p className="mt-4 text-red" role="alert">{err}</p>}
      {r && (
        <Verdict head={<Stamp tone={bad ? "bad" : "good"}>{bad ? <>Known<br />malware</> : <>No known<br />threat</>}</Stamp>} tone={bad ? "bad" : "good"}
          title={bad ? "Delete this file." : "Not a known threat."}
          sub={bad ? "Its fingerprint matches a known malware sample. Don't open or install it." : "Its fingerprint isn't on any malware list we checked. Still only open files you expected."}
          sources={r.sources} />
      )}
    </div>
  );
}

/* ---------- 3. Digital signature: sign & verify (ECDSA P-256) ---------- */
const ALG = { name: "ECDSA", namedCurve: "P-256" } as const;
const SIGN = { name: "ECDSA", hash: "SHA-256" } as const;
type Jwk = JsonWebKey & { crv?: string; x?: string; y?: string };
type SigFile = { format: string; alg: string; signer: string; publicKey: Jwk; file: { name: string; size: number; sha256: string }; signedAt: string; signature: string };
const fingerprint = async (k: Jwk) => (await sha256(new TextEncoder().encode(`${k.crv}:${k.x}:${k.y}`))).slice(0, 16);

async function myKeys(): Promise<{ priv: Jwk; pub: Jwk }> {
  // shortcut: key lives in localStorage (demo-grade); upgrade to a non-extractable IndexedDB CryptoKey for production
  const saved = localStorage.getItem("trustlens-keys");
  if (saved) return JSON.parse(saved);
  const kp = await crypto.subtle.generateKey(ALG, true, ["sign", "verify"]);
  const keys = { priv: await crypto.subtle.exportKey("jwk", kp.privateKey), pub: await crypto.subtle.exportKey("jwk", kp.publicKey) };
  localStorage.setItem("trustlens-keys", JSON.stringify(keys));
  return keys;
}

export function SignVerify() {
  const [mode, setMode] = useState<"verify" | "sign">("verify");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fp, setFp] = useState("");
  const [res, setRes] = useState<ReactNode>(null);
  const doc = useRef<HTMLInputElement>(null), sig = useRef<HTMLInputElement>(null), sdoc = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  useEffect(() => { myKeys().then((k) => fingerprint(k.pub)).then(setFp).catch(() => {}); }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const f = doc.current?.files?.[0], s = sig.current?.files?.[0];
    if (!f || !s) return setErr("Choose the document and its .sig file.");
    setBusy(true); setErr(""); setRes(null);
    try {
      const b: SigFile = JSON.parse(await s.text());
      if (b.format !== "trustlens-signature/1" || !b.publicKey || !b.signature) throw new Error("That .sig file isn't a TrustLens signature.");
      const key = await crypto.subtle.importKey("jwk", { ...b.publicKey, ext: true }, ALG, false, ["verify"]);
      const ok = await crypto.subtle.verify(SIGN, key, unb64(b.signature), await f.arrayBuffer());
      const kfp = await fingerprint(b.publicKey);
      const items = [<>Signed by <b>{b.signer}</b> on {new Date(b.signedAt).toLocaleString("en-IN")}</>, <>Key fingerprint <code className="font-mono text-teal">{kfp}</code></>];
      setRes(ok
        ? <Verdict head={<Stamp tone="good">Verified<br />original</Stamp>} tone="good" title="Original and unchanged." sub={`${f.name} is exactly what ${b.signer} signed.`} items={items} />
        : <Verdict head={<Stamp tone="bad">Tampered</Stamp>} tone="bad" title="Don't trust this." sub="The file was changed after signing, or the signature belongs to another file." items={items} />);
    } catch (x) { setErr(x instanceof Error ? x.message : "Couldn't read that signature."); }
    finally { setBusy(false); }
  }

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    const f = sdoc.current?.files?.[0];
    if (!name.trim()) return setErr("Add your name or organisation.");
    if (!f) return setErr("Choose a document to sign.");
    setBusy(true); setErr(""); setRes(null);
    try {
      const { priv, pub } = await myKeys();
      const data = await f.arrayBuffer();
      const s = await crypto.subtle.sign(SIGN, await crypto.subtle.importKey("jwk", priv, ALG, false, ["sign"]), data);
      const body: SigFile = { format: "trustlens-signature/1", alg: "ECDSA-P256-SHA256", signer: name.trim().slice(0, 80), publicKey: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y },
        file: { name: f.name, size: f.size, sha256: await sha256(data) }, signedAt: new Date().toISOString(), signature: b64(s) };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], { type: "application/json" }));
      a.download = `${f.name}.sig`; a.click(); URL.revokeObjectURL(a.href);
      setRes(<Verdict head={<Stamp tone="good">Signed</Stamp>} tone="good" title="Signed and sealed." sub={`Share ${f.name} together with ${f.name}.sig.`} items={[<>Signed as <b>{body.signer}</b></>, <>Key fingerprint <code className="font-mono text-teal">{fp}</code></>]} />);
    } catch (x) { setErr(x instanceof Error ? x.message : "Signing failed"); }
    finally { setBusy(false); }
  }

  const field = "mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-ink";
  return (
    <div>
      <div className="relative grid grid-cols-2 rounded-2xl border hairline bg-white/[0.03] p-1" role="group" aria-label="Verify or sign">
        <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-teal transition-transform duration-500" style={{ transform: mode === "sign" ? "translateX(100%)" : "none", transitionTimingFunction: "cubic-bezier(.3,1.45,.5,1)" }} aria-hidden />
        {(["verify", "sign"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setRes(null); setErr(""); }}
            className={`relative z-10 rounded-xl py-2.5 font-semibold capitalize transition-colors ${mode === m ? "text-[#04211d]" : "text-ink-soft hover:text-ink"}`}>{m}</button>
        ))}
      </div>
      {mode === "verify" ? (
        <form onSubmit={verify} className="mt-5">
          <label className="fig" htmlFor="vdoc">Document</label><input id="vdoc" ref={doc} type="file" className={field} />
          <label className="fig mt-4 block" htmlFor="vsig">Its signature (.sig)</label><input id="vsig" ref={sig} type="file" accept=".sig,.json" className={field} />
          <Busy busy={busy} label="Verifying…">Verify originality</Busy>
        </form>
      ) : (
        <form onSubmit={sign} className="mt-5">
          <label className="fig" htmlFor="sname">Your name or organisation</label>
          <input id="sname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="DBIT Exam Cell" className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-ink outline-none focus:border-teal" />
          <label className="fig mt-4 block" htmlFor="sdoc">Document to sign</label><input id="sdoc" ref={sdoc} type="file" className={field} />
          <Busy busy={busy} label="Signing…">Sign and download .sig</Busy>
          <p className="mt-3 text-sm text-ink-soft">Your key fingerprint <code className="font-mono text-teal">{fp || "…"}</code></p>
        </form>
      )}
      {err && <p className="mt-4 text-red" role="alert">{err}</p>}
      {res}
    </div>
  );
}
