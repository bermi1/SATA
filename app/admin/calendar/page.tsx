import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import CalendarView from "@/components/CalendarView";
import { RowControls } from "@/components/RowControls";
import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { calendarEntries, listCalendarItems } from "@/lib/store";
import CalendarItemForm from "./CalendarItemForm";

export default async function AdminCalendar() {
  const me = await requirePage("events");
  const writable = canWrite(me.role, "events");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
  const items = [...(await listCalendarItems())].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHeader eyebrow="Events & Logistics" title="Calendar">The SATA year in one schedule. Events appear automatically; add deadlines, meetings and other dates below. Members see the same calendar in their portal.</PageHeader>
      {writable && <Link href="/admin/events/new" className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep"><CalendarPlus className="size-4" /> New event</Link>}
      <CalendarView entries={await calendarEntries({ members: true, admin: true })} initialKey={today} />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={`Calendar items (${items.length})`}>
          {items.length === 0 ? <p className="text-sm text-muted">No items yet.</p> : (
            <ul className="divide-y divide-line">
              {items.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-deep">{c.title}</div><div className="flex flex-wrap items-center gap-2 text-xs text-muted">{fmtDate(c.date)}{c.endDate && ` – ${fmtDate(c.endDate)}`}<Badge tone="grey">{c.kind}</Badge>{c.membersOnly && <Badge tone="amber">Members</Badge>}</div></div>
                  {writable && <RowControls url="/api/admin/calendar" idKey="id" id={c.id} label={c.title} />}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">The 30 June subscription deadline is added to the calendar every year automatically.</p>
        </Panel>
        {writable && <Panel title="Add a date"><CalendarItemForm /></Panel>}
      </div>
    </>
  );
}
