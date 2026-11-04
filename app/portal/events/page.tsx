import Link from "next/link";
import { Badge, EVENT_LABEL, fmtDate, fmtRange, PageHeader, Panel, Table } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { listAttendance, listEvents, listRegistrations } from "@/lib/store";

export default async function MyEvents() {
  const me = await requirePage();
  const evById = new Map((await listEvents({ includeDrafts: true })).map((e) => [e.id, e]));
  const regs = (await listRegistrations()).filter((r) => r.memberId === me.id);
  const att = (await listAttendance()).filter((a) => a.memberId === me.id);
  const upcoming = (await listEvents()).filter((e) => new Date(e.endsAt) >= new Date());
  return (
    <>
      <PageHeader eyebrow="Events" title="Events & attendance">Register for what&apos;s coming and see every event you&apos;ve attended. Attendance is what earns your CPD points.</PageHeader>
      <div className="grid gap-6">
        <Panel title="Upcoming">
          <ul className="divide-y divide-line">
            {upcoming.map((e) => {
              const r = regs.find((x) => x.eventId === e.id);
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div><Link href={`/events/${e.slug}`} className="font-display font-bold text-deep hover:text-blue">{e.title}</Link><div className="text-xs text-muted">{fmtRange(e)} · {e.venue}</div></div>
                  <div className="flex items-center gap-2"><Badge tone="grey">{EVENT_LABEL[e.type]}</Badge>{r ? <Badge tone={r.paid ? "green" : "amber"}>{r.paid ? `Ticket ${r.ticketCode}` : "Payment due"}</Badge> : <Link href={`/events/${e.slug}`} className="rounded-full bg-blue px-4 py-1.5 text-xs font-semibold text-white">Register</Link>}</div>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="My attendance record">
          {att.length === 0 ? <p className="text-sm text-muted">No attendance recorded yet.</p> : (
            <Table head={["Event", "Date", "How", "Counted", "CPD"]}>
              {att.map((a) => { const e = evById.get(a.eventId)!; return (
                <tr key={a.id}><td className="font-semibold text-deep">{e.title}</td><td>{fmtDate(a.checkedInAt)}</td><td className="capitalize">{a.method}{a.minutes ? ` · ${a.minutes} min` : ""}</td><td>{a.counted ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Too short</Badge>}</td><td>{a.counted ? `+${e.cpdPoints}` : "0"}</td></tr>
              ); })}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
