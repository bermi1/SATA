import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getSettings } from "@/lib/store";

// The shared hero used by every inner page: deep-blue band, optional photograph fading in from the right,
// breadcrumb, title and intro. Keeps the whole site consistent.
export async function PageHero({ eyebrow, title, intro, image, pageKey, crumbs, children }: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  image?: string;
  /** Looks up the banner photo an admin chose for this page. */
  pageKey?: string;
  crumbs?: [string, string?][];
  children?: ReactNode;
}) {
  const settings = pageKey ? await getSettings() : null;
  image = (pageKey && settings?.pageHeroes?.[pageKey]) || image;
  const focus = (pageKey && settings?.pageHeroFocus?.[pageKey]) ?? 40;
  return (
    <section className="relative isolate overflow-hidden bg-deep text-white">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" style={{ objectPosition: `50% ${focus}%` }} className="-z-20 object-cover opacity-60 md:opacity-75" unoptimized={image.startsWith("/api/")} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep via-deep/85 to-deep/30" />
        </>
      )}
      <div className="dot-grid-dark absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-10 md:pb-16 md:pt-14">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            {crumbs.map(([label, href]) => (
              <span key={label} className="flex items-center gap-1.5">/ {href ? <Link href={href} className="hover:text-white">{label}</Link> : <span className="text-white/90">{label}</span>}</span>
            ))}
          </nav>
        )}
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">{eyebrow}</div>
        <h1 className="rise mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.12] sm:text-5xl">{title}</h1>
        {intro && <p className="rise mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg" style={{ animationDelay: "90ms" }}>{intro}</p>}
        {children && <div className="rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "170ms" }}>{children}</div>}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, intro, className = "" }: { eyebrow: string; title: string; intro?: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue">{eyebrow}</div>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-deep md:text-3xl">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
    </div>
  );
}
