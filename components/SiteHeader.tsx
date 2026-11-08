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

const NEWS = [
  ["SATA news", "/news", "Reports and notices from the Society"],
  ["Events & conferences", "/events", "Upcoming meetings, CME and registration"],
  ["World anaesthesia news", "/news?feed=news#world", "Daily stories from Tanzania, Africa and the world"],
  ["Research", "/news?feed=research#world", "New papers from leading journals"],
  ["Case reports", "/news?feed=cases#world", "Clinical cases reported worldwide"],
  ["Conferences worldwide", "/news?feed=events#world", "Congresses and meetings around the globe"],
] as const;

const MEMBERS = [
  ["Membership", "/membership", "Categories, benefits and fees"],
  ["Apply to join", "/membership/apply", "Online application in minutes"],
  ["Leadership", "/leadership", "The executive committee"],
  ["Verify a member", "/verify", "Check a SATA membership card"],
] as const;

type MenuKey = "about" | "members" | "news" | "resources";

export interface MenuAlbum { id: string; title: string; date: string; link?: string; photos: string[] }

const dateLabel = (d: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));

export function SiteHeader({ signedIn, home, label, albums }: { signedIn: boolean; home: string; label: string; albums: MenuAlbum[] }) {
  const path = usePathname();
  const [open, setOpen] = useState<null | MenuKey>(null);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups: MenuGroup[] = [
    { label: "About", href: "/about", children: ABOUT.map(([l, href]) => ({ label: l, href })) },
    { label: "Members", href: "/membership", children: MEMBERS.map(([l, href]) => ({ label: l, href })) },
    { label: "News & Events", href: "/news", children: NEWS.map(([l, href]) => ({ label: l, href })) },
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

  const hover = (k: MenuKey | null) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(k), k ? 0 : 160); };
  const link = "relative px-3 py-2 text-[14.5px] font-semibold text-ink transition hover:text-blue after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-blue after:transition hover:after:scale-x-100";
  const dd = (k: MenuKey, text: string, base: string) => (
    <div onMouseEnter={() => hover(k)} className="relative">
      <button className={`${link} inline-flex items-center gap-1 ${open === k || path.startsWith(base) ? "text-blue after:scale-x-100" : ""}`} aria-expanded={open === k} aria-haspopup="true" onClick={() => setOpen(open === k ? null : k)}>
        {text} <ChevronDown className={`size-3.5 transition ${open === k ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
  const item = (t: string, href: string, d?: string) => (
    <li key={href}><Link href={href} className="group block rounded-lg px-3 py-2.5 transition hover:bg-mist">
      <span className="block text-sm font-bold text-ink group-hover:text-blue">{t}</span>
      {d && <span className="mt-0.5 block text-xs leading-snug text-muted">{d}</span>}
    </Link></li>
  );
  const panel = (k: MenuKey, body: React.ReactNode) => open === k && (
    <div onMouseEnter={() => hover(k)} className="absolute inset-x-5 top-full z-50 hidden rounded-xl border border-line bg-white p-6 shadow-2xl shadow-ink/15 lg:block">{body}</div>
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
          {dd("about", "About", "/about")}
          {dd("members", "Members", "/membership")}
          {dd("news", "News & Events", "/news")}
          {dd("resources", "Resources", "/resources")}
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

        {panel("about", (
          <div className="grid grid-cols-[1fr_1fr_1.1fr] gap-8">
            <div><div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-muted">The Society</div><ul>{ABOUT.slice(0, 3).map(([t, h]) => item(t, h))}</ul></div>
            <div><div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-muted">Our work</div><ul>{ABOUT.slice(3).map(([t, h]) => item(t, h))}{item("Leadership", "/leadership")}{item("Contact us", "/contact")}</ul></div>
            <Link href="/about" className="group relative overflow-hidden rounded-lg bg-deep p-6 text-white">
              <Image src="/images/gallery/mbeya-hall.jpg" alt="" fill sizes="360px" className="object-cover opacity-30 transition duration-500 group-hover:scale-105" />
              <span className="relative block text-xs font-bold uppercase tracking-widest text-sky-200">Since 2002</span>
              <span className="relative mt-2 block text-lg font-bold leading-snug">Safe anaesthesia for every patient in Tanzania.</span>
              <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold">About SATA <ArrowUpRight className="size-4" /></span>
            </Link>
          </div>
        ))}
        {panel("members", (
          <div className="grid grid-cols-[1.4fr_1fr] gap-8">
            <ul className="grid grid-cols-2 gap-x-4">{MEMBERS.map(([t, h, d]) => item(t, h, d))}</ul>
            <div className="rounded-lg bg-mist p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-blue">Already a member?</div>
              <p className="mt-2 text-sm text-muted">Your digital card, payments, CPD record and event tickets in one place.</p>
              <Link href={signedIn ? home : "/login"} className="mt-4 inline-flex rounded-md bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-deep">{signedIn ? label : "Sign in to the portal"}</Link>
            </div>
          </div>
        ))}
        {panel("news", (
          <div className="grid grid-cols-[1fr_1fr_1.1fr] gap-8">
            <div><div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-muted">From SATA</div><ul>{NEWS.slice(0, 2).map(([t, h, d]) => item(t, h, d))}</ul></div>
            <div><div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-muted">Around the world</div><ul>{NEWS.slice(2).map(([t, h, d]) => item(t, h, d))}</ul></div>
            <a href="https://aaac2027.com" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-lg bg-deep p-6 text-white">
              <Image src="/images/news/conference-2025.jpg" alt="" fill sizes="360px" className="object-cover opacity-30 transition duration-500 group-hover:scale-105" />
              <span className="relative block text-xs font-bold uppercase tracking-widest text-sky-200">Featured congress</span>
              <span className="relative mt-2 block text-lg font-bold leading-snug">All Africa Anaesthesia Congress 2027, hosted in Tanzania.</span>
              <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold">aaac2027.com <ArrowUpRight className="size-4" /></span>
            </a>
          </div>
        ))}
        {/* Resources: library + gallery */}
        {open === "resources" && (
          <div onMouseEnter={() => hover("resources")} className="absolute inset-x-5 top-full z-50 hidden rounded-xl border border-line bg-white p-6 shadow-2xl shadow-ink/15 lg:block">
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
