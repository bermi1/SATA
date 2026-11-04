import { Download, MessageSquare, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonForm from "@/components/JsonForm";
import { RegistrantActions } from "@/components/RegistrantActions";
import { Badge, EVENT_LABEL, fmtDate, fmtRange, fmtTime, PageHeader, Panel, Stat, Table } from "@/components/ui";
import { can, canWrite, requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { getEvent, listAttendance, listRegistrations, registrantContact, memberMap } from "@/lib/store";

export default async function EventControl({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("events");
  const mm = await memberMap();
  const e = await getEvent((await params).id);
  if (!e) notFound();
  const regs = await listRegistrations(e.id);
  const att = await listAttendance(e.id);
  const counted = att.filter((a) => a.counted).length;
  const attendedIds = new Set(att.map((a) => a.memberId ?? a.guestName));
  const absent = regs.filter((r) => !attendedIds.has(r.memberId ?? r.guestName));
  const writable = canWrite(me.role, "attendance");
  const online = e.mode !== "physical";
  const unpaid = regs.filter((r) => !r.paid).length;
  const collected = regs.filter((r) => r.paid).reduce((s, r) => s + (r.memberId ? e.fees[mm.get(r.memberId)?.category ?? "full"] ?? 0 : e.fees.guest ?? 0), 0);

  return (
    <>
      <Link href="/admin/events" className="text-sm font-semibold text-blue">← All events</Link>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start">
        {e.image && <Image src={e.image} alt="Event poster" width={240} height={320} className="h-auto w-40 shrink-0 rounded-2xl border border-line object-cover shadow-lg" unoptimized={e.image.startsWith("/api/")} />}
        <div className="min-w-0 flex-1">
          <PageHeader eyebrow={EVENT_LABEL[e.type]} title={e.title}>{fmtRange(e)} · {e.venue}{e.sample ? " · Sample event" : ""}</PageHeader>
          <div className="-mt-3 flex flex-wrap gap-2">
            {canWrite(me.role, "events") && <Link href={`/admin/events/${e.id}/edit`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold hover:border-blue hover:text-blue"><Pencil className="size-3.5" /> Edit event</Link>}
            {can(me.role, "messaging") && <Link href={`/admin/messaging?type=event_registrants&id=${e.id}`} className="inline-flex items-center gap-2 rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-deep"><MessageSquare className="size-3.5" /> Message registrants</Link>}
            {can(me.role, "messaging") && unpaid > 0 && <Link href={`/admin/messaging?type=event_unpaid&id=${e.id}`} className="inline-flex items-center gap-2 rounded-full border border-vigil/30 bg-white px-4 py-2 text-xs font-semibold text-vigil hover:bg-vigil/5">Remind {unpaid} unpaid</Link>}
            <a href={`/api/admin/events/${e.id}/attendance`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold hover:border-blue hover:text-blue"><Download className="size-3.5" /> Export CSV</a>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Registered" value={regs.length} hint={e.capacity ? `of ${e.capacity} places` : "no cap"} />
        <Stat label="Attended" value={counted} hint={`${att.length - counted} below threshold`} />
        <Stat label="Attendance rate" value={regs.length ? `${Math.round((counted / regs.length) * 100)}%` : "-"} />
        <Stat label="Fees collected" value={fmtTZS(collected)} hint={`${unpaid} unpaid`} tone={unpaid ? "red" : undefined} />
      </div>

      {writable && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel title={e.type === "marathon" ? "Bib collection / start-line check-in" : "Gate check-in"}>
            <p className="mb-4 text-sm text-muted">Scan the QR on the ticket, or type the ticket code or member number. A USB scanner works like a keyboard: click the box and scan.</p>
            <JsonForm url="/api/admin/attendance" extra={{ eventId: e.id, method: "qr" }} submit="Check in" reset compact success="✓ {name} checked in{cpdText}" fields={[{ name: "code", label: "Ticket code or member number", placeholder: "SATA-0012 or SAT-ABC123" }]} />
          </Panel>
          {online && (
            <Panel title="Import online attendance report">
              <p className="mb-4 text-sm text-muted">Paste the report from Zoom, Meet or Teams: one participant per line as <code className="rounded bg-mist px-1">email, minutes</code>. Members who stayed at least {e.minutesRequired ?? 0} minutes are counted and credited.</p>
              <JsonForm url="/api/admin/attendance" method="PUT" extra={{ eventId: e.id }} submit="Import report" reset compact success="Counted {counted} · below threshold {belowThreshold} · already recorded {duplicates} · unknown emails {unknownCount}" fields={[{ name: "report", label: "Attendance report", type: "textarea", placeholder: "neema.mushi@example.tz, 62" }]} />
            </Panel>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6">
        <Panel title={`Registrations (${regs.length})`}>
          {regs.length === 0 ? <p className="text-sm text-muted">No one has registered yet. Share the link: <span className="font-mono text-xs">/events/{e.slug}</span></p> : (
            <>
              {/* Phone: stacked cards */}
              <ul className="divide-y divide-line md:hidden">
                {regs.slice(0, 60).map((r) => { const c = registrantContact(r, mm); return (
                  <li key={r.id} className="space-y-2 py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-deep">{c.name}</div><div className="text-xs text-muted">{c.memberNo ?? "Guest"} · {c.phone ?? c.email ?? "no contact"}</div></div><Badge tone={r.paid ? "green" : "amber"}>{r.paid ? "Paid" : "Unpaid"}</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted">{r.ticketCode}</span>{writable && <RegistrantActions id={r.id} paid={r.paid} />}</div>
                  </li>
                ); })}
              </ul>
              <div className="hidden md:block">
                <Table head={["Name", "Contact", "Ticket", "Registered", "Payment", ""]}>
                  {regs.slice(0, 120).map((r) => { const c = registrantContact(r, mm); return (
                    <tr key={r.id}><td><div className="font-semibold text-deep">{c.name}</div><div className="text-xs text-muted">{c.memberNo ?? "Guest"}</div></td><td className="text-xs">{c.phone ?? "-"}<br /><span className="text-muted">{c.email ?? ""}</span></td><td className="font-mono text-xs">{r.ticketCode}</td><td>{fmtDate(r.createdAt)}</td><td><Badge tone={r.paid ? "green" : "amber"}>{r.paid ? "Paid" : "Unpaid"}</Badge></td><td>{writable && <RegistrantActions id={r.id} paid={r.paid} />}</td></tr>
                  ); })}
                </Table>
              </div>
            </>
          )}
        </Panel>
        <Panel title={`Attendance register (${att.length})`}>
          {att.length === 0 ? <p className="text-sm text-muted">No one has been checked in yet.</p> : (
            <Table head={["Name", "Member no.", "Time", "How", "Counted"]}>
              {att.slice(-50).reverse().map((a) => { const m = a.memberId ? mm.get(a.memberId) ?? null : null; return (
                <tr key={a.id}><td className="font-semibold text-deep">{m?.name ?? a.guestName ?? "Guest"}</td><td className="font-mono text-xs">{m?.memberNo ?? "GUEST"}</td><td className="whitespace-nowrap">{fmtDate(a.checkedInAt)} {fmtTime(a.checkedInAt)}</td><td className="capitalize">{a.method}{a.minutes ? ` · ${a.minutes} min` : ""}</td><td>{a.counted ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Too short</Badge>}</td></tr>
              ); })}
            </Table>
          )}
        </Panel>
        {absent.length > 0 && att.length > 0 && (
          <Panel title={`Registered but not attended (${absent.length})`}>
            <p className="text-sm text-muted">{absent.slice(0, 30).map((r) => registrantContact(r, mm).name).join(" · ")}{absent.length > 30 && ` … +${absent.length - 30} more`}</p>
            {can(me.role, "messaging") && <Link href={`/admin/messaging?type=event_absent&id=${e.id}`} className="mt-3 inline-block text-sm font-bold text-blue">Message no-shows →</Link>}
          </Panel>
        )}
      </div>
    </>
  );
}
