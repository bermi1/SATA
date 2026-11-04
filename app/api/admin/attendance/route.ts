import { z } from "zod";
import { guard } from "@/lib/auth";
import { getEvent, getMemberByEmail, recordAttendance } from "@/lib/store";

const checkIn = z.object({
  eventId: z.string(),
  code: z.string().min(2), // QR ticket code or member number
  method: z.enum(["qr", "manual"]).default("qr"),
});

// Single check-in: scan a QR ticket or type a ticket code / member number.
export async function POST(req: Request) {
  const me = await guard("attendance");
  if (me instanceof Response) return me;
  const parsed = checkIn.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Event and code are required" }, { status: 400 });
  const { eventId, code, method } = parsed.data;
  const isMemberNo = /^SATA-\d+$/i.test(code.trim());
  const res = await recordAttendance(eventId, isMemberNo ? { memberNo: code.trim() } : { ticketCode: code.trim() }, { method, actor: me.name });
  if ("error" in res) return Response.json({ error: res.error }, { status: res.error === "Already checked in" ? 409 : 404 });
  return Response.json({ ok: true, name: res.member?.name ?? res.attendance.guestName ?? "Guest", cpdAwarded: res.cpdAwarded, cpdText: res.cpdAwarded ? ` · +${res.cpdAwarded} CPD` : "" });
}

const importSchema = z.object({
  eventId: z.string(),
  // One participant per line: "email, minutes" — the shape of a Zoom / Meet attendance report.
  report: z.string().min(3),
});

// Bulk import of a webinar / online meeting attendance report.
export async function PUT(req: Request) {
  const me = await guard("attendance");
  if (me instanceof Response) return me;
  const parsed = importSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Paste the attendance report" }, { status: 400 });
  const ev = await getEvent(parsed.data.eventId);
  if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });
  const out = { counted: 0, belowThreshold: 0, duplicates: 0, unknown: [] as string[] };
  for (const line of parsed.data.report.split(/\r?\n/)) {
    const [email, mins] = line.split(/[,;\t]/).map((s) => s.trim());
    if (!email || !email.includes("@")) continue;
    const m = await getMemberByEmail(email);
    if (!m) { out.unknown.push(email); continue; }
    const r = await recordAttendance(ev.id, { memberId: m.id }, { method: "online", minutes: Number(mins) || 0, actor: me.name });
    if ("error" in r) out.duplicates++;
    else if (r.attendance.counted) out.counted++;
    else out.belowThreshold++;
  }
  return Response.json({ ok: true, ...out, unknownCount: out.unknown.length });
}
