import { guard } from "@/lib/auth";
import { parseEventForm } from "@/lib/event-form";
import { deleteEvent, updateEvent } from "@/lib/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const { id } = await params;
  const ct = req.headers.get("content-type") ?? "";
  // Quick status change from the events table
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as { status?: string } | null;
    if (!body || !["draft", "published", "cancelled"].includes(body.status ?? "")) return Response.json({ error: "Invalid status" }, { status: 400 });
    const res = await updateEvent(id, { status: body.status as "draft" | "published" | "cancelled" }, me.name);
    if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
    return Response.json({ ok: true });
  }
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const parsed = await parseEventForm(fd);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const { image, ...rest } = parsed.data;
  const res = await updateEvent(id, { ...rest, ...(image ? { image } : {}) }, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true, slug: res.event.slug });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const res = await deleteEvent((await params).id, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 409 });
  return Response.json({ ok: true });
}
