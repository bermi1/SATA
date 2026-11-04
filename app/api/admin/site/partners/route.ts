import { z } from "zod";
import { guard } from "@/lib/auth";
import { deletePartner, savePartner } from "@/lib/store";
import { saveImage } from "@/lib/uploads";

const schema = z.object({ id: z.string().optional(), name: z.string().min(2).max(80), url: z.string().url().optional().or(z.literal("")) });

export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Enter the partner name (and a valid website link, if any)" }, { status: 400 });
  let logo: string | undefined;
  const file = fd.get("logo");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    logo = saved.url;
  }
  const res = await savePartner({ ...parsed.data, logo }, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deletePartner(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
