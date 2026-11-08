"use client";

import { ArrowRight, ChevronLeft, ChevronRight, ChevronsDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Slide { image: string; caption: string; text?: string; cta?: string; href?: string }

// Where each known photograph is framed so faces are never cut off. Admin-uploaded photos default to centre-top.
const FOCUS: Record<string, string> = {
  "mbeya-2026": "50% 58%",
  "masterclass-2025": "42% 38%",
  "conference-2025": "50% 55%",
  "getty_rf_surgery": "50% 50%",
};
const focusOf = (src: string) => Object.entries(FOCUS).find(([k]) => src.includes(k))?.[1] ?? "50% 40%";

const SLIDE_MS = 7500;
const STATS: [string, string][] = [["200+", "Conference delegates"], ["12", "Exhibitors, Mbeya 2026"], ["3", "Global partners"], ["2002", "Year registered"]];

// Full-bleed photograph with a transparent gradient and glass controls laid over it.
// Slow zoom, crossfade, timed progress; pauses on interaction and respects reduced motion.
export default function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), SLIDE_MS);
    return () => clearTimeout(t);
  }, [paused, n, i]);

  const s = slides[i] ?? slides[0];
  const go = (d: number) => { setPaused(true); setI((v) => (v + d + n) % n); };

  return (
    <section data-hero className="relative isolate overflow-hidden bg-deep text-white" aria-roledescription="carousel" aria-label="Featured stories">
      <div className="relative flex min-h-[calc(100svh-76px)] flex-col sm:min-h-[min(calc(100svh-76px),820px)]">
        {/* Photographs, full bleed */}
        <div className="absolute inset-0 -z-10">
          {slides.map((sl, idx) => (
            <Image key={sl.image + idx} src={sl.image} alt={idx === i ? sl.caption : ""} fill priority={idx === 0} quality={85} sizes="100vw"
              style={{ objectPosition: focusOf(sl.image) }}
              className={`object-cover transition-opacity duration-[1400ms] ease-out ${idx === i ? "hero-zoom opacity-100" : "opacity-0"}`} unoptimized={sl.image.startsWith("/api/")} />
          ))}
          {/* Transparent gradients: legible type on the left, photograph stays vivid on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-deep/90 via-deep/55 to-deep/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-transparent to-deep/30" />
        </div>

        {/* Message */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-6 pt-14 sm:pt-20">
          <div key={i} className="rise max-w-2xl" aria-live="polite">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-sky-300" />
              {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <h1 className="mt-4 text-balance text-[1.75rem] font-extrabold leading-[1.1] tracking-tight drop-shadow-sm sm:text-4xl lg:text-5xl">{s.caption}</h1>
            {s.text && <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {s.href && (
                <Link href={s.href} className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-deep shadow-xl shadow-black/20 transition hover:bg-sky-100">
                  {s.cta ?? "Learn more"} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              )}
              {s.href !== "/membership/apply" && (
                <Link href="/membership/apply" className="rounded-full border border-white/40 bg-white/10 px-7 py-4 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20">Join SATA</Link>
              )}
            </div>
          </div>
        </div>

        {/* Controls and key facts, as glass over the photograph */}
        <div className="mx-auto w-full max-w-7xl px-5 pb-6 sm:pb-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-1 gap-2 sm:max-w-md" role="tablist" aria-label="Choose a story">
              {slides.map((sl, idx) => (
                <button key={sl.image + idx} role="tab" aria-selected={idx === i} aria-label={`Story ${idx + 1}: ${sl.caption}`} onClick={() => { setPaused(true); setI(idx); }} className="group flex-1 py-3">
                  <span className="relative block h-1 overflow-hidden rounded-full bg-white/30 transition group-hover:bg-white/50">
                    {idx === i && <span key={`${i}-${paused}`} className={`absolute inset-y-0 left-0 rounded-full bg-white ${paused ? "w-full" : "hero-progress"}`} />}
                    {idx < i && <span className="absolute inset-0 rounded-full bg-white/80" />}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => go(-1)} aria-label="Previous story" className="grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition hover:bg-white/25"><ChevronLeft className="size-5" /></button>
              <button onClick={() => go(1)} aria-label="Next story" className="grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition hover:bg-white/25"><ChevronRight className="size-5" /></button>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-xl sm:grid-cols-4">
            {STATS.map(([a, b], idx) => (
              <div key={b} className={`px-5 py-4 ${idx > 0 ? "sm:border-l sm:border-white/15" : ""} ${idx % 2 === 1 ? "border-l border-white/15 sm:border-l" : ""} ${idx > 1 ? "border-t border-white/15 sm:border-t-0" : ""}`}>
                <dt className="text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl">{a}</dt>
                <dd className="mt-2 text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-white/65 sm:text-[11px]">{b}</dd>
              </div>
            ))}
          </dl>
          <a href="#main-content" aria-label="Scroll to content" className="mx-auto mt-4 hidden w-fit text-white/60 transition hover:text-white sm:block"><ChevronsDown className="size-5 animate-bounce" /></a>
        </div>
      </div>
    </section>
  );
}
