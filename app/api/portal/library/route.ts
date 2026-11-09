import { z } from "zod";
import { guard } from "@/lib/auth";
import { baseSchema, readLibraryForm } from "@/lib/library-input";
import { submitResource } from "@/lib/store";

const schema = baseSchema.extend({ kind: z.enum(["research", "case", "article", "guideline"]) });

// A member proposes an item for the library. It waits as "pending" for the Education committee.
export async function POST(req: Request) {
  const me = await guard();
  if (me instanceof Response) return me;
  if (me.status !== "active") return Response.json({ error: "Only active members can submit to the library" }, { status: 403 });
  const form = await readLibraryForm(req);
  if ("error" in form) return Response.json({ error: form.error }, { status: 400 });
  const parsed = schema.safeParse(form.raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the details" }, { status: 400 });
  if (!form.url) return Response.json({ error: "Upload a PDF or paste a link" }, { status: 400 });
  const d = parsed.data;
  const r = await submitResource(me, { title: d.title, kind: d.kind, description: d.description, author: d.author || me.name, year: d.year, url: form.url });
  return Response.json({ ok: true, id: r.id });
}
