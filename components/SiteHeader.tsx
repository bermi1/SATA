"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MobileMenu, type MenuGroup } from "./MobileMenu";

const ABOUT = [
  ["Who we are", "/about#who"],
  ["Vision & mission", "/about#mission"],
  ["Core objectives", "/about#objectives"],
  ["How we work", "/about#how"],
  ["Affiliations", "/about#affiliations"],
] as const;

const LIBRARY = [
  ["Reports", "/resources?kind=report"],
  ["Research", "/resources?kind=research"],
  ["Policy & advocacy", "/resources?kind=policy"],
  ["Guidelines", "/resources?kind=guideline"],
  ["Forms", "/resources?kind=form"],
] as const;

const FLAT = [
  { href: "/leadership", label: "Leadership" },
  { href: "/membership", label: "Membership" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
];

export interface MenuAlbum { id: string; title: string; date: string; link?: string; photos: string[] }

const dateLabel = (d: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));

export function SiteHeader({ signedIn, home, label, albums }: { signedIn: boolean; home: string; label: string; albums: MenuAlbum[] }) {
  const path = usePathname();
  const [open, setOpen] = useState<null | "about" | "resources">(null);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups: MenuGroup[] = [
    { label: "About", href: "/about", children: ABOUT.map(([l, href]) => ({ label: l, href })) },
    ...FLAT,
    { label: "Resources", href: "/resources", children: [...LIBRARY.map(([l, href]) => ({ label: l, href })), { label: "Gallery", href: "/gallery" }] },
    { label: "Contact", href: "/contact" },
    { label: "AAAC 2027", href: "https://aaac2027.com", external: true },
  ];

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close menus on navigation
  useEffect(() => setOpen(null), [path]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const out = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(null);
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", out);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", out); };
  }, []);

  const hover = (k: "about" | "resources" | null) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(k), k ? 0 : 160); };
  const link = "relative px-3 py-2 text-[14.5px] font-semibold text-ink transition hover:text-blue after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-blue after:transition hover:after:scale-x-100";
  const dd = (k: "about" | "resources", text: string) => (
    <div onMouseEnter={() => hover(k)} onMouseLeave={() => hover(null)} className="relative">
      <button className={`${link} inline-flex items-center gap-1 ${open === k || path.startsWith(`/${k}`) ? "text-blue" : ""}`} aria-expanded={open === k} aria-haspopup="true" onClick={() => setOpen(open === k ? null : k)}>
        {text} <ChevronDown className={`size-3.5 transition ${open === k ? "rotate-180" : ""}`} />
      </button>
      {k === "about" && open === "about" && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border border-line bg-white p-2 shadow-xl shadow-ink/10">
          {ABOUT.map(([t, href]) => <li key={href}><Link href={href} className="block rounded-md px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist hover:text-blue">{t}</Link></li>)}
        </ul>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div ref={root} className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5" onMouseLeave={() => hover(null)}>
        <Link href="/" aria-label="SATA, Society of Anaesthesiologists of Tanzania" className="flex shrink-0 items-center gap-3.5">
          <Image src="/brand/logo.png" alt="" width={64} height={58} priority className="h-[52px] w-auto" />
          <span className="hidden border-l border-line pl-3.5 sm:block">
            <span className="block text-[22px] font-bold leading-none tracking-tight text-deep">SATA</span>
            <span className="mt-1 block text-[10.5px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted lg:hidden xl:block">Society of Anaesthesiologists<br />of Tanzania</span>
          </span>
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Main">
          {dd("about", "About")}
          {FLAT.map((l) => <Link key={l.href} href={l.href} onMouseEnter={() => hover(null)} className={`${link} ${path.startsWith(l.href) ? "text-blue after:scale-x-100" : ""}`} aria-current={path.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>)}
          {dd("resources", "Resources")}
          <Link href="/contact" onMouseEnter={() => hover(null)} className={`${link} ${path.startsWith("/contact") ? "text-blue after:scale-x-100" : ""}`}>Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://aaac2027.com" target="_blank" rel="noreferrer" className="hidden items-center gap-1 whitespace-nowrap px-2 text-sm font-bold text-vigil hover:underline xl:inline-flex">AAAC 2027 <ArrowUpRight className="size-3.5" /></a>
          {signedIn ? (
            <Link href={home} className="hidden whitespace-nowrap rounded-md bg-blue px-5 py-2.5 text-sm font-bold text-white transition hover:bg-deep sm:block">{label}</Link>
          ) : (
            <>
              <Link href="/login" className="hidden whitespace-nowrap px-3 py-2 text-sm font-semibold text-deep hover:text-blue md:block">Sign in</Link>
              <Link href="/membership/apply" className="hidden whitespace-nowrap rounded-md bg-blue px-5 py-2.5 text-sm font-bold text-white transition hover:bg-deep sm:block">Join SATA</Link>
            </>
          )}
          <MobileMenu groups={groups} signedIn={signedIn} home={home} />
        </div>

        {/* Resources: library + gallery */}
        {open === "resources" && (
          <div onMouseEnter={() => hover("resources")} className="absolute inset-x-5 top-full z-50 hidden rounded-lg border border-line bg-white p-6 shadow-2xl shadow-ink/15 lg:block">
            <div className="grid grid-cols-[220px_1fr] gap-8">
              <div>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">Library</div>
                <ul className="space-y-0.5">{LIBRARY.map(([t, href]) => <li key={href}><Link href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-ink transition hover:bg-mist hover:text-blue">{t}</Link></li>)}</ul>
                <Link href="/resources" className="mt-3 inline-flex items-center gap-1 px-3 text-sm font-bold text-blue">Open the library <ArrowUpRight className="size-3.5" /></Link>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-widest text-muted">Gallery</span><Link href="/gallery" className="text-sm font-bold text-blue">All galleries →</Link></div>
                <ul className="grid gap-4 md:grid-cols-2">
                  {albums.map((a) => (
                    <li key={a.id} className="rounded-lg border border-line p-3">
                      <div className="grid grid-cols-3 gap-1.5">{a.photos.slice(0, 3).map((p) => <span key={p} className="relative aspect-[4/3] overflow-hidden rounded bg-mist"><Image src={p} alt="" fill sizes="110px" className="object-cover" unoptimized={p.startsWith("/api/")} /></span>)}</div>
                      <div className="mt-2.5 text-sm font-bold leading-snug text-deep">{a.title}</div>
                      <div className="text-xs text-muted">{dateLabel(a.date)}</div>
                      {a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-blue hover:underline">View the full album <ArrowUpRight className="size-3" /></a> : <Link href="/gallery" className="mt-1.5 inline-block text-xs font-bold text-blue hover:underline">View photos →</Link>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
