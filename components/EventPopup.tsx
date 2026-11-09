"use client";

import { ArrowRight, CalendarDays, MapPin, Award, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface PopupEvent {
  id: string; slug: string; title: string; typeLabel: string; dates: string; venue: string; summary: string;
  image?: string; cpdPoints: number; fee: string; registerHref: string; external: boolean;
}

const KEY = (id: string) => `sata-popup-${id}`;
const DAY = 24 * 60 * 60 * 1000;

// Promoted event: a wide pop-up (poster left, details right) shown once a day to visitors.
export function EventPopup({ event }: { event: PopupEvent }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = 0;
    try { seen = Number(localStorage.getItem(KEY(event.id)) ?? 0); } catch { /* storage blocked: show it */ }
    if (Date.now() - seen < DAY) return;
    const t = setTimeout(() => setOpen(true), 1400);
    return () => clearTimeout(t);
  }, [event.id]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  });

  function close() {
    setOpen(false);
    try { localStorage.setItem(KEY(event.id), String(Date.now())); } catch { /* ignore */ }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="popup-title">
      <button aria-label="Close" onClick={close} className="absolute inset-0 bg-[#06233d]/70 backdrop-blur-sm" />
      <div className="rise relative grid max-h-[92svh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/40 md:grid-cols-[0.95fr_1.05fr]">
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white"><X className="size-5" /></button>

        {/* Poster */}
        <div className="relative max-h-[38svh] min-h-48 overflow-hidden bg-gradient-to-br from-deep to-blue md:max-h-none">
          {event.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={event.image} alt={`${event.title} poster`} className="absolute inset-0 size-full object-cover" />
            : <div className="absolute inset-0 grid place-items-center p-8 text-center text-2xl font-bold text-white">{event.title}</div>}
        </div>

        {/* Details */}
        <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
          <span className="w-fit rounded-full bg-vigil/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-vigil">{event.typeLabel} · Register now</span>
          <h2 id="popup-title" className="mt-4 text-2xl font-bold leading-tight tracking-tight text-deep sm:text-[28px]">{event.title}</h2>
          <ul className="mt-4 grid gap-2 text-sm text-ink">
            <li className="flex items-center gap-2.5"><CalendarDays className="size-4 shrink-0 text-blue" />{event.dates}</li>
            <li className="flex items-center gap-2.5"><MapPin className="size-4 shrink-0 text-blue" />{event.venue}</li>
            {event.cpdPoints > 0 && <li className="flex items-center gap-2.5"><Award className="size-4 shrink-0 text-blue" />{event.cpdPoints} CPD points · {event.fee}</li>}
          </ul>
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted">{event.summary}</p>
          <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row">
            {event.external
              ? <a href={event.registerHref} target="_blank" rel="noreferrer" onClick={close} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep">Register now <ArrowRight className="size-4" /></a>
              : <Link href={event.registerHref} onClick={close} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep">Register now <ArrowRight className="size-4" /></Link>}
            <button onClick={close} className="rounded-full border border-line px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-blue hover:text-blue">Continue to the website</button>
          </div>
        </div>
      </div>
    </div>
  );
}
