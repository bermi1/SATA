import { z } from "zod";
import { guard } from "@/lib/auth";
import { deleteTeamMember, moveTeamMember, saveTeamMember } from "@/lib/store";
import { saveImage } from "@/lib/uploads";

const schema = z.object({
  slug: z.string().optional(),
  name: z.string().min(3).max(120),
  role: z.string().min(2).max(160),
  group: z.enum(["executive", "committee"]),
  note: z.string().max(200).optional(),
  linkedin: z.string().url().regex(/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i, "Use a linkedin.com profile link").optional().or(z.literal("")),
});

// Multipart: profile fields + optional "photo". Updates when `slug` is given, otherwise adds a new member.
export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the details" }, { status: 400 });
  let photo: string | undefined;
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    photo = saved.url;
  }
  const res = await saveTeamMember({ ...parsed.data, photo }, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true, slug: res.member.slug });
}

export async function DELETE(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const res = await deleteTeamMember(body?.slug ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}

export async function PATCH(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { slug?: string; dir?: number } | null;
  if (!body?.slug || (body.dir !== -1 && body.dir !== 1)) return Response.json({ error: "Invalid request" }, { status: 400 });
  const res = await moveTeamMember(body.slug, body.dir, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}
