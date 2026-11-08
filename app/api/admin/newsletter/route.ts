import { z } from "zod";
import { guard } from "@/lib/auth";
import { clip, getNewsletter } from "@/lib/newsletter";
import { repo } from "@/lib/db";
import type { Newsletter } from "@/lib/types";

const url = z.string().trim().max(1000).refine((u) => /^https?:\/\//i.test(u), "Links must start with http:// or https://");
const item = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(400).default(""),
  url,
  image: z.string().trim().max(1000).refine((u) => u === "" || /^https?:\/\//i.test(u), "Image URL must start with http(s)://").optional(),
  source: z.string().trim().min(1).max(120),
  kind: z.enum(["announcement", "event", "conference", "research", "case", "safety", "news", "custom"]),
  pinned: z.boolean().optional(),
});
const schema = z.object({
  id: z.string().min(1),
  subject: z.string().trim().min(1).max(200).optional(),
  intro: z.string().trim().max(2000).optional(),
  items: z.array(item).max(30).optional(),
});

/** Saves edits to a draft: subject, intro and the full ordered item list (reorder, remove, pin and custom items all go through here). */
export async function PUT(req: Request) {
  const me = await guard("announcements");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const nl = await getNewsletter(parsed.data.id);
  if (!nl) return Response.json({ error: "Newsletter not found" }, { status: 404 });
  if (nl.status !== "draft") return Response.json({ error: "A sent issue cannot be edited" }, { status: 409 });
  const next: Newsletter = {
    ...nl,
    subject: parsed.data.subject ?? nl.subject,
    intro: parsed.data.intro ?? nl.intro,
    items: parsed.data.items?.map((i) => ({ ...i, summary: clip(i.summary), image: i.image || undefined })) ?? nl.items,
  };
  await repo().put("newsletters", next);
  return Response.json({ ok: true });
}
