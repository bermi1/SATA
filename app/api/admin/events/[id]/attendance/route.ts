import { guard } from "@/lib/auth";
import { getEvent, getMember, listAttendance, listRegistrations } from "@/lib/store";

// CSV export of the attendance register for an event.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await guard("attendance", false);
  if (me instanceof Response) return me;
  const { id } = await params;
  const ev = await getEvent(id);
  if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });
  const regs = await listRegistrations(ev.id);
  const att = await listAttendance(ev.id);
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Member No", "Name", "Category", "Registered", "Checked in", "Method", "Minutes", "Counted for CPD"].map(q).join(",")];
  const seen = new Set<string>();
  for (const a of att) {
    const m = a.memberId ? await getMember(a.memberId) : null;
    if (m) seen.add(m.id);
    rows.push([m?.memberNo ?? "GUEST", m?.name ?? a.guestName ?? "Guest", m?.category ?? "guest", "Yes", a.checkedInAt, a.method, a.minutes ?? "", a.counted ? "Yes" : "No"].map(q).join(","));
  }
  for (const r of regs) {
    if (r.memberId && seen.has(r.memberId)) continue;
    const m = r.memberId ? await getMember(r.memberId) : null;
    rows.push([m?.memberNo ?? "GUEST", m?.name ?? r.guestName ?? "Guest", m?.category ?? "guest", "Yes", "", "", "", "No (absent)"].map(q).join(","));
  }
  return new Response(rows.join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${ev.slug}-attendance.csv"` },
  });
}
