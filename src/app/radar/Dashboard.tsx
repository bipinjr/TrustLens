"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { RadarReport, RadarSummary } from "@/lib/radar";
import { PRINCIPLES } from "@/lib/principles";

const CHANNEL: Record<string, string> = { sms: "SMS", whatsapp: "WhatsApp", call: "Phone call", email: "Email", other: "Other" };

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

// Horizontal bars: one series, one hue, value in text colour beside the bar.
function Bars({ rows, label }: { rows: { label: string; n: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <>
      <ul className="space-y-3" aria-hidden>
        {rows.map((r, i) => (
          <li key={r.label} className="group grid grid-cols-[minmax(0,9.5rem)_1fr_2.5rem] items-center gap-3 text-sm" title={`${r.label}: ${r.n}`}>
            <span className="truncate text-ink">{r.label}</span>
            <span className="relative h-2.5 rounded-full bg-white/[0.06]">
              <span className="bar-grow absolute inset-y-0 left-0 rounded-full bg-teal transition-[filter] group-hover:brightness-125" style={{ width: `${(r.n / max) * 100}%`, "--i": i } as CSSProperties} />
            </span>
            <span className="text-right font-mono text-ink-soft">{r.n}</span>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{rows.map((r) => <tr key={r.label}><th scope="row">{r.label}</th><td>{r.n}</td></tr>)}</tbody>
      </table>
    </>
  );
}

function Columns({ days }: { days: { day: string; n: number }[] }) {
  // Fill gaps so all 14 days show, oldest to newest
  const map = new Map(days.map((d) => [d.day.slice(0, 10), d.n]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), n: map.get(key) ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.n));
  return (
    <>
      <div className="flex h-44 items-end gap-1.5" aria-hidden>
        {series.map((s, i) => (
          <div key={s.key} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border hairline bg-sheet px-2 py-0.5 font-mono text-xs text-ink opacity-0 transition group-hover:opacity-100">
              {s.label}: {s.n}
            </span>
            <span className="col-grow block rounded-t-[4px] bg-teal/80 transition group-hover:bg-teal" style={{ height: `${Math.max(2, (s.n / max) * 100)}%`, "--i": i } as CSSProperties} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-ink-soft" aria-hidden>
        <span>{series[0].label}</span><span>today</span>
      </div>
      <table className="sr-only">
        <caption>Reports per day, last 14 days</caption>
        <tbody>{series.map((s) => <tr key={s.key}><th scope="row">{s.label}</th><td>{s.n}</td></tr>)}</tbody>
      </table>
    </>
  );
}

function Panel({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card reveal p-6 ${className}`}>
      <h2 className="font-semibold text-white">{title}</h2>
      {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Dashboard() {
  const [data, setData] = useState<{ summary: RadarSummary; recent: RadarReport[] } | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/radar").then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => {
        if (!alive) return;
        setData(j); setUpdated(new Date()); setError(false);
      }).catch(() => alive && setError(true));
    load();
    const id = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!data)
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        {error ? (
          <p className="card p-6 text-ink" role="alert">The Radar could not load. Check your connection and refresh the page.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4" aria-busy="true" aria-label="Loading the Scam Radar">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className={`card h-36 animate-pulse ${i > 3 ? "md:col-span-2 h-64" : ""}`} />)}
          </div>
        )}
      </div>
    );

  const s = data.summary;
  const top = s.by_type[0];
  const kpis = [
    { label: "Reports in the last 14 days", value: s.total },
    { label: "Confirmed scams", value: s.scams },
    { label: "Average risk score", value: `${s.avg_risk}/100` },
    { label: "Most reported scam", value: top?.label ?? "–", small: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
        <span className="flex items-center gap-2 font-medium text-white">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red" />
          </span>
          Live from the database
        </span>
        {updated && <span className="font-mono">updated {updated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · refreshes every 30 s</span>}
        {s.seeded > 0 && <span>Includes {s.seeded} sample reports added for the demo, marked “sample”.</span>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card reveal p-6">
            <p className="text-sm text-ink-soft">{k.label}</p>
            <p className={`mt-3 font-semibold tracking-tight text-white ${k.small ? "text-2xl" : "text-4xl tabular-nums"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Reports per day" sub="Last 14 days. Hover a bar for the count.">
          <Columns days={s.by_day} />
        </Panel>
        <Panel title="Most reported scam types" sub="Scam and suspicious verdicts only">
          <Bars rows={s.by_type} label="Most reported scam types" />
        </Panel>
        <Panel title="Which levers scammers pulled" sub="Stajano & Wilson's seven principles, counted across all tricks found">
          <Bars rows={s.by_principle.map((p) => ({ label: PRINCIPLES[p.id]?.name ?? p.id, n: p.n }))} label="Principles exploited" />
        </Panel>
        <Panel title="How scams reached people">
          <Bars rows={s.by_channel.map((c) => ({ label: CHANNEL[c.label] ?? c.label, n: c.n }))} label="Channels" />
          {s.top_domains.length > 0 && (
            <div className="mt-8 border-t hairline pt-5">
              <p className="font-semibold text-white">Never open these reported domains</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {s.top_domains.map((d) => (
                  <li key={d.label} className="rounded-lg border border-red/40 bg-red-wash px-2.5 py-1 font-mono text-sm text-red">
                    {d.label.replace(/\./g, "[.]")} <span className="text-ink-soft">×{d.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Latest reports</h2>
          <Link href="/check" className="btn-primary rounded-xl px-5 py-2.5">Got one? Check and report it</Link>
        </div>
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.recent.map((r) => (
            <li key={r.id} className="card reveal flex flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{r.scam_type}</span>
                <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${r.risk >= 65 ? "bg-red-wash text-red" : "bg-amber-wash text-amber"}`}>{r.risk}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-ink-soft">“{r.excerpt}”</p>
              <p className="mt-auto pt-4 font-mono text-xs text-ink-soft">
                {CHANNEL[r.channel] ?? r.channel} · {r.state ?? "India"} · {r.language} · {ago(r.created_at)}
                {r.is_seed && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-ink">sample</span>}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
