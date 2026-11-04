import Link from "next/link";
import EventForm from "@/components/EventForm";
import { PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewEvent() {
  const me = await requirePage("events");
  if (!canWrite(me.role, "events")) redirect("/admin/events");
  return (
    <>
      <Link href="/admin/events" className="text-sm font-semibold text-blue">← All events</Link>
      <div className="mt-3"><PageHeader eyebrow="Events & Logistics" title="New event">Conferences, webinars, meetings, workshops, the marathon: anything members or the public can register for.</PageHeader></div>
      <Panel className="max-w-3xl"><EventForm /></Panel>
    </>
  );
}
