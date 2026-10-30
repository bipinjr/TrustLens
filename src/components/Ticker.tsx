"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RadarReport } from "@/lib/radar";

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

export function Ticker() {
  const [items, setItems] = useState<RadarReport[] | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/radar").then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => {
        if (!alive) return;
        setItems(j.recent);
        setUpdated(new Date());
        setFailed(false);
      }).catch(() => alive && setFailed(true));
    load();
    const id = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (failed && !items) return null;
  const list = items ?? [];
  return (
    <section aria-label="Latest reports on the Scam Radar" className="relative border-y hairline bg-white/[0.02]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/radar" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red" />
          </span>
          Scam Radar
        </Link>
        <div className="ticker min-w-0 flex-1 overflow-hidden" data-paused={paused}>
          {list.length > 0 && (
            <ul className="ticker-track text-sm text-ink-soft">
              {[...list, ...list].map((r, i) => (
                <li key={`${r.id}-${i}`} className="flex shrink-0 items-center gap-2" aria-hidden={i >= list.length}>
                  <span className="font-semibold text-white">{r.scam_type}</span>
                  <span>· {r.state ?? "India"} · {r.channel === "call" ? "call" : r.channel}</span>
                  <span className="font-mono text-xs text-ink-soft/70">{ago(r.created_at)}{r.is_seed ? " · sample" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={() => setPaused(!paused)} className="shrink-0 rounded-md px-2 py-1 text-xs text-ink-soft hover:text-white" aria-pressed={paused}>
          {paused ? "Play" : "Pause"}
        </button>
        {updated && (
          <span className="hidden shrink-0 font-mono text-xs text-ink-soft/70 md:inline">
            updated {updated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </section>
  );
}
