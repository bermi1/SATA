import { ArrowUpRight, CalendarDays, MapPin, QrCode, Smartphone, Ticket, Award } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { Badge, EVENT_LABEL, fmtDate, fmtRange } from "@/components/ui";
import { listEvents } from "@/lib/store";
import type { SataEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Events", description: "Conferences, webinars, meetings, workshops and the SATA marathon." };

function Card({ e }: { e: SataEvent }) {
  return (
    <Link href={`/events/${e.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:border-blue hover:shadow-lg hover:shadow-ink/5">
      <div className="relative h-40 bg-gradient-to-br from-blue to-deep">
        {e.image && <Image src={e.image} alt="" fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={e.image.startsWith("/api/")} />}
        <div className="absolute bottom-3 left-3 rounded bg-white px-2.5 py-1 text-center shadow"><div className="font-display text-lg font-bold leading-none text-deep">{fmtDate(e.startsAt, { day: "numeric" })}</div><div className="text-[10px] font-bold uppercase text-blue">{fmtDate(e.startsAt, { month: "short" })}</div></div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5"><Badge>{EVENT_LABEL[e.type]}</Badge><Badge tone="grey">{e.mode === "online" ? "Online" : e.mode === "hybrid" ? "Hybrid" : "In person"}</Badge>{e.cpdPoints > 0 && <Badge tone="green">{e.cpdPoints} CPD</Badge>}{e.sample && <Badge tone="amber">Sample</Badge>}</div>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug text-deep group-hover:text-blue">{e.title}</h3>
        <p className="mt-auto pt-4 text-sm text-ink">{fmtRange(e)}</p>
        <p className="text-sm text-muted">{e.venue}</p>
      </div>
    </Link>
  );
}

export default async function Events() {
  const all = await listEvents();
  const now = new Date();
  const upcoming = all.filter((e) => new Date(e.endsAt) >= now && e.status !== "cancelled");
  const main = upcoming.find((e) => e.externalUrl) ?? upcoming[0];
  const others = upcoming.filter((e) => e.id !== main?.id);
  const past = all.filter((e) => new Date(e.endsAt) < now).reverse();

  return (
    <>
      <PageHero pageKey="events" eyebrow="Events" title="Conferences, webinars, meetings and the SATA marathon." image="/images/news/masterclass-2025.jpg" crumbs={[["Events"]]}
        intro="Register in a tap, receive a QR ticket by SMS, and have your attendance and CPD recorded automatically." />

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-14 md:space-y-20 md:py-16">
        {/* Main event: description left, picture right */}
        {main && (
          <Reveal>
            <section aria-label="Main event" className="grid overflow-hidden rounded-lg border border-line bg-white shadow-lg shadow-ink/5 lg:grid-cols-[1.05fr_1fr]">
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <span className="w-fit rounded bg-vigil px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Main event</span>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-deep sm:text-4xl">{main.title}</h2>
                {main.theme && <p className="mt-2 font-display text-lg font-semibold text-blue">{main.theme}</p>}
                <p className="mt-4 leading-relaxed text-muted">{main.summary}</p>
                <ul className="mt-5 space-y-2.5 text-sm font-semibold text-ink">
                  <li className="flex items-center gap-2.5"><CalendarDays className="size-4 text-blue" />{main.datesTbc ? "Dates to be announced" : "13–16 September 2027 · pre-congress workshops 12 September"}</li>
                  <li className="flex items-center gap-2.5"><MapPin className="size-4 text-blue" />{main.venue}</li>
                  {main.cpdPoints > 0 && <li className="flex items-center gap-2.5"><Award className="size-4 text-blue" />Up to 27.5 CPD hours (accredited by WFSA and MCT)</li>}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  {main.externalUrl ? (
                    <>
                      <a href="https://aaac2027.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-deep">Visit the official website <ArrowUpRight className="size-4" /></a>
                      <a href={main.externalUrl} target="_blank" rel="noreferrer" className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-deep transition hover:border-blue hover:text-blue">Register as a delegate</a>
                    </>
                  ) : <Link href={`/events/${main.slug}`} className="rounded-md bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-deep">View event and register</Link>}
                </div>
              </div>
              <div className="relative min-h-72 lg:min-h-[420px]">
                {main.image ? <Image src={main.image} alt={main.title} fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" unoptimized={main.image.startsWith("/api/")} /> : <div className="absolute inset-0 bg-gradient-to-br from-blue to-deep" />}
              </div>
            </section>
          </Reveal>
        )}

        {/* Other upcoming */}
        <section>
          <Reveal><SectionHead eyebrow="Coming up" title="Other upcoming events." /></Reveal>
          {others.length === 0 ? <p className="mt-6 text-muted">No other events are scheduled right now.</p> : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{others.map((e, i) => <Reveal key={e.id} delay={i * 60}><Card e={e} /></Reveal>)}</div>
          )}
        </section>

        {/* How it works */}
        <section>
          <Reveal><SectionHead eyebrow="How it works" title="From registration to CPD." /></Reveal>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[Ticket, "Register", "Members register in one tap. Guests register with name, email and phone."], [Smartphone, "Get your ticket", "A ticket code is sent by SMS, and shown in your member portal."], [QrCode, "Check in", "Scan your QR ticket at the gate, or join online; minutes are tracked for webinars."], [Award, "Earn CPD", "Attendance is recorded and CPD points are credited automatically."]].map(([Icon, t, d], i) => {
              const I = Icon as typeof Ticket;
              return <Reveal key={String(t)} delay={i * 60}><li className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue"><I className="size-5" /></span><div><div className="font-display text-base font-bold text-deep">{String(t)}</div><p className="mt-1 text-sm leading-relaxed text-muted">{String(d)}</p></div></li></Reveal>;
            })}
          </ol>
        </section>

        {/* Past */}
        <section>
          <Reveal><SectionHead eyebrow="Archive" title="Past events." /></Reveal>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {past.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.slug}`} className="group flex items-center gap-4 py-4">
                  <span className="relative hidden size-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-blue to-deep sm:block">{e.image && <Image src={e.image} alt="" fill sizes="64px" className="object-cover" unoptimized={e.image.startsWith("/api/")} />}</span>
                  <span className="min-w-0 flex-1"><span className="block font-display text-base font-bold text-deep group-hover:text-blue">{e.title}</span><span className="block text-sm text-muted">{fmtRange(e)} · {e.venue}</span></span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted transition group-hover:text-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
