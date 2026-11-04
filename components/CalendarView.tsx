"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CalEntry } from "@/lib/types";

const TZ = "Africa/Dar_es_Salaam";
const keyOf = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso)));
const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TONE: Record<string, { chip: string; dot: string; label: string }> = {
  event: { chip: "bg-blue text-white", dot: "bg-blue", label: "Events" },
  deadline: { chip: "bg-vigil text-white", dot: "bg-vigil", label: "Deadlines" },
  meeting: { chip: "bg-slate-700 text-white", dot: "bg-slate-700", label: "Meetings" },
  training: { chip: "bg-emerald-600 text-white", dot: "bg-emerald-600", label: "Training" },
  holiday: { chip: "bg-violet-600 text-white", dot: "bg-violet-600", label: "Observances" },
  other: { chip: "bg-amber-500 text-white", dot: "bg-amber-500", label: "Other dates" },
};

const fmtDay = (key: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(key + "T00:00:00Z"));
const fmtTime = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? "All day" : new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso)));

function EntryRow({ e }: { e: CalEntry }) {
  const tone = TONE[e.kind];
  const inner = (
    <>
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${tone.dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-deep">{e.title}{e.draft && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">DRAFT</span>}{e.sample && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">SAMPLE</span>}{e.membersOnly && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">MEMBERS</span>}</span>
        <span className="block text-xs text-muted">{e.label} · {fmtTime(e.start)}{e.place ? ` · ${e.place}` : ""}</span>
      </span>
      {e.href && <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted" />}
    </>
  );
  const cls = "flex gap-3 rounded-lg p-3 transition hover:bg-mist";
  if (!e.href) return <div className={cls}>{inner}</div>;
  return e.external ? <a href={e.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a> : <Link href={e.href} className={cls}>{inner}</Link>;
}

export default function CalendarView({ entries, icsHref = "/api/calendar.ics", initialKey }: { entries: CalEntry[]; icsHref?: string; initialKey: string }) {
  const [view, setView] = useState<"month" | "agenda" | "year">("month");
  const [y, setY] = useState(Number(initialKey.slice(0, 4)));
  const [m, setM] = useState(Number(initialKey.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string>(initialKey);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const today = initialKey;

  const visible = useMemo(() => entries.filter((e) => !hidden.has(e.kind)), [entries, hidden]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEntry[]>();
    for (const e of visible) {
      const s = keyOf(e.start);
      const en = keyOf(e.end ?? e.start);
      const d = new Date(s + "T00:00:00Z");
      for (let i = 0; i < 40; i++) {
        const k = d.toISOString().slice(0, 10);
        if (k > en) break;
        map.set(k, [...(map.get(k) ?? []), e]);
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return map;
  }, [visible]);

  const move = (d: number) => { const t = new Date(Date.UTC(y, m + d, 1)); setY(t.getUTCFullYear()); setM(t.getUTCMonth()); };
  const toToday = () => { setY(Number(today.slice(0, 4))); setM(Number(today.slice(5, 7)) - 1); setSelected(today); };

  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => { const n = i - lead + 1; return n >= 1 && n <= days ? `${y}-${pad(m + 1)}-${pad(n)}` : null; });
  const selList = byDay.get(selected) ?? [];

  const yearEntries = visible.filter((e) => keyOf(e.start).startsWith(String(y)) || keyOf(e.end ?? e.start).startsWith(String(y)));
  const agenda = MONTHS.map((name, idx) => ({ name, idx, items: yearEntries.filter((e) => keyOf(e.start).slice(5, 7) === pad(idx + 1) && keyOf(e.start).startsWith(String(y))) })).filter((g) => g.items.length);

  const tab = (v: typeof view, label: string) => <button onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${view === v ? "bg-deep text-white" : "text-deep hover:bg-mist"}`}>{label}</button>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => (view === "year" || view === "agenda" ? setY(y - 1) : move(-1))} aria-label="Previous" className="grid size-10 place-items-center rounded-md border border-line hover:border-blue hover:text-blue"><ChevronLeft className="size-5" /></button>
          <h2 className="min-w-44 text-center font-display text-xl font-bold text-deep">{view === "month" ? `${MONTHS[m]} ${y}` : y}</h2>
          <button onClick={() => (view === "year" || view === "agenda" ? setY(y + 1) : move(1))} aria-label="Next" className="grid size-10 place-items-center rounded-md border border-line hover:border-blue hover:text-blue"><ChevronRight className="size-5" /></button>
          <button onClick={toToday} className="ml-1 rounded-md border border-line px-3.5 py-2 text-sm font-semibold text-deep hover:border-blue hover:text-blue">Today</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="Calendar view">{tab("month", "Month")}{tab("agenda", "Agenda")}{tab("year", "Year")}</div>
          <a href={icsHref} className="inline-flex items-center gap-2 rounded-md border border-line px-3.5 py-2.5 text-sm font-semibold text-deep hover:border-blue hover:text-blue" title="Add to Google, Apple or Outlook calendar"><Download className="size-4" /><span className="hidden sm:inline">Add to my calendar</span></a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by type">
        {Object.entries(TONE).map(([k, t]) => (
          <button key={k} onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; })} aria-pressed={!hidden.has(k)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${hidden.has(k) ? "border-line text-muted line-through" : "border-line bg-white text-deep"}`}>
            <span className={`size-2.5 rounded-full ${t.dot}`} />{t.label}
          </button>
        ))}
      </div>

      {view === "month" && (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="grid grid-cols-7 border-b border-line bg-mist text-center text-[11px] font-bold uppercase tracking-wider text-muted">{DOW.map((d) => <div key={d} className="py-2.5">{d}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((k, i) => {
                if (!k) return <div key={i} className="min-h-14 border-b border-r border-line bg-mist/40 sm:min-h-28" />;
                const list = byDay.get(k) ?? [];
                const isToday = k === today;
                return (
                  <button key={k} onClick={() => setSelected(k)} aria-label={`${fmtDay(k, { day: "numeric", month: "long" })}, ${list.length} entries`} className={`min-h-14 border-b border-r border-line p-1 text-left align-top transition hover:bg-blue/5 sm:min-h-28 sm:p-1.5 ${selected === k ? "bg-blue/10" : ""}`}>
                    <span className={`grid size-6 place-items-center rounded-full text-xs font-bold sm:size-7 sm:text-sm ${isToday ? "bg-vigil text-white" : "text-deep"}`}>{Number(k.slice(8))}</span>
                    <span className="mt-1 hidden space-y-0.5 sm:block">
                      {list.slice(0, 2).map((e) => <span key={e.id + k} className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${TONE[e.kind].chip}`}>{e.title}</span>)}
                      {list.length > 2 && <span className="block px-1 text-[11px] font-semibold text-muted">+{list.length - 2} more</span>}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-0.5 sm:hidden">{list.slice(0, 3).map((e) => <span key={e.id + k} className={`size-1.5 rounded-full ${TONE[e.kind].dot}`} />)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="rounded-lg border border-line bg-white p-4 lg:sticky lg:top-28 lg:h-fit">
            <div className="px-1 text-[11px] font-bold uppercase tracking-widest text-blue">{fmtDay(selected, { weekday: "long" })}</div>
            <div className="px-1 font-display text-xl font-bold text-deep">{fmtDay(selected, { day: "numeric", month: "long", year: "numeric" })}</div>
            <div className="mt-3">{selList.length === 0 ? <p className="px-1 text-sm text-muted">Nothing scheduled.</p> : selList.map((e) => <EntryRow key={e.id} e={e} />)}</div>
          </aside>
        </div>
      )}

      {view === "agenda" && (
        <div className="mt-5 space-y-8">
          {agenda.length === 0 && <p className="rounded-lg bg-mist p-6 text-muted">No dates in {y}.</p>}
          {agenda.map((g) => (
            <section key={g.name}>
              <h3 className="border-b border-line pb-2 font-display text-lg font-bold text-deep">{g.name} {y}</h3>
              <ul className="mt-2 divide-y divide-line">
                {g.items.map((e) => { const k = keyOf(e.start); return (
                  <li key={e.id} className="flex items-start gap-4 py-2">
                    <div className="w-14 shrink-0 pt-3 text-center"><div className="font-display text-2xl font-bold leading-none text-deep">{Number(k.slice(8))}</div><div className="text-[10px] font-bold uppercase text-blue">{fmtDay(k, { weekday: "short" })}</div></div>
                    <div className="min-w-0 flex-1"><EntryRow e={e} /></div>
                  </li>
                ); })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {view === "year" && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MONTHS.map((name, idx) => {
            const f = new Date(Date.UTC(y, idx, 1));
            const l = (f.getUTCDay() + 6) % 7;
            const n = new Date(Date.UTC(y, idx + 1, 0)).getUTCDate();
            const count = [...byDay.keys()].filter((k) => k.startsWith(`${y}-${pad(idx + 1)}`)).length;
            return (
              <button key={name} onClick={() => { setM(idx); setView("month"); }} className="rounded-lg border border-line bg-white p-4 text-left transition hover:border-blue hover:shadow-md">
                <div className="flex items-baseline justify-between"><span className="font-display text-base font-bold text-deep">{name}</span><span className="text-xs text-muted">{count ? `${count} day${count > 1 ? "s" : ""}` : ""}</span></div>
                <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[10px] text-muted" aria-hidden>
                  {Array.from({ length: Math.ceil((l + n) / 7) * 7 }, (_, i) => {
                    const d = i - l + 1;
                    if (d < 1 || d > n) return <span key={i} />;
                    const k = `${y}-${pad(idx + 1)}-${pad(d)}`;
                    const list = byDay.get(k);
                    return <span key={i} className={`mx-auto grid size-5 place-items-center rounded-full ${k === today ? "bg-vigil font-bold text-white" : list ? `${TONE[list[0].kind].dot} font-bold text-white` : ""}`}>{d}</span>;
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
