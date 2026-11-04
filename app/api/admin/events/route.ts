import { guard } from "@/lib/auth";
import { parseEventForm } from "@/lib/event-form";
import { createEvent } from "@/lib/store";

// Multipart: event fields + optional "poster" image.
export async function POST(req: Request) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const parsed = await parseEventForm(fd);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const ev = await createEvent(parsed.data, me.name);
  return Response.json({ ok: true, id: ev.id, slug: ev.slug }, { status: 201 });
}
