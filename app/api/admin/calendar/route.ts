import { z } from "zod";
import { guard } from "@/lib/auth";
import { deleteCalendarItem, saveCalendarItem } from "@/lib/store";
import { CAL_KINDS } from "@/lib/types";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(140),
  date,
  endDate: date.optional().or(z.literal("")),
  kind: z.enum(CAL_KINDS),
  notes: z.string().max(400).optional().or(z.literal("")),
  href: z.string().url().optional().or(z.literal("")),
  membersOnly: z.boolean(),
});

// Dates on the SATA calendar that are not events: deadlines, committee meetings, observances.
export async function POST(req: Request) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the details" }, { status: 400 });
  const d = parsed.data;
  if (d.endDate && d.endDate < d.date) return Response.json({ error: "The end date must be on or after the start date" }, { status: 400 });
  await saveCalendarItem({ id: d.id, title: d.title, date: d.date, endDate: d.endDate || undefined, kind: d.kind, notes: d.notes || undefined, href: d.href || undefined, membersOnly: d.membersOnly }, me.name);
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deleteCalendarItem(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
