import { useState, type CSSProperties } from "react";
import type { Analysis } from "@/lib/shared";
import { PRINCIPLES } from "@/lib/principles";
import { Confetti } from "./fx";

const SPEECH_LANG: Record<string, string> = {
  English: "en-IN", Hindi: "hi-IN", Tamil: "ta-IN", Telugu: "te-IN", Bengali: "bn-IN",
  Marathi: "mr-IN", Kannada: "kn-IN", Malayalam: "ml-IN", Gujarati: "gu-IN",
  Hinglish: "hi-IN", Punjabi: "pa-IN", Odia: "or-IN", Urdu: "ur-IN", Assamese: "as-IN",
};

export const VERDICT = {
  scam: { stamp: "Scam", pen: "var(--color-red)", wash: "var(--color-red-wash)" },
  suspicious: { stamp: "Be careful", pen: "var(--color-amber)", wash: "var(--color-amber-wash)" },
  likely_safe: { stamp: "Looks genuine", pen: "var(--color-green)", wash: "var(--color-green-wash)" },
} as const;

const clean = (q: string) => q.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();

function markUp(text: string, quotes: string[]) {
  const lower = text.toLowerCase();
  const ranges: [number, number, number][] = [];
  quotes.forEach((q, i) => {
    const needle = clean(q).toLowerCase();
    if (needle.length < 3) return;
    const at = lower.indexOf(needle);
    if (at >= 0) ranges.push([at, at + needle.length, i]);
  });
  ranges.sort((a, b) => a[0] - b[0]);
  const out: { s: string; n?: number }[] = [];
  let pos = 0;
  for (const [a, b, i] of ranges) {
    if (a < pos) continue;
    if (a > pos) out.push({ s: text.slice(pos, a) });
    out.push({ s: text.slice(a, b), n: i });
    pos = b;
  }
  if (pos < text.length) out.push({ s: text.slice(pos) });
  return out;
}

const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal","Other"];

function ReportToRadar({ result, text, language, source }: { result: Analysis; text: string; language: string; source: "text" | "voice" | "image" }) {
  const [channel, setChannel] = useState(source === "voice" ? "call" : "sms");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function send() {
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text, language, channel, state: state || undefined,
          scamType: result.scamType, verdict: result.verdict, risk: result.risk,
          principles: result.tactics.map((t) => t.principle).filter(Boolean),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }
  if (status === "sent")
    return (
      <p className="card mt-6 flex flex-wrap items-center gap-3 px-5 py-4 text-ink" role="status">
        <span className="h-2 w-2 rounded-full bg-green shadow-[0_0_10px_var(--color-green)]" aria-hidden />
        Reported. Thank you, this now warns others on the <a href="/radar" className="font-semibold text-white underline underline-offset-4">Scam Radar</a>.
      </p>
    );
  return (
    <div className="card mt-6 flex flex-wrap items-end gap-3 px-5 py-4">
      <div className="mr-auto">
        <p className="font-semibold text-white">Warn everyone: add it to the Scam Radar</p>
        <p className="text-sm text-ink-soft">Phone numbers, OTPs and account numbers are removed before saving.</p>
      </div>
      <label className="text-sm text-ink-soft">
        Came by
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="mt-1 block rounded-lg border border-white/12 bg-sheet px-2.5 py-2 text-ink">
          <option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="call">Phone call</option><option value="email">Email</option><option value="other">Other</option>
        </select>
      </label>
      <label className="text-sm text-ink-soft">
        Your state (optional)
        <select value={state} onChange={(e) => setState(e.target.value)} className="mt-1 block rounded-lg border border-white/12 bg-sheet px-2.5 py-2 text-ink">
          <option value="">Prefer not to say</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <button onClick={send} disabled={status === "sending"} className="btn-primary rounded-xl px-5 py-2.5 disabled:opacity-60">
        {status === "sending" ? "Reporting…" : "Report to Scam Radar"}
      </button>
      {status === "error" && <p role="alert" className="w-full text-sm font-semibold text-red">The report did not go through. Try again.</p>}
    </div>
  );
}

export function Result({
  result, text, language, source, onPractice,
}: {
  result: Analysis;
  text: string;
  language: string;
  source: "text" | "voice" | "image";
  onPractice: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const v = VERDICT[result.verdict];
  const handwritten = language === "English" ? "font-pen" : "font-body";
  const segments = markUp(text, result.tactics.map((t) => t.quote));

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking) return setSpeaking(false);
    const parts = [result.summary, result.whatTheyWant, ...result.tactics.map((t) => `${t.name}. ${t.explanation}`), ...result.safeActions, result.lesson].filter(Boolean);
    const u = new SpeechSynthesisUtterance(parts.join(". "));
    u.lang = SPEECH_LANG[language] ?? "en-IN";
    u.rate = 0.92;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  const share = encodeURIComponent(
    `⚠️ ${v.stamp.toUpperCase()} (${result.risk}/100 risk) – checked with TrustLens\n\n` +
      `${result.summary}\n\nRemember: ${result.lesson}\n\n` +
      `Lost money? Call 1930 or report at cybercrime.gov.in\nCheck any message: ${typeof window !== "undefined" ? window.location.origin : ""}`,
  );

  return (
    <div className={`result-in ${result.verdict === "scam" ? "shake" : ""}`} style={{ "--pen": v.pen } as CSSProperties}>
      {result.verdict === "scam" && <div className="flash" aria-hidden />}
      {result.verdict === "likely_safe" && <Confetti colors={["#0f766e", "#14b8a6", "#5eead4", "#f59e0b"]} />}
      {/* Verdict */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="stamp px-5 py-2 text-3xl font-bold uppercase sm:text-4xl" style={{ color: v.pen }}>
          {v.stamp}
        </div>
        <div className="flex items-center gap-3" style={{ color: v.pen }}>
          <div className="grade-ring flex h-20 w-20 items-center justify-center">
            <span className="font-pen text-5xl font-bold leading-none">{result.risk}</span>
          </div>
          <p className="leading-tight text-ink-soft">risk<br />out of 100</p>
        </div>
        <p className="w-full text-ink-soft sm:w-auto sm:flex-1 sm:text-right">
          {source === "voice" ? "Voice clip · " : source === "image" ? "Screenshot · " : ""}{result.scamType}
        </p>
      </section>

      <p className="mt-7 max-w-3xl text-2xl font-semibold leading-snug text-white sm:text-[1.75rem]">{result.summary}</p>
      {result.whatTheyWant && (
        <p className="mt-2 max-w-3xl text-lg"><span className="text-ink-soft">What they&apos;re after: </span>{result.whatTheyWant}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {result.verdict !== "likely_safe" && (
          <a href="tel:1930" className="btn-primary rounded-2xl px-5 py-3">
            Lost money? Call 1930 now
          </a>
        )}
        <a
          href={`https://wa.me/?text=${share}`} target="_blank" rel="noreferrer"
          className="rounded-2xl bg-teal px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0d665f]"
        >
          Warn my family on WhatsApp
        </a>
        <button onClick={speak} aria-pressed={speaking} className="btn-ghost rounded-2xl px-5 py-3 font-semibold">
          {speaking ? "Stop reading" : "Read this to me"}
        </button>
        {result.tactics.length > 0 && (
          <button onClick={onPractice} className="rounded-2xl border border-dashed border-white/30 px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:border-white/60">
            Practise spotting these tricks
          </button>
        )}
      </div>

      {result.verdict !== "likely_safe" && <ReportToRadar result={result} text={text} language={language} source={source} />}

      {/* Marked-up message */}
      {result.tactics.length > 0 && (
        <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]" aria-label="The message, marked up">
          <div className="ruled self-start rounded-2xl py-6 pl-14 pr-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_60px_-20px_rgba(255,75,62,0.35)] sm:pr-8 lg:sticky lg:top-24">
            <p className="mb-3 -ml-1 font-pen text-xl text-ink-soft">
              {source === "voice" ? "What the caller said" : source === "image" ? "Text from your screenshot" : "The message you received"}
            </p>
            <div className="bubble max-w-xl bg-page-bubble px-4 py-3" style={{ "--bubble-bg": "var(--color-page-bubble)" } as CSSProperties}>
              <p className="whitespace-pre-wrap text-lg leading-[2]">
                {segments.map((seg, i) =>
                  seg.n === undefined ? (
                    <span key={i}>{seg.s}</span>
                  ) : (
                    <span key={i} className="pen-mark draw" style={{ "--i": seg.n } as CSSProperties}>
                      {seg.s}<span className="pen-num" aria-label={`trick ${seg.n + 1}`}>{seg.n + 1}</span>
                    </span>
                  ),
                )}
              </p>
            </div>
          </div>

          <ol className="space-y-6 lg:pt-2">
            {result.tactics.map((t, i) => {
              const p = t.principle ? PRINCIPLES[t.principle] : null;
              return (
                <li key={i} className="pen-note flex gap-3" style={{ "--i": i } as CSSProperties}>
                  <span className="font-pen text-3xl font-bold leading-none" style={{ color: v.pen }} aria-hidden>{i + 1}</span>
                  <div>
                    <p className={`${handwritten} text-2xl font-bold leading-tight`} style={{ color: v.pen }}>{t.name}</p>
                    {t.explanation && <p className="mt-1 text-ink-soft">{t.explanation}</p>}
                    {p && (
                      <a
                        href="/learn"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-sm text-ink hover:border-white/40"
                        title={p.long}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.pen }} aria-hidden />
                        Exploits: <b>{p.name}</b>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        {result.safeActions.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-white">What to do now</h3>
            <ul className="mt-3 space-y-3">
              {result.safeActions.map((a, i) => (
                <li key={i} className="flex gap-3 text-lg">
                  <span className="font-pen text-2xl font-bold leading-none text-green" aria-hidden>✓</span>
                  <span>{a}</span>
                </li>
              ))}
              {source === "voice" && (
                <li className="flex gap-3 text-lg">
                  <span className="font-pen text-2xl font-bold leading-none text-green" aria-hidden>✓</span>
                  <span>Voices can be cloned with AI. Agree on a family safe word, and hang up and call back on the number you already have.</span>
                </li>
              )}
            </ul>
          </section>
        )}
        {result.lesson && (
          <section className="card relative p-6">
            <h3 className="text-xl font-semibold text-white">Remember this for next time</h3>
            <p className={`${handwritten} mt-3 text-[1.9rem] leading-snug`} style={{ color: v.pen }}>{result.lesson}</p>
          </section>
        )}
      </div>

      <details className="mt-12 border-t hairline pt-5">
        <summary className="cursor-pointer font-bold text-ink-soft hover:text-ink">How we checked this message</summary>
        <p className="mt-3 max-w-3xl text-ink-soft">
          Two separate checks. A rule engine looks for hard evidence like fake bank links, hidden short links, requests for
          your OTP or PIN, and threats. Then an AI model reads the message for intent and names the tricks. The rules can only
          raise the AI&apos;s score, never lower it.
        </p>
        <div className="mt-4 grid max-w-xl gap-3">
          {([["AI reading", result.aiScore], ["Rule engine", result.ruleScore]] as const).map(([label, n]) => (
            <div key={label} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
              <span>{label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-red" style={{ width: `${n ?? 0}%` }} />
              </span>
              <span className="text-right font-bold">{n ?? "–"}</span>
            </div>
          ))}
        </div>
        {result.signals.length > 0 ? (
          <ul className="mt-5 space-y-1.5">
            {result.signals.map((s) => (
              <li key={s.id}><span className="font-bold">{s.label}:</span> <span className="text-ink-soft">{s.evidence}</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-ink-soft">The rule engine found no hard evidence in this message.</p>
        )}
        {result.model && <p className="mt-4 text-sm text-ink-soft">Model: {result.model} on Groq</p>}
      </details>
    </div>
  );
}
