"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Tactic } from "@/lib/shared";
import { CITATIONS, PRINCIPLES, type PrincipleId } from "@/lib/principles";
import { Confetti } from "./fx";

const RANKS = [
  { name: "Rookie", min: 0 },
  { name: "Scam Spotter", min: 3 },
  { name: "Fraud Detective", min: 8 },
  { name: "Cyber Guardian", min: 15 },
];
type Stats = { rounds: number; caught: number; streak: number; best: number };
const KEY = "trustlens-practice";
function loadStats(): Stats {
  try { return { rounds: 0, caught: 0, streak: 0, best: 0, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { rounds: 0, caught: 0, streak: 0, best: 0 }; }
}
function saveStats(st: Stats) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }

type Trick = { quote: string; principle?: PrincipleId; why: string };
type Drill = { message: string; tricks: Trick[] };

// Split into word tokens (keeping whitespace) and find which tokens each trick's quote covers.
function tokenize(message: string, tricks: Trick[]) {
  const tokens: { s: string; start: number; word: boolean }[] = [];
  for (const m of message.matchAll(/\S+|\s+/g)) tokens.push({ s: m[0], start: m.index!, word: /\S/.test(m[0]) });
  const lower = message.toLowerCase();
  const owner = new Array(tokens.length).fill(-1);
  tricks.forEach((t, ti) => {
    const q = t.quote.replace(/^["'“”]+|["'“”]+$/g, "").trim().toLowerCase();
    const at = q.length >= 2 ? lower.indexOf(q) : -1;
    if (at < 0) return;
    tokens.forEach((tok, i) => {
      if (tok.word && tok.start < at + q.length && tok.start + tok.s.length > at && owner[i] === -1) owner[i] = ti;
    });
  });
  return { tokens, owner };
}

export function Trainer({ seed, language }: { seed?: Tactic[]; language: string }) {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>({ rounds: 0, caught: 0, streak: 0, best: 0 });
  const [party, setParty] = useState(0);
  useEffect(() => setStats(loadStats()), []);

  async function newDrill() {
    setLoading(true);
    setError("");
    setRevealed(false);
    setPicked(new Set());
    try {
      const res = await fetch("/api/train", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ principles: seed?.map((t) => t.principle).filter(Boolean) ?? [], language }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Couldn't make a practice message. Try again.");
      setDrill(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const parsed = drill ? tokenize(drill.message, drill.tricks) : null;
  const findable = drill ? drill.tricks.map((_, i) => parsed!.owner.includes(i)) : [];
  const caught = drill ? drill.tricks.map((_, ti) => parsed!.owner.some((o, i) => o === ti && picked.has(i))) : [];
  const total = findable.filter(Boolean).length;
  const score = caught.filter(Boolean).length;
  const falseTaps = parsed ? [...picked].filter((i) => parsed.owner[i] === -1).length : 0;

  function reveal() {
    setRevealed(true);
    const perfect = total > 0 && score === total && falseTaps === 0;
    const next = { rounds: stats.rounds + 1, caught: stats.caught + score, streak: perfect ? stats.streak + 1 : 0, best: 0 };
    next.best = Math.max(stats.best, next.streak);
    setStats(next);
    saveStats(next);
    if (perfect) setParty(Date.now());
  }
  const rankIdx = RANKS.reduce((acc, r, i) => (stats.caught >= r.min ? i : acc), 0);
  const nextRank = RANKS[rankIdx + 1];
  const progress = nextRank ? (stats.caught - RANKS[rankIdx].min) / (nextRank.min - RANKS[rankIdx].min) : 1;

  return (
    <section id="practice" className="relative scroll-mt-20 border-y hairline bg-night py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="reveal">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"><span className="text-gradient">Train your eye</span></h2>
          <p className="mt-4 text-lg text-ink-soft">
            Spotting a scam is a skill. Researchers found that practising on a harmless, weakened example of a manipulation
            trick helps people resist it later, even when the real one is worded differently. They call it a
            psychological vaccine.
          </p>
          <p className="mt-4 text-ink-soft">
            Tap the words you think are the trap. Then check your answers.
          </p>
          <p className="mt-6 text-sm text-ink-soft">
            Based on{" "}
            <a className="underline hover:text-white" href={CITATIONS.inoculation.url} target="_blank" rel="noreferrer">{CITATIONS.inoculation.label}</a>{" "}
            and{" "}
            <a className="underline hover:text-white" href={CITATIONS.prebunking.url} target="_blank" rel="noreferrer">{CITATIONS.prebunking.label}</a>.
            Those studies tested misinformation; we apply the same method to scams.
          </p>
          <button
            onClick={newDrill} disabled={loading}
            className="btn-primary mt-8 rounded-2xl px-6 py-3.5 text-lg disabled:opacity-60"
          >
            {loading ? "Writing a practice message…" : drill ? "Give me another one" : seed?.length ? "Practise the tricks you just saw" : "Give me a practice message"}
          </button>
          {error && <p role="alert" className="mt-4 font-bold text-red">{error}</p>}
          {party > 0 && <Confetti key={party} />}
          {stats.rounds > 0 && (
            <div className="card pop mt-8 p-5" aria-live="polite">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-ink-soft">Your rank</p>
                <p className="font-mono text-sm text-ink-soft">streak {stats.streak} · best {stats.best}</p>
              </div>
              <p key={RANKS[rankIdx].name} className="pop mt-1 font-pen text-4xl font-bold text-red">{RANKS[rankIdx].name}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="rank-bar h-full rounded-full bg-teal" style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {stats.caught} tricks caught in {stats.rounds} round{stats.rounds > 1 ? "s" : ""}
                {nextRank ? ` · ${nextRank.min - stats.caught} more to ${nextRank.name}` : " · top rank reached"}
              </p>
            </div>
          )}
        </div>

        <div className="reveal">
          {!drill ? (
            <div className="flex h-full min-h-[18rem] items-center justify-center rounded-3xl border-2 border-dashed border-white/20 p-8 text-center text-ink-soft">
              <p className="max-w-sm text-lg">A made-up practice message will appear here. Nothing in it is real.</p>
            </div>
          ) : (
            <div className="card p-6 text-ink sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-amber-wash px-3 py-1 text-sm font-bold text-amber">Practice message · made up</span>
                {revealed && (
                  <span className="font-pen text-3xl font-bold text-red" aria-live="polite">
                    {score === total && !falseTaps ? "Perfect! " : ""}{score} / {total} caught{falseTaps ? `, ${falseTaps} extra` : ""}
                  </span>
                )}
              </div>
              <p className="mt-5 text-xl leading-[2.1]" style={{ "--pen": "var(--color-red)" } as CSSProperties}>
                {parsed!.tokens.map((tok, i) => {
                  if (!tok.word) return <span key={i}>{tok.s}</span>;
                  const on = picked.has(i);
                  const owner = parsed!.owner[i];
                  const revealMark = revealed && owner >= 0;
                  return (
                    <button
                      key={i}
                      disabled={revealed}
                      onClick={() => setPicked((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                      aria-pressed={on}
                      className={`rounded px-0.5 transition-colors ${on ? "bg-white text-night" : "hover:bg-white/10"} ${revealMark ? "pen-mark" : ""} ${revealed && on && owner === -1 ? "line-through decoration-ink-soft" : ""}`}
                    >
                      {tok.s}
                      {revealMark && parsed!.owner[i + 2] !== owner && parsed!.owner[i + 1] !== owner && <span className="pen-num">{owner + 1}</span>}
                    </button>
                  );
                })}
              </p>
              {!revealed ? (
                <button onClick={reveal} disabled={!picked.size} className="mt-6 rounded-2xl bg-white px-6 py-3 font-semibold text-night transition hover:bg-white/90 disabled:opacity-40">
                  Check my answers
                </button>
              ) : (
                <ol className="mt-6 space-y-4 border-t hairline pt-5">
                  {drill.tricks.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-pen text-3xl font-bold leading-none text-red">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-white">
                          {caught[i] ? "✓ You caught it" : findable[i] ? "✗ Missed" : "Hidden trick"}
                          {t.principle && <span className="font-normal text-ink-soft"> · {PRINCIPLES[t.principle].name}</span>}
                        </p>
                        <p className="text-ink-soft">{t.why}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
