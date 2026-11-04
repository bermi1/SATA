import { z } from "zod";
import { guard } from "@/lib/auth";
import { deleteAlbum, removeAlbumPhoto, saveAlbum } from "@/lib/store";
import { saveImage } from "@/lib/uploads";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(140),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  place: z.string().max(140).optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
});

// Multipart: album details plus up to three "photos". Adding photos to an existing album appends them.
export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the album details" }, { status: 400 });

  const photos: string[] = [];
  for (const f of fd.getAll("photos")) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (photos.length >= 3) break;
    const saved = await saveImage(f);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    photos.push(saved.url);
  }
  const res = await saveAlbum({ ...parsed.data, photos }, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}

export async function PATCH(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string; photo?: string } | null;
  if (!body?.id || !body.photo) return Response.json({ error: "Invalid request" }, { status: 400 });
  const res = await removeAlbumPhoto(body.id, body.photo, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deleteAlbum(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
