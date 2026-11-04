import { z } from "zod";
import { guard } from "@/lib/auth";
import { deleteAnnouncement, postAnnouncement, updateAnnouncement } from "@/lib/store";
import { saveImage } from "@/lib/uploads";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(160),
  body: z.string().min(5).max(8000),
  audience: z.enum(["all", "members", "leadership"]),
  linkLabel: z.string().max(60).optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
});

// Multipart: a news item with an optional picture and an optional link button.
export async function POST(req: Request) {
  const me = await guard("announcements");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Add a title and a message (and a valid link, if any)" }, { status: 400 });
  let image: string | undefined;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    image = saved.url;
  }
  const { id, linkLabel, linkUrl, ...rest } = parsed.data;
  if (id) {
    const res = await updateAnnouncement(id, { ...rest, ...(image ? { image } : {}), link: linkUrl ? { label: linkLabel || "Read more", url: linkUrl } : undefined }, me.name);
    if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
    return Response.json({ ok: true });
  }
  await postAnnouncement({ ...rest, image, link: linkUrl ? { label: linkLabel || "Read more", url: linkUrl } : undefined }, me.name);
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const me = await guard("announcements");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deleteAnnouncement(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
