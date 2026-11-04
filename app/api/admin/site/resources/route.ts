import { z } from "zod";
import { guard } from "@/lib/auth";
import { deleteResource, saveResource } from "@/lib/store";
import { savePdf } from "@/lib/uploads";
import { RESOURCE_KINDS } from "@/lib/types";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(160),
  kind: z.enum(RESOURCE_KINDS),
  description: z.string().min(3).max(400),
  author: z.string().max(120).optional().or(z.literal("")),
  year: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(1990).max(2100).optional()),
  url: z.string().max(500).optional().or(z.literal("")),
  membersOnly: z.enum(["true", "false"]),
  closesAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

// Multipart: publication details plus either a PDF upload ("file") or an external link ("url").
export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the details" }, { status: 400 });
  const d = parsed.data;

  let url = d.url?.trim() ?? "";
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    const saved = await savePdf(file);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    url = saved.url;
  }
  if (!url && d.id) url = "__keep__";
  if (!url) return Response.json({ error: "Upload a PDF or paste a link" }, { status: 400 });
  if (url !== "__keep__" && !url.startsWith("/") && !/^https?:\/\//.test(url)) return Response.json({ error: "Use a full link (https://…)" }, { status: 400 });

  await saveResource({ id: d.id, title: d.title, kind: d.kind, description: d.description, author: d.author || undefined, year: d.year, closesAt: d.closesAt || undefined, membersOnly: d.membersOnly === "true", url }, me.name);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deleteResource(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
