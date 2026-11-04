import { PageHeader, Panel, Stat, Table } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { listAttendance, listEvents, listRegistrations, stats } from "@/lib/store";

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[140px_1fr_32px] items-center gap-3 text-sm"><span className="truncate text-ink">{k}</span><span className="h-2.5 overflow-hidden rounded-full bg-mist"><span className="block h-full rounded-full bg-blue" style={{ width: `${(v / max) * 100}%` }} /></span><span className="text-right font-semibold text-deep">{v}</span></li>
      ))}
    </ul>
  );
}

export default async function Reports() {
  await requirePage("reports");
  const s = await stats();
  const events = (await listEvents()).filter((e) => new Date(e.startsAt) < new Date());
  const [allRegs, allAtt] = await Promise.all([listRegistrations(), listAttendance()]);
  return (
    <>
      <PageHeader eyebrow="Leadership oversight" title="Reports">Always current, so the board pack is exported rather than assembled.</PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Register" value={s.total} /><Stat label="In good standing" value={`${s.total ? Math.round((s.good / s.total) * 100) : 0}%`} hint={`${s.lapsed} lapsed`} /><Stat label="Revenue" value={fmtTZS(s.revenue)} /><Stat label="Event attendances" value={s.attendanceTotal} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Members by cadre"><Bars rows={s.byCadre as [string, number][]} /></Panel>
        <Panel title="Members by region (top 10)"><Bars rows={s.byRegion.slice(0, 10) as [string, number][]} /></Panel>
        <Panel title="Attendance by event" className="xl:col-span-2">
          <Table head={["Event", "Registered", "Attended", "Rate", "CPD credited"]}>
            {events.map((e) => { const r = allRegs.filter((x) => x.eventId === e.id).length; const a = allAtt.filter((x) => x.eventId === e.id && x.counted).length; return (
              <tr key={e.id}><td className="font-semibold text-deep">{e.title}</td><td>{r}</td><td>{a}</td><td>{r ? `${Math.round((a / r) * 100)}%` : "—"}</td><td>{a * e.cpdPoints}</td></tr>
            ); })}
          </Table>
        </Panel>
      </div>
    </>
  );
}
