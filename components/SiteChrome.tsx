import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSettings, listGallery } from "@/lib/store";
import { Logo } from "./Logo";
import { AffiliateRow } from "./Partners";
import { SiteHeader } from "./SiteHeader";
import { Subscribe } from "./Subscribe";

export async function SiteNav() {
  const me = await getSession();
  const home = me ? (me.role === "member" ? "/portal" : "/admin") : "/login";
  const albums = (await listGallery()).slice(0, 2).map((a) => ({ id: a.id, title: a.title, date: a.date, link: a.link, photos: a.photos.slice(0, 3) }));
  return <SiteHeader signedIn={!!me} home={home} label={me ? (me.role === "member" ? "My portal" : "Admin") : ""} albums={albums} />;
}

const COLS: { title: string; links: [string, string, boolean?][] }[] = [
  { title: "Society", links: [["About SATA", "/about"], ["Our objectives", "/about#objectives"], ["Leadership & governance", "/leadership"], ["Departments", "/leadership#departments"], ["News", "/news"], ["Contact us", "/contact"]] },
  { title: "Membership", links: [["Join SATA", "/membership/apply"], ["Categories & fees", "/membership#fees"], ["Member portal", "/portal"], ["Renew membership", "/portal/payments"], ["Verify a member", "/verify"], ["Sign in", "/login"]] },
  { title: "Events & learning", links: [["All events", "/events"], ["Photo gallery", "/gallery"], ["AAAC 2027", "https://aaac2027.com", true], ["SATA Marathon", "/events/sata-marathon"], ["Resource library", "/resources"]] },
  { title: "Resources", links: [["Conference reports", "/resources?kind=report"], ["Research & abstracts", "/resources?kind=research"], ["Policy & guidelines", "/resources?kind=policy"], ["Forms", "/resources?kind=form"], ["Media", "/resources?kind=media"]] },
];

const LEGAL: [string, string][] = [["Privacy Policy", "/privacy"], ["Terms of Use", "/terms"], ["Accessibility", "/accessibility"], ["Sitemap", "/sitemap.xml"]];

export async function SiteFooter() {
  const ORG = await getSettings();
  return (
    <footer className="relative mt-auto overflow-hidden bg-[#04182b] text-slate-300">
      <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Logo tone="white" size={52} withText />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">{ORG.tagline}</p>
          <div className="mt-6"><div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Affiliated with</div><AffiliateRow dark /></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-7">
          <h3 className="font-display text-lg font-bold text-white">Stay informed</h3>
          <p className="mb-5 mt-1 text-sm text-slate-400">News, events, CPD and reminders by email and SMS.</p>
          <Subscribe tone="dark" />
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-10 md:grid-cols-3 lg:grid-cols-5">
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{c.title}</div>
              <ul className="space-y-2.5 text-sm">
                {c.links.map(([l, h, ext]) => <li key={l}>{ext ? <a href={h} target="_blank" rel="noreferrer" className="transition hover:text-white">{l} ↗</a> : <Link href={h} className="transition hover:text-white">{l}</Link>}</li>)}
              </ul>
            </div>
          ))}
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Contact</div>
            <ul className="space-y-2.5 text-sm">
              <li className="leading-snug">{ORG.address}</li>
              <li><a href={`tel:${ORG.phone.replace(/\s/g, "")}`} className="hover:text-white">{ORG.phone}</a></li>
              <li><a href={`mailto:${ORG.email}`} className="hover:text-white">{ORG.email}</a></li>
              <li><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("MUHAS MOI Simulation Laboratory and Patient Safety Center Dar es Salaam")}`} target="_blank" rel="noreferrer" className="hover:text-white">Get directions ↗</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <nav aria-label="Legal" className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 pt-5 text-xs text-slate-400">
          {LEGAL.map(([l, h]) => <Link key={l} href={h} className="transition hover:text-white">{l}</Link>)}
          <a href="#top" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-semibold transition hover:border-white/40 hover:text-white">Back to top ↑</a>
        </nav>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} Society of Anaesthesiologists of Tanzania · Registered under the NGOs Act No. 24 of 2002</div>
          <div className="flex items-center gap-2"><span className="text-vigil">●</span> vigilance <span className="mx-1 text-white/20">|</span> Platform by <a href="https://bermitechs.com" aria-label="Bermi Techs" className="inline-flex items-center"><Image src="/brand/bermi-white.png" alt="Bermi Techs" width={110} height={44} className="h-7 w-auto opacity-80 transition hover:opacity-100" /></a></div>
        </div>
      </div>
    </footer>
  );
}
