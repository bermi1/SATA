import { ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, Globe2, HeartPulse, MapPin, Microscope, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import HeroSlideshow from "@/components/HeroSlideshow";
import { PartnerStrip } from "@/components/Partners";
import { SectionHead } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { TeamCard } from "@/components/TeamCard";
import { excerpt } from "@/components/RichText";
import { EVENT_LABEL, fmtDate, fmtRange } from "@/components/ui";
import { FEES, fmtTZS } from "@/lib/config";
import { calendarEntries, getSettings, listAnnouncements, listEvents, listPartners, listResources, listTeam } from "@/lib/store";

const PILLARS = [
  { icon: ShieldCheck, t: "Patient safety", d: "Standards and a culture of vigilance in every theatre and ICU." },
  { icon: BookOpenCheck, t: "Education & CPD", d: "Conferences, master classes and webinars with CPD credit." },
  { icon: Microscope, t: "Research", d: "Abstracts, audits and African-led research that changes practice." },
  { icon: Users, t: "Community", d: "Anaesthesiologists, officers and nurse anaesthetists in one network." },
  { icon: Globe2, t: "Advocacy", d: "A voice with the Ministry of Health, WFSA, WHO and CANECSA." },
  { icon: HeartPulse, t: "Critical care", d: "Leadership that reaches beyond the operating room." },
];

const sec = "mx-auto mt-16 max-w-7xl px-5 md:mt-20";

export default async function Home() {
  const settings = await getSettings();
  const events = (await listEvents()).filter((e) => new Date(e.endsAt) >= new Date() && e.id !== "e4").slice(0, 3);
  const news = (await listAnnouncements("public")).slice(0, 3);
  const exec = (await listTeam()).filter((m) => m.group === "executive");
  const partners = await listPartners();
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
  const keyDates = (await calendarEntries({ members: false })).filter((e) => e.start.slice(0, 10) >= todayKey && !e.sample).slice(0, 4);
  const library = (await listResources(false)).filter((r) => r.kind === "report" || r.kind === "research" || r.kind === "policy").slice(0, 3);

  return (
    <>
      <HeroSlideshow slides={settings.heroSlides} />

      {/* Who we are */}
      <section className={sec}>
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <Image src="/images/news/conference-2025.jpg" alt="Delegates and leaders at the 9th SATA Scientific Conference, Mwanza" width={1080} height={719} sizes="(min-width:1024px) 600px, 100vw" className="aspect-[3/2] w-full rounded-lg object-cover shadow-xl shadow-ink/10" />
            </div>
            <div>
              <SectionHead eyebrow="Who we are" title="A society built on education, advocacy and collaboration." />
              <p className="mt-4 leading-relaxed text-muted">The Society of Anaesthesiologists of Tanzania is a professional, non-governmental, non-profit organisation representing anaesthesiologists and anaesthesia providers across the country, registered under the NGOs Act No. 24 of 2002.</p>
              <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
                <div className="bg-white p-5"><div className="text-[11px] font-bold uppercase tracking-widest text-blue">Mission</div><p className="mt-1.5 text-sm leading-relaxed text-ink">Advancing anaesthesia care through education, advocacy and collaboration, ensuring the highest standards of patient safety.</p></div>
                <div className="bg-white p-5"><div className="text-[11px] font-bold uppercase tracking-widest text-blue">Vision</div><p className="mt-1.5 text-sm leading-relaxed text-ink">A culture of patient safety and quality improvement across Tanzania by 2030 and beyond.</p></div>
              </div>
              <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue transition hover:gap-3">About SATA <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Main event: AAAC 2027 (official site) */}
      <section className={sec}>
        <Reveal>
          <div className="grid overflow-hidden rounded-lg border border-line bg-white shadow-lg shadow-ink/5 lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="w-fit rounded bg-vigil px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Main event · hosted by SATA</span>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-deep sm:text-4xl">AAAC 2027</h2>
              <p className="mt-1 font-display text-lg font-semibold text-blue">The 10th All Africa Anaesthesia Congress</p>
              <p className="mt-4 text-muted">The future of anaesthesia and critical care in Africa. Smart · Safe · Inclusive.</p>
              <ul className="mt-5 space-y-2 text-sm font-semibold text-ink">
                <li className="flex items-center gap-2.5"><CalendarDays className="size-4 text-blue" /> 13–16 September 2027 · workshops 12 September</li>
                <li className="flex items-center gap-2.5"><MapPin className="size-4 text-blue" /> JNICC, Dar es Salaam, Tanzania</li>
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="https://aaac2027.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-deep">Visit the official website <ArrowUpRight className="size-4" /></a>
                <Link href="/events" className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-deep transition hover:border-blue hover:text-blue">All events</Link>
              </div>
            </div>
            <div className="relative min-h-64 lg:min-h-[380px]">
              <Image src="/images/aaac/hero-carousel-ChatGPT_Image_Jul_30__2026__07_20_59_PM.png" alt="AAAC 2027: Kilimanjaro, giraffes and the Dar es Salaam skyline" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* What we do */}
      <section className={sec}>
        <Reveal><SectionHead eyebrow="What we do" title="Six ways SATA advances safe care." /></Reveal>
        <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 50}>
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue"><p.icon className="size-5" /></span>
                <div><h3 className="font-display text-base font-bold text-deep">{p.t}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{p.d}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className={sec}>
        <Reveal>
          <div className="flex items-end justify-between gap-4"><SectionHead eyebrow="What's on" title="Upcoming events." /><Link href="/events" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue sm:inline-flex">All events <ArrowRight className="size-4" /></Link></div>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={i * 70}>
              <Link href={`/events/${e.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:border-blue hover:shadow-lg hover:shadow-ink/5">
                <div className="relative h-36 bg-gradient-to-br from-blue to-deep">
                  {e.image && <Image src={e.image} alt="" fill sizes="400px" className="object-cover" unoptimized={e.image.startsWith("/api/")} />}
                  <div className="absolute bottom-3 left-3 rounded bg-white px-2.5 py-1 text-center shadow"><div className="font-display text-lg font-bold leading-none text-deep">{fmtDate(e.startsAt, { day: "numeric" })}</div><div className="text-[10px] font-bold uppercase text-blue">{fmtDate(e.startsAt, { month: "short" })}</div></div>
                </div>
                <div className="flex flex-1 flex-col p-5"><div className="text-[11px] font-bold uppercase tracking-wider text-blue">{EVENT_LABEL[e.type]}</div><h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-deep group-hover:text-blue">{e.title}</h3><p className="mt-2 text-sm text-muted">{fmtRange(e)} · {e.venue}</p></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Key dates */}
      <section className={sec}>
        <Reveal>
          <div className="flex items-end justify-between gap-4"><SectionHead eyebrow="Key dates" title="Key dates this year." /><Link href="/events" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue sm:inline-flex">All events <ArrowRight className="size-4" /></Link></div>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {keyDates.map((k) => (
              <li key={k.id} className="bg-white">
                <Link href={k.href ?? "/events"} {...(k.external ? { target: "_blank", rel: "noreferrer" } : {})} className="group flex h-full gap-4 p-5 transition hover:bg-mist">
                  <span className="w-12 shrink-0 text-center"><span className="block font-display text-2xl font-bold leading-none text-deep">{Number(k.start.slice(8, 10))}</span><span className="text-[10px] font-bold uppercase text-blue">{new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(k.start.slice(0, 10) + "T00:00:00Z"))}</span></span>
                  <span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wider text-muted">{k.label}</span><span className="mt-0.5 block text-sm font-semibold leading-snug text-deep group-hover:text-blue">{k.title}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Leadership */}
      <section className={sec}>
        <Reveal>
          <div className="flex items-end justify-between gap-4"><SectionHead eyebrow="Leadership" title="The Executive Committee." /><Link href="/leadership" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue sm:inline-flex">Meet the team <ArrowRight className="size-4" /></Link></div>
        </Reveal>
        <Reveal delay={60}>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">{exec.map((m) => <TeamCard key={m.slug} m={m} />)}</div>
        </Reveal>
      </section>

      {/* Membership */}
      <section className={sec}>
        <Reveal>
          <div className="rounded-lg bg-deep p-7 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">Membership</div>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">One community. One digital card.</h2>
                <p className="mt-3 max-w-md text-white/75">Professional recognition, CPD, networking, a voice in governance and priority access to SATA events.</p>
                <div className="mt-6 flex flex-wrap gap-3"><Link href="/membership/apply" className="rounded-md bg-white px-6 py-3 text-sm font-bold text-deep transition hover:bg-mist">Apply online</Link><Link href="/membership" className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold transition hover:bg-white/10">Fees & benefits</Link></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["full", "associate", "honorary"] as const).map((k) => (
                  <div key={k} className="rounded-lg border border-white/15 bg-white/5 p-5"><div className="font-display text-base font-bold">{FEES[k].label}</div><div className="mt-2 text-xl font-bold">{FEES[k].registration ? fmtTZS(FEES[k].registration) : "No fee"}</div><div className="mt-1 text-[11px] text-white/60">{FEES[k].registration ? "registration fee" : "awarded by the Executive Committee"}</div></div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* News */}
      <section className={sec}>
        <Reveal>
          <div className="flex items-end justify-between gap-4"><SectionHead eyebrow="News" title="Latest from SATA." /><Link href="/news" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue sm:inline-flex">All news <ArrowRight className="size-4" /></Link></div>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {news.map((n, i) => (
            <Reveal key={n.id} delay={i * 70}>
              <Link href={`/news/${n.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:border-blue hover:shadow-lg hover:shadow-ink/5">
                <div className="relative h-40 bg-gradient-to-br from-blue to-deep">{n.image && <Image src={n.image} alt="" fill sizes="400px" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={n.image.startsWith("/api/")} />}</div>
                <div className="flex flex-1 flex-col p-5"><div className="text-xs font-semibold text-muted">{fmtDate(n.createdAt)}</div><h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-deep group-hover:text-blue">{n.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{excerpt(n.body, 150)}</p></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Publications */}
      <section className={sec}>
        <Reveal>
          <div className="flex items-end justify-between gap-4"><SectionHead eyebrow="Resources" title="Reports, research and policy." /><Link href="/resources" className="hidden shrink-0 items-center gap-2 text-sm font-bold text-blue sm:inline-flex">Open the library <ArrowRight className="size-4" /></Link></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {library.map((r) => (
              <Link key={r.id} href={r.url} {...(r.url.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="group rounded-lg border border-line bg-white p-5 transition hover:border-blue hover:shadow-md hover:shadow-ink/5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue">{r.kind}{r.year && <span className="text-muted">· {r.year}</span>}</div>
                <h3 className="mt-2 font-display text-base font-bold leading-snug text-deep group-hover:text-blue">{r.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{r.description}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal><PartnerStrip partners={partners} /></Reveal>
    </>
  );
}
