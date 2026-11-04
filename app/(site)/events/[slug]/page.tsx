import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import JsonForm from "@/components/JsonForm";
import { PageHero } from "@/components/PageHero";
import { Badge, EVENT_LABEL, fmtRange, fmtTime } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { getEvent, isInGoodStanding, listRegistrations } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return { title: e?.title ?? "Event" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  const me = await getSession();
  if (!e || (e.status === "draft" && !(me && me.role !== "member"))) notFound();
  const regs = await listRegistrations(e.id);
  const mine = me ? regs.find((r) => r.memberId === me.id) : undefined;
  const ended = new Date(e.endsAt) < new Date();
  const full = e.capacity !== null && regs.length >= e.capacity;
  const myFee = me ? e.fees[me.category] ?? 0 : e.fees.guest ?? 0;

  return (
    <>
      <PageHero eyebrow={EVENT_LABEL[e.type]} title={e.title} intro={e.theme} image={e.image} crumbs={[["Events", "/events"], [e.title]]} />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="grey">{e.mode === "online" ? "Online" : e.mode === "hybrid" ? "Hybrid" : "In person"}</Badge>
            {e.cpdPoints > 0 && <Badge tone="green">{e.cpdPoints} CPD points</Badge>}
            {e.sample && <Badge tone="amber">Sample event</Badge>}
            {ended && <Badge tone="grey">Ended</Badge>}
            {e.status === "cancelled" && <Badge tone="red">Cancelled</Badge>}
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{e.summary}</p>
          {e.image && <Image src={e.image} alt="" width={1200} height={800} sizes="(min-width:1024px) 760px, 100vw" className="mt-8 aspect-[16/9] w-full rounded-lg object-cover shadow-md" unoptimized={e.image.startsWith("/api/")} />}
          <dl className="mt-8 grid gap-5 rounded-lg bg-mist p-6 sm:grid-cols-2">
            <div><dt className="text-[11px] font-bold uppercase tracking-wider text-muted">When</dt><dd className="mt-1 font-semibold text-deep">{fmtRange(e)}</dd>{!e.datesTbc && <dd className="text-sm text-muted">{fmtTime(e.startsAt)} – {fmtTime(e.endsAt)} EAT</dd>}</div>
            <div><dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Where</dt><dd className="mt-1 font-semibold text-deep">{e.venue}</dd></div>
            {e.minutesRequired && <div><dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Attendance rule</dt><dd className="mt-1 text-sm text-deep">Join for at least {e.minutesRequired} minutes to be counted and receive CPD.</dd></div>}
            <div><dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Registered</dt><dd className="mt-1 font-semibold text-deep">{regs.length}{e.capacity ? ` of ${e.capacity}` : ""}</dd></div>
          </dl>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-white p-6 shadow-md lg:sticky lg:top-28">
          <div className="font-display text-lg font-bold text-deep">Registration</div>
          <div className="mt-1 text-sm text-muted">
            {myFee > 0 ? <>Your fee: <b className="text-ink">{fmtTZS(myFee)}</b></> : "Free for you"}
            {!me && (e.fees.guest ?? 0) > 0 && <> · Members pay less. <Link href="/login" className="font-semibold text-blue">Sign in</Link></>}
          </div>
          <div className="mt-5">
            {e.status === "cancelled" ? (
              <p className="rounded-md bg-vigil/10 p-4 text-sm font-semibold text-vigil">This event has been cancelled.</p>
            ) : ended ? (
              <p className="text-sm text-muted">This event has ended.</p>
            ) : e.externalUrl ? (
              <a href={e.externalUrl} className="flex items-center justify-center rounded-md bg-blue px-6 py-3.5 text-sm font-bold text-white transition hover:bg-deep">Register on the official site →</a>
            ) : e.datesTbc ? (
              <p className="text-sm text-muted">Registration opens when dates are announced.</p>
            ) : mine ? (
              <div className="rounded-md bg-emerald-50 p-4 text-sm">
                <div className="font-bold text-emerald-800">You&apos;re registered ✓</div>
                <div className="mt-1 text-emerald-900">Ticket <span className="font-mono font-bold">{mine.ticketCode}</span></div>
                {!mine.paid && <div className="mt-3"><Link href="/portal/payments" className="font-semibold text-blue underline">Pay {fmtTZS(myFee)} to confirm →</Link></div>}
                {e.link && mine.paid && <a href={e.link} className="mt-3 block font-semibold text-blue underline">Join link →</a>}
              </div>
            ) : full ? (
              <p className="text-sm font-semibold text-vigil">This event is full.</p>
            ) : me ? (
              isInGoodStanding(me) ? (
                <ActionButton url={`/api/events/${e.id}/register`} label="Register now" doneLabel="Registered ✓" />
              ) : (
                <p className="text-sm text-muted">Your membership needs renewing before you can register. <Link href="/portal/payments" className="font-semibold text-blue">Renew →</Link></p>
              )
            ) : (
              <JsonForm
                url={`/api/events/${e.id}/register`}
                submit="Register as guest"
                compact
                success="Registered. Your ticket code is {ticketCode}. We've also sent it by SMS."
                fields={[{ name: "guestName", label: "Full name" }, { name: "guestEmail", label: "Email", type: "email" }, { name: "guestPhone", label: "Phone (for your SMS ticket)", type: "tel", placeholder: "0754 000 000" }]}
              />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
