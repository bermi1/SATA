import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EventForm from "@/components/EventForm";
import { PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { toEatInput } from "@/lib/event-form";
import { getEvent } from "@/lib/store";

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("events");
  const { id } = await params;
  if (!canWrite(me.role, "events")) redirect(`/admin/events/${id}`);
  const e = await getEvent(id);
  if (!e) notFound();
  return (
    <>
      <Link href={`/admin/events/${e.id}`} className="text-sm font-semibold text-blue">← Back to event</Link>
      <div className="mt-3"><PageHeader eyebrow="Edit event" title={e.title} /></div>
      <Panel className="max-w-3xl">
        <EventForm values={{
          id: e.id, title: e.title, type: e.type, mode: e.mode, status: e.status ?? "published", startsAt: toEatInput(e.startsAt), endsAt: toEatInput(e.endsAt), venue: e.venue,
          link: e.link, externalUrl: e.externalUrl, summary: e.summary, theme: e.theme, capacity: e.capacity, cpdPoints: e.cpdPoints, memberFee: e.fees.full ?? 0,
          guestFee: e.fees.guest ?? 0, minutesRequired: e.minutesRequired, image: e.image, popup: !!e.popup, popupUntil: e.popupUntil ? toEatInput(e.popupUntil).slice(0, 10) : undefined,
        }} />
      </Panel>
    </>
  );
}
