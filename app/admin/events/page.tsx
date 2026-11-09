import { CalendarPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EventActions } from "@/components/EventActions";
import { Badge, EVENT_LABEL, fmtRange, PageHeader } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { listAttendance, listEvents, listRegistrations } from "@/lib/store";

const TONE = { published: "green", draft: "amber", cancelled: "red" } as const;

export default async function AdminEvents() {
  const me = await requirePage("events");
  const [allRegs, allAtt] = await Promise.all([listRegistrations(), listAttendance()]);
  const events = (await listEvents({ includeDrafts: true })).reverse();
  const writable = canWrite(me.role, "events");
  return (
    <>
      <PageHeader eyebrow="Events & Logistics" title="Events & attendance">Create events with posters, open registration on the website, run check-in and message attendees.</PageHeader>
      {writable && (
        <Link href="/admin/events/new" className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep"><CalendarPlus className="size-4" /> New event</Link>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {events.map((e) => {
          const reg = allRegs.filter((r) => r.eventId === e.id).length;
          const att = allAtt.filter((a) => a.eventId === e.id && a.counted).length;
          const status = e.status ?? "published";
          return (
            <article key={e.id} className="flex overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative hidden w-36 shrink-0 bg-gradient-to-br from-blue to-deep sm:block">
                {e.image && <Image src={e.image} alt="" fill sizes="144px" className="object-cover" unoptimized={e.image.startsWith("/api/")} />}
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-1.5"><Badge>{EVENT_LABEL[e.type]}</Badge><Badge tone={TONE[status]}>{status}</Badge>{e.sample && <Badge tone="amber">Sample</Badge>}{e.popup && <Badge tone="red">Website pop-up</Badge>}</div>
                <Link href={`/admin/events/${e.id}`} className="mt-2 block font-display text-lg font-bold leading-snug text-deep hover:text-blue">{e.title}</Link>
                <p className="mt-1 text-xs text-muted">{fmtRange(e)} · {e.venue}</p>
                <div className="mt-3 flex gap-5 text-sm"><span><b className="text-deep">{reg}</b> <span className="text-muted">registered{e.capacity ? ` / ${e.capacity}` : ""}</span></span><span><b className="text-deep">{att}</b> <span className="text-muted">attended</span></span></div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/events/${e.id}`} className="rounded-full bg-mist px-3.5 py-1.5 text-xs font-bold text-deep hover:bg-blue/10">Manage</Link>
                  {writable && <Link href={`/admin/events/${e.id}/edit`} className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold hover:border-blue hover:text-blue">Edit</Link>}
                </div>
                {writable && <div className="mt-3 border-t border-line pt-3"><EventActions id={e.id} status={status} canDelete={reg === 0} /></div>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
